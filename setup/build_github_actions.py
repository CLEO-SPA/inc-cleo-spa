#!/usr/bin/env python3
"""
Build script for GitHub Actions to create standalone executables for CLEO SPA Setup tool.
This modified version works across Windows, macOS, and Linux.
"""
import os
import sys
import subprocess
import shutil
import sqlite3
import argparse
from pathlib import Path
import importlib.metadata

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Build CLEO SPA Setup executable')
    parser.add_argument('--version', type=str, default=None, help='Version to use for the build')
    parser.add_argument('--platform', type=str, choices=['windows', 'macos', 'linux'], 
                        default=None, help='Target platform for the build')
    return parser.parse_args()

def get_version(specified_version=None):
    """Get the version from specified value, setup.py, or generate a default."""
    if specified_version:
        return specified_version
    
    try:
        version = importlib.metadata.version("cleo-setup")
        return version
    except importlib.metadata.PackageNotFoundError:
        return "0.0.0"

def get_platform(specified_platform=None):
    """Get the platform name from specified value or detect automatically."""
    if specified_platform:
        return specified_platform
    
    platform_map = {
        "win32": "windows",
        "darwin": "macos",
        "linux": "linux"
    }
    return platform_map.get(sys.platform, "unknown")

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
        
        # Check for Microsoft Visual C++ Redistributable on Windows
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

def clean_build_directories():
    """Clean up build directories from previous builds."""
    print("Cleaning previous build artifacts...")
    dirs_to_clean = ["build", "dist"]
    for dir_name in dirs_to_clean:
        dir_path = Path(dir_name)
        if dir_path.exists() and dir_path.is_dir():
            shutil.rmtree(dir_path)
            print(f"  Removed {dir_path}")

def store_resources(version):
    """Store resource files in the SQLite database."""
    print("Storing resource files in SQLite database...")
    
    try:
        # Import database utility functions
        from cleo_setup.utils.database import initialize_database, add_resource
        
        # Initialize the database
        db_conn = initialize_database()
        
        # Store terraform.tfvars template
        src_terraform = Path("../terraform/terraform.tfvars")
        if src_terraform.exists():
            with open(src_terraform, 'r', encoding='utf-8') as f:
                content = f.read()
                add_resource(db_conn, "terraform.tfvars", content, "template", version)
                print("  Stored terraform.tfvars in resources database")
        else:
            print(f"  Warning: Could not find {src_terraform}")
            fallback = generate_fallback_content("terraform.tfvars")
            add_resource(db_conn, "terraform.tfvars", fallback, "template", version)
            print("  Created fallback terraform.tfvars in resources database")
        
        # Store docker-compose.yml template
        src_compose = Path("../compose.yml")
        if src_compose.exists():
            with open(src_compose, 'r', encoding='utf-8') as f:
                content = f.read()
                add_resource(db_conn, "compose.yml", content, "template", version)
                print("  Stored compose.yml in resources database")
        else:
            print(f"  Warning: Could not find {src_compose}")
            fallback = generate_fallback_content("compose.yml")
            add_resource(db_conn, "compose.yml", fallback, "template", version)
            print("  Created fallback compose.yml in resources database")
        
        # Store server.env template
        server_env_content = generate_fallback_content("server.env")
        add_resource(db_conn, "server.env", server_env_content, "template", version)
        print("  Stored server.env in resources database")
        
        # Create a simple icon file based on platform
        icon_path = create_icon_file(Path("cleo_setup/resources"))
        if icon_path and icon_path.exists():
            with open(icon_path, 'rb') as f:
                icon_data = f.read()
                # Store binary data as base64 string
                import base64
                icon_data_base64 = base64.b64encode(icon_data).decode('utf-8')
                add_resource(db_conn, f"app_icon.{icon_path.suffix.lstrip('.')}", 
                             icon_data_base64, "binary", version)
                print(f"  Stored app icon in resources database")
        
        # Close database connection
        db_conn.close()
        print("  Resource storage complete")
        
    except Exception as e:
        print(f"Error storing resources: {e}")
        sys.exit(1)

