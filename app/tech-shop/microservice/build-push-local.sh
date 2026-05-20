#!/usr/bin/env bash
# =============================================================
# Build & push 9 microservices LOCAL (yêu cầu Docker desktop trên Windows/WSL2)
# Dùng khi muốn build cục bộ (debug nhanh) thay vì qua Cloud Build.
#
# Usage:
#   ./build-push-local.sh dev          # tag = dev
#   ./build-push-local.sh prod         # tag = prod
#   ./build-push-local.sh v1.0.0       # tag = v1.0.0
# =============================================================
set -euo pipefail

TAG="${1:-latest}"
PROJECT_ID="gcp-apse1-prj-sh-access-003"
REGION="asia-southeast1"
REPO="techshop"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

SERVICES=(
  discovery-service
  identity-service
  catalog-service
  order-service
  inventory-service
  payment-service
  search-service
  bff-user
  bff-admin
)

echo "==> Configure docker auth for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

cd "$(dirname "$0")"

for SVC in "${SERVICES[@]}"; do
  echo ""
  echo "================================================================"
  echo "  Build ${SVC}:${TAG}"
  echo "================================================================"
  docker build \
    --build-arg SERVICE_NAME="${SVC}" \
    --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo local)" \
    -t "${REGISTRY}/${SVC}:${TAG}" \
    .

  echo "==> Push ${REGISTRY}/${SVC}:${TAG}"
  docker push "${REGISTRY}/${SVC}:${TAG}"
done

echo ""
echo "✅ All 9 services pushed to ${REGISTRY}"
