#!/usr/bin/env bash
# =============================================================================
# full-ops.sh -- Quan ly tai nguyen ton tien trong Terraform
#
# USAGE:
#   ./full-ops.sh destroy [--skip-env <dev|prod>]
#   ./full-ops.sh apply   [--skip-env <dev|prod>]
#   ./full-ops.sh plan    [--skip-env <dev|prod>]
#
# VI DU:
#   ./full-ops.sh destroy                  # destroy TAT CA (dev + prod + shared)
#   ./full-ops.sh destroy --skip-env prod  # destroy moi thu tru prod
#   ./full-ops.sh apply                    # apply TAT CA
#   ./full-ops.sh apply   --skip-env dev   # apply moi thu tru dev
#   ./full-ops.sh apply   --skip-env prod  # apply moi thu tru prod
#   ./full-ops.sh plan    --skip-env dev   # preview apply ma khong co dev
#
# TAI NGUYEN KHONG BI DUNG (free):
#   VPC, subnet, firewall, peering, IAM, Artifact Registry,
#   monitoring policies, notification channels, BigQuery
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -- Parse arguments ----------------------------------------------------------
ACTION="${1:-}"
SKIP_ENV=""

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-env)
      SKIP_ENV="${2:-}"
      if [[ "$SKIP_ENV" != "dev" && "$SKIP_ENV" != "prod" ]]; then
        echo "Loi: --skip-env phai la 'dev' hoac 'prod', nhan duoc: '$SKIP_ENV'"
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Option khong hop le: $1"
      echo "Usage: $0 <destroy|apply|plan> [--skip-env <dev|prod>]"
      exit 1
      ;;
  esac
done

if [[ -z "$ACTION" ]]; then
  echo "Usage: $0 <destroy|apply|plan> [--skip-env <dev|prod>]"
  echo ""
  echo "Vi du:"
  echo "  $0 destroy                  # destroy tat ca billable resource"
  echo "  $0 destroy --skip-env prod  # destroy tat ca tru prod"
  echo "  $0 apply   --skip-env dev   # apply tat ca tru dev"
  echo "  $0 plan    --skip-env dev   # preview khong co dev"
  exit 1
fi

if [[ "$ACTION" != "destroy" && "$ACTION" != "apply" && "$ACTION" != "plan" ]]; then
  echo "ACTION khong hop le: '$ACTION'. Phai la: destroy | apply | plan"
  exit 1
fi

# =============================================================================
# Dinh nghia cac nhom resource
# =============================================================================

# --- STATIC IP (reserved) -- KHONG BAO GIO destroy de giu nguyen IP ----------
# Cloudflare DNS dang tro toi cac IP nay. Destroy = mat IP -> phai sua DNS.
# Cac IP nay chi duoc apply (idempotent, khong tao lai neu da co).
STATIC_IP_TARGETS=(
  "google_compute_address.gcp-asia-southeast1-bastion-ip-003"
  "google_compute_global_address.gcp-asia-southeast1-lb-grafana-ip-003"
  "google_compute_global_address.gcp-asia-southeast1-lb-k8s-dev-techshop-ip-003"
  "google_compute_global_address.gcp-asia-southeast1-lb-k8s-prod-techshop-ip-003"
)

SHARED_TARGETS=(
  # Bastion
  "google_compute_instance.gcp-asia-southeast1-vm-bastion-003"
  # obs-vm (Prometheus, Grafana, Loki, Tempo, Alertmanager)
  "google_compute_instance.gcp-asia-southeast1-vm-observability-003"
  "google_compute_instance_group.gcp-asia-southeast1-ig-obs-003"
  "google_compute_router.gcp-asia-southeast1-router-nat-observability-003"
  "google_compute_router_nat.gcp-asia-southeast1-nat-observability-003"
  # data-vm (Kafka, Redis, Elasticsearch, Debezium)
  "google_compute_instance.gcp-asia-southeast1-vm-data-001"
  # Grafana Load Balancer (IP tach rieng o STATIC_IP_TARGETS)
  "google_compute_health_check.gcp-asia-southeast1-hc-grafana-003"
  "google_compute_backend_service.gcp-asia-southeast1-backend-grafana-003"
  "google_compute_url_map.gcp-asia-southeast1-url-map-grafana-003"
  "google_compute_target_http_proxy.gcp-asia-southeast1-http-proxy-grafana-003"
  "google_compute_global_forwarding_rule.gcp-asia-southeast1-forwarding-rule-grafana-003"
)