def generate_fallback_content(template_name):
    """Generate fallback content for templates."""
    fallback_templates = {
        "terraform.tfvars": """aws_region         = "us-west-2"
aws_account_id     = "123456789012"
frontend_image_uri = "123456789012.dkr.ecr.us-west-2.amazonaws.com/cleo-spa-app-frontend:latest"
backend_image_uri  = "123456789012.dkr.ecr.us-west-2.amazonaws.com/cleo-spa-app-backend:latest"
secret_name        = "cleo-spa-db-credentials"
jwt_secret_name    = "cleo-spa-jwt-secrets"

# Database credentials
db_password        = "REPLACE_WITH_SECURE_PASSWORD"

# JWT secrets
auth_jwt_secret    = "REPLACE_WITH_AUTH_JWT_SECRET"
inv_jwt_secret     = "REPLACE_WITH_INV_JWT_SECRET"
remember_token     = "REPLACE_WITH_REMEMBER_TOKEN" 
session_secret     = "REPLACE_WITH_SESSION_SECRET"

# Project settings
project_name       = "cleo-spa-app"
""",
        "compose.yml": """version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - '3000:3000'
    depends_on:
      db:
        condition: service_healthy
      db-sim:
        condition: service_healthy
    env_file:
      - ./server/.env
    environment:
      PROD_DB_URL: postgresql://cleo_user:cleo_password@db/cleo_db
      SIM_DB_URL: postgresql://cleo_user:cleo_password@db-sim/sim_db
    volumes:
      - ./server/.env:/usr/src/app/.env

  frontend:
    build:
      context: ./client
      args:
        VITE_API_URL: /api
    ports:
      - '5173:80'
    depends_on:
      - backend

  db:
    image: postgres:latest
    environment:
      POSTGRES_DB: cleo_db
      POSTGRES_USER: cleo_user
      POSTGRES_PASSWORD: cleo_password
    ports:
      - 5432:5432
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cleo_user -d cleo_db']
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - db-data:/var/lib/postgresql/data

  db-sim:
    image: postgres:latest
    environment:
      POSTGRES_DB: sim_db
      POSTGRES_USER: cleo_user
      POSTGRES_PASSWORD: cleo_password
    ports:
      - 5433:5432
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cleo_user -d sim_db']
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - db-sim-data:/var/lib/postgresql/data

volumes:
  db-data:
  db-sim-data:
""",
        "server.env": """# Database URLs - local development
PROD_DB_URL=postgresql://cleo_user:cleo_password@localhost:5432/cleo_db
SIM_DB_URL=postgresql://cleo_user:cleo_password@localhost:5433/sim_db

# JWT secrets
AUTH_JWT_SECRET=local_development_auth_jwt_secret
INV_JWT_SECRET=local_development_inv_jwt_secret
RMB_TOKEN=rmb-token
SESSION_SECRET=local_development_session_secret

# CORS URLs
LOCAL_FRONTEND_URL=http://localhost:5173
LOCAL_BACKEND_URL=http://localhost:3000
"""
    }
    
    return fallback_templates.get(template_name, "# Template content not available")

def create_icon_file(resource_dir):
    """Create a simple icon file based on platform."""
    try:
        # Create a basic blue square icon for simplicity
        icon_path = resource_dir / "app.ico" if sys.platform == "win32" else resource_dir / "app.png"
        
        # Use Pillow to create a simple colored square
        try:
            from PIL import Image, ImageDraw
            
            # Create a simple colored square
            img = Image.new('RGBA', (256, 256), color=(0, 120, 212, 255))
            draw = ImageDraw.Draw(img)
            # Add a simple pattern
            draw.rectangle((50, 50, 206, 206), fill=(255, 255, 255, 255))
            
            # Save as appropriate format
            img.save(icon_path)
                
            print(f"  Created a simple icon: {icon_path}")
            return icon_path
        except Exception as e:
            print(f"  Error creating icon with Pillow: {e}")
            
            # If we can't use Pillow, create a very basic file
            if sys.platform == "win32":
                # For Windows, create a simple ICO file
                with open(icon_path, 'wb') as f:
                    # Very minimal ICO file
                    f.write(bytes([0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0, 32, 0, 68, 4, 0, 0, 22, 0, 0, 0]))
                    # Simple color data
                    f.write(bytes([0, 120, 212, 255]) * 256)
            else:
                # For other platforms, create a simple PNG-like file
                with open(icon_path, 'wb') as f:
                    # PNG signature and minimal data
                    f.write(bytes([137, 80, 78, 71, 13, 10, 26, 10]))
                    f.write(bytes([0, 0, 0, 0]))
                    
            print(f"  Created a minimal icon placeholder: {icon_path}")
            return icon_path
                
    except Exception as e:
        print(f"  Error handling icon: {e}")
        return None

