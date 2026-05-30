#!/usr/bin/env bash
# =============================================================================
# env-destroy.sh — Destroy/apply toàn bộ resource của 1 môi trường
# Usage:
#   ./env-destroy.sh destroy dev    # tắt dev
#   ./env-destroy.sh destroy prod   # tắt prod
#   ./env-destroy.sh apply   dev    # bật lại dev
#   ./env-destroy.sh apply   prod   # bật lại prod
#   ./env-destroy.sh plan    dev    # xem trước sẽ destroy/create gì
# =============================================================================
set -euo pipefail

ACTION="${1:-}"
ENV="${2:-}"

if [[ -z "$ACTION" || -z "$ENV" ]]; then
  echo "Usage: $0 <destroy|apply|plan> <dev|prod>"
  exit 1
fi

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "ENV phải là 'dev' hoặc 'prod'"
  exit 1
fi

# Lấy danh sách resource của env từ terraform state
# Lọc theo pattern tên chứa "-dev-" hoặc "-prod-" tương ứng
echo "==> Đang lấy danh sách resource env=$ENV từ terraform state..."

# Các pattern khớp với naming convention trong codebase:
#   - compute-engine:    gcp-asia-southeast1-vm-k8s-dev-* / gcp-asia-southeast1-vm-db-dev-*
#   - lb:                *-dev-techshop-* / *-dev-workers-*
#   - monitoring:        *-dev-003 (alert policies, notification channels)
#   - shared vpc:        *-shared-vpc-service-dev-* (chỉ attachment, không phải host)
# KHÔNG lấy: VPC, subnet, firewall, peering (network infra — giữ lại để recreate nhanh)

MATCH_PATTERN="(vm-k8s-${ENV}|vm-db-${ENV}|ig-k8s-${ENV}|backend-k8s-${ENV}|hc-k8s-${ENV}|url-map-k8s-${ENV}|http-proxy-k8s-${ENV}|lb-k8s-${ENV}-techshop|fr-k8s-${ENV}-techshop|alert-cpu-${ENV}|alert-memory-${ENV}|monitoring-email-${ENV}|router-nat-${ENV}|nat-${ENV})"

TARGETS=$(terraform state list 2>/dev/null | grep -E "$MATCH_PATTERN" \
  | sed 's/^/-target=/' | tr '\n' ' ')

if [[ -z "$TARGETS" ]]; then
  echo "Không tìm thấy resource nào cho env=$ENV trong state."
  echo "Có thể đã bị destroy rồi hoặc chưa apply."
  exit 0
fi

echo ""
echo "==> Resource sẽ bị $ACTION:"
terraform state list 2>/dev/null | grep -E "$MATCH_PATTERN" \
  | sed 's/^/  - /'

echo ""
read -rp "Xác nhận $ACTION env=$ENV? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Hủy."
  exit 0
fi

echo ""
echo "==> Đang chạy: terraform $ACTION $TARGETS"
eval "terraform $ACTION $TARGETS"
