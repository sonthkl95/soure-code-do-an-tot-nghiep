#!/usr/bin/env bash
# =============================================================================
# demo-alerts.sh — Script kiểm thử hệ thống giám sát TechShop
# Chạy trên: Bastion Host (34.142.190.240)
# User: admin_sontx_online
# SSH Key: ~/.ssh/gcp_sontx_key
# =============================================================================

set -euo pipefail

# ── Màu sắc terminal ─────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Cấu hình SSH ─────────────────────────────────────────────────────────────
SSH_KEY="$HOME/.ssh/gcp_sontx_key"
SSH_USER="admin_sontx_online"
SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o ConnectTimeout=10"

# ── IP máy chủ (từ inventory/hosts.ini) ──────────────────────────────────────
IP_K8S_PROD_MASTER="10.20.1.10"
IP_K8S_PROD_WORKER1="10.20.1.20"
IP_K8S_PROD_WORKER2="10.20.1.21"
IP_DB_PROD="10.20.1.30"
IP_DATA_VM="10.60.1.20"
IP_OBS_VM="10.60.1.10"
K8S_NAMESPACE="prod"

# ── Hàm tiện ích ─────────────────────────────────────────────────────────────
ssh_cmd() {
    local host="$1"; shift
    ssh ${SSH_OPTS} "${SSH_USER}@${host}" "$@"
}

print_header() {
    clear
    echo -e "${BOLD}${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║        DEMO HỆ THỐNG GIÁM SÁT — TECHSHOP E-COMMERCE            ║"
    echo "║                  Monitoring on Google Cloud Platform            ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${RESET}"
}

print_alert_box() {
    local code="$1"
    local msg="$2"
    local level="$3"   # critical | warning
    local color="${RED}"
    local icon="🔴"
    [[ "$level" == "warning" ]] && color="${YELLOW}" && icon="🟡"

    echo ""
    echo -e "${color}${BOLD}┌─── THÔNG BÁO KỲ VỌNG (Telegram / Slack) ───────────────────────┐${RESET}"
    echo -e "${color}${BOLD}│ ${icon} [${code}] ${msg}${RESET}"
    echo -e "${color}${BOLD}└─────────────────────────────────────────────────────────────────┘${RESET}"
    echo ""
}

wait_confirm() {
    echo -e "${DIM}Nhấn ${BOLD}[Enter]${RESET}${DIM} để tiếp tục hoặc ${BOLD}[Ctrl+C]${RESET}${DIM} để hủy...${RESET}"
    read -r
}

show_countdown() {
    local secs="$1"
    local label="${2:-Chờ Prometheus phát hiện}"
    echo -ne "${CYAN}${label}: "
    for ((i=secs; i>0; i--)); do
        echo -ne "${BOLD}${i}s ${RESET}"
        sleep 1
    done
    echo -e "${GREEN}✓ Xong!${RESET}"
}

# ── Menu chính ────────────────────────────────────────────────────────────────
show_main_menu() {
    print_header
    echo -e "${BOLD}  Chọn nhóm kiểm thử:${RESET}"
    echo ""
    echo -e "  ${BLUE}${BOLD}[1]${RESET}  🏗️  Nhóm 1 — Hạ Tầng GCP  ${DIM}(INF-01 → INF-05)${RESET}"
    echo -e "  ${BLUE}${BOLD}[2]${RESET}  ☸️  Nhóm 2 — Cụm Kubernetes ${DIM}(K8S-01 → K8S-05)${RESET}"
    echo -e "  ${BLUE}${BOLD}[3]${RESET}  📦  Nhóm 3 — Ứng Dụng      ${DIM}(APP-01 → APP-05)${RESET}"
    echo ""
    echo -e "  ${GREEN}${BOLD}[r]${RESET}  🔧  Khôi phục tất cả (recover all)"
    echo -e "  ${YELLOW}${BOLD}[s]${RESET}  📊  Kiểm tra trạng thái hệ thống"
    echo -e "  ${RED}${BOLD}[q]${RESET}  ❌  Thoát"
    echo ""
    echo -ne "  Nhập lựa chọn: "
}

