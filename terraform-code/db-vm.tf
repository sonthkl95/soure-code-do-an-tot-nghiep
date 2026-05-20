# ==============================================================================
# DB VMs — MongoDB + MySQL cô lập theo môi trường (Dev/Prod)
# ------------------------------------------------------------------------------
# Mỗi VM nằm trong VPC tương ứng với app cluster (Shared VPC service project).
# Dev:  10.10.1.30 trong VPC shared-dev
# Prod: 10.20.1.30 trong VPC shared-prod
# Debezium ở data-vm (10.60.1.20) đọc oplog Mongo qua peering Obs↔Dev/Prod.
# ==============================================================================

# ── DB Dev VM (10.10.1.30) ────────────────────────────────────────────────────
resource "google_compute_instance" "gcp-asia-southeast1-vm-db-dev-001" {
  name         = "gcp-asia-southeast1-vm-db-dev-001"
  machine_type = "e2-small" # 2 vCPUs (shared), 2GB RAM — tiết kiệm cho Dev
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 50
      type  = "pd-balanced"
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
    network_ip         = "10.10.1.30"
  }

  service_account {
    email  = google_service_account.sa-dev-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "db-dev-001", env = "dev", role = "db" }
  tags                    = ["db-vm", "db-dev", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-dev-003]
}

# ── DB Prod VM (10.20.1.30) ───────────────────────────────────────────────────
resource "google_compute_instance" "gcp-asia-southeast1-vm-db-prod-001" {
  name         = "gcp-asia-southeast1-vm-db-prod-001"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM — gần production
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 100
      type  = "pd-balanced"
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
    network_ip         = "10.20.1.30"
  }

  service_account {
    email  = google_service_account.sa-prd-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "db-prod-001", env = "prod", role = "db" }
  tags                    = ["db-vm", "db-prod", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-prod-003]
}

# ──────────────────────────────────────────────────────────────────────────────
# Firewall rules
# ──────────────────────────────────────────────────────────────────────────────

# Bastion SSH → DB Dev
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-bastion-ssh-db-dev-003" {
  name          = "gcp-asia-southeast1-fw-allow-bastion-ssh-db-dev-003"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.name
  description   = "Allow SSH from Bastion to db-dev VM"
  source_ranges = ["10.50.1.100/32"]
  target_tags   = ["db-dev"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# Bastion SSH → DB Prod
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-bastion-ssh-db-prod-003" {
  name          = "gcp-asia-southeast1-fw-allow-bastion-ssh-db-prod-003"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.name
  description   = "Allow SSH from Bastion to db-prod VM"
  source_ranges = ["10.50.1.100/32"]
  target_tags   = ["db-prod"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# Obs (data-vm) → DB Dev: Debezium đọc Mongo oplog qua peering Obs↔Dev
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-debezium-mongo-dev-003" {
  name          = "gcp-asia-southeast1-fw-allow-debezium-mongo-dev-003"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.name
  description   = "Allow Debezium on data-vm (obs) to read MongoDB oplog from db-dev"
  source_ranges = ["10.60.1.20/32"]
  target_tags   = ["db-dev"]
  allow {
    protocol = "tcp"
    ports    = ["27017"]
  }
}

# Obs (data-vm) → DB Prod: Debezium đọc Mongo oplog qua peering Obs↔Prod
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-debezium-mongo-prod-003" {
  name          = "gcp-asia-southeast1-fw-allow-debezium-mongo-prod-003"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.name
  description   = "Allow Debezium on data-vm (obs) to read MongoDB oplog from db-prod"
  source_ranges = ["10.60.1.20/32"]
  target_tags   = ["db-prod"]
  allow {
    protocol = "tcp"
    ports    = ["27017"]
  }
}
