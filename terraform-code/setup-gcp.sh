#!/bin/bash

# === CONFIGURATION ===
ORG_ID="54431047904"
BILLING_1="01A195-0B3541-5A90F7" # For Hub, Access, Obs, Prod-Env (4 projects)
BILLING_2="0111F0-7665F8-2E3C36" # For Dev-Host, Dev-Env, Prod-Host (3 projects)
REGION="asia-southeast1"
STATE_BUCKET="gcp-apse1-tf-state-54431047904"

# Project IDs
PRJ_HUB="gcp-apse1-prj-hub-net-001"
PRJ_ACCESS="gcp-apse1-prj-sh-access-001"
PRJ_VPC_DEV="gcp-apse1-prj-sh-vpc-dev-001"
PRJ_VPC_PRD="gcp-apse1-prj-sh-vpc-prd-001"
PRJ_DEV_ENV="gcp-apse1-prj-dev-env-001"
PRJ_PRD_ENV="gcp-apse1-prj-prd-env-001"
PRJ_OBS="gcp-apse1-prj-obs-001"

echo "--- Retrying GCP Infrastructure Setup ---"

# 3. Re-Link Billing Accounts with new distribution
echo "[3/6] Linking Billing Accounts (Optimized Distribution)..."

# Group 1: Hub, Access, Obs, Prod-Env -> Billing Account 1
for PRJ in $PRJ_HUB $PRJ_ACCESS $PRJ_OBS $PRJ_PRD_ENV; do
    gcloud billing projects link $PRJ --billing-account=$BILLING_1
done

# Group 2: Dev-Host, Dev-Env, Prod-Host -> Billing Account 2
for PRJ in $PRJ_VPC_DEV $PRJ_VPC_PRD $PRJ_DEV_ENV; do
    gcloud billing projects link $PRJ --billing-account=$BILLING_2
done

# 5. Create Terraform State Bucket (Using gcloud storage instead of gsutil)
echo "[5/6] Creating Terraform State Bucket..."
gcloud storage buckets create gs://$STATE_BUCKET --project=$PRJ_HUB --location=$REGION
gcloud storage buckets update gs://$STATE_BUCKET --versioning

echo "--- Setup Completed ---"
echo "Next steps:"
echo "1. Run 'terraform init' in terraform-code directory"
