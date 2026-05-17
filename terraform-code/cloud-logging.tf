# GCS bucket: long-term log archive (deletes after 90 days)
resource "google_storage_bucket" "gcp-asia-southeast1-log-archive-001" {
  name          = "gcp-apse1-log-archive-${var.org_id}-003"
  location      = "asia-southeast1"
  project       = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  force_destroy = false

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }

  uniform_bucket_level_access = true
}

# GCS bucket: Loki chunk storage
resource "google_storage_bucket" "gcp-asia-southeast1-loki-storage-001" {
  name                        = "gcp-apse1-loki-storage-${var.org_id}-003"
  location                    = "asia-southeast1"
  project                     = data.google_project.gcp-apse1-prj-obs-001.project_id
  force_destroy               = false
  uniform_bucket_level_access = true
}

# GCS bucket: Tempo trace storage
resource "google_storage_bucket" "gcp-asia-southeast1-tempo-storage-001" {
  name                        = "gcp-apse1-tempo-storage-${var.org_id}-003"
  location                    = "asia-southeast1"
  project                     = data.google_project.gcp-apse1-prj-obs-001.project_id
  force_destroy               = false
  uniform_bucket_level_access = true
}

# BigQuery dataset for queryable infra logs (30-day expiry)
resource "google_bigquery_dataset" "gcp-asia-southeast1-log-dataset-001" {
  dataset_id  = "gcp_apse1_infra_logs_001"
  description = "Infrastructure logs from GCP native services for analysis"
  location    = "asia-southeast1"
  project     = data.google_project.gcp-apse1-prj-hub-net-001.project_id

  default_table_expiration_ms = 2592000000
}

# Org log sink: VPC Flow + Firewall logs -> BigQuery
resource "google_logging_organization_sink" "gcp-asia-southeast1-log-sink-vpc-bq-001" {
  name             = "gcp-asia-southeast1-log-sink-vpc-bq-001"
  org_id           = var.org_id
  include_children = true

  destination = "bigquery.googleapis.com/projects/${data.google_project.gcp-apse1-prj-hub-net-001.project_id}/datasets/${google_bigquery_dataset.gcp-asia-southeast1-log-dataset-001.dataset_id}"
  filter      = "log_id(\"compute.googleapis.com/vpc_flows\") OR log_id(\"compute.googleapis.com/firewall\")"

  depends_on = [google_bigquery_dataset.gcp-asia-southeast1-log-dataset-001]
}

# Grant BigQuery write permission to log sink SA
resource "google_bigquery_dataset_iam_member" "gcp-asia-southeast1-log-sink-bq-iam-001" {
  project    = data.google_project.gcp-apse1-prj-hub-net-001.project_id
  dataset_id = google_bigquery_dataset.gcp-asia-southeast1-log-dataset-001.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_organization_sink.gcp-asia-southeast1-log-sink-vpc-bq-001.writer_identity
}

# Org log sink: audit + system event logs -> GCS archive
resource "google_logging_organization_sink" "gcp-asia-southeast1-log-sink-audit-gcs-001" {
  name             = "gcp-asia-southeast1-log-sink-audit-gcs-001"
  org_id           = var.org_id
  include_children = true

  destination = "storage.googleapis.com/${google_storage_bucket.gcp-asia-southeast1-log-archive-001.name}"
  filter      = "log_id(\"cloudaudit.googleapis.com/activity\") OR log_id(\"cloudaudit.googleapis.com/system_event\")"

  depends_on = [google_storage_bucket.gcp-asia-southeast1-log-archive-001]
}

# Grant GCS write permission to log sink SA
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-log-sink-gcs-iam-001" {
  bucket = google_storage_bucket.gcp-asia-southeast1-log-archive-001.name
  role   = "roles/storage.objectCreator"
  member = google_logging_organization_sink.gcp-asia-southeast1-log-sink-audit-gcs-001.writer_identity
}

# Grant Loki bucket full access to observability SA
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-loki-storage-iam-001" {
  bucket = google_storage_bucket.gcp-asia-southeast1-loki-storage-001.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Grant Tempo bucket full access to observability SA
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-tempo-storage-iam-001" {
  bucket = google_storage_bucket.gcp-asia-southeast1-tempo-storage-001.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.sa-obs.email}"
}
