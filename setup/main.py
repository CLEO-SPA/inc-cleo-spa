#!/usr/bin/env python3
"""
Main entry point for CLEO SPA setup tool.
"""
import os
import sys
import tkinter as tk
from cleo_setup import DeploymentApp

def main():
    """Main function to start the application."""
    # Check Python version
    if sys.version_info < (3, 6):
        print("This script requires Python 3.6 or higher")
        sys.exit(1)
        
    # Check if running in a container
    in_container = os.path.exists('/.dockerenv')
    
    # If we're in a container and arguments are provided, run the deployment directly
    if in_container and len(sys.argv) > 1:
        # TODO: Implement container-mode operation
        pass
    else:
        # Start the GUI
        root = tk.Tk()
        app = DeploymentApp(root)
        root.mainloop()

if __name__ == "__main__":
    main()
