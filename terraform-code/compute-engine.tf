locals {
  ops_agent_startup_script = <<-EOT
    #!/bin/bash
    # Install Google Cloud Ops Agent if not already installed
    if ! systemctl is-active --quiet google-cloud-ops-agent; then
      echo "Ops Agent is not running. Downloading and installing..."
      curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
      bash add-google-cloud-ops-agent-repo.sh --also-install
    else
      echo "Ops Agent is already running."
    fi
  EOT
}

# Dev K8s master (10.10.1.10)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-dev-master-1" {
  name         = "gcp-asia-southeast1-vm-k8s-dev-master-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 30
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
    network_ip         = "10.10.1.10"
  }

  service_account {
    email  = google_service_account.sa-dev-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "k8s-dev-master-1", env = "dev", role = "master" }
  tags                    = ["k8s-master", "k8s-dev", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-dev-003]
}

# Dev K8s worker 1 (10.10.1.20)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-dev-worker-1" {
  name         = "gcp-asia-southeast1-vm-k8s-dev-worker-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 40
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
    network_ip         = "10.10.1.20"
  }

  service_account {
    email  = google_service_account.sa-dev-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "k8s-dev-worker-1", env = "dev", role = "worker" }
  tags                    = ["k8s-worker", "k8s-dev", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-dev-003]
}

# Dev K8s worker 2 (10.10.1.21)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-dev-worker-2" {
  name         = "gcp-asia-southeast1-vm-k8s-dev-worker-2"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 40
      type  = "pd-standard"
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-dev-003.project_id
    network_ip         = "10.10.1.21"
  }

  service_account {
    email  = google_service_account.sa-dev-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "k8s-dev-worker-2", env = "dev", role = "worker" }
  tags                    = ["k8s-worker", "k8s-dev", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-dev-003]
}

# Prod K8s master (10.20.1.10)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-prod-master-1" {
  name         = "gcp-asia-southeast1-vm-k8s-prod-master-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 30
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
    network_ip         = "10.20.1.10"
  }

  service_account {
    email  = google_service_account.sa-prd-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "k8s-prod-master-1", env = "prod", role = "master" }
  tags                    = ["k8s-master", "k8s-prod", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-prod-003]
}

# Prod K8s worker 1 (10.20.1.20)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-prod-worker-1" {
  name         = "gcp-asia-southeast1-vm-k8s-prod-worker-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 40
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
    network_ip         = "10.20.1.20"
  }

  service_account {
    email  = google_service_account.sa-prd-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "k8s-prod-worker-1", env = "prod", role = "worker" }
  tags                    = ["k8s-worker", "k8s-prod", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-prod-003]
}

# Prod K8s worker 2 (10.20.1.21)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-prod-worker-2" {
  name         = "gcp-asia-southeast1-vm-k8s-prod-worker-2"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 40
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-prd-003.project_id
    network_ip         = "10.20.1.21"
  }

  service_account {
    email  = google_service_account.sa-prd-env.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "k8s-prod-worker-2", env = "prod", role = "worker" }
  tags                    = ["k8s-worker", "k8s-prod", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-prod-003]
}

# Bastion Host (10.50.1.100, has public IP)

# Static external IP cho Bastion (giữ nguyên IP sau mỗi lần recreate)
resource "google_compute_address" "gcp-asia-southeast1-bastion-ip-003" {
  name         = "gcp-asia-southeast1-bastion-ip-003"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  region       = "asia-southeast1"
  address_type = "EXTERNAL"
  network_tier = "PREMIUM"
}

resource "google_compute_instance" "gcp-asia-southeast1-vm-bastion-003" {
  name         = "gcp-asia-southeast1-vm-bastion-003"
  machine_type = "e2-micro" # 2 shared vCPUs, 1GB RAM - extremely small footprint for quotas
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 20
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-access-003.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-shared-access-003.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-access-003.project_id
    network_ip         = "10.50.1.100"

    access_config {
      nat_ip       = google_compute_address.gcp-asia-southeast1-bastion-ip-003.address
      network_tier = "PREMIUM"
    }
  }

  service_account {
    email  = google_service_account.sa-sh-access.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  tags                    = ["bastion", "allow-ssh-external"]

  depends_on = [
    google_org_policy_policy.gcp-asia-southeast1-org-policy-allow-vm-external-ip-bastion-003,
  ]
}

# Observability VM (10.60.1.10) running Prometheus, Loki, Tempo, Grafana, Alertmanager, OTel Gateway
resource "google_compute_instance" "gcp-asia-southeast1-vm-observability-003" {
  name         = "gcp-asia-southeast1-vm-observability-003"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-obs-003.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 50
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network    = google_compute_network.gcp-asia-southeast1-vpc-observability-003.id
    subnetwork = google_compute_subnetwork.gcp-asia-southeast1-subnet-observability-003.id
    network_ip = "10.60.1.10"
  }

  service_account {
    email  = google_service_account.sa-obs.email
    scopes = ["cloud-platform"]
  }

  metadata                = { enable-oslogin = "TRUE" }
  metadata_startup_script = local.ops_agent_startup_script
  labels                  = { vm_name = "observability-vm", env = "obs", role = "observability" }
  tags                    = ["observability-vm", "allow-internal"]

  depends_on = [google_project_service.gcp-apse1-apis-observability-003]
}
