#!/bin/bash
# Script to import existing AWS resources into Terraform state

# Read the project name from terraform.tfvars
if grep -q 'project_name' terraform.tfvars; then
    project_name=$(grep 'project_name' terraform.tfvars | sed 's/project_name\s*=\s*"\(.*\)"/\1/')
    echo "Project name found: $project_name"
else
    echo "Could not find project_name in terraform.tfvars. Please enter it manually:"
    read project_name
fi

if [ -z "$project_name" ]; then
    echo "Project name is required. Exiting."
    exit 1
fi

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Remove any existing state for the resources that cause import conflicts
echo "Removing any existing state entries for conflicting resources..."
terraform state rm aws_secretsmanager_secret.cleo-spa-db-credentials 2>/dev/null || true
terraform state rm aws_secretsmanager_secret.cleo-spa-jwt-secrets 2>/dev/null || true

# Import ECR repositories
echo "Importing ECR repositories..."
terraform import "aws_ecr_repository.backend" "$project_name-backend"
terraform import "aws_ecr_repository.frontend" "$project_name-frontend"

# Import DB Subnet Group
echo "Importing DB Subnet Group..."
terraform import "aws_db_subnet_group.default" "$project_name-db-subnet-group"

# Import IAM role
echo "Importing IAM role..."
terraform import "aws_iam_role.ec2_ecr_access_role" "$project_name-ec2-ecr-access-role"

# Import Key Pair
echo "Importing EC2 Key Pair..."
terraform import "aws_key_pair.generated_key" "$project_name-key"

# Try to import CodeCommit repository if it exists
echo "Attempting to import CodeCommit repository..."
if ! terraform import "aws_codecommit_repository.app_repo" "$project_name-repository" 2>/dev/null; then
    echo "CodeCommit repository import failed. This is expected if the repository doesn't exist."
    echo "You can proceed with applying your Terraform configuration."
fi

# Try to import Secrets Manager secrets
echo "Attempting to import Secrets Manager secrets..."
if ! terraform import "aws_secretsmanager_secret.db_creds" "$project_name/cleo-spa-db-credentials" 2>/dev/null; then
    echo "DB credentials secret import failed. You may need to create this resource."
fi

if ! terraform import "aws_secretsmanager_secret.jwt_secrets" "$project_name/cleo-spa-jwt-secrets" 2>/dev/null; then
    echo "JWT secret import failed. You may need to create this resource."
fi

echo "Import process completed. You can now run 'terraform plan' to see what changes will be applied."
