#!/usr/bin/env python3
"""
Build script to create a standalone executable for CLEO SPA Setup tool.
This script uses PyInstaller to package the application into a single .exe file.
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def install_dependencies():
    """Install required packages for building the executable."""
    print("Installing required dependencies...")
    try:
        # Force upgrade pip first to avoid issues
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        
        # Install PyInstaller and project dependencies
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pyinstaller"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pillow"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "PyJWT"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "requests"])
        
        # Try to install cairosvg but don't fail if it doesn't work
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "cairosvg"])
            print("  CairoSVG installed successfully")
        except:
            print("  CairoSVG installation failed - will use fallback icon methods")
        
        # Install the project in development mode
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        
        # Verify PyInstaller installation
        result = subprocess.run([sys.executable, "-m", "PyInstaller", "--version"], 
                               capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  PyInstaller version: {result.stdout.strip()}")
        else:
            print("  Warning: PyInstaller installed but version check failed.")
        
        # Check for Microsoft Visual C++ Redistributable
        if sys.platform == 'win32':
            print("Checking for Microsoft Visual C++ Redistributable...")
            # This is a basic check - not comprehensive
            vcredist_dlls = [
                r"C:\Windows\System32\vcruntime140.dll",
                r"C:\Windows\System32\msvcp140.dll"
            ]
            missing_dlls = [dll for dll in vcredist_dlls if not os.path.exists(dll)]
            
            if missing_dlls:
                print("  Warning: Some Visual C++ Redistributable DLLs may be missing.")
                print("  The built executable may require Microsoft Visual C++ Redistributable to run.")
                print("  Download from: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist")
            else:
                print("  Microsoft Visual C++ Redistributable appears to be installed.")
    
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)
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

def copy_resources():
    """Copy necessary resource files to be included in the executable."""
    print("Copying resource files...")
    
    # Create a resources directory in the cleo_setup package if it doesn't exist
    resource_dir = Path("cleo_setup/resources")
    resource_dir.mkdir(exist_ok=True)
    
    # Create or convert an appropriate icon file
    create_icon_file(resource_dir)
    print("  Resource files prepared for bundling with project files")

def bundle_project_files():
    """Bundle all project files into the resources directory for extraction."""
    print("Bundling entire project files for installer...")
    
    # Create project_files directory in resources
    project_files_dir = Path("cleo_setup/resources/project_files")
    project_files_dir.mkdir(exist_ok=True, parents=True)
    
    # Define what to copy from the parent project
    project_root = Path("..")
    
    # Directories to copy entirely
    directories_to_copy = [
        "client",
        "server", 
        "terraform",
        "seed",
        "scripts"
    ]
    
    # Individual files to copy
    files_to_copy = [
        "compose.yml",
        "README.md"
    ]
    
    # Copy directories
    for dir_name in directories_to_copy:
        source_dir = project_root / dir_name
        target_dir = project_files_dir / dir_name
        
        if source_dir.exists():
            print(f"  Bundling directory: {dir_name}")
            # Remove existing directory if it exists
            if target_dir.exists():
                shutil.rmtree(target_dir)
            
            # Copy the entire directory
            shutil.copytree(source_dir, target_dir, 
                          ignore=shutil.ignore_patterns(
                              '*.log', '__pycache__', '*.pyc', '.git*', 
                              'node_modules', '**/node_modules', 'node_modules/**',
                              'dist', 'build', '.env', '.env.local', '.env.production'
                          ))
        else:
            print(f"  Warning: Directory not found: {dir_name}")
    
    # Copy individual files
    for file_name in files_to_copy:
        source_file = project_root / file_name
        target_file = project_files_dir / file_name
        
        if source_file.exists():
            print(f"  Bundling file: {file_name}")
            shutil.copy2(source_file, target_file)
        else:
            print(f"  Warning: File not found: {file_name}")
    
    print(f"  Project files bundled in: {project_files_dir}")
    return project_files_dir

def create_icon_file(resource_dir):
    """Create an appropriate icon file for Windows executable."""
    try:
        # Try to use the existing logo or create a basic icon
        logo_path = Path("../client/public/vite.svg")
        icon_path = resource_dir / "app.ico"
        
        if logo_path.exists():
            print(f"  Found logo at {logo_path}")
            # First, try to use Pillow for icon creation
            try:
                # Install Pillow if not available
                try:
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"], 
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    from PIL import Image
                    print("  Pillow installed successfully")
                except:
                    print("  Could not install or import Pillow")
                    return create_simple_icon_with_code(icon_path)
                
                # Try to install cairosvg for SVG conversion
                try:
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "cairosvg"], 
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    import cairosvg
                    print("  CairoSVG installed successfully")
                    
                    # Convert SVG to PNG first
                    temp_png = resource_dir / "temp_logo.png"
                    cairosvg.svg2png(url=str(logo_path), write_to=str(temp_png), output_width=256, output_height=256)
                    
                    # Convert PNG to ICO
                    img = Image.open(temp_png)
                    img.save(icon_path)
                    
                    # Remove temporary PNG
                    if temp_png.exists():
                        temp_png.unlink()
                    
                    print(f"  Successfully converted SVG to ICO: {icon_path}")
                    return icon_path
                except:
                    print("  Could not install or use CairoSVG, creating simple icon")
                    return create_simple_icon_with_pillow(icon_path)
            except:
                print("  Error in icon conversion process, creating simple icon")
                return create_simple_icon_with_code(icon_path)
        else:
            print("  Logo not found, creating a simple icon...")
            return create_simple_icon_with_code(icon_path)
                
    except Exception as e:
        print(f"  Error handling icon: {e}")
        return None

def create_simple_icon_with_pillow(icon_path):
    """Create a simple icon using Pillow."""
    try:
        from PIL import Image, ImageDraw
        
        # Create a simple colored square
        img = Image.new('RGBA', (256, 256), color=(0, 120, 212, 255))
        draw = ImageDraw.Draw(img)
        # Add a simple pattern
        draw.rectangle((50, 50, 206, 206), fill=(255, 255, 255, 255))
        img.save(icon_path)
        print(f"  Created a simple icon with Pillow: {icon_path}")
        return icon_path
    except Exception as e:
        print(f"  Error creating icon with Pillow: {e}")
        return create_simple_icon_with_code(icon_path)

def create_simple_icon_with_code(icon_path):
    """Create a very basic .ico file manually if all else fails."""
    try:
        # Create a very basic 16x16 ICO file manually
        # ICO format header plus a simple 16x16 bitmap
        ico_data = bytes([
            # ICO header (6 bytes)
            0, 0,  # Reserved
            1, 0,  # Type: 1 for ICO
            1, 0,  # Number of images: 1
            
            # Directory entry (16 bytes)
            16, 0,  # Width: 16 pixels
            16, 0,  # Height: 16 pixels
            0,      # Color palette: 0
            0,      # Reserved
            1, 0,   # Color planes: 1
            32, 0,  # Bits per pixel: 32
            40, 0, 0, 0,  # Size of bitmap data: 40 bytes
            22, 0, 0, 0,  # Offset to bitmap data: 22 bytes
            
            # Bitmap data - simple blue square
            40, 0, 0, 0,  # BITMAPINFOHEADER size: 40 bytes
            16, 0, 0, 0,  # Width: 16 pixels
            32, 0, 0, 0,  # Height: 32 pixels (16x2 for XOR and AND masks)
            1, 0,         # Planes: 1
            32, 0,        # Bits per pixel: 32
            0, 0, 0, 0,   # Compression: 0 (none)
            0, 4, 0, 0,   # Image size: 1024 bytes (16*16*4)
            0, 0, 0, 0,   # X pixels per meter
            0, 0, 0, 0,   # Y pixels per meter
            0, 0, 0, 0,   # Colors used: 0
            0, 0, 0, 0    # Important colors: 0
        ])
        
        # Simple blue color for all pixels (repeated 16x16 times)
        pixel_data = bytes([0, 120, 212, 255]) * 256  # BGRA format, 16x16 pixels
        
        # AND mask (all 0 for fully opaque) - 16x16 bits packed into bytes
        and_mask = bytes([0] * 32)  # 16*16 bits / 8 = 32 bytes
        
        # Write the ICO file
        with open(icon_path, 'wb') as f:
            f.write(ico_data + pixel_data + and_mask)
        
        print(f"  Created a basic icon file manually: {icon_path}")
        return icon_path
    except Exception as e:
        print(f"  Error creating basic icon file: {e}")
        return None

def create_executable():
    """Build the executable using PyInstaller."""
    print("Building executable with PyInstaller...")
    
    # Create PyInstaller command arguments
    pyinstaller_args = [
        "--name=CLEO_SPA_SETUP",
        "--onefile",  # Create a single executable file
        "--windowed",  # Don't show console window when running the app
        "--clean",  # Clean PyInstaller cache before building
        "--add-data=cleo_setup/resources;cleo_setup/resources",  # Include resources
        "--noconsole",  # Disable console window
    ]
    
    # Add icon if available
    icon_path = Path("cleo_setup/resources/app.ico")
    if icon_path.exists():
        print(f"  Using icon: {icon_path}")
        pyinstaller_args.extend(["--icon", str(icon_path)])
    else:
        print("  No icon available, building without custom icon")
    
    # Add the entry point
    pyinstaller_args.append("main.py")  # Use main.py as entry point instead of __main__.py
    
    # Additional PyInstaller options to avoid DLL issues
    os.environ['PYTHONOPTIMIZE'] = '1'  # Set optimization level
    
    # Run PyInstaller as a Python module
    try:
        print(f"  Executing: python -m PyInstaller {' '.join(pyinstaller_args)}")
        subprocess.check_call([sys.executable, "-m", "PyInstaller"] + pyinstaller_args)
    except subprocess.CalledProcessError as e:
        print(f"Error building executable: {e}")
        # Try with a more direct approach as fallback
        try:
            print("  Trying alternative PyInstaller invocation method...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pyinstaller"])
            
            # Try to install additional dependencies for icon handling
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "cairosvg"])
            except:
                print("  Could not install cairosvg (optional)")
            
            # Run without icon if it was causing problems
            if "--icon" in pyinstaller_args:
                idx = pyinstaller_args.index("--icon")
                if idx < len(pyinstaller_args) - 1:
                    # Remove the icon and its path
                    print("  Removing icon parameter which may be causing issues")
                    pyinstaller_args.pop(idx)  # Remove --icon
                    pyinstaller_args.pop(idx)  # Remove the path
            
            # Run using the Python executable directly
            final_cmd = [sys.executable, "-m", "PyInstaller"] + pyinstaller_args
            print(f"  Final fallback command: {' '.join(final_cmd)}")
            subprocess.check_call(final_cmd)
        except Exception as e2:
            print(f"Error during fallback PyInstaller execution: {e2}")
            sys.exit(1)

def verify_executable():
    """Verify the executable was created successfully."""
    exe_path = Path("dist/CLEO_SPA_SETUP.exe")
    if exe_path.exists():
        print(f"\nBuild successful! Executable created at: {exe_path.absolute()}")
        
        # Check file size
        size_mb = exe_path.stat().st_size / (1024 * 1024)
        print(f"Executable size: {size_mb:.2f} MB")
        
        print("\nDistribution Instructions:")
        print("==========================")
        print("To distribute this application to clients, include these files/folders:")
        print(f"1. {exe_path.name} - The executable file")
        print("2. terraform/ - The AWS infrastructure code")
        print("3. compose.yml - Docker Compose configuration for local development")
        print("4. client/ and server/ - Application source code")
        
        print("\nClient Requirements:")
        print("===================")
        print("1. Windows OS")
        print("2. Docker Desktop installed and running")
        print("3. Microsoft Visual C++ Redistributable (if not already installed)")
        print("   Download: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist")
        print("4. AWS account with appropriate permissions (for deployment)")
        
        print("\nTroubleshooting:")
        print("===============")
        print("If the client encounters 'Missing DLL' or 'Ordinal not found' errors:")
        print("1. Make sure Microsoft Visual C++ Redistributable is installed")
        print("2. Try running the application in a Command Prompt to see detailed error messages")
    else:
        print("\nBuild failed: Executable not found.")
        sys.exit(1)

def main():
    """Main build function."""
    # Check if we're in the correct directory
    if not Path("setup.py").exists():
        print("Error: This script must be run from the setup directory (containing setup.py)")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)
    
    # Create __main__.py if it doesn't exist
    main_file = Path("cleo_setup/__main__.py")
    if not main_file.exists():
        print("Creating __main__.py entry point...")
        with open(main_file, "w") as f:
            f.write("""#!/usr/bin/env python3
