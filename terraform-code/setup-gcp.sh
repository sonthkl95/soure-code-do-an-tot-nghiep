#!/bin/bash

# === CONFIGURATION ===
ORG_ID="54431047904"
BILLING_1="01A195-0B3541-5A90F7" # For Hub, Access, Obs, Prod-Env (4 projects)
BILLING_2="0111F0-7665F8-2E3C36" # For Dev-Host, Dev-Env, Prod-Host (3 projects)
REGION="asia-southeast1"
STATE_BUCKET="gcp-apse1-tf-state-54431047904-003"

# Project IDs
PRJ_HUB="gcp-apse1-prj-hub-net-003"
PRJ_ACCESS="gcp-apse1-prj-sh-access-003"
PRJ_VPC_DEV="gcp-apse1-prj-sh-vpc-dev-003"
PRJ_VPC_PRD="gcp-apse1-prj-sh-vpc-prd-003"
PRJ_DEV_ENV="gcp-apse1-prj-dev-env-003"
PRJ_PRD_ENV="gcp-apse1-prj-prd-env-003"
PRJ_OBS="gcp-apse1-prj-obs-003"

echo "=========================================================="
echo "          GCP LANDING ZONE INITIALIZATION SCRIPT          "
echo "=========================================================="

# --- HELPER FUNCTIONS FOR ROBUSTNESS & RATE-LIMIT COMPLIANCE ---

# Check and get or create a folder safely
ensure_folder() {
    local DISPLAY_NAME=$1
    local ORG_ID=$2
    
    echo "Checking folder '$DISPLAY_NAME'..." >&2
    local FLD_ID=$(gcloud resource-manager folders list --organization=$ORG_ID --filter="displayName='$DISPLAY_NAME'" --format="value(name)" | cut -d'/' -f2 | head -n 1)
    
    if [ -z "$FLD_ID" ]; then
        echo "-> Folder '$DISPLAY_NAME' does not exist. Creating..." >&2
        FLD_ID=$(gcloud resource-manager folders create --display-name="$DISPLAY_NAME" --organization=$ORG_ID --format="value(name)" | cut -d'/' -f2)
        echo "Created folder '$DISPLAY_NAME' with ID: $FLD_ID" >&2
    else
        echo "-> Folder '$DISPLAY_NAME' already exists with ID: $FLD_ID" >&2
    fi
    echo "$FLD_ID"
}

# Check, create, or undelete a project safely
ensure_project() {
    local PRJ_ID=$1
    local FLD_ID=$2
    
    echo "----------------------------------------------------------"
    echo "Verifying Project ID: $PRJ_ID..."
    
    # Check if project exists and get its lifecycle state
    local STATE=$(gcloud projects describe $PRJ_ID --format="value(lifecycleState)" 2>/dev/null)
    
    if [ -z "$STATE" ]; then
        echo "-> Project '$PRJ_ID' does not exist. Creating..."
        gcloud projects create $PRJ_ID --folder=$FLD_ID
        
        # VERY IMPORTANT: Sleep 45 seconds to prevent Google Cloud Anti-Abuse from flagging rapid project creation
        echo "Safe delay: Sleeping 45 seconds to satisfy GCP policies..."
        sleep 45
    elif [ "$STATE" == "DELETE_REQUESTED" ] || [ "$STATE" == "PENDING_DELETE" ]; then
        echo "-> Project '$PRJ_ID' is currently pending deletion (soft-deleted)."
        echo "Restoring/Undeleting project '$PRJ_ID'..."
        gcloud projects undelete $PRJ_ID
        
        echo "Safe delay: Sleeping 15 seconds after undeleting..."
        sleep 15
    else
        echo "-> Project '$PRJ_ID' already exists and is active (Lifecycle State: $STATE)."
    fi
}

# --- STEP 1: CREATE OR VERIFY FOLDERS ---
echo ""
echo "[1/5] Setting up Folder Hierarchy..."
FLD_NET_ID=$(ensure_folder "network-hub" $ORG_ID)
FLD_SH_ID=$(ensure_folder "shared-vpc" $ORG_ID)
FLD_DEV_ID=$(ensure_folder "dev" $ORG_ID)
FLD_PRD_ID=$(ensure_folder "prod" $ORG_ID)
FLD_OBS_ID=$(ensure_folder "observability" $ORG_ID)

# --- STEP 2: CREATE, RESTORE, OR VERIFY PROJECTS ---
echo ""
echo "[2/5] Setting up Projects (With Safety Policy Controls)..."
ensure_project $PRJ_HUB $FLD_NET_ID
ensure_project $PRJ_ACCESS $FLD_NET_ID
ensure_project $PRJ_VPC_DEV $FLD_SH_ID
ensure_project $PRJ_VPC_PRD $FLD_SH_ID
ensure_project $PRJ_DEV_ENV $FLD_DEV_ID
ensure_project $PRJ_PRD_ENV $FLD_PRD_ID
ensure_project $PRJ_OBS $FLD_OBS_ID

# --- STEP 3: LINK BILLING ACCOUNTS ---
echo ""
echo "[3/5] Linking Billing Accounts (Optimized Distribution)..."

# Group 1: Hub, Access, Obs, Prod-Env -> Billing Account 1
echo "Linking Group 1 projects to Billing Account 1 ($BILLING_1)..."
for PRJ in $PRJ_HUB $PRJ_ACCESS $PRJ_OBS $PRJ_PRD_ENV; do
    gcloud billing projects link $PRJ --billing-account=$BILLING_1
done

# Group 2: Dev-Host, Dev-Env, Prod-Host -> Billing Account 2
echo "Linking Group 2 projects to Billing Account 2 ($BILLING_2)..."
for PRJ in $PRJ_VPC_DEV $PRJ_VPC_PRD $PRJ_DEV_ENV; do
    gcloud billing projects link $PRJ --billing-account=$BILLING_2
done

# --- STEP 4: ENABLE CRITICAL INITIALIZATION APIS ---
echo ""
echo "[4/5] Enabling Mandatory APIs..."
PROJECTS=($PRJ_HUB $PRJ_ACCESS $PRJ_VPC_DEV $PRJ_VPC_PRD $PRJ_DEV_ENV $PRJ_PRD_ENV $PRJ_OBS)
for PRJ in "${PROJECTS[@]}"; do
    echo "Enabling cloudresourcemanager.googleapis.com for $PRJ..."
    gcloud services enable cloudresourcemanager.googleapis.com --project=$PRJ
done

echo "Enabling storage.googleapis.com for state bucket project $PRJ_HUB..."
gcloud services enable storage.googleapis.com --project=$PRJ_HUB

# --- STEP 5: CREATE TERRAFORM STATE BUCKET ---
echo ""
echo "[5/5] Creating GCS Backend Terraform State Bucket..."
if gcloud storage buckets describe gs://$STATE_BUCKET 2>/dev/null; then
    echo "-> GCS Bucket gs://$STATE_BUCKET already exists."
else
    echo "-> Creating GCS Bucket gs://$STATE_BUCKET in $REGION..."
    gcloud storage buckets create gs://$STATE_BUCKET --project=$PRJ_HUB --location=$REGION
    gcloud storage buckets update gs://$STATE_BUCKET --versioning
fi

echo ""
echo "=========================================================="
echo "          SETUP COMPLETED SUCCESSFULLY                    "
echo "=========================================================="
echo "All folders and projects are verified and ready!"
echo "Next steps:"
echo "1. Run 'terraform init' in the terraform-code directory."
echo "2. Run 'terraform apply' to provision the Landing Zone."
echo "=========================================================="
