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

# EC2 Instance outputs
output "ecs_instance_id" {
  description = "The ID of the EC2 instance running ECS"
  value       = aws_instance.ecs_instance.id
}

output "ecs_instance_public_ip" {
  description = "The public IP of the EC2 instance"
  value       = aws_instance.ecs_instance.public_ip
}

output "ecs_instance_public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = aws_instance.ecs_instance.public_dns
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

# Security group outputs
output "ecs_security_group_id" {
  description = "The ID of the ECS security group"
  value       = aws_security_group.ecs_sg.id
}

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds_sg.id
}

# ECS task and service outputs
output "ecs_task_definition_arn" {
  description = "The ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.main.name
}

# Connection strings
output "ssh_connection_string" {
  description = "SSH command to connect to the EC2 instance (if key_name was provided)"
  value       = var.key_name != "" ? "ssh -i ${var.key_name}.pem ec2-user@${aws_instance.ecs_instance.public_dns}" : "No SSH key specified"
}

output "application_url" {
  description = "The URL to access the application"
  value       = "http://${aws_instance.ecs_instance.public_dns}"
}