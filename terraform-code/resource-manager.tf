# Projects and folders are managed manually outside Terraform.
# Fill in project IDs via terraform.tfvars then run terraform apply.

data "google_project" "gcp-apse1-prj-hub-net-001" {
  project_id = var.project_id_hub_net
}

data "google_project" "gcp-apse1-prj-sh-access-001" {
  project_id = var.project_id_sh_access
}

data "google_project" "gcp-apse1-prj-sh-vpc-dev-001" {
  project_id = var.project_id_sh_vpc_dev
}

data "google_project" "gcp-apse1-prj-sh-vpc-prd-001" {
  project_id = var.project_id_sh_vpc_prd
}

data "google_project" "gcp-apse1-prj-dev-env-001" {
  project_id = var.project_id_dev_env
}

data "google_project" "gcp-apse1-prj-prd-env-001" {
  project_id = var.project_id_prd_env
}

data "google_project" "gcp-apse1-prj-obs-001" {
  project_id = var.project_id_obs
}