# ── Menu nhóm hạ tầng ─────────────────────────────────────────────────────────
show_infra_menu() {
    print_header
    echo -e "${BOLD}  🏗️  NHÓM 1 — HẠ TẦNG GCP${RESET}  ${DIM}(Tài nguyên do Terraform dựng)${RESET}"
    echo ""
    echo -e "  ${RED}${BOLD}[1]${RESET}  INF-01  ${BOLD}VM down${RESET}          ${DIM}— Tắt db-prod (10.20.1.30)${RESET}"
    echo -e "  ${YELLOW}${BOLD}[2]${RESET}  INF-02  ${BOLD}Ổ đĩa đầy${RESET}       ${DIM}— Data VM (10.60.1.20) chiếm 85GB${RESET}"
    echo -e "  ${RED}${BOLD}[3]${RESET}  INF-03  ${BOLD}RAM cạn kiệt${RESET}     ${DIM}— OOM Killer nguy cơ tắt MySQL${RESET}"
    echo -e "  ${RED}${BOLD}[4]${RESET}  INF-04  ${BOLD}LB backend down${RESET}  ${DIM}— GCP Load Balancer 502 toàn bộ${RESET}"
    echo -e "  ${YELLOW}${BOLD}[5]${RESET}  INF-05  ${BOLD}Obs VM quá tải${RESET}  ${DIM}— Mù giám sát: Prometheus bị chậm${RESET}"
    echo ""
    echo -e "  ${DIM}[0]  Quay lại menu chính${RESET}"
    echo ""
    echo -ne "  Nhập lựa chọn: "
}

# ── Menu nhóm kubernetes ──────────────────────────────────────────────────────
show_k8s_menu() {
    print_header
    echo -e "${BOLD}  ☸️  NHÓM 2 — CỤM KUBERNETES${RESET}  ${DIM}(Prod cluster: 10.20.1.x)${RESET}"
    echo ""
    echo -e "  ${RED}${BOLD}[1]${RESET}  K8S-01  ${BOLD}Worker NotReady${RESET}    ${DIM}— worker-2 (10.20.1.21) ngừng phản hồi${RESET}"
    echo -e "  ${RED}${BOLD}[2]${RESET}  K8S-02  ${BOLD}CrashLoopBackOff${RESET}   ${DIM}— order-service sai DB_HOST${RESET}"
    echo -e "  ${RED}${BOLD}[3]${RESET}  K8S-03  ${BOLD}Ingress-nginx down${RESET} ${DIM}— Toàn bộ HTTP 502${RESET}"
    echo -e "  ${YELLOW}${BOLD}[4]${RESET}  K8S-04  ${BOLD}Thiếu replica${RESET}     ${DIM}— catalog-service chỉ 1/2 replicas${RESET}"
    echo -e "  ${RED}${BOLD}[5]${RESET}  K8S-05  ${BOLD}API Server down${RESET}    ${DIM}— Master 10.20.1.10 không quản lý được${RESET}"
    echo ""
    echo -e "  ${DIM}[0]  Quay lại menu chính${RESET}"
    echo ""
    echo -ne "  Nhập lựa chọn: "
}

# ── Menu nhóm ứng dụng ────────────────────────────────────────────────────────
show_app_menu() {
    print_header
    echo -e "${BOLD}  📦  NHÓM 3 — ỨNG DỤNG${RESET}  ${DIM}(Microservices + Data Services)${RESET}"
    echo ""
    echo -e "  ${RED}${BOLD}[1]${RESET}  APP-01  ${BOLD}Payment down${RESET}     ${DIM}— Mất 100%% doanh thu${RESET}"
    echo -e "  ${RED}${BOLD}[2]${RESET}  APP-02  ${BOLD}Identity down${RESET}    ${DIM}— 100%% người dùng bị đăng xuất${RESET}"
    echo -e "  ${RED}${BOLD}[3]${RESET}  APP-03  ${BOLD}MySQL down${RESET}       ${DIM}— Website hoàn toàn tê liệt${RESET}"
    echo -e "  ${RED}${BOLD}[4]${RESET}  APP-04  ${BOLD}Kafka down${RESET}       ${DIM}— Pipeline sự kiện đứng hoàn toàn${RESET}"
    echo -e "  ${RED}${BOLD}[5]${RESET}  APP-05  ${BOLD}Redis down${RESET}       ${DIM}— Cascade failure: Redis → MySQL${RESET}"
    echo ""
    echo -e "  ${DIM}[0]  Quay lại menu chính${RESET}"
    echo ""
    echo -ne "  Nhập lựa chọn: "
}

# =============================================================================
# NHÓM 1 — HẠ TẦNG
# =============================================================================

