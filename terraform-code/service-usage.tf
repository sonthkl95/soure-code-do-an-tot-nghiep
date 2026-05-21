# Enable APIs for hub network project
resource "google_project_service" "gcp-apse1-apis-hub-net-003" {
  for_each = toset([
    "compute.googleapis.com",
    "networkmanagement.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "bigquery.googleapis.com",
    "storage.googleapis.com",
    "bigquerystorage.googleapis.com",
    "oslogin.googleapis.com",
    "orgpolicy.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Enable APIs for shared VPC dev host project
resource "google_project_service" "gcp-apse1-apis-sh-vpc-dev-003" {
  for_each = toset([
    "compute.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "networkmanagement.googleapis.com",
    "oslogin.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Enable APIs for shared VPC prod host project
resource "google_project_service" "gcp-apse1-apis-sh-vpc-prd-003" {
  for_each = toset([
    "compute.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "networkmanagement.googleapis.com",
    "oslogin.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Enable APIs for shared access project (Bastion, LB, Artifact Registry, Cloud Build)
resource "google_project_service" "gcp-apse1-apis-sh-access-003" {
  for_each = toset([
    "compute.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "oslogin.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "orgpolicy.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Enable APIs for dev environment project
resource "google_project_service" "gcp-apse1-apis-dev-env-003" {
  for_each = toset([
    "compute.googleapis.com",
    "oslogin.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "storage.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Enable APIs for prod environment project
resource "google_project_service" "gcp-apse1-apis-prd-env-003" {
  for_each = toset([
    "compute.googleapis.com",
    "oslogin.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "storage.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Enable APIs for observability project
resource "google_project_service" "gcp-apse1-apis-observability-003" {
  for_each = toset([
    "compute.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "storage.googleapis.com",
    "oslogin.googleapis.com",
  ])

  project                    = data.google_project.gcp-apse1-prj-obs-003.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}
