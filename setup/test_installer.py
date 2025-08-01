#!/usr/bin/env python3
"""
Test script for the CLEO SPA installer functionality.
"""
import sys
import tempfile
import shutil
from pathlib import Path

# Add the setup directory to the path so we can import modules
sys.path.insert(0, str(Path(__file__).parent))

from cleo_setup.installer import check_installation, run_installer
from cleo_setup.utils import get_project_root

def test_installation_check():
    """Test the installation check functionality."""
    print("Testing installation check...")
    
    # Should return None if no installation exists
    install_path = check_installation()
    print(f"Current installation path: {install_path}")
    
    return install_path

def test_project_root():
    """Test the project root detection."""
    print("Testing project root detection...")
    
    project_root = get_project_root()
    print(f"Project root: {project_root}")
    print(f"Project root exists: {project_root.exists()}")
    
    if project_root.exists():
        print("Contents:")
        for item in project_root.iterdir():
            print(f"  {item.name}")
    
    return project_root

def main():
    """Run all tests."""
    print("=== CLEO SPA Installer Test ===\n")
    
    # Test installation check
    install_path = test_installation_check()
    print()
    
    # Test project root
    project_root = test_project_root()
    print()
    
    print("Test Summary:")
    print(f"✓ Installation check: {'Found' if install_path else 'Not found'}")
    print(f"✓ Project root: {project_root}")
    print(f"✓ Project root exists: {project_root.exists()}")

if __name__ == "__main__":
    main()