DEV_TARGETS=(
  "google_compute_instance.gcp-asia-southeast1-vm-k8s-dev-master-1"
  "google_compute_instance.gcp-asia-southeast1-vm-k8s-dev-worker-1"
  "google_compute_instance.gcp-asia-southeast1-vm-k8s-dev-worker-2"
  "google_compute_instance_group.gcp-asia-southeast1-ig-k8s-dev-workers-003"
  "google_compute_instance.gcp-asia-southeast1-vm-db-dev-001"
  # IP tach rieng o STATIC_IP_TARGETS
  "google_compute_health_check.gcp-asia-southeast1-hc-k8s-dev-ingress-003"
  "google_compute_backend_service.gcp-asia-southeast1-backend-k8s-dev-techshop-003"
  "google_compute_url_map.gcp-asia-southeast1-url-map-k8s-dev-techshop-003"
  "google_compute_target_http_proxy.gcp-asia-southeast1-http-proxy-k8s-dev-techshop-003"
  "google_compute_global_forwarding_rule.gcp-asia-southeast1-fr-k8s-dev-techshop-003"
  "google_compute_router.gcp-asia-southeast1-router-nat-dev-003"
  "google_compute_router_nat.gcp-asia-southeast1-nat-dev-003"
)

PROD_TARGETS=(
  "google_compute_instance.gcp-asia-southeast1-vm-k8s-prod-master-1"
  "google_compute_instance.gcp-asia-southeast1-vm-k8s-prod-worker-1"
  "google_compute_instance.gcp-asia-southeast1-vm-k8s-prod-worker-2"
  "google_compute_instance_group.gcp-asia-southeast1-ig-k8s-prod-workers-003"
  "google_compute_instance.gcp-asia-southeast1-vm-db-prod-001"
  # IP tach rieng o STATIC_IP_TARGETS
  "google_compute_health_check.gcp-asia-southeast1-hc-k8s-prod-ingress-003"
  "google_compute_backend_service.gcp-asia-southeast1-backend-k8s-prod-techshop-003"
  "google_compute_url_map.gcp-asia-southeast1-url-map-k8s-prod-techshop-003"
  "google_compute_target_http_proxy.gcp-asia-southeast1-http-proxy-k8s-prod-techshop-003"
  "google_compute_global_forwarding_rule.gcp-asia-southeast1-fr-k8s-prod-techshop-003"
  "google_compute_router.gcp-asia-southeast1-router-nat-prod-003"
  "google_compute_router_nat.gcp-asia-southeast1-nat-prod-003"
)

# =============================================================================
# Build active list -- SHARED xu ly khac nhau giua destroy vs apply:
#
#  - apply/plan : LUON apply SHARED (obs-vm, data-vm, bastion can cho moi env)
#  - destroy    :
#       * khong --skip-env  -> teardown toan bo, CO destroy SHARED
#       * co --skip-env X   -> giu env X song, nen GIU LAI SHARED
#                              (chi destroy env con lai)
# =============================================================================
INCLUDE_SHARED=true
if [[ "$ACTION" == "destroy" && -n "$SKIP_ENV" ]]; then
  # Giu 1 env song => khong duoc dung den shared infra
  INCLUDE_SHARED=false
fi

ACTIVE_TARGETS=()
[[ "$INCLUDE_SHARED" == "true" ]] && ACTIVE_TARGETS+=("${SHARED_TARGETS[@]}")
[[ "$SKIP_ENV" != "dev"  ]] && ACTIVE_TARGETS+=("${DEV_TARGETS[@]}")
[[ "$SKIP_ENV" != "prod" ]] && ACTIVE_TARGETS+=("${PROD_TARGETS[@]}")

