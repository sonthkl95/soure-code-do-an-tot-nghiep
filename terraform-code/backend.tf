# GCS backend — state stored in hub-net project bucket
# Run setup-gcp.sh first to create the bucket before terraform init
terraform {
  backend "gcs" {
    bucket = "gcp-apse1-tf-state-54431047904"
    prefix = "terraform/state"
  }
}
