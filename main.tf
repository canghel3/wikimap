# Configure the Google Provider
provider "google" {
  project = "wikimap-475508"
  region  = "europe-west4"
}

#Store Terraform state remotely in a GCS bucket
terraform {
  backend "gcs" {
    bucket = "wikimap-tfstate-bucket" # MUST be created manually first or via a separate script
    prefix = "prod"
  }
}

# 2. CI/CD: Create a repository to store Docker images
resource "google_artifact_registry_repository" "backend_repo" {
  location      = "europe-west4"
  repository_id = "my-backend-app-repo"
  format        = "DOCKER"
  description   = "Docker repository for my backend app"
}

# 3. BACKEND: Deploy the backend service to Cloud Run
resource "google_cloud_run_v2_service" "backend_service" {
  name     = "my-backend-service"
  location = "europe-west4"

  template {
    containers {
      # The image URL will be updated by the CI/CD pipeline
      image = "europe-west4-docker.pkg.dev/your-gcp-project-id/my-backend-app-repo/my-backend-image:latest"
    }
  }
}

# Allow unauthenticated access to the backend service
resource "google_cloud_run_v2_service_iam_member" "allow_public" {
  project  = google_cloud_run_v2_service.backend_service.project
  location = google_cloud_run_v2_service.backend_service.location
  name     = google_cloud_run_v2_service.backend_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}


# 4. FRONTEND: Create a GCS bucket to host the static frontend
resource "google_storage_bucket" "frontend_bucket" {
  name          = "your-unique-frontend-bucket-name"
  location      = "US"
  force_destroy = true # Useful for development

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

# Allow public read access to the frontend files
resource "google_storage_bucket_iam_member" "public_access" {
  bucket = google_storage_bucket.frontend_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}