# Static IP: CHI them khi apply/plan (de dam bao IP ton tai). KHONG BAO GIO
# dua vao danh sach destroy -> giu nguyen IP cho Cloudflare DNS.
if [[ "$ACTION" != "destroy" ]]; then
  ACTIVE_TARGETS+=("${STATIC_IP_TARGETS[@]}")
fi

# =============================================================================
# Print summary
# =============================================================================
LABEL="tat ca"
[[ -n "$SKIP_ENV" ]] && LABEL="tat ca (bo qua $SKIP_ENV)"

echo "============================================================"
echo " ACTION: $ACTION   |   scope: $LABEL"
echo "============================================================"
echo ""
if [[ "$INCLUDE_SHARED" == "true" ]]; then
  printf '  [shared]  %s\n' "${SHARED_TARGETS[@]}"
else
  echo "  [shared]  >>> GIU LAI (obs/data/bastion can cho $SKIP_ENV) <<<"
fi
if [[ "$SKIP_ENV" == "dev" ]]; then
  echo "  [dev]     >>> BO QUA (--skip-env dev) <<<"
else
  printf '  [dev]     %s\n' "${DEV_TARGETS[@]}"
fi
if [[ "$SKIP_ENV" == "prod" ]]; then
  echo "  [prod]    >>> BO QUA (--skip-env prod) <<<"
else
  printf '  [prod]    %s\n' "${PROD_TARGETS[@]}"
fi
if [[ "$ACTION" == "destroy" ]]; then
  echo "  [static-ip] >>> KHONG destroy (giu IP cho Cloudflare DNS) <<<"
  printf '              %s\n' "${STATIC_IP_TARGETS[@]}"
else
  printf '  [static-ip] %s\n' "${STATIC_IP_TARGETS[@]}"
fi
echo ""
echo "  Tong: ${#ACTIVE_TARGETS[@]} resource"
echo ""

# =============================================================================
# Confirm (bo qua voi plan)
# =============================================================================
if [[ "$ACTION" != "plan" ]]; then
  read -rp "Xac nhan $ACTION $LABEL? (yes/no): " CONFIRM
  [[ "$CONFIRM" != "yes" ]] && echo "Huy." && exit 0
  echo ""
fi

# =============================================================================
# Chay terraform
# =============================================================================
TARGET_FLAGS=$(printf -- '-target=%s ' "${ACTIVE_TARGETS[@]}")

echo "==> terraform $ACTION ..."
eval "terraform $ACTION $TARGET_FLAGS"

if [[ "$ACTION" != "plan" ]]; then
  echo ""
  echo "Done: $ACTION xong."
  if [[ "$ACTION" == "apply" ]]; then
    # ─── Tu dong khoi phuc secrets len bastion neu vua tao lai ──────────────
    # bastion-secrets.sh nam o repo root (1 cap tren terraform-code).
    # Chi copy file nao CON THIEU tren bastion (khong --force).
    SECRETS_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bastion-secrets.sh"
    if [[ "$INCLUDE_SHARED" == "true" && -x "$SECRETS_SCRIPT" ]]; then
      echo ""
      echo "==> Khoi phuc secrets len bastion (chi file con thieu)..."
      if [[ -d "${LOCAL_STORE:-$HOME/bastion-secrets}" ]]; then
        bash "$SECRETS_SCRIPT" push || echo "  (bo qua: push that bai, chay thu cong sau)"
      else
        echo "  Chua co backup local (~/bastion-secrets)."
        echo "  Neu day la lan dau: dang bastion cu con song, chay 'bash ../bastion-secrets.sh pull' de backup."
      fi
    fi

    echo ""
    echo "Buoc tiep theo -- chay Ansible tu Bastion:"
    case "$SKIP_ENV" in
      dev)  echo "  bash run-prod.sh   # vault tu dong tu ~/.vault_pass (ansible.cfg)" ;;
      prod) echo "  bash run-dev.sh    # vault tu dong tu ~/.vault_pass (ansible.cfg)" ;;
      *)    echo "  bash run-dev.sh    # vault tu dong tu ~/.vault_pass (ansible.cfg)"
            echo "  bash run-prod.sh" ;;
    esac
  fi
fi
