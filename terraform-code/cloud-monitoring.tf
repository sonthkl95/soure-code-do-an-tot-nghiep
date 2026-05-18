# Notification channel: hub project
resource "google_monitoring_notification_channel" "gcp-asia-southeast1-monitoring-email-hub-003" {
  display_name = "gcp-asia-southeast1-monitoring-email-hub-003"
  type         = "email"
  project      = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  labels = {
    email_address = var.user_email
  }
}

# Notification channel: dev project
resource "google_monitoring_notification_channel" "gcp-asia-southeast1-monitoring-email-dev-003" {
  display_name = "gcp-asia-southeast1-monitoring-email-dev-003"
  type         = "email"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  labels = {
    email_address = var.user_email
  }
}

# Notification channel: prod project
resource "google_monitoring_notification_channel" "gcp-asia-southeast1-monitoring-email-prod-003" {
  display_name = "gcp-asia-southeast1-monitoring-email-prod-003"
  type         = "email"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  labels = {
    email_address = var.user_email
  }
}

# Notification channel: shared access project
resource "google_monitoring_notification_channel" "gcp-asia-southeast1-monitoring-email-access-003" {
  display_name = "gcp-asia-southeast1-monitoring-email-access-003"
  type         = "email"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  labels = {
    email_address = var.user_email
  }
}

# Notification channel: observability project
resource "google_monitoring_notification_channel" "gcp-asia-southeast1-monitoring-email-obs-003" {
  display_name = "gcp-asia-southeast1-monitoring-email-obs-003"
  type         = "email"
  project      = data.google_project.gcp-apse1-prj-obs-003.project_id
  labels = {
    email_address = var.user_email
  }
}

# Uptime check: Bastion Host SSH (public IP, port 22)
resource "google_monitoring_uptime_check_config" "gcp-asia-southeast1-uptime-bastion-003" {
  display_name = "gcp-asia-southeast1-uptime-bastion-003"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  timeout      = "10s"
  period       = "60s"

  tcp_check {
    port = 22
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = data.google_project.gcp-apse1-prj-sh-access-003.project_id
      host       = google_compute_instance.gcp-asia-southeast1-vm-bastion-003.network_interface[0].access_config[0].nat_ip
    }
  }
}

# Alert: Dev VM CPU > 80% for 5 minutes
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-cpu-dev-003" {
  display_name = "gcp-asia-southeast1-alert-cpu-dev-003"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "Dev VM CPU > 80%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"compute.googleapis.com/instance/cpu/utilization\" AND resource.labels.project_id = \"${data.google_project.gcp-apse1-prj-dev-env-003.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-dev-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: Prod VM CPU > 80% for 5 minutes
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-cpu-prod-003" {
  display_name = "gcp-asia-southeast1-alert-cpu-prod-003"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "Prod VM CPU > 80%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"compute.googleapis.com/instance/cpu/utilization\" AND resource.labels.project_id = \"${data.google_project.gcp-apse1-prj-prd-env-003.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-prod-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: Dev VM memory > 85% for 5 minutes (requires Ops Agent)
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-memory-dev-003" {
  display_name = "gcp-asia-southeast1-alert-memory-dev-003"
  project      = data.google_project.gcp-apse1-prj-dev-env-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "Dev VM Memory > 85%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"agent.googleapis.com/memory/percent_used\" AND metric.labels.state = \"used\" AND resource.labels.project_id = \"${data.google_project.gcp-apse1-prj-dev-env-003.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 85

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-dev-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: Prod VM memory > 85% for 5 minutes (requires Ops Agent)
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-memory-prod-003" {
  display_name = "gcp-asia-southeast1-alert-memory-prod-003"
  project      = data.google_project.gcp-apse1-prj-prd-env-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "Prod VM Memory > 85%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"agent.googleapis.com/memory/percent_used\" AND metric.labels.state = \"used\" AND resource.labels.project_id = \"${data.google_project.gcp-apse1-prj-prd-env-003.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 85

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-prod-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: VPN tunnel is down
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-vpn-tunnel-003" {
  display_name = "gcp-asia-southeast1-alert-vpn-tunnel-003"
  project      = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "VPN Tunnel is down"
    condition_threshold {
      filter          = "resource.type = \"vpn_gateway\" AND metric.type = \"vpn.googleapis.com/tunnel_established\""
      duration        = "60s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-hub-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: LB 5xx error rate > 5% for 2 minutes
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-lb-5xx-003" {
  display_name = "gcp-asia-southeast1-alert-lb-5xx-003"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "LB 5xx error rate > 5%"
    condition_threshold {
      filter          = "resource.type = \"https_lb_rule\" AND metric.type = \"loadbalancing.googleapis.com/https/request_count\" AND metric.labels.response_code_class = \"500\""
      duration        = "120s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-access-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: Bastion CPU > 80% for 5 minutes
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-cpu-bastion-003" {
  display_name = "gcp-asia-southeast1-alert-cpu-bastion-003"
  project      = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "Bastion Host CPU > 80%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"compute.googleapis.com/instance/cpu/utilization\" AND resource.labels.project_id = \"${data.google_project.gcp-apse1-prj-sh-access-003.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-access-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Alert: Observability VM CPU > 80% for 5 minutes
resource "google_monitoring_alert_policy" "gcp-asia-southeast1-alert-cpu-observability-003" {
  display_name = "gcp-asia-southeast1-alert-cpu-observability-003"
  project      = data.google_project.gcp-apse1-prj-obs-003.project_id
  combiner     = "OR"

  conditions {
    display_name = "Observability VM CPU > 80%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"compute.googleapis.com/instance/cpu/utilization\" AND resource.labels.project_id = \"${data.google_project.gcp-apse1-prj-obs-003.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.gcp-asia-southeast1-monitoring-email-obs-003.name]

  alert_strategy {
    auto_close = "604800s"
  }
}
