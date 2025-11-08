output "gateway_url" {
  description = "The public Gateway URL of the Cloud Run service."
  value       = google_cloud_run_v2_service.gateway_service.uri
}