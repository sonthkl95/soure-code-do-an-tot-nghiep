#!/bin/bash

# === CONFIGURATION ===
ORG_ID="54431047904"
BILLING_1="01A195-0B3541-5A90F7" # Primary: Hub, Access, Obs
BILLING_2="0111F0-7665F8-2E3C36" # Secondary: Dev, Prod
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

echo "--- Starting GCP Infrastructure Setup ---"

# 1. Create Folders (Managed manually in TF via data sources)
echo "[1/6] Creating Folders..."
FLD_NET_ID=$(gcloud resource-manager folders create --display-name="network-hub" --organization=$ORG_ID --format="value(name)" | cut -d'/' -f2)
FLD_SH_ID=$(gcloud resource-manager folders create --display-name="shared-vpc" --organization=$ORG_ID --format="value(name)" | cut -d'/' -f2)
FLD_DEV_ID=$(gcloud resource-manager folders create --display-name="dev" --organization=$ORG_ID --format="value(name)" | cut -d'/' -f2)
FLD_PRD_ID=$(gcloud resource-manager folders create --display-name="prod" --organization=$ORG_ID --format="value(name)" | cut -d'/' -f2)
FLD_OBS_ID=$(gcloud resource-manager folders create --display-name="observability" --organization=$ORG_ID --format="value(name)" | cut -d'/' -f2)

# 2. Create Projects under respective folders
echo "[2/6] Creating Projects..."
gcloud projects create $PRJ_HUB --folder=$FLD_NET_ID
gcloud projects create $PRJ_ACCESS --folder=$FLD_NET_ID
gcloud projects create $PRJ_VPC_DEV --folder=$FLD_SH_ID
gcloud projects create $PRJ_VPC_PRD --folder=$FLD_SH_ID
gcloud projects create $PRJ_DEV_ENV --folder=$FLD_DEV_ID
gcloud projects create $PRJ_PRD_ENV --folder=$FLD_PRD_ID
gcloud projects create $PRJ_OBS --folder=$FLD_OBS_ID

# 3. Link Billing Accounts (Distributing to stay within Free Tier quotas)
echo "[3/6] Linking Billing Accounts..."

# Group 1: Hub, Access, Obs -> Billing Account 1
for PRJ in $PRJ_HUB $PRJ_ACCESS $PRJ_OBS; do
    gcloud billing projects link $PRJ --billing-account=$BILLING_1
done

# Group 2: Dev, Prod -> Billing Account 2
for PRJ in $PRJ_VPC_DEV $PRJ_VPC_PRD $PRJ_DEV_ENV $PRJ_PRD_ENV; do
    gcloud billing projects link $PRJ --billing-account=$BILLING_2
done

# 4. Enable Critical APIs (Cloud Resource Manager & Storage)
echo "[4/6] Enabling mandatory APIs..."
PROJECTS=($PRJ_HUB $PRJ_ACCESS $PRJ_VPC_DEV $PRJ_VPC_PRD $PRJ_DEV_ENV $PRJ_PRD_ENV $PRJ_OBS)
for PRJ in "${PROJECTS[@]}"; do
    gcloud services enable cloudresourcemanager.googleapis.com --project=$PRJ
done
gcloud services enable storage.googleapis.com --project=$PRJ_HUB

# 5. Create Terraform State Bucket (in Hub project)
echo "[5/6] Creating Terraform State Bucket..."
gsutil mb -p $PRJ_HUB -l $REGION gs://$STATE_BUCKET
gsutil versioning set on gs://$STATE_BUCKET

# 6. Final Status
echo "--- Setup Completed Successfully ---"
echo "Org ID: $ORG_ID"
echo "Billing 1 (Hub/Acc/Obs): $BILLING_1"
echo "Billing 2 (Dev/Prod): $BILLING_2"
echo "State Bucket: gs://$STATE_BUCKET"
echo "-------------------------------------"
echo "Next steps:"
echo "1. Update 'user_email' in terraform.tfvars"
echo "2. Run 'terraform init' in terraform-code directory"
