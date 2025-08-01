"""
Cross-platform utilities for CLEO SPA setup tool.
This file contains utility functions that work across different platforms.
"""
import os
import sys
import tkinter as tk
from pathlib import Path

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
        if hasattr(sys, '_MEIPASS'):
            # PyInstaller
            base_path = Path(sys._MEIPASS) / "cleo_setup" / "resources"
        else:
            # Other freezers might use different approaches
            base_path = Path(os.path.dirname(sys.executable)) / "cleo_setup" / "resources"
        return base_path / resource_name
    else:
        # Running as script, check if the file exists in the cleo_setup/resources directory
        base_path = Path(__file__).parent / "resources"
        if (base_path / resource_name).exists():
            return base_path / resource_name
        
        # If not found in resources, try to find it in the project directory
        project_root = Path(__file__).parent.parent
        
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
    If running from exe, will create a temp directory for the project files.
    
    Returns:
        Path object pointing to the project root
    """
    if getattr(sys, 'frozen', False):
        # Running as executable
        # Use a folder in the user's documents for the project files
        if sys.platform == "win32":
            user_docs = Path.home() / "Documents" / "CLEO-SPA"
        elif sys.platform == "darwin":
            user_docs = Path.home() / "Documents" / "CLEO-SPA"
        else:
            # Linux
            user_docs = Path.home() / "CLEO-SPA"
        
        user_docs.mkdir(exist_ok=True, parents=True)
        return user_docs
    else:
        # Running as script
        return Path(__file__).parent.parent

def get_platform_name():
    """Get the current platform name in a user-friendly format."""
    platform_mapping = {
        "win32": "Windows",
        "darwin": "macOS",
        "linux": "Linux"
    }
    return platform_mapping.get(sys.platform, sys.platform)
