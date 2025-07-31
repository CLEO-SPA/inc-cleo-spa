"""
Utility functions for CLEO SPA setup tool.
"""
import subprocess
import tkinter as tk
from tkinter import messagebox

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
        console.insert(tk.END, message + "\n")
        console.see(tk.END)
        console.config(state=tk.DISABLED)