\"\"\"
Entry point for CLEO SPA Setup application.
\"\"\"
from cleo_setup.app import main

if __name__ == "__main__":
    main()
""")
        print(f"  Created {main_file}")
    
    # Make sure the resources directory exists
    resource_dir = Path("cleo_setup/resources")
    resource_dir.mkdir(exist_ok=True)
    
    try:
        # Make sure requirements.txt includes necessary dependencies
        update_requirements()
        
        # Execute build steps
        install_dependencies()
        clean_build_directories()
        copy_resources()
        bundle_project_files()  # Bundle all project files
        create_executable()
        verify_executable()
        print("\nDone!")
    except Exception as e:
        print(f"\nBuild failed with error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure PyInstaller is properly installed:")
        print("   pip install -U pyinstaller")
        print("2. Install Pillow for icon handling:")
        print("   pip install pillow")
        print("3. Try running PyInstaller directly:")
        print("   python -m PyInstaller --onefile --windowed cleo_setup/__main__.py")
        print("4. Check if all dependencies are installed:")
        print("   pip install -r requirements.txt")
        sys.exit(1)

def update_requirements():
    """Update requirements.txt to include build dependencies."""
    try:
        req_file = Path("requirements.txt")
        if req_file.exists():
            with open(req_file, "r") as f:
                requirements = f.read()
            
            # Add necessary build dependencies if not already present
            new_reqs = []
            if "pyinstaller" not in requirements.lower():
                new_reqs.append("pyinstaller>=6.3.0")
            if "pillow" not in requirements.lower():
                new_reqs.append("pillow>=10.0.0")
            if "pyjwt" not in requirements.lower():
                new_reqs.append("PyJWT>=2.6.0")
            if "requests" not in requirements.lower():
                new_reqs.append("requests>=2.28.0")
            
            if new_reqs:
                with open(req_file, "a") as f:
                    f.write("\n# Build dependencies\n")
                    for req in new_reqs:
                        f.write(f"{req}\n")
                print(f"  Updated {req_file} with build dependencies")
    except Exception as e:
        print(f"  Warning: Could not update requirements.txt: {e}")
        # Non-critical error, continue

if __name__ == "__main__":
    main()
