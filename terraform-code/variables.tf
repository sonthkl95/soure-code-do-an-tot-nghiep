variable "org_id" {
  description = "GCP Organization ID"
  type        = string
}

variable "billing_account" {
  description = "GCP Billing Account ID"
  type        = string
}

variable "user_email" {
  description = "Personal GCP account email - used for org-level admin roles and monitoring notifications"
  type        = string
}

variable "vpn_shared_secret_1" {
  description = "Shared secret for HA VPN Tunnel 1"
  type        = string
  sensitive   = true
}

variable "vpn_shared_secret_2" {
  description = "Shared secret for HA VPN Tunnel 2"
  type        = string
  sensitive   = true
}

# Project IDs - created manually and passed in
variable "project_id_hub_net" {
  description = "Project ID of the hub network project (Cloud VPN, Cloud Router)"
  type        = string
}

variable "project_id_sh_access" {
  description = "Project ID of the shared access project (Bastion, Global LB)"
  type        = string
}

variable "project_id_sh_vpc_dev" {
  description = "Project ID of the shared VPC dev host project"
  type        = string
}

variable "project_id_sh_vpc_prd" {
  description = "Project ID of the shared VPC prod host project"
  type        = string
}

variable "project_id_dev_env" {
  description = "Project ID of the dev environment service project"
  type        = string
}

variable "project_id_prd_env" {
  description = "Project ID of the prod environment service project"
  type        = string
}

variable "project_id_obs" {
  description = "Project ID of the observability project (Prometheus, Loki, Grafana)"
  type        = string
}
