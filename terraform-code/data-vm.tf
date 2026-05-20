# ==============================================================================
# Data VM (10.60.1.20) — Kafka + MongoDB + Redis + Elasticsearch + Debezium
# ------------------------------------------------------------------------------
# Đặt trong project Obs, cùng VPC `gcp-asia-southeast1-vpc-observability-003`
# để tận dụng peering sẵn có với Dev/Prod (cùng zone → free egress).
# ==============================================================================

resource "google_compute_instance" "gcp-asia-southeast1-vm-data-001" {
  name         = "gcp-asia-southeast1-vm-data-001"
  machine_type = "e2-standard-2" # 2 vCPUs, 8GB RAM — đủ cho Kafka+Mongo+ES+Redis+Debezium
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-obs-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 100
      type  = "pd-balanced" # IO tốt hơn pd-standard cho DB
    }
  }

  network_interface {
    network    = google_compute_network.gcp-asia-southeast1-vpc-observability-003.id
    subnetwork = google_compute_subnetwork.gcp-asia-southeast1-subnet-observability-003.id
    network_ip = "10.60.1.20"
  }

  service_account {
    email  = google_service_account.sa-obs.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "data-001", env = "obs", role = "data" }
  tags                    = ["data-vm", "allow-internal"]

  depends_on = [google_project_service.gcp-apse1-apis-observability-003]
}

# ── Bastion SSH → data-vm ────────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-bastion-ssh-data-003" {
  name          = "gcp-asia-southeast1-fw-allow-bastion-ssh-data-003"
  project       = data.google_project.gcp-apse1-prj-obs-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-observability-003.name
  description   = "Allow SSH from Bastion to data VM"
  source_ranges = ["10.50.1.100/32"]
  target_tags   = ["data-vm"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}
