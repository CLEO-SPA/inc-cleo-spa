#!/usr/bin/env pwsh
# Script to import existing AWS resources into Terraform state

# Read the project name from terraform.tfvars
$tfvarsContent = Get-Content -Path "terraform.tfvars" -Raw
$projectName = ""
if ($tfvarsContent -match 'project_name\s*=\s*"([^"]+)"') {
    $projectName = $matches[1]
    Write-Host "Project name found: $projectName"
} else {
    Write-Host "Could not find project_name in terraform.tfvars. Please enter it manually:"
    $projectName = Read-Host
}

if ([string]::IsNullOrEmpty($projectName)) {
    Write-Host "Project name is required. Exiting."
    exit 1
}

# Initialize Terraform
Write-Host "Initializing Terraform..."
terraform init

# Remove any existing state for the resources that cause import conflicts
Write-Host "Removing any existing state entries for conflicting resources..."
terraform state rm aws_secretsmanager_secret.cleo-spa-db-credentials 2>$null
terraform state rm aws_secretsmanager_secret.cleo-spa-jwt-secrets 2>$null

# Import ECR repositories
Write-Host "Importing ECR repositories..."
terraform import "aws_ecr_repository.backend" "$projectName-backend"
terraform import "aws_ecr_repository.frontend" "$projectName-frontend"

# Import DB Subnet Group
Write-Host "Importing DB Subnet Group..."
terraform import "aws_db_subnet_group.default" "$projectName-db-subnet-group"

# Import IAM role
Write-Host "Importing IAM role..."
terraform import "aws_iam_role.ec2_ecr_access_role" "$projectName-ec2-ecr-access-role"

# Import Key Pair
Write-Host "Importing EC2 Key Pair..."
terraform import "aws_key_pair.generated_key" "$projectName-key"

# Try to import CodeCommit repository if it exists
Write-Host "Attempting to import CodeCommit repository..."
$repoImport = terraform import "aws_codecommit_repository.app_repo" "$projectName-repository" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "CodeCommit repository import failed. This is expected if the repository doesn't exist."
    Write-Host "You can proceed with applying your Terraform configuration."
}

# Try to import Secrets Manager secrets
Write-Host "Attempting to import Secrets Manager secrets..."
$secretImport = terraform import "aws_secretsmanager_secret.db_creds" "$projectName/cleo-spa-db-credentials" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "DB credentials secret import failed. You may need to create this resource."
}

$jwtSecretImport = terraform import "aws_secretsmanager_secret.jwt_secrets" "$projectName/cleo-spa-jwt-secrets" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "JWT secret import failed. You may need to create this resource."
}

Write-Host "Import process completed. You can now run 'terraform plan' to see what changes will be applied."
