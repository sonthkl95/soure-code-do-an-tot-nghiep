/* TEMPORARILY DISABLED - VPN resources commented out
# Cloud Router in hub VPC (ASN 65001) for VPN BGP sessions
resource "google_compute_router" "gcp-asia-southeast1-router-hub-001" {
  name       = "gcp-asia-southeast1-router-hub-001"
  project    = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  region     = "asia-southeast1"
  network    = google_compute_network.gcp-asia-southeast1-vpc-network-hub-001.id
  depends_on = [google_project_service.gcp-apse1-apis-hub-net-001]

  bgp {
    asn               = 65001
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]

    # Advertise peered spoke VPC subnets to on-prem (peering routes are not auto-advertised over BGP)
    advertised_ip_ranges {
      range       = "10.10.0.0/20"
      description = "shared-dev VPC subnets"
    }
    advertised_ip_ranges {
      range       = "10.20.0.0/20"
      description = "shared-prod VPC subnets"
    }
    advertised_ip_ranges {
      range       = "10.50.1.0/24"
      description = "shared-access VPC subnet (bastion)"
    }
    advertised_ip_ranges {
      range       = "10.60.1.0/24"
      description = "observability VPC subnet"
    }
  }
}

# HA VPN Gateway in hub VPC
resource "google_compute_ha_vpn_gateway" "gcp-asia-southeast1-vpn-hub-001" {
  name       = "gcp-asia-southeast1-vpn-hub-001"
  project    = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  region     = "asia-southeast1"
  network    = google_compute_network.gcp-asia-southeast1-vpc-network-hub-001.id
  depends_on = [google_project_service.gcp-apse1-apis-hub-net-001]
}

# External VPN Gateway representing on-prem peer
resource "google_compute_external_vpn_gateway" "gcp-asia-southeast1-vpn-external-peer-001" {
  name            = "gcp-asia-southeast1-vpn-external-peer-001"
  project         = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  redundancy_type = "TWO_IPS_REDUNDANCY"
  description     = "External on-premises VPN peer gateway"
  depends_on      = [google_project_service.gcp-apse1-apis-hub-net-001]

  interface {
    id         = 0
    ip_address = var.onprem_vpn_public_ip_0
  }

  interface {
    id         = 1
    ip_address = var.onprem_vpn_public_ip_1
  }
}

# VPN Tunnel 0 (HA VPN iface 0 <-> peer iface 0)
resource "google_compute_vpn_tunnel" "gcp-asia-southeast1-vpn-tunnel-001" {
  name                            = "gcp-asia-southeast1-vpn-tunnel-001"
  project                         = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  region                          = "asia-southeast1"
  vpn_gateway                     = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-001.id
  vpn_gateway_interface           = 0
  peer_external_gateway           = google_compute_external_vpn_gateway.gcp-asia-southeast1-vpn-external-peer-001.id
  peer_external_gateway_interface = 0
  shared_secret                   = var.vpn_shared_secret_1
  router                          = google_compute_router.gcp-asia-southeast1-router-hub-001.id
}

# VPN Tunnel 1 (HA VPN iface 1 <-> peer iface 1)
resource "google_compute_vpn_tunnel" "gcp-asia-southeast1-vpn-tunnel-002" {
  name                            = "gcp-asia-southeast1-vpn-tunnel-002"
  project                         = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  region                          = "asia-southeast1"
  vpn_gateway                     = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-001.id
  vpn_gateway_interface           = 1
  peer_external_gateway           = google_compute_external_vpn_gateway.gcp-asia-southeast1-vpn-external-peer-001.id
  peer_external_gateway_interface = 1
  shared_secret                   = var.vpn_shared_secret_2
  router                          = google_compute_router.gcp-asia-southeast1-router-hub-001.id
}

# BGP interface for tunnel 0
resource "google_compute_router_interface" "gcp-asia-southeast1-router-interface-001" {
  name       = "gcp-asia-southeast1-router-interface-001"
  project    = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  router     = google_compute_router.gcp-asia-southeast1-router-hub-001.name
  region     = "asia-southeast1"
  ip_range   = "169.254.0.1/30"
  vpn_tunnel = google_compute_vpn_tunnel.gcp-asia-southeast1-vpn-tunnel-001.name
}

# BGP peer for tunnel 0
resource "google_compute_router_peer" "gcp-asia-southeast1-router-peer-001" {
  name                      = "gcp-asia-southeast1-router-peer-001"
  project                   = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  router                    = google_compute_router.gcp-asia-southeast1-router-hub-001.name
  region                    = "asia-southeast1"
  peer_ip_address           = "169.254.0.2"
  peer_asn                  = 65002
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.gcp-asia-southeast1-router-interface-001.name
}

# BGP interface for tunnel 1
resource "google_compute_router_interface" "gcp-asia-southeast1-router-interface-002" {
  name       = "gcp-asia-southeast1-router-interface-002"
  project    = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  router     = google_compute_router.gcp-asia-southeast1-router-hub-001.name
  region     = "asia-southeast1"
  ip_range   = "169.254.1.1/30"
  vpn_tunnel = google_compute_vpn_tunnel.gcp-asia-southeast1-vpn-tunnel-002.name

  depends_on = [google_compute_router_interface.gcp-asia-southeast1-router-interface-001]
}

# BGP peer for tunnel 1
resource "google_compute_router_peer" "gcp-asia-southeast1-router-peer-002" {
  name                      = "gcp-asia-southeast1-router-peer-002"
  project                   = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  router                    = google_compute_router.gcp-asia-southeast1-router-hub-001.name
  region                    = "asia-southeast1"
  peer_ip_address           = "169.254.1.2"
  peer_asn                  = 65002
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.gcp-asia-southeast1-router-interface-002.name
}
TEMPORARILY DISABLED */
