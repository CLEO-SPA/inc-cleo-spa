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

variable "db_storage" {
  description = "Storage size for the RDS database in GB."
  type        = number
  default     = 10
}

variable "db_engine" {
  description = "The database engine to use for the RDS instance."
  type        = string
  default     = "postgres"
}

variable "db_version" {
  description = "The version of the database engine."
  type        = string
  default     = "postgres14"
}

variable "db_instance" {
  description = "The instance type for the RDS database."
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "The name of the database to create."
  type        = string
  default     = "cleospa"
}

variable "db_username" {
  description = "The master username for the RDS database."
  type        = string
  default     = "cleo_owner"
}

variable "db_password" {
  description = "Password for the RDS database master user."
  type        = string
  sensitive   = true
}

variable "db_skip_final_snapshot" {
  description = "Whether to skip the final snapshot when deleting the RDS instance."
  type        = bool
  default     = true
}

variable "db_publicly_accessible" {
  description = "Whether the RDS instance should be publicly accessible."
  type        = bool
  default     = false
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

variable "aws_account_id" {
  description = "The AWS account ID"
  type        = string
}

variable "secret_name" {
  description = "The name of the secret containing the database credentials"
  type        = string
  default     = "cleo-spa-app/cleo-spa-db-credentials"
}

variable "jwt_secret_name" {
  description = "The name of the secret containing JWT secrets"
  type        = string
  default     = "cleo-spa-app/cleo-spa-jwt-secrets"
}

variable "key_name" {
  description = "The key pair name for SSH access to the EC2 instance"
  type        = string
  default     = "cleo-spa-key"
}