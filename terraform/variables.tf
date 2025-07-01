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

# JWT secret variables
variable "auth_jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "inv_jwt_secret" {
  description = "JWT secret for inventory"
  type        = string
  sensitive   = true
}

variable "remember_token" {
  description = "Remember token secret"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret"
  type        = string
  sensitive   = true
}

# CORS and URL variables
variable "local_frontend_url" {
  description = "Local frontend URL for CORS"
  type        = string
  default     = "http://localhost:5173"
}

variable "local_backend_url" {
  description = "Local backend URL for CORS"
  type        = string
  default     = "http://localhost:3000"
}

variable "aws_frontend_url" {
  description = "AWS frontend URL for CORS"
  type        = string
}

variable "aws_account_id" {
  description = "The AWS account ID"
  type        = string
}

variable "secret_name" {
  description = "The name of the secret containing the database credentials"
  type        = string
  default     = "cleo-spa-app/db-credentials"
}

variable "jwt_secret_name" {
  description = "The name of the secret containing JWT secrets"
  type        = string
  default     = "cleo-spa-app/jwt-secrets"
}