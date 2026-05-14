# ── SSH: Internet → Bastion ───────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-ssh-bastion-001" {
  name          = "gcp-asia-southeast1-fw-allow-ssh-bastion-001"
  project       = data.google_project.gcp-apse1-prj-sh-access-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-access-001.name
  description   = "Allow SSH from internet to Bastion Host"
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["allow-ssh-external"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# ── SSH: Bastion → Dev VMs ────────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-bastion-ssh-dev-001" {
  name          = "gcp-asia-southeast1-fw-allow-bastion-ssh-dev-001"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.name
  description   = "Allow SSH from Bastion to dev VMs"
  source_ranges = ["10.50.1.100/32"]
  target_tags   = ["k8s-dev"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# ── SSH: Bastion → Prod VMs ───────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-bastion-ssh-prod-001" {
  name          = "gcp-asia-southeast1-fw-allow-bastion-ssh-prod-001"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.name
  description   = "Allow SSH from Bastion to prod VMs"
  source_ranges = ["10.50.1.100/32"]
  target_tags   = ["k8s-prod"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# ── SSH: Bastion → Observability VM ──────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-bastion-ssh-obs-001" {
  name          = "gcp-asia-southeast1-fw-allow-bastion-ssh-obs-001"
  project       = data.google_project.gcp-apse1-prj-obs-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-observability-001.name
  description   = "Allow SSH from Bastion to observability VM"
  source_ranges = ["10.50.1.100/32"]
  target_tags   = ["observability-vm"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# ── Internal: Dev VPC ─────────────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-internal-dev-001" {
  name          = "gcp-asia-southeast1-fw-allow-internal-dev-001"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.name
  description   = "Allow internal traffic within the dev VPC"
  source_ranges = ["10.10.0.0/20"]
  allow { protocol = "tcp" }
  allow { protocol = "udp" }
  allow { protocol = "icmp" }
}

# ── Internal: Prod VPC ────────────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-internal-prod-001" {
  name          = "gcp-asia-southeast1-fw-allow-internal-prod-001"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.name
  description   = "Allow internal traffic within the prod VPC"
  source_ranges = ["10.20.0.0/20"]
  allow { protocol = "tcp" }
  allow { protocol = "udp" }
  allow { protocol = "icmp" }
}

# ── Internal: Observability VPC (receives telemetry from all spokes) ──────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-internal-obs-001" {
  name        = "gcp-asia-southeast1-fw-allow-internal-obs-001"
  project     = data.google_project.gcp-apse1-prj-obs-001.project_id
  network     = google_compute_network.gcp-asia-southeast1-vpc-observability-001.name
  description = "Allow inbound telemetry from all spokes to observability VM"
  source_ranges = [
    "10.0.0.0/24",
    "10.10.0.0/20",
    "10.20.0.0/20",
    "10.50.1.0/24",
    "10.60.1.0/24",
  ]
  allow { protocol = "tcp" }
  allow { protocol = "udp" }
  allow { protocol = "icmp" }
}

# ── VPN: IKE + ESP to Hub ─────────────────────────────────────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-vpn-hub-001" {
  name          = "gcp-asia-southeast1-fw-allow-vpn-hub-001"
  project       = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-network-hub-001.name
  description   = "Allow VPN tunnel IKE and ESP traffic to the hub"
  source_ranges = ["0.0.0.0/0"]
  allow { protocol = "udp"; ports = ["500", "4500"] }
  allow { protocol = "esp" }
}

# ── LB Health Check: Grafana (port 3000) — only active LB ────────────────────
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-lb-hc-grafana-001" {
  name          = "gcp-asia-southeast1-fw-allow-lb-hc-grafana-001"
  project       = data.google_project.gcp-apse1-prj-obs-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-observability-001.name
  description   = "Allow GCP LB health check probes to Grafana on port 3000"
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["observability-vm"]
  allow {
    protocol = "tcp"
    ports    = ["3000"]
  }
}

# ── LB Health Check: K8s NodePort range dev (covers all future K8s LB services) 
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-k8s-lb-hc-dev-001" {
  name          = "gcp-asia-southeast1-fw-allow-k8s-lb-hc-dev-001"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.name
  description   = "Allow GCP LB health check probes to dev K8s workers on NodePort range"
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["k8s-worker"]
  allow {
    protocol = "tcp"
    ports    = ["30000-32767"]
  }
}

# ── LB Health Check: K8s NodePort range prod (covers all future K8s LB services)
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-k8s-lb-hc-prod-001" {
  name          = "gcp-asia-southeast1-fw-allow-k8s-lb-hc-prod-001"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.name
  description   = "Allow GCP LB health check probes to prod K8s workers on NodePort range"
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["k8s-worker"]
  allow {
    protocol = "tcp"
    ports    = ["30000-32767"]
  }
}
