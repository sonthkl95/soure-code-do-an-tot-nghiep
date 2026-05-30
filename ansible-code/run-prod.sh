#!/usr/bin/env bash
# =============================================================================
# run-prod.sh — Chạy toàn bộ Ansible stack cho môi trường PROD
# Chạy từ Bastion host: cd ~/ansible-code && bash run-prod.sh
#
# Options:
#   --vault-file <path>   Dùng vault password file thay vì --ask-vault-pass
#   --tags <tag>          Chỉ chạy tag cụ thể
#   --start-at <task>     Bắt đầu từ bước cụ thể
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Parse args ────────────────────────────────────────────────────────────────
# Mac dinh rong: dua vao vault_password_file=~/.vault_pass trong ansible.cfg
# (tat ca play tu giai ma). Chi override bang --vault-file khi can file khac.
VAULT_OPT=""
EXTRA_OPTS=()
MODULE_FLAGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault-file)    VAULT_OPT="--vault-password-file $2"; shift 2 ;;
    --tags)          EXTRA_OPTS+=(--tags "$2"); shift 2 ;;
    --start-at)      EXTRA_OPTS+=(--start-at-task "$2"); shift 2 ;;
    --skip-module)   MODULE_FLAGS+=(-e "module_${2}_enabled=false"); shift 2 ;;
    --only-module)   MODULE_FLAGS+=(
                       -e module_prometheus_enabled=false
                       -e module_loki_enabled=false
                       -e module_tempo_enabled=false
                       -e module_otel_gateway_enabled=false
                       -e module_alertmanager_enabled=false
                       -e module_grafana_enabled=false
                       -e module_kafka_enabled=false
                       -e module_redis_enabled=false
                       -e module_elasticsearch_enabled=false
                       -e module_debezium_enabled=false
                       -e module_mongodb_enabled=false
                       -e module_mysql_enabled=false
                       -e module_ingress_nginx_enabled=false
                       -e module_prometheus_agent_enabled=false
                       -e module_otel_collector_enabled=false
                       -e module_node_exporter_enabled=false
                       -e module_app_enabled=false
                       -e "module_${2}_enabled=true"
                     ); shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

ENV_FLAGS="-e env_dev_enabled=false -e env_prod_enabled=true"

echo "============================================================"
echo " Ansible PROD Stack Deploy"
echo " env_dev_enabled=false  |  env_prod_enabled=true (isolated)"
[[ ${#MODULE_FLAGS[@]} -gt 0 ]] && echo " module overrides: ${MODULE_FLAGS[*]}"
echo "============================================================"
echo ""
echo " Tắt 1 module:    bash run-prod.sh --skip-module elasticsearch"
echo " Chỉ test 1 module: bash run-prod.sh --only-module grafana"
echo ""

run() {
  local label="$1"; shift
  echo ""
  echo "──── $label ────"
  ansible-playbook -i inventory/hosts.ini "$@" $ENV_FLAGS \
    "${MODULE_FLAGS[@]+"${MODULE_FLAGS[@]}"}"\
    "${EXTRA_OPTS[@]+"${EXTRA_OPTS[@]}"}"
}

# 0. Preflight
run "PREFLIGHT" playbooks/preflight.yml

# 1. K8s cluster (chỉ prod nodes nhờ --limit)
run "K8S PROD" playbooks/k8s.yml --limit k8s_prod

# 2. DB prod (MySQL + MongoDB)
run "DB PROD" playbooks/data.yml --limit db_prod --tags mysql,mongodb

# 3. Shared data stack — Debezium chỉ register connector prod
run "DATA STACK + DEBEZIUM" playbooks/data.yml --limit data

# 4. Observability (Prometheus chỉ có prod scrape targets)
run "OBSERVABILITY" playbooks/observability.yml

# 5. Ingress-nginx trên prod master
run "INGRESS PROD" playbooks/ingress-nginx.yml --limit k8s_prod_master

# 6. App microservices
run "APP PROD" playbooks/app.yml --limit k8s_prod_master $VAULT_OPT

# 7. OTel Collector + Node Exporter chỉ trên prod nodes
run "COLLECTORS PROD" playbooks/collectors.yml --limit k8s_prod,db_prod

# 8. Prometheus Agent Mode trên prod master
run "METRICS K8S PROD" playbooks/metrics-k8s.yml --limit k8s_prod_master

# NOTE: Ops Agent được cài tự động qua Terraform startup_script.

echo ""
echo "============================================================"
echo " PROD stack deploy XONG!"
echo "============================================================"