demo_inf01() {
    print_header
    echo -e "${RED}${BOLD}  [INF-01] VM DOWN — Máy chủ GCP ngừng phản hồi${RESET}"
    echo -e "  ${DIM}Terraform resource: google_compute_instance.gcp-asia-southeast1-vm-db-prod-001${RESET}"
    echo -e "  ${DIM}IP: ${IP_DB_PROD} | project: prod${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Tắt kubelet trên db-prod để giả lập VM mất kết nối${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Dừng node-exporter trên db-prod...${RESET}"
    ssh_cmd "${IP_DB_PROD}" "sudo systemctl stop node_exporter" \
        && echo -e "${GREEN}  ✓ node_exporter đã dừng trên ${IP_DB_PROD}${RESET}" \
        || echo -e "${RED}  ✗ Lỗi SSH — kiểm tra kết nối VPN/Bastion${RESET}"

    print_alert_box "INF-01" "Máy chủ GCP MẤT KẾT NỐI: ${IP_DB_PROD}:9100 (cluster: prod)" "critical"
    show_countdown 30 "Chờ Prometheus phát hiện"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_inf01
    fi
}

recover_inf01() {
    echo -e "${CYAN}  → Khôi phục node-exporter trên db-prod...${RESET}"
    ssh_cmd "${IP_DB_PROD}" "sudo systemctl start node_exporter" \
        && echo -e "${GREEN}  ✓ node_exporter đã khởi động lại. Alert sẽ tự RESOLVED.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi khôi phục — kiểm tra SSH${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_inf02() {
    print_header
    echo -e "${YELLOW}${BOLD}  [INF-02] Ổ ĐĨA ĐẦY — Data VM 10.60.1.20 (100GB pd-balanced)${RESET}"
    echo -e "  ${DIM}Terraform resource: google_compute_instance.gcp-asia-southeast1-vm-data-001${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Tạo file 85GB giả lập đầy ổ đĩa${RESET}"

    echo -e "${CYAN}  → Kiểm tra dung lượng hiện tại...${RESET}"
    ssh_cmd "${IP_DATA_VM}" "df -h /" || true

    wait_confirm

    echo -e "${CYAN}  → Tạo file 85GB để chiếm dung lượng...${RESET}"
    ssh_cmd "${IP_DATA_VM}" "fallocate -l 85G /tmp/demo_disk_full.tmp && df -h /" \
        && echo -e "${GREEN}  ✓ File tạo xong. Chờ Prometheus scrape...${RESET}" \
        || echo -e "${RED}  ✗ Lỗi — ổ đĩa có thể không đủ trống để test${RESET}"

    print_alert_box "INF-02" "Ổ đĩa gần đầy (< 20%) - ${IP_DATA_VM}" "warning"
    show_countdown 60 "Chờ Prometheus phát hiện (scrape interval 15s + for 5m)"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_inf02
    fi
}

recover_inf02() {
    echo -e "${CYAN}  → Xóa file test...${RESET}"
    ssh_cmd "${IP_DATA_VM}" "rm -f /tmp/demo_disk_full.tmp && df -h /" \
        && echo -e "${GREEN}  ✓ Đã dọn dẹp. Dung lượng đã giải phóng.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_inf03() {
    print_header
    echo -e "${RED}${BOLD}  [INF-03] RAM CẠN KIỆT — OOM Killer nguy cơ tắt MySQL/MongoDB${RESET}"
    echo -e "  ${DIM}DB Prod VM (e2-medium: 4GB RAM) — IP: ${IP_DB_PROD}${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Chạy stress-ng chiếm 90%% RAM trong 5 phút${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Khởi động stress test RAM trên ${IP_DB_PROD}...${RESET}"
    ssh_cmd "${IP_DB_PROD}" "nohup stress-ng --vm 1 --vm-bytes 90% --timeout 300s > /tmp/stress.log 2>&1 &" \
        && echo -e "${GREEN}  ✓ Stress test đang chạy nền (5 phút). Theo dõi Grafana.${RESET}" \
        || echo -e "${YELLOW}  ⚠ stress-ng chưa cài — thử: sudo apt-get install -y stress-ng${RESET}"

    print_alert_box "INF-03" "RAM cạn kiệt > 90% - ${IP_DB_PROD} — OOM Killer có thể kích hoạt" "critical"
    echo -e "  ${DIM}Stress test tự dừng sau 5 phút, không cần khôi phục thủ công.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_inf04() {
    print_header
    echo -e "${RED}${BOLD}  [INF-04] GCP LOAD BALANCER BACKEND DOWN${RESET}"
    echo -e "  ${DIM}Health check: NodePort :30080 trên worker-1 (${IP_K8S_PROD_WORKER1}) + worker-2 (${IP_K8S_PROD_WORKER2})${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Scale ingress-nginx về 0 replica${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Scale down ingress-nginx-controller...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment ingress-nginx-controller --replicas=0 -n ingress-nginx" \
        && echo -e "${GREEN}  ✓ Ingress-nginx đã dừng. GCP LB health check sẽ fail sau ~30s.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi kubectl — kiểm tra kubeconfig trên master${RESET}"

    print_alert_box "INF-04" "GCP LB Backend không phản hồi — Website trả về 502" "critical"
    show_countdown 30 "Chờ GCP health check fail"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_inf04
    fi
}

