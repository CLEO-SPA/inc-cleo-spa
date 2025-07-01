variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "A name for the project to prefix resources."
  type        = string
  default     = "cleo-spa-app"
}

variable "db_password" {
  description = "Password for the RDS database master user."
  type        = string
  sensitive   = true
}

variable "backend_image_uri" {
  description = "The URI of the backend Docker image in ECR."
  type        = string
}

variable "frontend_image_uri" {
  description = "The URI of the frontend Docker image in ECR."
  type        = string
}