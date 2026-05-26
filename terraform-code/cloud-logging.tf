# GCS bucket: long-term log archive (deletes after 90 days)
resource "google_storage_bucket" "gcp-asia-southeast1-log-archive-003" {
  name          = "gcp-apse1-log-archive-${var.org_id}-003"
  location      = "asia-southeast1"
  project       = data.google_project.gcp-apse1-prj-hub-net-003.project_id
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
resource "google_storage_bucket" "gcp-asia-southeast1-loki-storage-003" {
  name                        = "gcp-apse1-loki-storage-${var.org_id}-003"
  location                    = "asia-southeast1"
  project                     = data.google_project.gcp-apse1-prj-obs-003.project_id
  force_destroy               = false
  uniform_bucket_level_access = true
}

# GCS bucket: Tempo trace storage
resource "google_storage_bucket" "gcp-asia-southeast1-tempo-storage-003" {
  name                        = "gcp-apse1-tempo-storage-${var.org_id}-003"
  location                    = "asia-southeast1"
  project                     = data.google_project.gcp-apse1-prj-obs-003.project_id
  force_destroy               = false
  uniform_bucket_level_access = true
}

# BigQuery dataset for queryable infra logs (30-day expiry)
resource "google_bigquery_dataset" "gcp-asia-southeast1-log-dataset-003" {
  dataset_id  = "gcp_apse1_infra_logs_003"
  description = "Infrastructure logs from GCP native services for analysis"
  location    = "asia-southeast1"
  project     = data.google_project.gcp-apse1-prj-hub-net-003.project_id

  default_table_expiration_ms = 2592000000
}

# Org log sink: VPC Flow + Firewall logs -> BigQuery
resource "google_logging_organization_sink" "gcp-asia-southeast1-log-sink-vpc-bq-003" {
  name             = "gcp-asia-southeast1-log-sink-vpc-bq-003"
  org_id           = var.org_id
  include_children = true

  destination = "bigquery.googleapis.com/projects/${data.google_project.gcp-apse1-prj-hub-net-003.project_id}/datasets/${google_bigquery_dataset.gcp-asia-southeast1-log-dataset-003.dataset_id}"
  filter      = "log_id(\"compute.googleapis.com/vpc_flows\") OR log_id(\"compute.googleapis.com/firewall\")"

  depends_on = [google_bigquery_dataset.gcp-asia-southeast1-log-dataset-003]
}

# Grant BigQuery write permission to log sink SA
resource "google_bigquery_dataset_iam_member" "gcp-asia-southeast1-log-sink-bq-iam-003" {
  project    = data.google_project.gcp-apse1-prj-hub-net-003.project_id
  dataset_id = google_bigquery_dataset.gcp-asia-southeast1-log-dataset-003.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_organization_sink.gcp-asia-southeast1-log-sink-vpc-bq-003.writer_identity
}

# Org log sink: audit + system event logs -> GCS archive
resource "google_logging_organization_sink" "gcp-asia-southeast1-log-sink-audit-gcs-003" {
  name             = "gcp-asia-southeast1-log-sink-audit-gcs-003"
  org_id           = var.org_id
  include_children = true

  destination = "storage.googleapis.com/${google_storage_bucket.gcp-asia-southeast1-log-archive-003.name}"
  filter      = "log_id(\"cloudaudit.googleapis.com/activity\") OR log_id(\"cloudaudit.googleapis.com/system_event\")"

  depends_on = [google_storage_bucket.gcp-asia-southeast1-log-archive-003]
}

# Grant GCS write permission to log sink SA
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-log-sink-gcs-iam-003" {
  bucket = google_storage_bucket.gcp-asia-southeast1-log-archive-003.name
  role   = "roles/storage.objectCreator"
  member = google_logging_organization_sink.gcp-asia-southeast1-log-sink-audit-gcs-003.writer_identity
}

# Grant Loki bucket full access to observability SA
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-loki-storage-iam-003" {
  bucket = google_storage_bucket.gcp-asia-southeast1-loki-storage-003.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Loki cần đọc bucket metadata (storage.buckets.get) -> thêm legacyBucketReader.
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-loki-storage-bucket-reader-003" {
  bucket = google_storage_bucket.gcp-asia-southeast1-loki-storage-003.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Grant Tempo bucket full access to observability SA
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-tempo-storage-iam-003" {
  bucket = google_storage_bucket.gcp-asia-southeast1-tempo-storage-003.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Tempo cần `storage.buckets.get` để kiểm tra bucket tồn tại trước khi write.
# `storage.objectAdmin` chỉ cho phép thao tác object, không có bucket-level perm.
resource "google_storage_bucket_iam_member" "gcp-asia-southeast1-tempo-storage-bucket-reader-003" {
  bucket = google_storage_bucket.gcp-asia-southeast1-tempo-storage-003.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.sa-obs.email}"
}

# Import existing GCS buckets (already created in a previous partial apply)
import {
  to = google_storage_bucket.gcp-asia-southeast1-log-archive-003
  id = "gcp-apse1-log-archive-54431047904-003"
}

import {
  to = google_storage_bucket.gcp-asia-southeast1-loki-storage-003
  id = "gcp-apse1-loki-storage-54431047904-003"
}

# Import existing BigQuery dataset (already created in a previous partial apply)
import {
  to = google_bigquery_dataset.gcp-asia-southeast1-log-dataset-003
  id = "gcp-apse1-prj-hub-net-003/gcp_apse1_infra_logs_003"
}
