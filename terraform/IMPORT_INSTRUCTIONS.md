# Instructions for Importing Existing AWS Resources

Before applying your Terraform configuration, follow these steps to import existing AWS resources:

## For Windows Users:

1. Open PowerShell in the terraform directory
2. Run the import script:
   ```
   .\import_resources.ps1
   ```

## For Linux/macOS Users:

1. Open a terminal in the terraform directory
2. Make the script executable and run it:
   ```
   chmod +x import_resources.sh
   ./import_resources.sh
   ```

## After Importing

Once the import is complete:

1. Run `terraform plan` to see what changes will be made
2. Run `terraform apply` to apply the changes

## Troubleshooting

If you encounter errors during import:

1. For resources that already exist but fail to import, check that the resource names match exactly
2. For CodeCommit repository errors, you may need to remove or comment out the CodeCommit-related resources if your AWS account doesn't support CodeCommit

## Note About Secrets

If your Secrets Manager secrets have different names than expected, modify the import commands in the script with the correct names before running.
