# Hub VPC
resource "google_compute_network" "gcp-asia-southeast1-vpc-network-hub-001" {
  name                    = "gcp-asia-southeast1-vpc-network-hub-001"
  project                 = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-hub-net-001]
}

# Shared VPC Dev
resource "google_compute_network" "gcp-asia-southeast1-vpc-shared-dev-001" {
  name                    = "gcp-asia-southeast1-vpc-shared-dev-001"
  project                 = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-sh-vpc-dev-001]
}

# Shared VPC Prod
resource "google_compute_network" "gcp-asia-southeast1-vpc-shared-prod-001" {
  name                    = "gcp-asia-southeast1-vpc-shared-prod-001"
  project                 = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-sh-vpc-prd-001]
}

# Shared Access VPC
resource "google_compute_network" "gcp-asia-southeast1-vpc-shared-access-001" {
  name                    = "gcp-asia-southeast1-vpc-shared-access-001"
  project                 = data.google_project.gcp-apse1-prj-sh-access-001.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-sh-access-001]
}

# Observability VPC
resource "google_compute_network" "gcp-asia-southeast1-vpc-observability-001" {
  name                    = "gcp-asia-southeast1-vpc-observability-001"
  project                 = data.google_project.gcp-apse1-prj-obs-001.project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.gcp-apse1-apis-observability-001]
}

# Hub subnet (10.0.0.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-hub-001" {
  name                     = "gcp-asia-southeast1-subnet-hub-001"
  ip_cidr_range            = "10.0.0.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-network-hub-001.id
  project                  = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Dev app subnet (10.10.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-dev-app-001" {
  name                     = "gcp-asia-southeast1-subnet-dev-app-001"
  ip_cidr_range            = "10.10.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.id
  project                  = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Prod app subnet (10.20.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-prod-app-001" {
  name                     = "gcp-asia-southeast1-subnet-prod-app-001"
  ip_cidr_range            = "10.20.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.id
  project                  = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Shared access subnet (10.50.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-shared-access-001" {
  name                     = "gcp-asia-southeast1-subnet-shared-access-001"
  ip_cidr_range            = "10.50.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-shared-access-001.id
  project                  = data.google_project.gcp-apse1-prj-sh-access-001.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Observability subnet (10.60.1.0/24)
resource "google_compute_subnetwork" "gcp-asia-southeast1-subnet-observability-001" {
  name                     = "gcp-asia-southeast1-subnet-observability-001"
  ip_cidr_range            = "10.60.1.0/24"
  region                   = "asia-southeast1"
  network                  = google_compute_network.gcp-asia-southeast1-vpc-observability-001.id
  project                  = data.google_project.gcp-apse1-prj-obs-001.project_id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}