def create_executable(platform):
    """Build the executable using PyInstaller."""
    print(f"Building executable for {platform} with PyInstaller...")
    
    # Set the separator based on the platform
    separator = ";" if sys.platform == "win32" else ":"
    
    # Create PyInstaller command arguments
    pyinstaller_args = [
        "--name=CLEO_SPA_SETUP",
        "--onefile",  # Create a single executable file
    ]
    
    # Add windowed flag on Windows and macOS
    if sys.platform in ["win32", "darwin"]:
        pyinstaller_args.append("--windowed")
    
    # Continue with common arguments
    pyinstaller_args.extend([
        "--clean",  # Clean PyInstaller cache before building
        f"--add-data=cleo_setup/resources{separator}cleo_setup/resources",  # Include resources
    ])
    
    # Add icon if available
    if sys.platform == "win32":
        icon_path = Path("cleo_setup/resources/app.ico")
        if icon_path.exists():
            pyinstaller_args.extend(["--icon", str(icon_path)])
    else:
        icon_path = Path("cleo_setup/resources/app.png")
        if icon_path.exists() and sys.platform == "darwin":  # macOS
            pyinstaller_args.extend(["--icon", str(icon_path)])
    
    # Add the entry point with correct path separator
    main_path = "cleo_setup/__main__.py"
    pyinstaller_args.append(main_path)
    
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
            
            # Run using the Python executable directly
            final_cmd = [sys.executable, "-m", "PyInstaller"] + pyinstaller_args
            print(f"  Final fallback command: {' '.join(final_cmd)}")
            subprocess.check_call(final_cmd)
        except Exception as e2:
            print(f"Error during fallback PyInstaller execution: {e2}")
            sys.exit(1)

def verify_executable(platform, version):
    """Verify the executable was created successfully."""
    # Determine the executable name based on platform
    if platform == "windows":
        exe_path = Path("dist/CLEO_SPA_SETUP.exe")
    elif platform == "macos":
        # Check for .app bundle on macOS
        app_path = Path("dist/CLEO_SPA_SETUP.app")
        if app_path.exists():
            exe_path = app_path
        else:
            exe_path = Path("dist/CLEO_SPA_SETUP")
    else:  # Linux or other Unix
        exe_path = Path("dist/CLEO_SPA_SETUP")
    
    if exe_path.exists():
        print(f"\nBuild successful! Executable created at: {exe_path.absolute()}")
        
        # Check file size
        if exe_path.is_dir():  # macOS .app bundle
            size_mb = sum(f.stat().st_size for f in exe_path.glob('**/*') if f.is_file()) / (1024 * 1024)
        else:
            size_mb = exe_path.stat().st_size / (1024 * 1024)
            
        print(f"Executable size: {size_mb:.2f} MB")
        
        # Make the file executable on Unix-like systems
        if platform != "windows" and not exe_path.is_dir():
            os.chmod(exe_path, 0o755)
            print(f"Made the executable file executable (chmod +x)")
        
        print(f"\nBuild for {platform} completed successfully!")
        print(f"Version: {version}")
    else:
        print("\nBuild failed: Executable not found.")
        sys.exit(1)

def main():
    """Main build function."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Get version and platform
    version = get_version(args.version)
    platform = get_platform(args.platform)
    
    print(f"Building CLEO SPA SETUP version {version} for {platform}")
    
    # Check if we're in the correct directory
    if not Path("setup.py").exists():
        print("Error: This script must be run from the setup directory (containing setup.py)")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)
    
    # Create __main__.py if it doesn't exist
    main_file = Path("cleo_setup/__main__.py")
    main_file.parent.mkdir(exist_ok=True, parents=True)
    
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
    resource_dir.mkdir(exist_ok=True, parents=True)
    
    try:
        # Execute build steps
        install_dependencies()
        clean_build_directories()
        store_resources(version)
        create_executable(platform)
        verify_executable(platform, version)
        print("\nDone!")
    except Exception as e:
        print(f"\nBuild failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
