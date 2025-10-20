# Configure the Google Provider
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Store Terraform state remotely in a GCS bucket
terraform {
  backend "gcs" {
    bucket = "wikimap-tfstate-bucket"
    prefix = "dev"
  }
}

# 1. CI/CD: Create a repository to store Docker images
resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.gcp_region
  repository_id = var.artifact_registry_repo_id
  format        = "DOCKER"
  description   = "Docker repository for the wikimap backend app"
}

# 2. BACKEND: Deploy the backend service to Cloud Run
resource "google_cloud_run_v2_service" "backend_service" {
  name     = var.cloud_run_service_name
  location = var.gcp_region

  template {
    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.backend_repo.repository_id}/${var.image_name}:latest"
    }
  }

  # Ensure the Artifact Registry repo is created before Cloud Run tries to pull from it
  depends_on = [
    google_artifact_registry_repository.backend_repo
  ]
}

# Allow unauthenticated access to the backend service
resource "google_cloud_run_v2_service_iam_member" "allow_public" {
  project  = google_cloud_run_v2_service.backend_service.project
  location = google_cloud_run_v2_service.backend_service.location
  name     = google_cloud_run_v2_service.backend_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 3. FRONTEND: Create a GCS bucket to host the static frontend
resource "google_storage_bucket" "frontend_bucket" {
  name          = var.frontend_bucket_name
  location      = "EU" # Multi-region is often better for websites
  force_destroy = true # Useful for development

  website {
    main_page_suffix = "index.html"
    # not_found_page   = "404.html"
  }
}

# Allow public read access to the frontend files
resource "google_storage_bucket_iam_member" "public_access" {
  bucket = google_storage_bucket.frontend_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}