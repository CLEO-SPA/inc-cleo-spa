#!/usr/bin/env python3
"""
Main entry point for CLEO SPA setup tool.
"""
import os
import sys
import tkinter as tk
import argparse
from cleo_setup import DeploymentApp
from cleo_setup.aws_deployment import deploy_to_codecommit

def main():
    """Main function to start the application."""
    # Check Python version
    if sys.version_info < (3, 6):
        print("This script requires Python 3.6 or higher")
        sys.exit(1)
    
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="CLEO SPA Setup Tool")
    parser.add_argument("--deploy-codecommit", dest="deploy_path", 
                       help="Deploy code to AWS CodeCommit from the specified directory")
    args = parser.parse_args()
        
    # Check if running in a container
    in_container = os.path.exists('/.dockerenv')
    
    # If deploy-codecommit argument is provided, run the deployment directly
    if args.deploy_path:
        print(f"Deploying code from {args.deploy_path} to AWS CodeCommit...")
        # We need a temporary Tk root for the DeploymentApp
        root = tk.Tk()
        root.withdraw()  # Hide the root window
        app = DeploymentApp(root)
        deploy_to_codecommit(app, args.deploy_path)
        # Keep the app running until deployment is complete
        root.mainloop()
    # If we're in a container and arguments are provided, run the deployment directly
    elif in_container and len(sys.argv) > 1:
        # TODO: Implement container-mode operation
        pass
    else:
        # Start the GUI
        root = tk.Tk()
        app = DeploymentApp(root)
        root.mainloop()

if __name__ == "__main__":
    main()
