# Cloud Router for NAT in dev shared VPC
resource "google_compute_router" "gcp-asia-southeast1-router-nat-dev-001" {
  name       = "gcp-asia-southeast1-router-nat-dev-001"
  project    = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  region     = "asia-southeast1"
  network    = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.id
  depends_on = [google_project_service.gcp-apse1-apis-sh-vpc-dev-001]
}

# Cloud NAT for dev subnet (outbound internet for private VMs)
resource "google_compute_router_nat" "gcp-asia-southeast1-nat-dev-001" {
  name                               = "gcp-asia-southeast1-nat-dev-001"
  project                            = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  router                             = google_compute_router.gcp-asia-southeast1-router-nat-dev-001.name
  region                             = "asia-southeast1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-001.self_link
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Cloud Router for NAT in prod shared VPC
resource "google_compute_router" "gcp-asia-southeast1-router-nat-prod-001" {
  name       = "gcp-asia-southeast1-router-nat-prod-001"
  project    = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  region     = "asia-southeast1"
  network    = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.id
  depends_on = [google_project_service.gcp-apse1-apis-sh-vpc-prd-001]
}

# Cloud NAT for prod subnet (outbound internet for private VMs)
resource "google_compute_router_nat" "gcp-asia-southeast1-nat-prod-001" {
  name                               = "gcp-asia-southeast1-nat-prod-001"
  project                            = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  router                             = google_compute_router.gcp-asia-southeast1-router-nat-prod-001.name
  region                             = "asia-southeast1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-001.self_link
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Cloud Router for NAT in observability VPC
resource "google_compute_router" "gcp-asia-southeast1-router-nat-observability-001" {
  name       = "gcp-asia-southeast1-router-nat-observability-001"
  project    = data.google_project.gcp-apse1-prj-obs-001.project_id
  region     = "asia-southeast1"
  network    = google_compute_network.gcp-asia-southeast1-vpc-observability-001.id
  depends_on = [google_project_service.gcp-apse1-apis-observability-001]
}

# Cloud NAT for observability subnet (outbound internet for obs VM)
resource "google_compute_router_nat" "gcp-asia-southeast1-nat-observability-001" {
  name                               = "gcp-asia-southeast1-nat-observability-001"
  project                            = data.google_project.gcp-apse1-prj-obs-001.project_id
  router                             = google_compute_router.gcp-asia-southeast1-router-nat-observability-001.name
  region                             = "asia-southeast1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.gcp-asia-southeast1-subnet-observability-001.self_link
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
