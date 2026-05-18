# Enable Shared VPC host on dev host project
resource "google_compute_shared_vpc_host_project" "gcp-asia-southeast1-shared-vpc-host-dev-003" {
  project    = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  depends_on = [google_project_service.gcp-apse1-apis-sh-vpc-dev-003]
}

# Attach dev-env as service project to dev host
resource "google_compute_shared_vpc_service_project" "gcp-asia-southeast1-shared-vpc-service-dev-003" {
  host_project    = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  service_project = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  depends_on      = [google_compute_shared_vpc_host_project.gcp-asia-southeast1-shared-vpc-host-dev-003]
}

# Enable Shared VPC host on prod host project
resource "google_compute_shared_vpc_host_project" "gcp-asia-southeast1-shared-vpc-host-prod-003" {
  project    = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  depends_on = [google_project_service.gcp-apse1-apis-sh-vpc-prd-003]
}

# Attach prd-env as service project to prod host
resource "google_compute_shared_vpc_service_project" "gcp-asia-southeast1-shared-vpc-service-prod-003" {
  host_project    = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  service_project = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  depends_on      = [google_compute_shared_vpc_host_project.gcp-asia-southeast1-shared-vpc-host-prod-003]
}
