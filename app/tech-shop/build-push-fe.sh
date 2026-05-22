#!/usr/bin/env bash
# =============================================================
# Build & push 2 FE app (ecommerce-customer + techshop-admin) LOCAL.
# - VITE_API_BASE_URL được inject ở build-time theo môi trường (dev/prod).
# - Image push lên GCP Artifact Registry (project sh-access-003).
#
# Usage (chạy từ thư mục app/tech-shop/):
#   ./build-push-fe.sh dev      # build cho cluster dev (shop.dev.techshop.local / admin.dev.techshop.local)
#   ./build-push-fe.sh prod     # build cho cluster prod (shop.techshop.local / admin.techshop.local)
#
# Image tag = "dev" (single-tag policy đang dùng cho cả 2 cluster).
# =============================================================
set -euo pipefail

ENV="${1:-dev}"

PROJECT_ID="gcp-apse1-prj-sh-access-003"
REGION="asia-southeast1"
REPO="techshop"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

if [[ "$ENV" == "dev" ]]; then
  TAG="dev"
  CUSTOMER_API="http://shop.dev.techshop.local"
  ADMIN_API="http://admin.dev.techshop.local"
elif [[ "$ENV" == "prod" ]]; then
  TAG="prod"
  CUSTOMER_API="http://shop.techshop.local"
  ADMIN_API="http://admin.techshop.local"
else
  echo "ERROR: ENV phải là 'dev' hoặc 'prod'" >&2
  exit 1
fi

echo "==> Configure docker auth for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

cd "$(dirname "$0")"

# ---------- 1. ecommerce-customer ----------
echo ""
echo "================================================================"
echo "  Build ecommerce-customer:${TAG} (VITE_API_BASE_URL=${CUSTOMER_API})"
echo "================================================================"
docker build \
  --build-arg VITE_API_BASE_URL="${CUSTOMER_API}" \
  -t "${REGISTRY}/ecommerce-customer:${TAG}" \
  ecommerce-customer
docker push "${REGISTRY}/ecommerce-customer:${TAG}"

# ---------- 2. techshop-admin ----------
echo ""
echo "================================================================"
echo "  Build techshop-admin:${TAG} (VITE_API_BASE_URL=${ADMIN_API})"
echo "================================================================"
docker build \
  --build-arg VITE_API_BASE_URL="${ADMIN_API}" \
  -t "${REGISTRY}/techshop-admin:${TAG}" \
  techshop
docker push "${REGISTRY}/techshop-admin:${TAG}"

echo ""
echo "✅ FE images pushed to ${REGISTRY} với env=${ENV}"
