# Hub <-> Dev
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-hub-to-dev-003" {
  name                 = "gcp-asia-southeast1-peering-hub-to-dev-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-dev-to-hub-003" {
  name                 = "gcp-asia-southeast1-peering-dev-to-hub-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Hub <-> Prod
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-hub-to-prod-003" {
  name                 = "gcp-asia-southeast1-peering-hub-to-prod-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-prod-to-hub-003" {
  name                 = "gcp-asia-southeast1-peering-prod-to-hub-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Hub <-> Observability
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-hub-to-obs-003" {
  name                 = "gcp-asia-southeast1-peering-hub-to-obs-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-obs-to-hub-003" {
  name                 = "gcp-asia-southeast1-peering-obs-to-hub-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-network-hub-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Dev <-> Observability (metrics/logs push, non-transitive workaround)
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-dev-to-obs-003" {
  name                 = "gcp-asia-southeast1-peering-dev-to-obs-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-obs-to-dev-003" {
  name                 = "gcp-asia-southeast1-peering-obs-to-dev-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Prod <-> Observability (metrics/logs push, non-transitive workaround)
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-prod-to-obs-003" {
  name                 = "gcp-asia-southeast1-peering-prod-to-obs-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-obs-to-prod-003" {
  name                 = "gcp-asia-southeast1-peering-obs-to-prod-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Access <-> Dev (Bastion SSH, non-transitive workaround)
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-access-to-dev-003" {
  name                 = "gcp-asia-southeast1-peering-access-to-dev-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-dev-to-access-003" {
  name                 = "gcp-asia-southeast1-peering-dev-to-access-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Access <-> Prod (Bastion SSH, non-transitive workaround)
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-access-to-prod-003" {
  name                 = "gcp-asia-southeast1-peering-access-to-prod-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-prod-to-access-003" {
  name                 = "gcp-asia-southeast1-peering-prod-to-access-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

# Access <-> Observability (Bastion SSH, non-transitive workaround)
resource "google_compute_network_peering" "gcp-asia-southeast1-peering-access-to-obs-003" {
  name                 = "gcp-asia-southeast1-peering-access-to-obs-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_network_peering" "gcp-asia-southeast1-peering-obs-to-access-003" {
  name                 = "gcp-asia-southeast1-peering-obs-to-access-003"
  network              = google_compute_network.gcp-asia-southeast1-vpc-observability-003.self_link
  peer_network         = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.self_link
  export_custom_routes = true
  import_custom_routes = true
}
