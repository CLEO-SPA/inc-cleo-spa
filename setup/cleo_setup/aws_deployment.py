"""
AWS deployment functionality for CLEO SPA setup.

Note: AWS CodeCommit functionality has been removed as the service 
is no longer available for new customers as of July 2024.
"""
import subprocess
import threading
import json
import os
from pathlib import Path
import tkinter as tk
from tkinter import messagebox

def run_terraform_command(app, command):
    """Run a Terraform command in a Docker container."""
    # Check if AWS credentials are configured
    env_path = Path(__file__).parent.parent.parent / "scripts" / ".aws_credentials.env"
    if not env_path.exists():
        messagebox.showerror(
            "Missing Configuration", 
            "AWS credentials not found. Please complete and save the configuration first."
        )
        return
            
    # Confirm potentially destructive operations
    if command == "apply":
        if not messagebox.askyesno(
            "Confirm Deployment", 
            "This will deploy resources to AWS and may incur costs. Continue?"
        ):
            return
    elif command == "destroy":
        if not messagebox.askyesno(
            "Confirm Destruction", 
            "This will DESTROY all resources created in AWS. This cannot be undone. Continue?"
        ):
            return
    
    # Run the command in a separate thread to avoid freezing the UI
    threading.Thread(target=_run_terraform_in_docker, args=(app, command), daemon=True).start()

def _run_terraform_in_docker(app, command):
    """Execute Terraform commands inside a Docker container."""
    from .utils import get_project_root
    
    app.log_message(f"Starting Terraform {command} operation...", "cyan")
    app.log_message("This may take several minutes. Please be patient.", "cyan")
    
    # Use extracted project path
    project_root = get_project_root()
    terraform_dir = project_root / "terraform"
    
    # Check if terraform directory exists
    if not terraform_dir.exists():
        app.log_message("Error: Terraform directory not found in extracted project files.", "red")
        return
    
    # For now, we'll still use the scripts directory from the original location for AWS credentials
    # This might need to be updated based on your specific setup
    original_project_root = Path(__file__).parent.parent.parent
    env_path = original_project_root / "scripts" / ".aws_credentials.env"
    
    # Create Docker command
    docker_cmd = [
        "docker", "run", "--rm",
        "--env-file", str(env_path),
        "-v", f"{terraform_dir}:/terraform",
        "-w", "/terraform",
        "hashicorp/terraform:latest"
    ]
    
    # Add terraform command
    if command == "init":
        docker_cmd.extend(["init"])
    elif command == "plan":
        docker_cmd.extend(["plan"])
    elif command == "apply":
        docker_cmd.extend(["apply", "-auto-approve"])
    elif command == "destroy":
        docker_cmd.extend(["destroy", "-auto-approve"])
    
    try:
        # Run the command
        app.log_message(f"Executing: {' '.join(docker_cmd)}", "cyan")
        
        # Execute command
        process = subprocess.Popen(
            docker_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Stream output to the console
        for line in iter(process.stdout.readline, ''):
            app.log_message(line.rstrip())
        
        process.stdout.close()
        return_code = process.wait()
        
        if return_code == 0:
            app.log_message(f"\nTerraform {command} completed successfully!", "green")
            
            # If this was an apply, extract and display important outputs
            if command == "apply":
                extract_and_display_outputs(app)
        else:
            app.log_message(f"\nTerraform {command} failed with return code {return_code}", "red")
            
    except Exception as e:
        app.log_message(f"Error: {str(e)}", "red")

def extract_and_display_outputs(app):
    """Extract and display Terraform outputs after successful deployment."""
    try:
        from .utils import get_project_root
        
        # Use extracted project path for terraform directory
        project_root = get_project_root()
        terraform_dir = project_root / "terraform"
        
        # For now, we'll still use the scripts directory from the original location for AWS credentials
        original_project_root = Path(__file__).parent.parent.parent
        env_path = original_project_root / "scripts" / ".aws_credentials.env"
        
        # Run terraform output -json
        docker_cmd = [
            "docker", "run", "--rm",
            "--env-file", str(env_path),
            "-v", f"{terraform_dir}:/terraform",
            "-w", "/terraform",
            "hashicorp/terraform:latest",
            "output", "-json"
        ]
        
        result = subprocess.run(docker_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            outputs = json.loads(result.stdout)
            
            # Display important outputs
            app.log_message("\n---- DEPLOYMENT INFORMATION ----", "green")
            
            if 'app_instance_public_dns' in outputs:
                public_dns = outputs['app_instance_public_dns']['value']
                app.log_message(f"Application URL: http://{public_dns}", "cyan")
            
            if 'ssh_connection_string' in outputs:
                ssh_cmd = outputs['ssh_connection_string']['value']
                app.log_message(f"SSH Connection: {ssh_cmd}", "cyan")
            
            if 'rds_database_endpoint' in outputs:
                db_endpoint = outputs['rds_database_endpoint']['value']
                app.log_message(f"Database Endpoint: {db_endpoint}", "cyan")
            
            app.log_message("\nDeployment complete! Your application should be accessible soon.", "green")
            
    except Exception as e:
        app.log_message(f"Error retrieving outputs: {str(e)}", "red")
