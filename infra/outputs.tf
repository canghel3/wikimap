output "gateway_url" {
  description = "The public Gateway URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.gateway_service.uri
}

output "mediawiki_uri" {
  description = "The uri of mediawiki"
  value       = google_cloud_run_v2_service.mediawiki_service.uri
}

output "frontend_base_url" {
  description = "Public base url for frontend assets"
  value = "https://storage.googleapis.com/${google_storage_bucket.frontend_bucket.name}/"
}