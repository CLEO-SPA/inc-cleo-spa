#!/usr/bin/env python3
"""
Main entry point for CLEO SPA setup tool.
"""
import os
import sys
import tkinter as tk
import argparse
from cleo_setup import DeploymentApp

def main():
    """Main function to start the application."""
    # Check Python version
    if sys.version_info < (3, 6):
        print("This script requires Python 3.6 or higher")
        sys.exit(1)
    
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="CLEO SPA Setup Tool")
    args = parser.parse_args()
        
    # Check if running in a container
    in_container = os.path.exists('/.dockerenv')
    
    # Start the GUI (removed CodeCommit deployment option)
    root = tk.Tk()
    app = DeploymentApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
