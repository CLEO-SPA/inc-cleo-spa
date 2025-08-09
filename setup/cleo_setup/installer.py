#!/usr/bin/env python3
"""
Installer interface for CLEO SPA Setup Tool.
This module handles the initial installation process including directory selection
and project file extraction.
"""
import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import shutil
import tempfile
from pathlib import Path
import json
import zipfile
import importlib.resources as pkg_resources


class InstallerApp:
    """Installer application for extracting and setting up CLEO SPA project files."""
    
    def __init__(self, root):
        """Initialize the installer."""
        self.root = root
        self.root.title("CLEO SPA Self-Extracting Installer")
        self.root.geometry("700x500")  # Made window larger
        self.root.resizable(True, True)  # Allow resizing to debug layout issues
        
        # Center the window
        self.center_window()
        
        # Installation directory
        self.install_dir = tk.StringVar()
        self.install_dir.set(str(Path.home() / "CLEO-SPA"))
        
        # Installation state
        self.is_installing = False
        
        # Create the UI
        self.create_installer_ui()
    
    def center_window(self):
        """Center the window on the screen."""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f"{width}x{height}+{x}+{y}")
    
    def create_installer_ui(self):
        """Create the installer user interface."""
        # Main frame with scrolling capability
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="CLEO SPA Self-Extracting Installer", 
            font=("Arial", 16, "bold")
        )
        title_label.pack(pady=(0, 20))
        
        # Description
        desc_text = (
            "Welcome to the CLEO SPA Setup Tool!\n\n"
            "This self-extracting installer contains all necessary project files embedded within it. "
            "Click 'Extract Files' to extract the complete project to your chosen location.\n\n"
            "The extracted files include:\n"
            "• Client application (React/Vite frontend)\n"
            "• Server application (Node.js/TypeScript backend)\n"
            "• Terraform infrastructure configuration\n"
            "• Docker compose files for local development\n"
            "• Database seed files and scripts\n\n"
            "Please choose where you would like to extract the CLEO SPA project files:"
        )
        
        desc_label = ttk.Label(
            main_frame, 
            text=desc_text, 
            wraplength=650,
            justify=tk.LEFT
        )
        desc_label.pack(pady=(0, 20))
        
        # Directory selection frame
        dir_frame = ttk.LabelFrame(main_frame, text="Extraction Directory", padding="10")
        dir_frame.pack(fill=tk.X, pady=(0, 20))
        
        dir_entry_frame = ttk.Frame(dir_frame)
        dir_entry_frame.pack(fill=tk.X)
        
        ttk.Entry(
            dir_entry_frame, 
            textvariable=self.install_dir, 
            width=60
        ).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        ttk.Button(
            dir_entry_frame, 
            text="Browse...", 
            command=self.browse_directory
        ).pack(side=tk.RIGHT, padx=(10, 0))
        
        # Warning label
        warning_label = ttk.Label(
            dir_frame,
            text="⚠️ Warning: If the directory already exists, existing files may be overwritten.",
            foreground="orange"
        )
        warning_label.pack(pady=(10, 0))
        
        # Progress frame (initially hidden)
        self.progress_frame = ttk.LabelFrame(main_frame, text="Extraction Progress", padding="10")
        
        self.progress_bar = ttk.Progressbar(
            self.progress_frame, 
            mode='indeterminate'
        )
        self.progress_bar.pack(fill=tk.X, pady=(0, 10))
        
        self.progress_label = ttk.Label(self.progress_frame, text="")
        self.progress_label.pack()
        
        # Spacer to push buttons to bottom
        spacer = ttk.Frame(main_frame)
        spacer.pack(fill=tk.BOTH, expand=True)
        
        # Button frame - always at bottom
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, side=tk.BOTTOM, pady=(20, 0))
        
        # Cancel button (left side)
        cancel_button = ttk.Button(
            button_frame, 
            text="Cancel", 
            command=self.cancel_installation
        )
        cancel_button.pack(side=tk.RIGHT, padx=(10, 0))
        
        # Extract Files button (right side) - make it more prominent
        self.install_button = ttk.Button(
            button_frame, 
            text="Extract Files", 
            command=self.start_installation
        )
        self.install_button.pack(side=tk.RIGHT)
        
        # Force update to ensure layout is applied
        self.root.update_idletasks()
    
    def browse_directory(self):
        """Open directory browser for extraction location."""
        directory = filedialog.askdirectory(
            title="Choose Extraction Directory",
            initialdir=self.install_dir.get()
        )
        if directory:
            self.install_dir.set(directory)
    
    def start_installation(self):
        """Start the extraction process."""
        install_path = Path(self.install_dir.get())
        
        # Validate installation directory
        if not install_path.parent.exists():
            messagebox.showerror(
                "Invalid Directory", 
                "The parent directory does not exist. Please choose a valid location."
            )
            return
        
        # Check if directory exists and warn user
        if install_path.exists() and any(install_path.iterdir()):
            result = messagebox.askyesno(
                "Directory Not Empty",
                f"The directory '{install_path}' already exists and is not empty. "
                "Existing files may be overwritten. Do you want to continue?"
            )
            if not result:
                return
        
        # Disable extract button and show progress
        self.install_button.config(state='disabled')
        self.progress_frame.pack(fill=tk.X, pady=(20, 0))
        self.progress_bar.start()
        self.is_installing = True
        
        # Start extraction in a separate thread
        threading.Thread(
            target=self.perform_installation, 
            args=(install_path,), 
            daemon=True
        ).start()
    
    def perform_installation(self, install_path):
        """Perform the actual extraction."""
        try:
            self.update_progress("Creating extraction directory...")
            install_path.mkdir(parents=True, exist_ok=True)
            
            self.update_progress("Extracting embedded project files...")
            
            # Extract all bundled project files
            if getattr(sys, 'frozen', False):
                # Running as executable - extract from bundled resources
                self.extract_from_executable(install_path)
            else:
                # Running as script - copy from source
                self.extract_from_source(install_path)
            
            self.update_progress("Setting up configuration files...")
            
            # Create initial configuration
            self.create_initial_config(install_path)
            
            self.update_progress("Extraction completed successfully!")
            
            # Extraction complete
            self.root.after(1000, lambda: self.installation_complete(install_path))
            
        except Exception as e:
            self.root.after(0, lambda: self.installation_failed(str(e)))
    
    def extract_from_executable(self, install_path):
        """Extract files from the frozen executable."""
        # In PyInstaller, bundled data is in sys._MEIPASS
        if hasattr(sys, '_MEIPASS'):
            bundle_path = Path(sys._MEIPASS) / "cleo_setup" / "resources" / "project_files"
            if bundle_path.exists():
                # Copy all bundled project files
                for item in bundle_path.iterdir():
                    target = install_path / item.name
                    if item.is_dir():
                        if target.exists():
                            shutil.rmtree(target)
                        shutil.copytree(item, target)
                    else:
                        shutil.copy2(item, target)
                return
        
        # Fallback: extract from embedded zip
        try:
            with pkg_resources.path('cleo_setup.resources', 'project_bundle.zip') as zip_path:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(install_path)
        except (ImportError, FileNotFoundError):
            raise Exception("Could not find bundled project files")
    
    def extract_from_source(self, install_path):
        """Extract files when running from source (development mode)."""
        # When running from source, copy from the parent directory
        source_path = Path(__file__).parent.parent.parent
        
        # Copy specific directories
        directories_to_copy = [
            'client',
            'server', 
            'terraform',
            'seed',
            'scripts'
        ]
        
        files_to_copy = [
            'compose.yml',
            'README.md'
        ]
        
        for dir_name in directories_to_copy:
            source_dir = source_path / dir_name
            if source_dir.exists():
                target_dir = install_path / dir_name
                if target_dir.exists():
                    shutil.rmtree(target_dir)
                shutil.copytree(source_dir, target_dir)
        
        for file_name in files_to_copy:
            source_file = source_path / file_name
            if source_file.exists():
                shutil.copy2(source_file, install_path / file_name)
    
    def create_initial_config(self, install_path):
        """Create initial configuration files."""
        # Store config in a fixed location in user's home directory
        config_dir = Path.home() / ".cleo-spa"
        config_dir.mkdir(exist_ok=True)
        
        config_data = {
            "installation_path": str(install_path),
            "version": "1.0.0",
            "installed_at": str(Path(__file__).parent.parent.parent),
            "setup_completed": True
        }
        
        with open(config_dir / "config.json", 'w') as f:
            json.dump(config_data, f, indent=2)
    
    def update_progress(self, message):
        """Update the progress message."""
        self.root.after(0, lambda: self.progress_label.config(text=message))
    
    def installation_complete(self, install_path):
        """Handle successful extraction completion."""
        self.progress_bar.stop()
        self.progress_frame.pack_forget()
        
        result = messagebox.showinfo(
            "Extraction Complete",
            f"CLEO SPA project files have been successfully extracted to:\n\n"
            f"{install_path}\n\n"
            "Note: You will need to install dependencies:\n"
            "• Client: cd client && npm install\n"
            "• Server: cd server && npm install\n\n"
            "The setup tool will now launch to help you configure the application."
        )
        
        # Store installation path for the main app
        os.environ['CLEO_SPA_PROJECT_PATH'] = str(install_path)
        
        # Close installer and launch main app
        self.root.destroy()
    
    def installation_failed(self, error_message):
        """Handle extraction failure."""
        self.progress_bar.stop()
        self.progress_frame.pack_forget()
        self.install_button.config(state='normal')
        self.is_installing = False
        
        messagebox.showerror(
            "Extraction Failed",
            f"Extraction failed with the following error:\n\n{error_message}\n\n"
            "Please check the extraction directory and try again."
        )
    
    def cancel_installation(self):
        """Cancel the extraction."""
        if self.is_installing:
            result = messagebox.askyesno(
                "Cancel Extraction",
                "Extraction is in progress. Are you sure you want to cancel?"
            )
            if not result:
                return
        
        self.root.destroy()
        sys.exit(0)


