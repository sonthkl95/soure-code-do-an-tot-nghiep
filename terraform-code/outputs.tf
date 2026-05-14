# ─── ACCESS & CONNECTIVITY ──────────────────────────────────────────────────────

output "bastion_host_public_ip" {
  description = "Public IP of the Bastion Host - use this as the SSH entry point"
  value       = google_compute_instance.gcp-asia-southeast1-vm-bastion-001.network_interface[0].access_config[0].nat_ip
}

output "observability_vm_private_ip" {
  description = "Private IP of the Observability VM (used in Ansible inventory)"
  value       = google_compute_instance.gcp-asia-southeast1-vm-observability-001.network_interface[0].network_ip
}

# ─── SERVICES & ENDPOINTS ───────────────────────────────────────────────────────

output "load_balancer_ip" {
  description = "Global IP for Grafana Dashboard (http://<ip>)"
  value       = google_compute_global_address.gcp-asia-southeast1-lb-grafana-ip-001.address
}

# ─── NETWORK (HA VPN) ───────────────────────────────────────────────────────────

output "vpn_gateway_interface_0_ip" {
  description = "External IP of HA VPN Gateway interface 0"
  value       = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-001.vpn_interfaces[0].ip_address
}

output "vpn_gateway_interface_1_ip" {
  description = "External IP of HA VPN Gateway interface 1"
  value       = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-001.vpn_interfaces[1].ip_address
}
