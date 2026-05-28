locals {
  sa_hub_net_roles = [
    "roles/compute.networkAdmin",
    "roles/compute.securityAdmin",
  ]

  sa_sh_vpc_dev_roles = [
    "roles/compute.networkAdmin",
    "roles/compute.networkUser",
  ]

  sa_sh_vpc_prd_roles = [
    "roles/compute.networkAdmin",
    "roles/compute.networkUser",
  ]

  sa_sh_access_roles = [
    "roles/compute.instanceAdmin.v1",
    "roles/iam.serviceAccountUser",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
  ]

  sa_dev_env_roles = [
    "roles/compute.instanceAdmin.v1",
    "roles/compute.loadBalancerServiceUser",
    "roles/storage.objectAdmin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
  ]

  sa_prd_env_roles = [
    "roles/compute.instanceAdmin.v1",
    "roles/compute.loadBalancerServiceUser",
    "roles/storage.objectAdmin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
  ]

  sa_obs_roles = [
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
    "roles/logging.logWriter",
    "roles/logging.viewer",
    "roles/storage.objectAdmin",
  ]

  user_org_roles = [
    "roles/resourcemanager.organizationAdmin",
    "roles/billing.user",
    "roles/resourcemanager.projectCreator",
    "roles/resourcemanager.folderAdmin",
    "roles/iam.serviceAccountAdmin",
    "roles/compute.osLogin",
    "roles/monitoring.viewer",
    "roles/logging.viewer",
  ]
}

# Service account for hub-net project
resource "google_service_account" "sa-hub-net" {
  account_id   = "gcp-apse1-sa-hub-net-003"
  display_name = "gcp-apse1-sa-hub-net-003"
  description  = "SA for hub network management (VPC, routing, firewall)"
  project      = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-hub-net-003]
}

# Assign roles to hub-net SA on hub-net project
resource "google_project_iam_member" "sa-hub-net-roles" {
  for_each = toset(local.sa_hub_net_roles)
  project  = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-hub-net.email}"
}

# Service account for shared VPC dev host project
resource "google_service_account" "sa-sh-vpc-dev" {
  account_id   = "gcp-apse1-sa-sh-vpc-dev-003"
  display_name = "gcp-apse1-sa-sh-vpc-dev-003"
  description  = "SA for Shared VPC dev host project management"
  project      = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-sh-vpc-dev-003]
}

# Assign roles to sh-vpc-dev SA on sh-vpc-dev project
resource "google_project_iam_member" "sa-sh-vpc-dev-roles" {
  for_each = toset(local.sa_sh_vpc_dev_roles)
  project  = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-sh-vpc-dev.email}"
}

# Service account for shared VPC prod host project
resource "google_service_account" "sa-sh-vpc-prd" {
  account_id   = "gcp-apse1-sa-sh-vpc-prd-003"
  display_name = "gcp-apse1-sa-sh-vpc-prd-003"
  description  = "SA for Shared VPC prod host project management"
  project      = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-sh-vpc-prd-003]
}

# Assign roles to sh-vpc-prd SA on sh-vpc-prd project
resource "google_project_iam_member" "sa-sh-vpc-prd-roles" {
  for_each = toset(local.sa_sh_vpc_prd_roles)
  project  = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-sh-vpc-prd.email}"
}

# Service account for shared access project (bastion, IAP)
resource "google_service_account" "sa-sh-access" {
  account_id   = "gcp-apse1-sa-sh-access-003"
  display_name = "gcp-apse1-sa-sh-access-003"
  description  = "SA for bastion host, IAP tunnel and OS Login"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-sh-access-003]
}

# Assign roles to sh-access SA on sh-access project
resource "google_project_iam_member" "sa-sh-access-roles" {
  for_each = toset(local.sa_sh_access_roles)
  project  = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-sh-access.email}"
}

