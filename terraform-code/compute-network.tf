# Hub VPC
resource "google_compute_network" "gcp-asia-southeast1-vpc-network-hub-003" {
  name                    = "gcp-asia-southeast1-vpc-network-hub-003"
  project                 = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-hub-net-003]
}

# Shared VPC Dev
resource "google_compute_network" "gcp-asia-southeast1-vpc-shared-dev-003" {
  name                    = "gcp-asia-southeast1-vpc-shared-dev-003"
  project                 = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-sh-vpc-dev-003]
}

# Shared VPC Prod
resource "google_compute_network" "gcp-asia-southeast1-vpc-shared-prod-003" {
  name                    = "gcp-asia-southeast1-vpc-shared-prod-003"
  project                 = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-sh-vpc-prd-003]
}

# Shared Access VPC
resource "google_compute_network" "gcp-asia-southeast1-vpc-shared-access-003" {
  name                    = "gcp-asia-southeast1-vpc-shared-access-003"
  project                 = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-sh-access-003]
}

# Observability VPC
resource "google_compute_network" "gcp-asia-southeast1-vpc-observability-003" {
  name                    = "gcp-asia-southeast1-vpc-observability-003"
  project                 = data.google_project.gcp-apse1-prj-obs-003.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-observability-003]
}

# Hub subnet (10.0.0.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-hub-003" {
  name                     = "gcp-asia-southeast1-subnet-hub-003"
  ip_cidr_range            = "10.0.0.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.id
  project                  = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Dev app subnet (10.10.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-dev-app-003" {
  name                     = "gcp-asia-southeast1-subnet-dev-app-003"
  ip_cidr_range            = "10.10.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.id
  project                  = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Prod app subnet (10.20.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-prod-app-003" {
  name                     = "gcp-asia-southeast1-subnet-prod-app-003"
  ip_cidr_range            = "10.20.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.id
  project                  = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Shared access subnet (10.50.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-shared-access-003" {
  name                     = "gcp-asia-southeast1-subnet-shared-access-003"
  ip_cidr_range            = "10.50.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.id
  project                  = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Observability subnet (10.60.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-observability-003" {
  name                     = "gcp-asia-southeast1-subnet-observability-003"
  ip_cidr_range            = "10.60.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-observability-003.id
  project                  = data.google_project.gcp-apse1-prj-obs-003.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}
