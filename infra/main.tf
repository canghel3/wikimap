provider "google" {
  project = var.GCP_PROJECT_ID
  region  = var.GCP_REGION
}

terraform {
  backend "gcs" {
    bucket = "wikimap-tfstate-bucket"
    prefix = "dev"
  }
}

resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.GCP_REGION
  repository_id = var.REPOSITORY_NAME
  format        = "DOCKER"
  description   = "Docker repository for the wikimap backend app"
}

resource "google_cloud_run_v2_service" "gateway_service" {
  name     = "gateway"
  location = var.GCP_REGION

  template {
    containers {
      image = "${var.GCP_REGION}-docker.pkg.dev/${var.GCP_PROJECT_ID}/${google_artifact_registry_repository.backend_repo.repository_id}/${var.IMAGE_NAME}-gateway:${var.TAG}"

      env {
        name = "GATEWAY_SERVICES_MEDIAWIKI_URL"
        value = google_cloud_run_v2_service.mediawiki_service.uri
      }
    }

    service_account = google_service_account.gateway_sa.email
  }

  depends_on = [
    google_artifact_registry_repository.backend_repo,
    google_cloud_run_v2_service.mediawiki_service,
    google_service_account.gateway_sa
  ]
}

resource "google_cloud_run_v2_service" "mediawiki_service" {
  location = var.GCP_REGION
  name     = "mediawiki"

  template {
    containers {
      image = "${var.GCP_REGION}-docker.pkg.dev/${var.GCP_PROJECT_ID}/${google_artifact_registry_repository.backend_repo.repository_id}/${var.IMAGE_NAME}-mediawiki:${var.TAG}"
    }
  }

  depends_on = [
    google_artifact_registry_repository.backend_repo
  ]
}

resource "google_service_account" "gateway_sa" {
  account_id   = "gateway-sa"
  display_name = "Service Account for the Gateway Cloud Run Service"
}

# allow public access to the gateway service
resource "google_cloud_run_v2_service_iam_member" "allow_public_gateway" {
  project  = google_cloud_run_v2_service.gateway_service.project
  location = google_cloud_run_v2_service.gateway_service.location
  name     = google_cloud_run_v2_service.gateway_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "allow_gateway_to_invoke_mediawiki" {
  project  = google_cloud_run_v2_service.mediawiki_service.project
  location = google_cloud_run_v2_service.mediawiki_service.location
  name     = google_cloud_run_v2_service.mediawiki_service.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.gateway_sa.email}"
}


resource "google_storage_bucket" "frontend_bucket" {
  name          = var.FRONTEND_BUCKET_NAME
  location      = var.GCP_REGION
  force_destroy = true # Useful for development

  website {
    main_page_suffix = "index.html"
    # not_found_page   = "404.html"
  }
}

# allow public read access to the frontend files
resource "google_storage_bucket_iam_member" "public_access" {
  bucket = google_storage_bucket.frontend_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}