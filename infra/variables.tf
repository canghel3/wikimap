variable "GCP_PROJECT_ID" {
  type        = string
}

variable "GCP_REGION" {
  type        = string
  default     = "europe-west4"
}

variable "REPOSITORY_NAME" {
  type        = string
}

variable "FRONTEND_BUCKET_NAME" {
  type        = string
}

variable "IMAGE_NAME" {
  type        = string
}

variable "TAG" {
  type = string
}