group "default" {
  targets = ["gateway", "mediawiki"]
}

variable "REPO_URL" {}

variable "IMAGE_NAME" {}

variable "TAG" {}

target "gateway" {
  target = "gateway"
  tags = ["${REPO_URL}/${IMAGE_NAME}-gateway:${TAG}"]
}

target "mediawiki" {
  target = "mediawiki"
  tags = ["${REPO_URL}/${IMAGE_NAME}-mediawiki:${TAG}"]
}