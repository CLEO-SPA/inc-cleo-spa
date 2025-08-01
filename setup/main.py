#!/usr/bin/env python3
"""
Main entry point for CLEO SPA setup tool.
Self-extracting installer that embeds all project files.
"""
import os
import sys
import tkinter as tk
import argparse
from pathlib import Path
from cleo_setup import DeploymentApp
from cleo_setup.installer import check_installation, run_installer

def main():
    """Main function to start the application."""
    # Check Python version
    if sys.version_info < (3, 6):
        print("This script requires Python 3.6 or higher")
        sys.exit(1)
    
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="CLEO SPA Setup Tool - Self-Extracting Installer")
    parser.add_argument('--force-install', action='store_true', 
                       help='Force reinstallation even if already installed')
    parser.add_argument('--extract-only', action='store_true',
                       help='Only extract files, do not launch the setup tool')
    args = parser.parse_args()
    
    # Check if we're running as a frozen executable (built with PyInstaller)
    is_frozen = getattr(sys, 'frozen', False)
    
    # For frozen executables, always check for installation or run installer
    if is_frozen:
        # Check if CLEO SPA is already installed
        install_path = check_installation()
        
        if not install_path or args.force_install:
            # Show installer interface for extraction
            print("CLEO SPA Setup Tool - Self-Extracting Installer")
            print("=" * 50)
            print("This installer contains all CLEO SPA project files.")
            print("Please choose where to extract the project files...")
            
            install_path = run_installer()
            
            if not install_path:
                print("Installation cancelled or failed.")
                sys.exit(1)
            
            print(f"Project files extracted to: {install_path}")
            
            # If extract-only mode, exit after extraction
            if args.extract_only:
                print("Extraction completed. You can now run the setup tool from the extracted location.")
                input("Press Enter to exit...")
                sys.exit(0)
        
        # Set the project path environment variable
        os.environ['CLEO_SPA_PROJECT_PATH'] = str(install_path)
        print(f"Using CLEO SPA project files from: {install_path}")
    
    else:
        # Running from source - development mode
        # Try to find installation or use current directory
        install_path = check_installation()
        if not install_path:
            # Use current project directory for development
            install_path = Path(__file__).parent.parent
            os.environ['CLEO_SPA_PROJECT_PATH'] = str(install_path)
            print(f"Development mode: Using project files from: {install_path}")
        else:
            os.environ['CLEO_SPA_PROJECT_PATH'] = str(install_path)
            print(f"Using installed project files from: {install_path}")
    
    # Check if running in a container
    in_container = os.path.exists('/.dockerenv')
    
    # Start the GUI
    root = tk.Tk()
    app = DeploymentApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
