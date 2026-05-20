# ==============================================================================
# Firewall rules cho Prometheus (obs-vm 10.60.1.10) scrape node_exporter (9100)
# trên các VM thuộc VPC dev/prod qua peering Obs↔Dev/Prod.
#
# Trước đây các fw-allow-internal-{dev,prod} chỉ cho phép intra-VPC
# (10.10.0.0/20, 10.20.0.0/20) → Prometheus ở obs-vm không scrape được
# k8s-dev/prod node + db-dev/prod node.
# ==============================================================================

# Obs (Prometheus) → Dev VMs: node-exporter scrape
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-prom-scrape-dev-003" {
  name          = "gcp-asia-southeast1-fw-allow-prom-scrape-dev-003"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.name
  description   = "Allow Prometheus on obs-vm to scrape node_exporter on dev VMs (k8s + db)"
  source_ranges = ["10.60.1.10/32"]
  target_tags   = ["allow-internal"]
  allow {
    protocol = "tcp"
    ports    = ["9100"]
  }
}

# Obs (Prometheus) → Prod VMs: node-exporter scrape
resource "google_compute_firewall" "gcp-asia-southeast1-fw-allow-prom-scrape-prod-003" {
  name          = "gcp-asia-southeast1-fw-allow-prom-scrape-prod-003"
  project       = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
  network       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.name
  description   = "Allow Prometheus on obs-vm to scrape node_exporter on prod VMs (k8s + db)"
  source_ranges = ["10.60.1.10/32"]
  target_tags   = ["allow-internal"]
  allow {
    protocol = "tcp"
    ports    = ["9100"]
  }
}
