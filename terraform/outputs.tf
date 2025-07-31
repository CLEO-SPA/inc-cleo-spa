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

output "db_credentials_secret_arn" {
  description = "The ARN of the secret containing the database credentials."
  value       = aws_secretsmanager_secret.db_creds.arn
}

output "jwt_secrets_secret_arn" {
  description = "The ARN of the secret containing JWT secrets."
  value       = aws_secretsmanager_secret.jwt_secrets.arn
}

# EC2 Instance outputs
output "app_instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.app_instance.id
}

output "app_instance_public_ip" {
  description = "The public IP of the EC2 instance"
  value       = aws_instance.app_instance.public_ip
}

output "app_instance_public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = aws_instance.app_instance.public_dns
}

# Network outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

# Connection strings
output "ssh_connection_string" {
  description = "SSH command to connect to the EC2 instance"
  value       = "ssh -i ${var.project_name}-key.pem ec2-user@${aws_instance.app_instance.public_dns}"
}

output "application_url" {
  description = "The URL to access the application"
  value       = "http://${aws_instance.app_instance.public_dns}"
}

output "codecommit_clone_url_http" {
  description = "The HTTP clone URL of the repository"
  value       = aws_codecommit_repository.app_repo.clone_url_http
}

output "codecommit_clone_url_ssh" {
  description = "The SSH clone URL of the repository"
  value       = aws_codecommit_repository.app_repo.clone_url_ssh
}