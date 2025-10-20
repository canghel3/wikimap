variable "gcp_project_id" {
  type        = string
}

variable "gcp_region" {
  type        = string
  default     = "europe-west4"
}

variable "artifact_registry_repo_id" {
  type        = string
}

variable "cloud_run_service_name" {
  type        = string
}

variable "frontend_bucket_name" {
  type        = string
}

variable "image_name" {
  type        = string
}