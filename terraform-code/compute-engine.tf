# Dev K8s master (10.10.1.10)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-dev-master-1" {
  name         = "gcp-asia-southeast1-vm-k8s-dev-master-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-dev-env-001.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 30
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-001.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
    network_ip         = "10.10.1.10"
  }

  service_account {
    email  = google_service_account.sa-dev-env.email
    scopes = ["cloud-platform"]
  }

  metadata = { enable-oslogin = "TRUE" }
  tags     = ["k8s-master", "k8s-dev", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-dev-001]
}

# Dev K8s worker 1 (10.10.1.20)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-dev-worker-1" {
  name         = "gcp-asia-southeast1-vm-k8s-dev-worker-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-dev-env-001.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 40
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-dev-001.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-dev-app-001.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-dev-001.project_id
    network_ip         = "10.10.1.20"
  }

  service_account {
    email  = google_service_account.sa-dev-env.email
    scopes = ["cloud-platform"]
  }

  metadata = { enable-oslogin = "TRUE" }
  tags     = ["k8s-worker", "k8s-dev", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-dev-001]
}

# Prod K8s master (10.20.1.10)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-prod-master-1" {
  name         = "gcp-asia-southeast1-vm-k8s-prod-master-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-prd-env-001.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 30
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-001.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
    network_ip         = "10.20.1.10"
  }

  service_account {
    email  = google_service_account.sa-prd-env.email
    scopes = ["cloud-platform"]
  }

  metadata = { enable-oslogin = "TRUE" }
  tags     = ["k8s-master", "k8s-prod", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-prod-001]
}

# Prod K8s worker 1 (10.20.1.20)
resource "google_compute_instance" "gcp-asia-southeast1-vm-k8s-prod-worker-1" {
  name         = "gcp-asia-southeast1-vm-k8s-prod-worker-1"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-prd-env-001.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 40
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-prod-001.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-prod-app-001.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-vpc-prd-001.project_id
    network_ip         = "10.20.1.20"
  }

  service_account {
    email  = google_service_account.sa-prd-env.email
    scopes = ["cloud-platform"]
  }

  metadata = { enable-oslogin = "TRUE" }
  tags     = ["k8s-worker", "k8s-prod", "allow-internal"]

  depends_on = [google_compute_shared_vpc_service_project.gcp-asia-southeast1-shared-vpc-service-prod-001]
}

# Bastion Host (10.50.1.100, has public IP)
resource "google_compute_instance" "gcp-asia-southeast1-vm-bastion-001" {
  name         = "gcp-asia-southeast1-vm-bastion-001"
  machine_type = "e2-micro" # 2 shared vCPUs, 1GB RAM - extremely small footprint for quotas
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-sh-access-001.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 20
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network            = google_compute_network.gcp-asia-southeast1-vpc-shared-access-001.id
    subnetwork         = google_compute_subnetwork.gcp-asia-southeast1-subnet-shared-access-001.id
    subnetwork_project = data.google_project.gcp-apse1-prj-sh-access-001.project_id
    network_ip         = "10.50.1.100"

    access_config {
      network_tier = "PREMIUM"
    }
  }

  service_account {
    email  = google_service_account.sa-sh-access.email
    scopes = ["cloud-platform"]
  }

  metadata = { enable-oslogin = "TRUE" }
  tags     = ["bastion", "allow-ssh-external"]

  depends_on = [
    google_org_policy_policy.gcp-asia-southeast1-org-policy-allow-vm-external-ip-bastion-001,
  ]
}

# Observability VM (10.60.1.10) running Kafka, Prometheus, Loki, Tempo, Grafana, Alertmanager
resource "google_compute_instance" "gcp-asia-southeast1-vm-observability-001" {
  name         = "gcp-asia-southeast1-vm-observability-001"
  machine_type = "e2-medium" # 2 vCPUs, 4GB RAM - optimized for quota compliance
  zone         = "asia-southeast1-b"
  project      = data.google_project.gcp-apse1-prj-obs-001.project_id

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 50
      type  = "pd-standard" # Changed to standard disk to avoid SSD quota limits
    }
  }

  network_interface {
    network    = google_compute_network.gcp-asia-southeast1-vpc-observability-001.id
    subnetwork = google_compute_subnetwork.gcp-asia-southeast1-subnet-observability-001.id
    network_ip = "10.60.1.10"
  }

  service_account {
    email  = google_service_account.sa-obs.email
    scopes = ["cloud-platform"]
  }

  metadata = { enable-oslogin = "TRUE" }
  tags     = ["observability-vm", "allow-internal"]

  depends_on = [google_project_service.gcp-apse1-apis-observability-001]
}