recover_inf04() {
    echo -e "${CYAN}  → Khôi phục ingress-nginx...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment ingress-nginx-controller --replicas=2 -n ingress-nginx" \
        && echo -e "${GREEN}  ✓ Ingress-nginx đang khởi động lại (30-60s).${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_inf05() {
    print_header
    echo -e "${YELLOW}${BOLD}  [INF-05] OBSERVABILITY VM QUÁ TẢI — Rủi ro mù giám sát${RESET}"
    echo -e "  ${DIM}Obs VM: ${IP_OBS_VM} — Prometheus + Alertmanager + Grafana + Loki${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Tạo tải CPU 85%% trên máy chủ giám sát${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Khởi động stress test CPU trên obs-vm...${RESET}"
    ssh_cmd "${IP_OBS_VM}" "nohup stress-ng --cpu 2 --cpu-load 85 --timeout 300s > /tmp/stress.log 2>&1 &" \
        && echo -e "${GREEN}  ✓ Stress test đang chạy. Quan sát Prometheus scrape delay.${RESET}" \
        || echo -e "${YELLOW}  ⚠ stress-ng chưa cài — thử: sudo apt-get install -y stress-ng${RESET}"

    print_alert_box "INF-05" "Observability VM CPU: 87% — Prometheus scrape bị trễ" "warning"
    echo -e "  ${DIM}Stress test tự dừng sau 5 phút.${RESET}"
}

# =============================================================================
# NHÓM 2 — KUBERNETES
# =============================================================================

demo_k8s01() {
    print_header
    echo -e "${RED}${BOLD}  [K8S-01] WORKER NODE NOT READY${RESET}"
    echo -e "  ${DIM}Node: k8s-prod-worker-2 (${IP_K8S_PROD_WORKER2}) — Prod cluster${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Dừng kubelet trên worker-2${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Dừng kubelet trên ${IP_K8S_PROD_WORKER2}...${RESET}"
    ssh_cmd "${IP_K8S_PROD_WORKER2}" "sudo systemctl stop kubelet" \
        && echo -e "${GREEN}  ✓ Kubelet đã dừng. Node sẽ chuyển sang NotReady sau ~40s.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi SSH${RESET}"

    echo -e "${CYAN}  → Xem trạng thái nodes...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" "kubectl get nodes" || true

    print_alert_box "K8S-01" "K8s Node KHÔNG SẴN SÀNG: k8s-prod-worker-2 (prod)" "critical"
    show_countdown 45 "Chờ K8s đánh dấu NotReady"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_k8s01
    fi
}

recover_k8s01() {
    echo -e "${CYAN}  → Khởi động lại kubelet...${RESET}"
    ssh_cmd "${IP_K8S_PROD_WORKER2}" "sudo systemctl start kubelet" \
        && echo -e "${GREEN}  ✓ Kubelet đang start. Node sẽ Ready sau ~1 phút.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_k8s02() {
    print_header
    echo -e "${RED}${BOLD}  [K8S-02] POD CRASHLOOPBACKOFF${RESET}"
    echo -e "  ${DIM}Deployment: order-service | Namespace: ${K8S_NAMESPACE}${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Inject sai DB_HOST vào order-service${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Inject biến môi trường sai...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl set env deployment/order-service DB_HOST=wrong-host-does-not-exist -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Đã inject. Order-service đang crash...${RESET}" \
        || echo -e "${RED}  ✗ Lỗi kubectl${RESET}"

    echo -e "${CYAN}  → Theo dõi pod restart:${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl get pods -n ${K8S_NAMESPACE} | grep order" || true

    print_alert_box "K8S-02" "Pod order-service CrashLoop > 3 lần/15 phút" "critical"
    echo -e "  ${DIM}Prometheus phát hiện sau khi pod restart > 3 lần (~5 phút).${RESET}"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_k8s02
    fi
}

