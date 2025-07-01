output "backend_ecr_repository_url" {
  description = "The URL of the backend ECR repository."
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "The URL of the frontend ECR repository."
  value       = aws_ecr_repository.frontend.repository_url
}

output "rds_database_endpoint" {
  description = "The endpoint of the RDS database instance."
  value       = aws_db_instance.default.address
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster."
  value       = aws_ecs_cluster.main.name
}

output "db_credentials_secret_arn" {
  description = "The ARN of the secret containing the database credentials."
  value       = aws_secretsmanager_secret.db_creds.arn
}

output "secret_arn_prefix" {
  description = "The prefix for the secret ARN used in the ECS task definition."
  value       = "${aws_secretsmanager_secret.db_creds.arn}:"
}

output "jwt_secret_arn_prefix" {
  description = "The prefix for the JWT secrets ARN used in the ECS task definition."
  value       = "${aws_secretsmanager_secret.jwt_secrets.arn}:"
}