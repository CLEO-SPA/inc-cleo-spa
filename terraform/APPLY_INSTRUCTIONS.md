# Terraform Apply Instructions

The import script has successfully imported several resources, but we're encountering some challenges with the CodeCommit repository and Secrets Manager secrets. Here's how to resolve these issues:

## Steps to Complete the Infrastructure Setup

1. **First, reset the state for problematic resources**:

   ```bash
   terraform state rm aws_secretsmanager_secret.db_creds
   terraform state rm aws_secretsmanager_secret.jwt_secrets
   ```

2. **Now run a targeted apply for the VPC and basic networking**:

   ```bash
   terraform apply -target=aws_vpc.main -target=aws_subnet.public_1 -target=aws_subnet.public_2 -target=aws_internet_gateway.gw
   ```

3. **Apply the security groups**:

   ```bash
   terraform apply -target=aws_security_group.app_sg -target=aws_security_group.rds_sg $([ "$db_publicly_accessible" = "true" ] && echo "-target=aws_security_group.rds_public_sg")
   ```

   For PowerShell:

   ```powershell
   terraform apply -target=aws_security_group.app_sg -target=aws_security_group.rds_sg $(if ($env:db_publicly_accessible -eq "true") { "-target=aws_security_group.rds_public_sg" })
   ```

4. **Apply ECR repositories**:

   ```bash
   terraform apply -target=aws_ecr_repository.backend -target=aws_ecr_repository.frontend
   ```

5. **Apply RDS components**:

   ```bash
   terraform apply -target=aws_db_subnet_group.default -target=aws_db_parameter_group.postgres_params -target=aws_db_instance.default
   ```

6. **Apply IAM roles and instance profile**:

   ```bash
   terraform apply -target=aws_iam_role.ec2_ecr_access_role -target=aws_iam_role_policy.ecr_access_policy -target=aws_iam_instance_profile.ec2_ecr_access_profile
   ```

7. **Apply key pair**:

   ```bash
   terraform apply -target=aws_key_pair.generated_key
   ```

8. **Apply the instance**:

   ```bash
   terraform apply -target=aws_instance.app_instance
   ```

9. **Apply remaining resources including Secrets Manager**:

   ```bash
   terraform apply -target=aws_secretsmanager_secret.db_creds -target=aws_secretsmanager_secret.jwt_secrets
   ```

10. **Apply all remaining resources**:
    ```bash
    terraform apply
    ```

## Handling CodeCommit Issues

If you encounter errors with CodeCommit indicating the service isn't available in your region:

1. Comment out the CodeCommit repository, pipeline, and related resources in the Terraform configuration
2. Run `terraform apply` again

## Reusing Secret Values

If you need to reuse the exact values from your existing secrets:

1. Get the current values:

   ```bash
   aws secretsmanager get-secret-value --secret-id "cleo-spa-app/db1" --query SecretString --output text
   aws secretsmanager get-secret-value --secret-id "cleo-spa-app/jwt1" --query SecretString --output text
   ```

2. Update your variables file with these values
3. Run the final `terraform apply`
