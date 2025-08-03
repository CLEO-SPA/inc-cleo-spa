"""
Utility functions for CLEO SPA setup tool.
"""
import os
import sys
import subprocess
import tkinter as tk
from tkinter import messagebox
from pathlib import Path
import importlib.resources as pkg_resources

def check_docker(root=None):
    """Check if Docker is installed and running."""
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True, text=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        if root:
            messagebox.showerror(
                "Docker Not Found", 
                "Docker is required but not found on your system. Please install Docker and try again."
            )
            root.after(2000, root.destroy)
        return False

def log_message(console, message, color="white"):
    """Log a message to a scrolledtext console widget."""
    if console:
        console.config(state=tk.NORMAL)
        console.insert(tk.END, message + "\n", color)
        console.see(tk.END)
        console.config(state=tk.DISABLED)
    else:
        print(message)

def get_resource_path(resource_name):
    """
    Get the path to a resource file bundled with the executable.
    If running from source, it will look for the file in the normal project structure.
    If running from exe, it will extract the file from the bundled resources.
    
    Args:
        resource_name: Name of the resource file (e.g., "terraform.tfvars.template")
        
    Returns:
        Path to the resource file
    """
    # Determine if we're running as a script or frozen executable
    if getattr(sys, 'frozen', False):
        # Running as executable
        base_path = Path(sys._MEIPASS) / "cleo_setup" / "resources"
        return base_path / resource_name
    else:
        # Running as script, check if the file exists in the cleo_setup/resources directory
        try:
            # Try to use importlib.resources for Python 3.7+
            with pkg_resources.path('cleo_setup.resources', resource_name) as resource_path:
                return resource_path
        except (ImportError, ModuleNotFoundError):
            # Fall back to direct path
            base_path = Path(__file__).parent / "resources"
            if (base_path / resource_name).exists():
                return base_path / resource_name
            
            # If not found in resources, try to find it in the project directory
            project_root = Path(__file__).parent.parent.parent
            
            # Check common locations
            if resource_name == "terraform.tfvars.template":
                # Look for terraform.tfvars
                possible_paths = [
                    project_root / "terraform" / "terraform.tfvars",
                    project_root / "terraform" / "terraform.tfvars.template"
                ]
            elif resource_name == "compose.yml.template":
                possible_paths = [
                    project_root / "compose.yml",
                    project_root / "docker-compose.yml"
                ]
            elif resource_name == "server.env.template":
                possible_paths = [
                    project_root / "server" / ".env.template",
                    project_root / "server" / ".env.example",
                    project_root / "server" / ".env"
                ]
            else:
                # Generic search
                possible_paths = [
                    project_root / resource_name,
                    project_root / f"{resource_name}.template",
                    project_root / f"{resource_name}.example"
                ]
                
            # Try to find the file in possible locations
            for path in possible_paths:
                if path.exists():
                    return path
                    
            # If we got here, we couldn't find the file
            # Create a resource directory if it doesn't exist
            base_path.mkdir(exist_ok=True, parents=True)
            
            # Return the path where the file should be, even if it doesn't exist yet
            return base_path / resource_name

def get_project_root():
    """
    Get the project root directory.
    First checks for installed project files, then falls back to development mode.
    
    Returns:
        Path object pointing to the project root
    """
    # Check if we have an installed project path
    project_path = os.environ.get('CLEO_SPA_PROJECT_PATH')
    if project_path and Path(project_path).exists():
        return Path(project_path)
    
    # Check for installation in common locations
    possible_locations = [
        Path.home() / "CLEO-SPA",
        Path.home() / "Documents" / "CLEO-SPA",
    ]
    
    if sys.platform == "win32":
        possible_locations.append(Path("C:/Program Files/CLEO-SPA"))
    elif sys.platform.startswith("linux"):
        possible_locations.append(Path("/opt/cleo-spa"))
    elif sys.platform == "darwin":
        possible_locations.append(Path("/Applications/CLEO-SPA"))
    
    for location in possible_locations:
        if location.exists():
            config_file = location / ".cleo-setup" / "config.json"
            if config_file.exists():
                return location
    
    if getattr(sys, 'frozen', False):
        # Running as executable but no installation found
        # Use a folder in the user's documents for the project files
        user_docs = Path.home() / "Documents" / "CLEO-SPA"
        user_docs.mkdir(exist_ok=True, parents=True)
        return user_docs
    else:
        # Running as script - development mode
        return Path(__file__).parent.parent.parent