# Service account for dev environment project
resource "google_service_account" "sa-dev-env" {
  account_id   = "gcp-apse1-sa-dev-env-003"
  display_name = "gcp-apse1-sa-dev-env-003"
  description  = "SA for deploying and operating workloads in dev environment"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-dev-env-003]
}

# Assign roles to dev-env SA on dev-env project
resource "google_project_iam_member" "sa-dev-env-roles" {
  for_each = toset(local.sa_dev_env_roles)
  project  = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-dev-env.email}"
}

# Service account for prod environment project
resource "google_service_account" "sa-prd-env" {
  account_id   = "gcp-apse1-sa-prd-env-003"
  display_name = "gcp-apse1-sa-prd-env-003"
  description  = "SA for deploying and operating workloads in prod environment"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-prd-env-003]
}

# Assign roles to prd-env SA on prd-env project
resource "google_project_iam_member" "sa-prd-env-roles" {
  for_each = toset(local.sa_prd_env_roles)
  project  = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-prd-env.email}"
}

# Service account for observability project
resource "google_service_account" "sa-obs" {
  account_id   = "gcp-apse1-sa-obs-003"
  display_name = "gcp-apse1-sa-obs-003"
  description  = "SA for observability stack (Prometheus, Loki, Grafana)"
  project      = data.google_project.gcp-apse1-prj-obs-003.project_id
  depends_on   = [google_project_service.gcp-apse1-apis-observability-003]
}

# Assign roles to obs SA on observability project
resource "google_project_iam_member" "sa-obs-roles" {
  for_each = toset(local.sa_obs_roles)
  project  = data.google_project.gcp-apse1-prj-obs-003.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Assign org-level roles to personal user account
resource "google_organization_iam_member" "user_org_roles" {
  for_each = toset(local.user_org_roles)
  org_id   = var.org_id
  role     = each.value
  member   = "user:${var.user_email}"
}

# Assign roles/compute.xpnAdmin at the Organization level for Service Accounts
resource "google_organization_iam_member" "sa-hub-net-xpnAdmin" {
  org_id = var.org_id
  role   = "roles/compute.xpnAdmin"
  member = "serviceAccount:${google_service_account.sa-hub-net.email}"
}

resource "google_organization_iam_member" "sa-sh-vpc-dev-xpnAdmin" {
  org_id = var.org_id
  role   = "roles/compute.xpnAdmin"
  member = "serviceAccount:${google_service_account.sa-sh-vpc-dev.email}"
}

resource "google_organization_iam_member" "sa-sh-vpc-prd-xpnAdmin" {
  org_id = var.org_id
  role   = "roles/compute.xpnAdmin"
  member = "serviceAccount:${google_service_account.sa-sh-vpc-prd.email}"
}

# Grant loadBalancerServiceUser on obs project so sh-access LB can use obs instance group
resource "google_project_iam_member" "lb_service_user_obs" {
  project = data.google_project.gcp-apse1-prj-obs-003.project_id
  role    = "roles/compute.loadBalancerServiceUser"
  member  = "serviceAccount:${google_service_account.sa-sh-access.email}"
}

# Grant cross-project monitoring.viewer to sa-obs for Grafana GCP Cloud Monitoring integration
resource "google_project_iam_member" "sa-obs-monitoring-hub" {
  project = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-monitoring-dev" {
  project = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-monitoring-prod" {
  project = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-monitoring-access" {
  project = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-monitoring-sh-vpc-dev" {
  project = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-monitoring-sh-vpc-prd" {
  project = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Grant cross-project logging.viewer to sa-obs for Grafana GCP Cloud Logging integration
# (cho phép Explore xem log syslog/audit/VPC flow của tất cả VM ngoài K8s)
resource "google_project_iam_member" "sa-obs-logging-hub" {
  project = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-logging-dev" {
  project = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-logging-prod" {
  project = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-logging-access" {
  project = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-logging-sh-vpc-dev" {
  project = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

resource "google_project_iam_member" "sa-obs-logging-sh-vpc-prd" {
  project = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.sa-obs.email}"
}