recover_k8s02() {
    echo -e "${CYAN}  → Rollback order-service về phiên bản trước...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl rollout undo deployment/order-service -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Rollback thành công. Pod đang khởi động lại bình thường.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_k8s03() {
    print_header
    echo -e "${RED}${BOLD}  [K8S-03] INGRESS-NGINX DOWN — Toàn bộ HTTP 502${RESET}"
    echo -e "  ${DIM}GCP LB → ingress-nginx NodePort :30080 → microservices${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Scale ingress-nginx-controller về 0 replica${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Scale down ingress-nginx-controller...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment ingress-nginx-controller --replicas=0 -n ingress-nginx" \
        && echo -e "${GREEN}  ✓ Done. Website sẽ trả về 502 trong vài giây.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi kubectl${RESET}"

    print_alert_box "K8S-03" "Ingress-nginx NGỪNG HOẠT ĐỘNG — Website 502/503 toàn bộ" "critical"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_k8s03
    fi
}

recover_k8s03() {
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment ingress-nginx-controller --replicas=2 -n ingress-nginx" \
        && echo -e "${GREEN}  ✓ Ingress-nginx đang khởi động lại.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_k8s04() {
    print_header
    echo -e "${YELLOW}${BOLD}  [K8S-04] DEPLOYMENT THIẾU REPLICA${RESET}"
    echo -e "  ${DIM}Deployment: catalog-service | Expected: 2 replicas${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Scale catalog-service xuống 1 replica${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Scale catalog-service xuống 1 replica...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment catalog-service --replicas=1 -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Done. Capacity giảm 50%%.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi kubectl${RESET}"

    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl get deployment catalog-service -n ${K8S_NAMESPACE}" || true

    print_alert_box "K8S-04" "catalog-service thiếu replica: 1/2 ready (prod)" "warning"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_k8s04
    fi
}

recover_k8s04() {
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment catalog-service --replicas=2 -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ catalog-service đã về 2 replicas.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_k8s05() {
    print_header
    echo -e "${RED}${BOLD}  [K8S-05] KUBERNETES API SERVER DOWN${RESET}"
    echo -e "  ${DIM}Master: k8s-prod-master-1 (${IP_K8S_PROD_MASTER}) — kube-apiserver :6443${RESET}"
    echo ""
    echo -e "${RED}${BOLD}  ⚠ CẢNH BÁO: Sau khi dừng, bạn sẽ mất quyền kubectl cho đến khi khôi phục!${RESET}"
    echo -e "${YELLOW}  Hành động: Dừng kubelet trên Master node${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Dừng kubelet trên master ${IP_K8S_PROD_MASTER}...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" "sudo systemctl stop kubelet" \
        && echo -e "${GREEN}  ✓ Kubelet master đã dừng. API Server sẽ không phản hồi.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi SSH${RESET}"

    print_alert_box "K8S-05" "Kubernetes API Server DOWN — ${IP_K8S_PROD_MASTER}:6443 — Cluster prod không quản lý được" "critical"
    show_countdown 30 "Chờ Prometheus phát hiện API Server down"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_k8s05
    fi
}

recover_k8s05() {
    echo -e "${CYAN}  → Khởi động lại kubelet trên master...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" "sudo systemctl start kubelet" \
        && echo -e "${GREEN}  ✓ Master đang khởi động. API Server sẽ ready sau ~30s.${RESET}"
}

# =============================================================================
# NHÓM 3 — ỨNG DỤNG
# =============================================================================

demo_app01() {
    print_header
    echo -e "${RED}${BOLD}  [APP-01] PAYMENT SERVICE DOWN — Mất 100%% doanh thu${RESET}"
    echo -e "  ${DIM}Namespace: ${K8S_NAMESPACE} | Deployment: payment-service${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Scale payment-service về 0 replica${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Scale down payment-service...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment payment-service --replicas=0 -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Payment service đã dừng. Khách hàng không thể thanh toán.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi kubectl${RESET}"

    print_alert_box "APP-01" "Dịch vụ thanh toán NGỪNG HOẠT ĐỘNG — Mỗi phút downtime = 100% đơn hàng bị mất" "critical"
    show_countdown 60 "Chờ Prometheus phát hiện"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_app01
    fi
}

recover_app01() {
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment payment-service --replicas=2 -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Payment service đang khởi động lại.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_app02() {
    print_header
    echo -e "${RED}${BOLD}  [APP-02] IDENTITY SERVICE DOWN — Toàn bộ login bị từ chối${RESET}"
    echo -e "  ${DIM}identity-service là gateway xác thực JWT cho mọi API call${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Scale identity-service về 0 replica${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Scale down identity-service...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment identity-service --replicas=0 -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Identity service đã dừng. 100%% user bị đăng xuất.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi kubectl${RESET}"

    print_alert_box "APP-02" "Identity Service DOWN — 100% người dùng bị đăng xuất — HTTP 401/503" "critical"
    show_countdown 60 "Chờ Prometheus phát hiện"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_app02
    fi
}

recover_app02() {
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment identity-service --replicas=2 -n ${K8S_NAMESPACE}" \
        && echo -e "${GREEN}  ✓ Identity service đang khởi động lại.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_app03() {
    print_header
    echo -e "${RED}${BOLD}  [APP-03] MYSQL DOWN — Website hoàn toàn tê liệt${RESET}"
    echo -e "  ${DIM}DB Prod VM: ${IP_DB_PROD} | MySQL lưu: users, products, orders, payments${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Dừng MySQL trên db-prod${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Dừng MySQL trên ${IP_DB_PROD}...${RESET}"
    ssh_cmd "${IP_DB_PROD}" "sudo systemctl stop mysql" \
        && echo -e "${GREEN}  ✓ MySQL đã dừng. Website hoàn toàn không hoạt động.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi SSH${RESET}"

    print_alert_box "APP-03" "MySQL NGỪNG HOẠT ĐỘNG - ${IP_DB_PROD} — Không đăng nhập, không đặt hàng" "critical"
    show_countdown 60 "Chờ Prometheus phát hiện (mysql_up == 0)"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_app03
    fi
}

recover_app03() {
    ssh_cmd "${IP_DB_PROD}" "sudo systemctl start mysql" \
        && echo -e "${GREEN}  ✓ MySQL đang khởi động lại. Alert sẽ tự RESOLVED.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_app04() {
    print_header
    echo -e "${RED}${BOLD}  [APP-04] KAFKA DOWN — Pipeline sự kiện bị đứng${RESET}"
    echo -e "  ${DIM}Data VM: ${IP_DATA_VM} | Luồng: order → payment → inventory${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Dừng Kafka trên data-vm${RESET}"
    echo -e "${DIM}  Sau khi Kafka down: đơn hàng được tạo nhưng payment KHÔNG bao giờ chạy (đơn hàng ma)${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Dừng Kafka trên ${IP_DATA_VM}...${RESET}"
    ssh_cmd "${IP_DATA_VM}" "sudo systemctl stop kafka" \
        && echo -e "${GREEN}  ✓ Kafka đã dừng. Event pipeline bị đứng hoàn toàn.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi SSH${RESET}"

    print_alert_box "APP-04" "Kafka Broker DOWN - ${IP_DATA_VM} — Pipeline sự kiện đứng hoàn toàn" "critical"
    show_countdown 60 "Chờ Prometheus phát hiện"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_app04
    fi
}

recover_app04() {
    ssh_cmd "${IP_DATA_VM}" "sudo systemctl start kafka" \
        && echo -e "${GREEN}  ✓ Kafka đang khởi động lại. Consumer lag sẽ giảm dần.${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────

demo_app05() {
    print_header
    echo -e "${RED}${BOLD}  [APP-05] REDIS DOWN — Cascade Failure: Redis → MySQL sập theo${RESET}"
    echo -e "  ${DIM}Data VM: ${IP_DATA_VM} | Redis cache session, products, cart${RESET}"
    echo ""
    echo -e "${YELLOW}  Hành động: Dừng Redis trên data-vm${RESET}"
    echo -e "${DIM}  Sau đó: quan sát MySQL connection pool tăng đột biến trên Grafana${RESET}"
    wait_confirm

    echo -e "${CYAN}  → Dừng Redis trên ${IP_DATA_VM}...${RESET}"
    ssh_cmd "${IP_DATA_VM}" "sudo systemctl stop redis" \
        && echo -e "${GREEN}  ✓ Redis đã dừng. Mọi request đang đánh thẳng vào MySQL.${RESET}" \
        || echo -e "${RED}  ✗ Lỗi SSH — thử: sudo systemctl stop redis-server${RESET}"

    print_alert_box "APP-05" "Redis Cache DOWN - ${IP_DATA_VM} — Cache miss cascade, MySQL sắp quá tải" "critical"
    show_countdown 60 "Chờ Prometheus phát hiện (redis_up == 0)"
    echo -e "${CYAN}  → Theo dõi Grafana: MySQL connections tăng đột biến (hiệu ứng domino)${RESET}"

    echo ""
    echo -ne "${YELLOW}  Khôi phục ngay? [y/N]: ${RESET}"
    read -r ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
        recover_app05
    fi
}

recover_app05() {
    ssh_cmd "${IP_DATA_VM}" "sudo systemctl start redis 2>/dev/null || sudo systemctl start redis-server" \
        && echo -e "${GREEN}  ✓ Redis đang khởi động. MySQL connections sẽ giảm dần.${RESET}"
}

# =============================================================================
# KHÔI PHỤC TẤT CẢ
# =============================================================================

recover_all() {
    print_header
    echo -e "${GREEN}${BOLD}  KHÔI PHỤC TẤT CẢ CÁC DEMO${RESET}"
    echo ""
    echo -e "${CYAN}  → Khôi phục node-exporter trên db-prod...${RESET}"
    ssh_cmd "${IP_DB_PROD}" "sudo systemctl start node_exporter 2>/dev/null; true" && echo "  ✓ INF-01 OK" || echo "  - INF-01 skip"

    echo -e "${CYAN}  → Xóa file disk test trên data-vm...${RESET}"
    ssh_cmd "${IP_DATA_VM}" "rm -f /tmp/demo_disk_full.tmp; true" && echo "  ✓ INF-02 OK" || echo "  - INF-02 skip"

    echo -e "${CYAN}  → Kill stress-ng trên tất cả VMs...${RESET}"
    for host in "${IP_DB_PROD}" "${IP_OBS_VM}"; do
        ssh_cmd "${host}" "sudo pkill -f stress-ng 2>/dev/null; true" || true
    done
    echo "  ✓ INF-03, INF-05 OK"

    echo -e "${CYAN}  → Khôi phục ingress-nginx (2 replicas)...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment ingress-nginx-controller --replicas=2 -n ingress-nginx 2>/dev/null; true" \
        && echo "  ✓ INF-04 + K8S-03 OK" || echo "  - skip"

    echo -e "${CYAN}  → Khôi phục kubelet worker-2...${RESET}"
    ssh_cmd "${IP_K8S_PROD_WORKER2}" "sudo systemctl start kubelet 2>/dev/null; true" && echo "  ✓ K8S-01 OK" || echo "  - skip"

    echo -e "${CYAN}  → Rollback order-service...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl rollout undo deployment/order-service -n ${K8S_NAMESPACE} 2>/dev/null; true" \
        && echo "  ✓ K8S-02 OK" || echo "  - skip"

    echo -e "${CYAN}  → Khôi phục kubelet master...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" "sudo systemctl start kubelet 2>/dev/null; true" && echo "  ✓ K8S-05 OK" || echo "  - skip"

    echo -e "${CYAN}  → Khôi phục catalog-service (2 replicas)...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment catalog-service --replicas=2 -n ${K8S_NAMESPACE} 2>/dev/null; true" \
        && echo "  ✓ K8S-04 OK" || echo "  - skip"

    echo -e "${CYAN}  → Khôi phục payment + identity service...${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" \
        "kubectl scale deployment payment-service --replicas=2 -n ${K8S_NAMESPACE} 2>/dev/null; \
         kubectl scale deployment identity-service --replicas=2 -n ${K8S_NAMESPACE} 2>/dev/null; true" \
        && echo "  ✓ APP-01, APP-02 OK" || echo "  - skip"

    echo -e "${CYAN}  → Khôi phục MySQL...${RESET}"
    ssh_cmd "${IP_DB_PROD}" "sudo systemctl start mysql 2>/dev/null; true" && echo "  ✓ APP-03 OK" || echo "  - skip"

    echo -e "${CYAN}  → Khôi phục Kafka + Redis...${RESET}"
    ssh_cmd "${IP_DATA_VM}" \
        "sudo systemctl start kafka 2>/dev/null; \
         sudo systemctl start redis 2>/dev/null || sudo systemctl start redis-server 2>/dev/null; true" \
        && echo "  ✓ APP-04, APP-05 OK" || echo "  - skip"

    echo ""
    echo -e "${GREEN}${BOLD}  Tất cả dịch vụ đã được khôi phục!${RESET}"
    echo -e "${DIM}  Prometheus sẽ tự gửi thông báo RESOLVED trong vài phút.${RESET}"
}

# =============================================================================
# KIỂM TRA TRẠNG THÁI
# =============================================================================

check_status() {
    print_header
    echo -e "${BOLD}  TRẠNG THÁI HỆ THỐNG${RESET}"
    echo ""

    echo -e "${CYAN}  K8s Nodes (prod):${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" "kubectl get nodes -o wide" 2>/dev/null || echo "  ✗ Không kết nối được master"

    echo ""
    echo -e "${CYAN}  Pods (prod namespace):${RESET}"
    ssh_cmd "${IP_K8S_PROD_MASTER}" "kubectl get pods -n ${K8S_NAMESPACE}" 2>/dev/null || echo "  ✗ Lỗi kubectl"

    echo ""
    echo -e "${CYAN}  Dịch vụ data-vm (Kafka / Redis):${RESET}"
    ssh_cmd "${IP_DATA_VM}" "systemctl is-active kafka redis redis-server 2>/dev/null | paste - - -" 2>/dev/null || echo "  ✗ Không SSH được data-vm"

    echo ""
    echo -e "${CYAN}  MySQL (db-prod):${RESET}"
    ssh_cmd "${IP_DB_PROD}" "systemctl is-active mysql" 2>/dev/null || echo "  ✗ Không SSH được db-prod"

    echo ""
    echo -e "${CYAN}  Ổ đĩa data-vm:${RESET}"
    ssh_cmd "${IP_DATA_VM}" "df -h /" 2>/dev/null || echo "  ✗ skip"

    echo ""
    wait_confirm
}

# =============================================================================
# VÒNG LẶP CHÍNH
# =============================================================================

main() {
    # Kiểm tra SSH key tồn tại
    if [[ ! -f "${SSH_KEY}" ]]; then
        echo -e "${RED}  ✗ SSH key không tìm thấy: ${SSH_KEY}${RESET}"
        echo -e "  Chạy: ssh-keygen -t rsa -b 4096 -f ~/.ssh/gcp_sontx_key -N \"\""
        exit 1
    fi

    while true; do
        show_main_menu
        read -r choice

        case "$choice" in
            1) # Nhóm Hạ Tầng
                while true; do
                    show_infra_menu
                    read -r sub
                    case "$sub" in
                        1) demo_inf01 ;;
                        2) demo_inf02 ;;
                        3) demo_inf03 ;;
                        4) demo_inf04 ;;
                        5) demo_inf05 ;;
                        0) break ;;
                        *) echo -e "${RED}  Lựa chọn không hợp lệ${RESET}"; sleep 1 ;;
                    esac
                    echo ""; echo -ne "${DIM}  Nhấn Enter để quay lại menu nhóm...${RESET}"; read -r
                done
                ;;
            2) # Nhóm Kubernetes
                while true; do
                    show_k8s_menu
                    read -r sub
                    case "$sub" in
                        1) demo_k8s01 ;;
                        2) demo_k8s02 ;;
                        3) demo_k8s03 ;;
                        4) demo_k8s04 ;;
                        5) demo_k8s05 ;;
                        0) break ;;
                        *) echo -e "${RED}  Lựa chọn không hợp lệ${RESET}"; sleep 1 ;;
                    esac
                    echo ""; echo -ne "${DIM}  Nhấn Enter để quay lại menu nhóm...${RESET}"; read -r
                done
                ;;
            3) # Nhóm Ứng Dụng
                while true; do
                    show_app_menu
                    read -r sub
                    case "$sub" in
                        1) demo_app01 ;;
                        2) demo_app02 ;;
                        3) demo_app03 ;;
                        4) demo_app04 ;;
                        5) demo_app05 ;;
                        0) break ;;
                        *) echo -e "${RED}  Lựa chọn không hợp lệ${RESET}"; sleep 1 ;;
                    esac
                    echo ""; echo -ne "${DIM}  Nhấn Enter để quay lại menu nhóm...${RESET}"; read -r
                done
                ;;
            r|R) recover_all; echo ""; echo -ne "${DIM}  Nhấn Enter để quay lại...${RESET}"; read -r ;;
            s|S) check_status ;;
            q|Q) echo -e "\n${GREEN}  Bye!${RESET}\n"; exit 0 ;;
            *) echo -e "${RED}  Lựa chọn không hợp lệ${RESET}"; sleep 1 ;;
        esac
    done
}

main "$@"
