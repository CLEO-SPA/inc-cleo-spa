#!/usr/bin/env python3
"""
GitHub Actions build script for CLEO SPA Setup Tool with installer functionality.
This creates a self-contained installer that bundles all project files.
"""
import os
import sys
import subprocess
import shutil
import zipfile
from pathlib import Path

def install_dependencies():
    """Install required packages for building the executable."""
    print("Installing required dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pyinstaller"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pillow"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        print("Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)

def clean_build_directories():
    """Clean up build directories from previous builds."""
    print("Cleaning previous build artifacts...")
    dirs_to_clean = ["build", "dist"]
    for dir_name in dirs_to_clean:
        dir_path = Path(dir_name)
        if dir_path.exists() and dir_path.is_dir():
            shutil.rmtree(dir_path)
            print(f"  Removed {dir_path}")

def bundle_all_project_files():
    """Bundle all project files for the installer."""
    print("Bundling entire CLEO SPA project...")
    
    # Create resources directory
    resource_dir = Path("cleo_setup/resources")
    resource_dir.mkdir(exist_ok=True, parents=True)
    
    # Create project_files directory
    project_files_dir = resource_dir / "project_files"
    if project_files_dir.exists():
        shutil.rmtree(project_files_dir)
    project_files_dir.mkdir(exist_ok=True)
    
    # Define project root (parent directory)
    project_root = Path("..")
    
    # Directories to include in the installer
    directories_to_bundle = [
        "client",
        "server", 
        "terraform",
        "seed",
        "scripts"
    ]
    
    # Files to include in the installer
    files_to_bundle = [
        "compose.yml",
        "README.md"
    ]
    
    # Bundle directories
    for dir_name in directories_to_bundle:
        source_dir = project_root / dir_name
        target_dir = project_files_dir / dir_name
        
        if source_dir.exists():
            print(f"  Bundling directory: {dir_name}")
            shutil.copytree(
                source_dir, 
                target_dir,
                ignore=shutil.ignore_patterns(
                    '*.log', '__pycache__', '*.pyc', '.git*', 
                    'node_modules', 'dist', 'build', '.env*',
                    '.DS_Store', 'Thumbs.db'
                )
            )
        else:
            print(f"  Warning: Directory not found: {source_dir}")
    
    # Bundle files
    for file_name in files_to_bundle:
        source_file = project_root / file_name
        target_file = project_files_dir / file_name
        
        if source_file.exists():
            print(f"  Bundling file: {file_name}")
            shutil.copy2(source_file, target_file)
        else:
            print(f"  Warning: File not found: {source_file}")
    
    print(f"  All project files bundled in: {project_files_dir}")
    return project_files_dir

def create_icon():
    """Create a simple icon for the executable."""
    print("Creating application icon...")
    
    icon_path = Path("cleo_setup/resources/app.ico")
    
    try:
        from PIL import Image, ImageDraw
        
        # Create a simple blue icon with "CLEO" text
        img = Image.new('RGBA', (256, 256), color=(0, 120, 212, 255))
        draw = ImageDraw.Draw(img)
        
        # Add a white border
        draw.rectangle((10, 10, 246, 246), outline=(255, 255, 255, 255), width=4)
        
        # Add a simple pattern
        draw.rectangle((50, 50, 206, 206), fill=(255, 255, 255, 128))
        
        # Save as ICO
        img.save(icon_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
        print(f"  Created icon: {icon_path}")
        return icon_path
    except ImportError:
        print("  Pillow not available, creating basic icon manually...")
        # Create a very basic ICO file
        with open(icon_path, 'wb') as f:
            # Basic ICO header for a 32x32 icon
            ico_data = bytes([
                0, 0, 1, 0, 1, 0, 32, 32, 0, 0, 1, 0, 32, 0,
                0, 16, 0, 0, 22, 0, 0, 0
            ])
            f.write(ico_data)
            # Simple blue pixels
            f.write(bytes([0, 120, 212, 255]) * 1024)
        return icon_path
    except Exception as e:
        print(f"  Error creating icon: {e}")
        return None

def build_executable():
    """Build the executable using PyInstaller."""
    print("Building installer executable...")
    
    # Determine platform-specific settings
    platform = sys.platform
    
    if platform == "win32":
        exe_name = "CLEO_SPA_Setup.exe"
        platform_args = ["--windowed", "--noconsole"]
    elif platform == "darwin":
        exe_name = "CLEO_SPA_Setup"
        platform_args = ["--windowed"]
    else:  # Linux
        exe_name = "CLEO_SPA_Setup"
        platform_args = []
    
    # Build PyInstaller command
    pyinstaller_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", exe_name.replace(".exe", ""),
        "--onefile",
        "--clean",
        "--add-data", "cleo_setup/resources;cleo_setup/resources",
        *platform_args,
        "main.py"
    ]
    
    # Add icon if available
    icon_path = Path("cleo_setup/resources/app.ico")
    if icon_path.exists() and platform == "win32":
        pyinstaller_cmd.extend(["--icon", str(icon_path)])
    
    # Execute PyInstaller
    try:
        print(f"  Running: {' '.join(pyinstaller_cmd)}")
        subprocess.check_call(pyinstaller_cmd)
        
        # Verify the executable was created
        expected_exe = Path("dist") / exe_name
        if not expected_exe.exists():
            # Try without extension
            expected_exe = Path("dist") / exe_name.replace(".exe", "")
        
        if expected_exe.exists():
            size_mb = expected_exe.stat().st_size / (1024 * 1024)
            print(f"  Build successful! Executable: {expected_exe} ({size_mb:.2f} MB)")
            return expected_exe
        else:
            print("  Build failed: Executable not found")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"  PyInstaller failed: {e}")
        return None

def main():
    """Main build function for GitHub Actions."""
    print("=== CLEO SPA Setup Tool - Installer Build ===")
    print(f"Platform: {sys.platform}")
    print(f"Python: {sys.version}")
    
    # Check if we're in the setup directory
    if not Path("setup.py").exists():
        print("Error: Must run from the setup directory")
        sys.exit(1)
    
    try:
        # Execute build steps
        install_dependencies()
        clean_build_directories()
        bundle_all_project_files()
        create_icon()
        executable = build_executable()
        
        if executable:
            print(f"\n✓ Build completed successfully!")
            print(f"✓ Installer executable: {executable}")
            print(f"✓ This installer contains the entire CLEO SPA project")
            print(f"✓ Users can run this executable to install CLEO SPA anywhere")
        else:
            print("\n✗ Build failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n✗ Build failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
