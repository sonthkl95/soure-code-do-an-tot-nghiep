# =============================================================
# Artifact Registry — central Docker repo cho 9 microservice
# Đặt ở project sh-access (project trung tâm, đã có bastion + ít workload).
# Cả 2 cluster Dev/Prod đều pull image qua VM service account
# (sa-dev-env / sa-prd-env) đã có scope cloud-platform.
# =============================================================

# Repo Docker format, region asia-southeast1 (cùng region với cluster → free egress)
resource "google_artifact_registry_repository" "gcp-asia-southeast1-gar-techshop-003" {
  provider      = google
  project       = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  location      = "asia-southeast1"
  repository_id = "techshop"
  format        = "DOCKER"
  description   = "Tech-shop microservice container images (9 services)"

  docker_config {
    immutable_tags = false
  }

  depends_on = [google_project_service.gcp-apse1-apis-sh-access-003]
}

# ── IAM: dev-env SA có quyền pull image (kubelet trên k8s-dev-worker dùng SA này)
resource "google_artifact_registry_repository_iam_member" "gar-techshop-reader-dev" {
  project    = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  location   = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.location
  repository = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.sa-dev-env.email}"
}

# ── IAM: prd-env SA có quyền pull image (kubelet trên k8s-prod-worker dùng SA này)
resource "google_artifact_registry_repository_iam_member" "gar-techshop-reader-prd" {
  project    = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  location   = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.location
  repository = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.sa-prd-env.email}"
}

# ── IAM: user (developer) có quyền push image qua gcloud / docker
resource "google_artifact_registry_repository_iam_member" "gar-techshop-writer-user" {
  project    = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  location   = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.location
  repository = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.name
  role       = "roles/artifactregistry.writer"
  member     = "user:${var.user_email}"
}

# ── IAM: Cloud Build SA (mặc định <project-number>@cloudbuild.gserviceaccount.com)
#    có quyền push khi build qua `gcloud builds submit`
data "google_project" "sh-access-project-info" {
  project_id = data.google_project.gcp-apse1-prj-sh-access-003.project_id
}

resource "google_artifact_registry_repository_iam_member" "gar-techshop-writer-cloudbuild" {
  project    = data.google_project.gcp-apse1-prj-sh-access-003.project_id
  location   = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.location
  repository = google_artifact_registry_repository.gcp-asia-southeast1-gar-techshop-003.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${data.google_project.sh-access-project-info.number}@cloudbuild.gserviceaccount.com"

  depends_on = [google_project_service.gcp-apse1-apis-sh-access-003]
}

# ── Output: registry URL để dùng trong kustomization + docker tag
output "artifact_registry_url" {
  description = "Base URL của Docker Artifact Registry (push: docker tag <image> <url>/<service>:<tag>)"
  value       = "asia-southeast1-docker.pkg.dev/${data.google_project.gcp-apse1-prj-sh-access-003.project_id}/techshop"
}
