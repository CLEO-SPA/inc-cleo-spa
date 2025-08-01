# CLEO SPA Setup Tool - Installer Mode

This document explains the new installer-style approach for the CLEO SPA Setup Tool.

## Overview

The CLEO SPA Setup Tool now functions as a proper installer that:

1. **Bundles the entire project** inside the executable during build
2. **Prompts for installation directory** on first run
3. **Extracts all project files** to the user-chosen location
4. **Eliminates reference errors** by having everything self-contained
5. **Works like traditional installers** (similar to software installation wizards)

## How It Works

### For End Users

1. **Download and Run**: Users download a single executable file (`CLEO_SPA_Setup.exe`)
2. **Choose Installation Directory**: On first run, the installer asks where to extract the project files
3. **Automatic Extraction**: All project files (client, server, terraform, etc.) are extracted to the chosen location
4. **Ready to Use**: The setup tool launches with full access to all project files

### For Developers

1. **Build Process**: The build script now bundles ALL project files into the executable
2. **No External Dependencies**: No need to distribute separate folders or files
3. **Self-Contained**: Everything needed is inside the single executable

## Directory Structure After Installation

Once installed, users will have this structure in their chosen directory:

```
C:\Users\Username\CLEO-SPA\  (or user-chosen path)
├── .cleo-setup/
│   └── config.json              # Installation metadata
├── client/                      # React frontend application
├── server/                      # Node.js backend application
├── terraform/                   # AWS infrastructure code
├── seed/                        # Database seed files
├── scripts/                     # Utility scripts
├── compose.yml                  # Docker Compose configuration
└── README.md                    # Project documentation
```

## Building the Installer

### Using the New Build Script

```bash
cd setup
python build_installer.py
```

This will:

1. Install required dependencies
2. Bundle all project files from the parent directory
3. Create a self-contained executable
4. Include everything needed for installation

### Using GitHub Actions

The GitHub Actions workflow automatically builds installers for all platforms:

```yaml
- name: Build Installer
  run: |
    cd setup
    python build_installer.py
```

## Key Features

### 🎯 **Self-Contained**

- Single executable contains everything
- No external file dependencies
- No "missing files" errors

### 🚀 **Easy Distribution**

- Just share one executable file
- Users don't need to clone repositories
- Works on any Windows machine with Docker

### 📁 **Flexible Installation**

- Users choose where to install
- Supports multiple installations
- Can reinstall or update easily

### 🔧 **Proper Installer UI**

- Professional installation interface
- Progress indicators
- Error handling and validation

### 🔄 **Smart Path Resolution**

- Automatically uses installed project files
- Falls back to development mode when appropriate
- Handles both installed and development scenarios

## Technical Implementation

### Main Components

1. **`installer.py`** - Installation UI and extraction logic
2. **`main.py`** - Updated entry point with installer integration
3. **`build_installer.py`** - New build script for creating installers
4. **`utils.py`** - Updated utilities for path resolution

### Installation Flow

```python
# 1. Check if already installed
install_path = check_installation()

# 2. Run installer if needed
if not install_path:
    install_path = run_installer()

# 3. Set project path
os.environ['CLEO_SPA_PROJECT_PATH'] = str(install_path)

# 4. Launch main application
app = DeploymentApp(root)
```

### Path Resolution

The tool now uses this priority order for finding project files:

1. **Environment Variable**: `CLEO_SPA_PROJECT_PATH`
2. **Installation Locations**: Check common install directories
3. **Development Mode**: Fall back to source directory

## Command Line Options

```bash
# Force reinstallation
CLEO_SPA_Setup.exe --force-install

# Normal run (auto-detects installation)
CLEO_SPA_Setup.exe
```

## Benefits

### For End Users

- ✅ **Simple**: Download one file, run it, choose where to install
- ✅ **Reliable**: No missing dependencies or file path issues
- ✅ **Professional**: Looks and feels like commercial software
- ✅ **Flexible**: Install anywhere they want

### For Developers

- ✅ **Easy Distribution**: Just build and share the executable
- ✅ **No Support Issues**: Everything is self-contained
- ✅ **Version Control**: Each executable is a complete snapshot
- ✅ **Cross-Platform**: Works on Windows, macOS, and Linux

### For the Project

- ✅ **Professional Image**: Enterprise-grade installation experience
- ✅ **Reduced Complexity**: No need for complex setup instructions
- ✅ **Better Adoption**: Easier for clients to get started
- ✅ **Maintainable**: Clear separation between installer and application

## Migration from Previous Version

### For Existing Users

- The tool will detect if files are already installed
- Can choose to use existing installation or reinstall
- No data loss - configuration files are preserved

### For Developers

- Old build scripts still work for development
- New build script is for distribution
- Both approaches are supported

## Troubleshooting

### Common Issues

1. **"Installation failed"**

   - Check write permissions to installation directory
   - Try installing to a different location

2. **"Project files not found"**

   - Run with `--force-install` to reinstall
   - Check if installation directory was moved/deleted

3. **"Cannot find bundled files"**
   - Executable may be corrupted
   - Re-download and try again

### Debug Mode

For debugging, you can check:

- Installation configuration: `[install_dir]/.cleo-setup/config.json`
- Environment variable: `CLEO_SPA_PROJECT_PATH`
- Current working directory

## Future Enhancements

Potential future improvements:

- **Update mechanism**: Check for and install updates
- **Uninstaller**: Clean removal of installed files
- **Multiple versions**: Support side-by-side installations
- **Component selection**: Let users choose what to install
- **Silent installation**: Command-line installation without UI
