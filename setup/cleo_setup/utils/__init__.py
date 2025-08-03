"""
Utility modules for the CLEO SPA Setup application.
"""
import os
import sys
import tkinter as tk

from .utils import check_docker, get_project_root, get_resource_path

def log_message(console, message, color="white"):
    """Log a message to a scrolledtext console widget."""
    if console:
        console.config(state=tk.NORMAL)
        console.insert(tk.END, message + "\n", color)
        console.see(tk.END)
        console.config(state=tk.DISABLED)
    else:
        print(message)