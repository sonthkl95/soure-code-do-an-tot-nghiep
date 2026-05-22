# ─── ACCESS & CONNECTIVITY ──────────────────────────────────────────────────────

output "bastion_host_public_ip" {
  description = "Public IP of the Bastion Host - use this as the SSH entry point"
  value       = google_compute_instance.gcp-asia-southeast1-vm-bastion-003.network_interface[0].access_config[0].nat_ip
}

output "observability_vm_private_ip" {
  description = "Private IP of the Observability VM (used in Ansible inventory)"
  value       = google_compute_instance.gcp-asia-southeast1-vm-observability-003.network_interface[0].network_ip
}

# ─── SERVICES & ENDPOINTS ───────────────────────────────────────────────────────

output "load_balancer_ip" {
  description = "Global IP for Grafana Dashboard (http://<ip>)"
  value       = google_compute_global_address.gcp-asia-southeast1-lb-grafana-ip-003.address
}

output "techshop_dev_lb_ip" {
  description = "Global IP for TechShop DEV cluster (map /etc/hosts: www.dev.techshop.local, shop.dev.techshop.local, ... → IP này)"
  value       = google_compute_global_address.gcp-asia-southeast1-lb-k8s-dev-techshop-ip-003.address
}

output "techshop_prod_lb_ip" {
  description = "Global IP for TechShop PROD cluster (map /etc/hosts: www.techshop.local, shop.techshop.local, ... → IP này)"
  value       = google_compute_global_address.gcp-asia-southeast1-lb-k8s-prod-techshop-ip-003.address
}

# ─── NETWORK (HA VPN) ───────────────────────────────────────────────────────────

# TEMPORARILY DISABLED - VPN outputs commented out
# output "vpn_gateway_interface_0_ip" {
#   description = "External IP of HA VPN Gateway interface 0"
#   value       = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-003.vpn_interfaces[0].ip_address
# }

# output "vpn_gateway_interface_1_ip" {
#   description = "External IP of HA VPN Gateway interface 1"
#   value       = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-003.vpn_interfaces[1].ip_address
# }