def check_installation():
    """
    Check if CLEO SPA is already installed and return the installation path.
    
    Returns:
        Path or None: Installation path if found, None otherwise
    """
    # Check environment variable first
    env_path = os.environ.get('CLEO_SPA_PROJECT_PATH')
    if env_path and Path(env_path).exists():
        return Path(env_path)
    
    # Check fixed config location first (primary method)
    fixed_config_path = Path.home() / ".cleo-spa" / "config.json"
    if fixed_config_path.exists():
        try:
            with open(fixed_config_path) as f:
                config = json.load(f)
            if config.get("setup_completed"):
                install_path = Path(config.get("installation_path", ""))
                if install_path.exists():
                    return install_path
        except (json.JSONDecodeError, KeyError, FileNotFoundError):
            pass
    
    # Fallback: Check common installation locations for local config files
    possible_locations = [
        Path.home() / "CLEO-SPA",
        Path.home() / "Documents" / "CLEO-SPA",
        Path("C:/Program Files/CLEO-SPA") if sys.platform == "win32" else None,
        Path("/opt/cleo-spa") if sys.platform.startswith("linux") else None,
        Path("/Applications/CLEO-SPA") if sys.platform == "darwin" else None
    ]
    
    for location in possible_locations:
        if location and location.exists():
            config_file = location / ".cleo-setup" / "config.json"
            if config_file.exists():
                try:
                    with open(config_file) as f:
                        config = json.load(f)
                    if config.get("setup_completed"):
                        return location
                except (json.JSONDecodeError, KeyError):
                    continue
    
    return None


def run_installer():
    """Run the installer interface."""
    root = tk.Tk()
    app = InstallerApp(root)
    root.mainloop()
    
    # Check if installation was completed
    install_path = check_installation()
    return install_path


if __name__ == "__main__":
    run_installer()
