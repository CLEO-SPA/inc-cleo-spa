#!/usr/bin/env python3
"""
Install script for CLEO SPA Setup tool.
This script installs all required dependencies.
"""
import subprocess
import sys
import os
from pathlib import Path


def main():
    """Install all required dependencies."""
    print("Installing required dependencies for CLEO SPA Setup tool...")
    
    # Upgrade pip first
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    
    # Install required packages
    required_packages = [
        "pyinstaller",  # For building the executable
        "pillow",       # For handling icons
        "pyjwt",        # For JWT token handling
        "requests",     # For API requests
        "tkinter",      # For GUI (usually comes with Python)
        "boto3",       # For AWS integration (CodeCommit)
    ]
    
    for package in required_packages:
        print(f"Installing {package}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except subprocess.CalledProcessError:
            print(f"Failed to install {package}. Please install it manually.")
    
    # Check if tkinter is available
    try:
        import tkinter
        print("Tkinter is available.")
    except ImportError:
        print("Tkinter is not available. Please install it manually.")
        print("On Ubuntu/Debian: sudo apt-get install python3-tk")
        print("On Fedora: sudo dnf install python3-tkinter")
        print("On macOS: brew install python-tk")
    
    # Install the package itself in development mode
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        print("Installed CLEO SPA Setup tool in development mode.")
    except subprocess.CalledProcessError:
        print("Failed to install CLEO SPA Setup tool in development mode.")
    
    print("\nInstallation complete!")


if __name__ == "__main__":
    main()
