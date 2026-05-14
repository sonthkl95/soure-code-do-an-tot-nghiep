# Project IDs
output "project_id_hub_network" {
  description = "Project ID of the hub network project"
  value       = data.google_project.gcp-apse1-prj-hub-net-001.project_id
}

output "project_id_shared_vpc_dev" {
  description = "Project ID of the shared VPC dev host project"
  value       = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
}

output "project_id_shared_vpc_prod" {
  description = "Project ID of the shared VPC prod host project"
  value       = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
}

output "project_id_shared_access" {
  description = "Project ID of the shared access project"
  value       = data.google_project.gcp-apse1-prj-sh-access-001.project_id
}

output "project_id_dev_environment" {
  description = "Project ID of the dev environment project"
  value       = data.google_project.gcp-apse1-prj-dev-env-001.project_id
}

output "project_id_prod_environment" {
  description = "Project ID of the prod environment project"
  value       = data.google_project.gcp-apse1-prj-prd-env-001.project_id
}

# VPC self-links
output "vpc_hub_self_link" {
  description = "Self-link of the hub VPC network"
  value       = google_compute_network.gcp-asia-southeast1-vpc-network-hub-001.self_link
}

output "vpc_shared_dev_self_link" {
  description = "Self-link of the shared dev VPC network"
  value       = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.self_link
}

output "vpc_shared_prod_self_link" {
  description = "Self-link of the shared prod VPC network"
  value       = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.self_link
}

output "vpc_shared_access_self_link" {
  description = "Self-link of the shared access VPC network"
  value       = google_compute_network.gcp-asia-southeast1-vpc-shared-access-001.self_link
}

# Grafana Load Balancer IP (Global External LB in sh-access-001)
output "load_balancer_ip" {
  description = "Static global IP of the Grafana External Application Load Balancer"
  value       = google_compute_global_address.gcp-asia-southeast1-lb-grafana-ip-001.address
}

# HA VPN gateway IPs
output "vpn_gateway_interface_0_ip" {
  description = "External IP of HA VPN Gateway interface 0"
  value       = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-001.vpn_interfaces[0].ip_address
}

output "vpn_gateway_interface_1_ip" {
  description = "External IP of HA VPN Gateway interface 1"
  value       = google_compute_ha_vpn_gateway.gcp-asia-southeast1-vpn-hub-001.vpn_interfaces[1].ip_address
}

# Service account emails per project
output "sa_hub_net_email" {
  description = "Email of the hub-net service account"
  value       = google_service_account.sa-hub-net.email
}

output "sa_sh_vpc_dev_email" {
  description = "Email of the shared VPC dev service account"
  value       = google_service_account.sa-sh-vpc-dev.email
}

output "sa_sh_vpc_prd_email" {
  description = "Email of the shared VPC prod service account"
  value       = google_service_account.sa-sh-vpc-prd.email
}

output "sa_sh_access_email" {
  description = "Email of the shared access (bastion) service account"
  value       = google_service_account.sa-sh-access.email
}

output "sa_dev_env_email" {
  description = "Email of the dev environment service account"
  value       = google_service_account.sa-dev-env.email
}

output "sa_prd_env_email" {
  description = "Email of the prod environment service account"
  value       = google_service_account.sa-prd-env.email
}

output "sa_obs_email" {
  description = "Email of the observability service account"
  value       = google_service_account.sa-obs.email
}

# Bastion public IP (used to SSH in and run Ansible)
output "bastion_host_public_ip" {
  description = "Public IP of the Bastion Host - use this to SSH in"
  value       = google_compute_instance.gcp-asia-southeast1-vm-bastion-001.network_interface[0].access_config[0].nat_ip
}

# Observability VM private IP (used in Ansible inventory)
output "observability_vm_private_ip" {
  description = "Private IP of the Observability VM (10.60.1.10)"
  value       = google_compute_instance.gcp-asia-southeast1-vm-observability-001.network_interface[0].network_ip
}

output "project_id_observability" {
  description = "Project ID of the observability project"
  value       = data.google_project.gcp-apse1-prj-obs-001.project_id
}
