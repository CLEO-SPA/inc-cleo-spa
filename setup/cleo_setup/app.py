#!/usr/bin/env python3
"""
Main application module containing the DeploymentApp class.
"""
import os
import sys
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, scrolledtext
import threading
import re
import json
from pathlib import Path
import secrets
import string

from .aws_deployment import run_terraform_command, extract_and_display_outputs
from .local_development import setup_local_dev_tab, update_docker_compose_config, run_docker_compose_command
from .super_admin import setup_super_admin_tab
from .utils import check_docker, log_message


class DeploymentApp:
    """Main application class for CLEO SPA setup tool."""
    
    def __init__(self, root):
        """Initialize the application."""
        self.root = root
        self.root.title("CLEO SPA SETUP")
        self.root.geometry("900x600")
        self.root.resizable(True, True)

        # AWS credentials
        self.aws_access_key = tk.StringVar()
        self.aws_secret_key = tk.StringVar()
        self.aws_region = tk.StringVar(value="ap-southeast-1")  # Default to Singapore
        self.aws_account_id = tk.StringVar()
        
        # DB and JWT secrets
        self.db_password = tk.StringVar()
        self.auth_jwt_secret = tk.StringVar()
        self.inv_jwt_secret = tk.StringVar()
        self.remember_token = tk.StringVar(value="rmb-token")  # Default
        self.session_secret = tk.StringVar()
        
        # Local development settings
        self.local_db_user = tk.StringVar(value="user")
        self.local_db_password = tk.StringVar(value="password")
        self.local_db_name = tk.StringVar(value="my_db")
        self.local_sim_db_name = tk.StringVar(value="sim_db")
        self.backend_port = tk.StringVar(value="3000")
        self.frontend_port = tk.StringVar(value="5173")
        self.db_port = tk.StringVar(value="5432")
        self.sim_db_port = tk.StringVar(value="5433")
        
        # Project settings
        self.project_name = tk.StringVar(value="cleo-spa-app")  # Default
        
        # Console output references
        self.console = None
        self.local_console = None
        
        # Create the UI
        self.create_notebook()
        
        # Check if Docker is installed
        self.check_docker()
    
    def check_docker(self):
        """Check if Docker is installed and running."""
        return check_docker(self.root)

    def create_notebook(self):
        """Create the tabbed interface."""
        # Create a notebook with tabs
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Add tabs
        credentials_frame = ttk.Frame(notebook)
        deployment_frame = ttk.Frame(notebook)
        local_dev_frame = ttk.Frame(notebook)
        super_admin_frame = ttk.Frame(notebook)
        
        notebook.add(credentials_frame, text="AWS Configuration")
        notebook.add(deployment_frame, text="AWS Deployment")
        notebook.add(local_dev_frame, text="Local Development")
        notebook.add(super_admin_frame, text="Super Admin Setup")
        
        # Setup credentials tab
        self.setup_credentials_tab(credentials_frame)
        
        # Setup deployment tab
        self.setup_deployment_tab(deployment_frame)
        
        # Setup local development tab
        setup_local_dev_tab(self, local_dev_frame)
        
        # Setup super admin tab
        setup_super_admin_tab(super_admin_frame, self)

    def setup_credentials_tab(self, parent):
        """Set up the AWS credentials tab."""
        # Create a frame with padding
        frame = ttk.Frame(parent, padding="10")
        frame.pack(fill=tk.BOTH, expand=True)
        
        # AWS Credentials section
        ttk.Label(frame, text="AWS Credentials", font=("Arial", 14, "bold")).grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=(0, 10))
        
        ttk.Label(frame, text="AWS Access Key:").grid(row=1, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.aws_access_key, width=50).grid(row=1, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="AWS Secret Key:").grid(row=2, column=0, sticky=tk.W, pady=5)
        secret_entry = ttk.Entry(frame, textvariable=self.aws_secret_key, width=50, show="*")
        secret_entry.grid(row=2, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="AWS Region:").grid(row=3, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.aws_region, width=50).grid(row=3, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="AWS Account ID:").grid(row=4, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.aws_account_id, width=50).grid(row=4, column=1, sticky=tk.W, pady=5)
        
        # Database and JWT section
        ttk.Label(frame, text="Database and JWT Configuration", font=("Arial", 14, "bold")).grid(row=5, column=0, columnspan=2, sticky=tk.W, pady=(20, 10))
        
        ttk.Label(frame, text="Database Password:").grid(row=6, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.db_password, width=50, show="*").grid(row=6, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="Auth JWT Secret:").grid(row=7, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.auth_jwt_secret, width=50).grid(row=7, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="Inv JWT Secret:").grid(row=8, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.inv_jwt_secret, width=50).grid(row=8, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="Remember Token:").grid(row=9, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.remember_token, width=50).grid(row=9, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="Session Secret:").grid(row=10, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.session_secret, width=50).grid(row=10, column=1, sticky=tk.W, pady=5)
        
        # Project settings
        ttk.Label(frame, text="Project Settings", font=("Arial", 14, "bold")).grid(row=11, column=0, columnspan=2, sticky=tk.W, pady=(20, 10))
        
        ttk.Label(frame, text="Project Name:").grid(row=12, column=0, sticky=tk.W, pady=5)
        ttk.Entry(frame, textvariable=self.project_name, width=50).grid(row=12, column=1, sticky=tk.W, pady=5)
        
        # Generate random secrets button
        ttk.Button(frame, text="Generate Random Secrets", command=self.generate_random_secrets).grid(row=13, column=0, pady=20)
        
        # Save configuration button
        ttk.Button(frame, text="Save Configuration", command=self.save_configuration).grid(row=13, column=1, pady=20)

    def setup_deployment_tab(self, parent):
        """Set up the AWS deployment tab."""
        # Create a frame with padding
        frame = ttk.Frame(parent, padding="10")
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Add explanation text
        explanation = ttk.Label(
            frame, 
            text="This tool will deploy CLEO SPA to AWS using Terraform inside a Docker container.\n"
                 "Make sure you have completed the AWS Configuration tab before proceeding.",
            wraplength=850,
            justify=tk.LEFT
        )
        explanation.pack(fill=tk.X, pady=(0, 10))
        
        # Add action buttons
        button_frame = ttk.Frame(frame)
        button_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(
            button_frame, 
            text="Initialize Terraform", 
            command=lambda: run_terraform_command(self, "init")
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(
            button_frame, 
            text="Plan Deployment", 
            command=lambda: run_terraform_command(self, "plan")
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(
            button_frame, 
            text="Apply Deployment", 
            command=lambda: run_terraform_command(self, "apply")
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(
            button_frame, 
            text="Destroy Infrastructure", 
            command=lambda: run_terraform_command(self, "destroy")
        ).pack(side=tk.LEFT, padx=5)
        
        # Add output console
        console_frame = ttk.LabelFrame(frame, text="Deployment Console")
        console_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        self.console = scrolledtext.ScrolledText(console_frame, wrap=tk.WORD, bg="black", fg="white", font=("Consolas", 10))
        self.console.pack(fill=tk.BOTH, expand=True)
        self.console.config(state=tk.DISABLED)

    def generate_random_secrets(self):
        """Generate random secure secrets for JWT and database."""
        def generate_secret(length=32):
            alphabet = string.ascii_letters + string.digits
            return ''.join(secrets.choice(alphabet) for _ in range(length))

        # Generate random secrets
        self.db_password.set(generate_secret(16))
        self.auth_jwt_secret.set(generate_secret(32))
        self.inv_jwt_secret.set(generate_secret(32))
        self.session_secret.set(generate_secret(32))
        
        messagebox.showinfo("Success", "Random secrets have been generated!")

    def save_configuration(self):
        """Save the configuration to terraform.tfvars and .env files."""
        # Validate required fields
        required_fields = {
            "AWS Access Key": self.aws_access_key.get(),
            "AWS Secret Key": self.aws_secret_key.get(),
            "AWS Region": self.aws_region.get(),
            "AWS Account ID": self.aws_account_id.get(),
            "Database Password": self.db_password.get(),
            "Auth JWT Secret": self.auth_jwt_secret.get(),
            "Inv JWT Secret": self.inv_jwt_secret.get(),
            "Session Secret": self.session_secret.get()
        }
        
        missing_fields = [field for field, value in required_fields.items() if not value]
        
        if missing_fields:
            messagebox.showerror(
                "Missing Fields", 
                f"Please fill in the following required fields: {', '.join(missing_fields)}"
            )
            return
        
        try:
            # Update terraform.tfvars
            terraform_dir = Path(__file__).parent.parent.parent / "terraform"
            tfvars_path = terraform_dir / "terraform.tfvars"
            
            # Replace placeholders with actual values
            tfvars_content = f"""aws_region         = "{self.aws_region.get()}"
aws_account_id     = "{self.aws_account_id.get()}"
frontend_image_uri = "{self.aws_account_id.get()}.dkr.ecr.{self.aws_region.get()}.amazonaws.com/cleo-spa-app-frontend:latest"
backend_image_uri  = "{self.aws_account_id.get()}.dkr.ecr.{self.aws_region.get()}.amazonaws.com/cleo-spa-app-backend:latest"
secret_name        = "cleo-spa-db-credentials"
jwt_secret_name    = "cleo-spa-jwt-secrets"

# Database credentials
db_password        = "{self.db_password.get()}"

# JWT secrets
auth_jwt_secret    = "{self.auth_jwt_secret.get()}" 
inv_jwt_secret     = "{self.inv_jwt_secret.get()}"
remember_token     = "{self.remember_token.get()}"
session_secret     = "{self.session_secret.get()}"

# SSH key name
key_name           = "cleo-spa-key"

# Project name
project_name       = "{self.project_name.get()}"
"""
            
            # Write the updated content
            with open(tfvars_path, 'w') as f:
                f.write(tfvars_content)
                
            # Create a .env file for AWS credentials
            env_path = Path(__file__).parent.parent.parent / "scripts" / ".aws_credentials.env"
            with open(env_path, 'w') as f:
                f.write(f"AWS_ACCESS_KEY_ID={self.aws_access_key.get()}\n")
                f.write(f"AWS_SECRET_ACCESS_KEY={self.aws_secret_key.get()}\n")
                f.write(f"AWS_DEFAULT_REGION={self.aws_region.get()}\n")
            
            messagebox.showinfo(
                "Success", 
                "Configuration has been saved successfully!\n"
                "You can now proceed to the Deployment tab to deploy your application."
            )
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save configuration: {str(e)}")

    def log_message(self, message, color="white"):
        """Log a message to the AWS deployment console."""
        log_message(self.console, message, color)

    def log_local_message(self, message, color="white"):
        """Log a message to the local development console."""
        log_message(self.local_console, message, color)
    
    def log_su_message(self, message, color="white"):
        """Log a message to the super admin setup console."""
        log_message(self.su_console, message, color)

def main():
    """
    Main entry point for the application.
    Creates and runs the CLEO SPA Setup tool.
    """
    # Check Python version
    if sys.version_info < (3, 6):
        print("This script requires Python 3.6 or higher")
        sys.exit(1)
        
    # Start the GUI
    root = tk.Tk()
    app = DeploymentApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()