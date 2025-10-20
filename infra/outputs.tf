output "cloud_run_url" {
  description = "The public URL of the Cloud Run service."
  value       = google_cloud_run_v2_service.backend_service.uri
}