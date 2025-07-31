#!/bin/bash
# Script to apply Terraform configuration in a targeted order

echo "Running targeted Terraform apply to handle potential dependency issues..."

# First, run state remove for any resources that might conflict
echo "Removing any conflicting resources from state..."
terraform state rm aws_secretsmanager_secret.db_creds 2>/dev/null || true
terraform state rm aws_secretsmanager_secret.jwt_secrets 2>/dev/null || true

# Run terraform plan with output to a file
echo "Running terraform plan..."
terraform plan -out=tfplan

# Apply the plan
echo "Applying terraform plan..."
terraform apply tfplan

echo "Terraform apply completed."
