# =============================================================================
# External HTTP LB cho TechShop K8s clusters
# - Dev:  gcp-apse1-prj-dev-env-003 (workers: 10.10.1.20, 10.10.1.21)
# - Prod: gcp-apse1-prj-prd-env-003 (workers: 10.20.1.20, 10.20.1.21)
# Mỗi LB trỏ về ingress-nginx-controller NodePort 30080 trên 2 worker.
# Firewall cho HC range 130.211.0.0/22 + 35.191.0.0/16 → 30000-32767 đã có
# trong compute-firewall.tf (gcp-asia-southeast1-fw-allow-k8s-lb-hc-{dev,prod}-003).
# =============================================================================

locals {
  k8s_ingress_nodeport = 30080
}

# ─── DEV ────────────────────────────────────────────────────────────────────
resource "google_compute_instance_group" "gcp-asia-southeast1-ig-k8s-dev-workers-003" {
  name      = "gcp-asia-southeast1-ig-k8s-dev-workers-003"
  zone      = "asia-southeast1-b"
  project   = data.google_project.gcp-apse1-prj-dev-env-003.project_id

  instances = [
    google_compute_instance.gcp-asia-southeast1-vm-k8s-dev-worker-1.self_link,
    google_compute_instance.gcp-asia-southeast1-vm-k8s-dev-worker-2.self_link,
  ]

  named_port {
    name = "ingress-http"
    port = local.k8s_ingress_nodeport
  }
}

resource "google_compute_health_check" "gcp-asia-southeast1-hc-k8s-dev-ingress-003" {
  name    = "gcp-asia-southeast1-hc-k8s-dev-ingress-003"
  project = data.google_project.gcp-apse1-prj-dev-env-003.project_id

  http_health_check {
    port         = local.k8s_ingress_nodeport
    request_path = "/healthz"
  }
}

resource "google_compute_backend_service" "gcp-asia-southeast1-backend-k8s-dev-techshop-003" {
  name                  = "gcp-asia-southeast1-backend-k8s-dev-techshop-003"
  project               = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_name             = "ingress-http"
  health_checks         = [google_compute_health_check.gcp-asia-southeast1-hc-k8s-dev-ingress-003.id]
  timeout_sec           = 30

  backend {
    group                 = google_compute_instance_group.gcp-asia-southeast1-ig-k8s-dev-workers-003.id
    balancing_mode        = "RATE"
    max_rate_per_instance = 200
  }
}

resource "google_compute_url_map" "gcp-asia-southeast1-url-map-k8s-dev-techshop-003" {
  name            = "gcp-asia-southeast1-url-map-k8s-dev-techshop-003"
  project         = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  default_service = google_compute_backend_service.gcp-asia-southeast1-backend-k8s-dev-techshop-003.id
}

resource "google_compute_target_http_proxy" "gcp-asia-southeast1-http-proxy-k8s-dev-techshop-003" {
  name    = "gcp-asia-southeast1-http-proxy-k8s-dev-techshop-003"
  project = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  url_map = google_compute_url_map.gcp-asia-southeast1-url-map-k8s-dev-techshop-003.id
}

resource "google_compute_global_address" "gcp-asia-southeast1-lb-k8s-dev-techshop-ip-003" {
  name       = "gcp-asia-southeast1-lb-k8s-dev-techshop-ip-003"
  project    = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  depends_on = [google_project_service.gcp-apse1-apis-dev-env-003]
}

resource "google_compute_global_forwarding_rule" "gcp-asia-southeast1-fr-k8s-dev-techshop-003" {
  name                  = "gcp-asia-southeast1-fr-k8s-dev-techshop-003"
  project               = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  ip_address            = google_compute_global_address.gcp-asia-southeast1-lb-k8s-dev-techshop-ip-003.id
  port_range            = "80"
  target                = google_compute_target_http_proxy.gcp-asia-southeast1-http-proxy-k8s-dev-techshop-003.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# ─── PROD ───────────────────────────────────────────────────────────────────
resource "google_compute_instance_group" "gcp-asia-southeast1-ig-k8s-prod-workers-003" {
  name      = "gcp-asia-southeast1-ig-k8s-prod-workers-003"
  zone      = "asia-southeast1-b"
  project   = data.google_project.gcp-apse1-prj-prd-env-003.project_id

  instances = [
    google_compute_instance.gcp-asia-southeast1-vm-k8s-prod-worker-1.self_link,
    google_compute_instance.gcp-asia-southeast1-vm-k8s-prod-worker-2.self_link,
  ]

  named_port {
    name = "ingress-http"
    port = local.k8s_ingress_nodeport
  }
}

resource "google_compute_health_check" "gcp-asia-southeast1-hc-k8s-prod-ingress-003" {
  name    = "gcp-asia-southeast1-hc-k8s-prod-ingress-003"
  project = data.google_project.gcp-apse1-prj-prd-env-003.project_id

  http_health_check {
    port         = local.k8s_ingress_nodeport
    request_path = "/healthz"
  }
}

resource "google_compute_backend_service" "gcp-asia-southeast1-backend-k8s-prod-techshop-003" {
  name                  = "gcp-asia-southeast1-backend-k8s-prod-techshop-003"
  project               = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_name             = "ingress-http"
  health_checks         = [google_compute_health_check.gcp-asia-southeast1-hc-k8s-prod-ingress-003.id]
  timeout_sec           = 30

  backend {
    group                 = google_compute_instance_group.gcp-asia-southeast1-ig-k8s-prod-workers-003.id
    balancing_mode        = "RATE"
    max_rate_per_instance = 200
  }
}

resource "google_compute_url_map" "gcp-asia-southeast1-url-map-k8s-prod-techshop-003" {
  name            = "gcp-asia-southeast1-url-map-k8s-prod-techshop-003"
  project         = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  default_service = google_compute_backend_service.gcp-asia-southeast1-backend-k8s-prod-techshop-003.id
}

resource "google_compute_target_http_proxy" "gcp-asia-southeast1-http-proxy-k8s-prod-techshop-003" {
  name    = "gcp-asia-southeast1-http-proxy-k8s-prod-techshop-003"
  project = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  url_map = google_compute_url_map.gcp-asia-southeast1-url-map-k8s-prod-techshop-003.id
}

resource "google_compute_global_address" "gcp-asia-southeast1-lb-k8s-prod-techshop-ip-003" {
  name       = "gcp-asia-southeast1-lb-k8s-prod-techshop-ip-003"
  project    = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  depends_on = [google_project_service.gcp-apse1-apis-prd-env-003]
}

resource "google_compute_global_forwarding_rule" "gcp-asia-southeast1-fr-k8s-prod-techshop-003" {
  name                  = "gcp-asia-southeast1-fr-k8s-prod-techshop-003"
  project               = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  ip_address            = google_compute_global_address.gcp-asia-southeast1-lb-k8s-prod-techshop-ip-003.id
  port_range            = "80"
  target                = google_compute_target_http_proxy.gcp-asia-southeast1-http-proxy-k8s-prod-techshop-003.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
