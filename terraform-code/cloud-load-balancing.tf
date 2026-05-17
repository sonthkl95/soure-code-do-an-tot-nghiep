# Unmanaged instance group wrapping the observability VM (in obs project)
resource "google_compute_instance_group" "gcp-asia-southeast1-ig-obs-001" {
  name    = "gcp-asia-southeast1-ig-obs-001"
  zone    = "asia-southeast1-b"
  project = data.google_project.gcp-apse1-prj-obs-001.project_id

  instances = [google_compute_instance.gcp-asia-southeast1-vm-observability-001.self_link]

  named_port {
    name = "grafana"
    port = 3000
  }
}

# Static global IP for Grafana LB (created in obs project to match the backend)
resource "google_compute_global_address" "gcp-asia-southeast1-lb-grafana-ip-001" {
  name       = "gcp-asia-southeast1-lb-grafana-ip-001"
  project    = data.google_project.gcp-apse1-prj-obs-001.project_id
  depends_on = [google_project_service.gcp-apse1-apis-observability-001]
}

# Health check on Grafana HTTP endpoint (created in obs project)
resource "google_compute_health_check" "gcp-asia-southeast1-hc-grafana-001" {
  name       = "gcp-asia-southeast1-hc-grafana-001"
  project    = data.google_project.gcp-apse1-prj-obs-001.project_id
  depends_on = [google_project_service.gcp-apse1-apis-observability-001]

  http_health_check {
    port         = 3000
    request_path = "/api/health"
  }
}

# Backend service pointing to Grafana instance group (same project now)
resource "google_compute_backend_service" "gcp-asia-southeast1-backend-grafana-001" {
  name                  = "gcp-asia-southeast1-backend-grafana-001"
  project               = data.google_project.gcp-apse1-prj-obs-001.project_id
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.gcp-asia-southeast1-hc-grafana-001.id]

  backend {
    group                 = google_compute_instance_group.gcp-asia-southeast1-ig-obs-001.id
    balancing_mode        = "RATE"
    max_rate_per_instance = 100
  }
}

# URL map – all traffic goes to Grafana backend (created in obs project)
resource "google_compute_url_map" "gcp-asia-southeast1-url-map-grafana-001" {
  name            = "gcp-asia-southeast1-url-map-grafana-001"
  project         = data.google_project.gcp-apse1-prj-obs-001.project_id
  default_service = google_compute_backend_service.gcp-asia-southeast1-backend-grafana-001.id
}

# HTTP target proxy linking forwarding rule to URL map (created in obs project)
resource "google_compute_target_http_proxy" "gcp-asia-southeast1-http-proxy-grafana-001" {
  name    = "gcp-asia-southeast1-http-proxy-grafana-001"
  project = data.google_project.gcp-apse1-prj-obs-001.project_id
  url_map = google_compute_url_map.gcp-asia-southeast1-url-map-grafana-001.id
}

# Global forwarding rule: static IP + port 80 -> Grafana proxy (created in obs project)
resource "google_compute_global_forwarding_rule" "gcp-asia-southeast1-forwarding-rule-grafana-001" {
  name                  = "gcp-asia-southeast1-forwarding-rule-grafana-001"
  project               = data.google_project.gcp-apse1-prj-obs-001.project_id
  ip_address            = google_compute_global_address.gcp-asia-southeast1-lb-grafana-ip-001.id
  port_range            = "80"
  target                = google_compute_target_http_proxy.gcp-asia-southeast1-http-proxy-grafana-001.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
