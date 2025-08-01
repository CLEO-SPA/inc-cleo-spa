# CLEO SPA Setup Tool - GitHub Actions Build

This document explains the GitHub Actions workflow for building the CLEO SPA Setup Tool across multiple platforms.

## Automated Build Workflow

The GitHub Actions workflow defined in `.github/workflows/build-setup-app.yml` automatically builds the CLEO SPA Setup Tool for Windows, macOS, and Linux platforms. This ensures that users can run the tool on their preferred operating system without having to build it themselves.

### Workflow Triggers

The workflow is triggered by:

- Pushing to the `master` branch
- Pushing to the `feature/aws-hosting` branch
- Creating a new tag (which also creates a GitHub release)

### Build Process

For each platform (Windows, macOS, and Linux), the workflow:

1. Sets up the appropriate runner (Windows, macOS, or Ubuntu)
2. Installs Python and required dependencies
3. Runs the build script that creates a platform-specific executable
4. Uploads the build artifacts to GitHub
5. Creates a release with the binaries when triggered by a tag

## Using the Build Script Manually

You can build the installer manually to create executables for your current platform:

### Standard Installer Build (Recommended)

```bash
# Navigate to the setup directory
cd setup

# Install required dependencies
pip install pyinstaller pillow

# Run the installer build script (bundles entire project)
python build_installer.py
```

### Development Build (For Testing)

```bash
# Navigate to the setup directory
cd setup

# Install required dependencies
pip install pyinstaller pillow

# Run the development build script
python build.py
```

The **installer build** creates a self-contained executable that includes all project files and provides a proper installation interface. This is recommended for distribution to end users.

The **development build** is lighter and suitable for testing during development.

## Cross-Platform Considerations

The build process handles various platform-specific considerations:

### Windows

- Creates a `.exe` file with a Windows-specific icon
- Packages all dependencies into a single executable

### macOS

- Creates a macOS executable with appropriate permissions
- Uses `.icns` format for the application icon
- Optionally creates an `.app` bundle

### Linux

- Creates a Linux executable with appropriate permissions
- Ensures compatibility across different Linux distributions

## Resource Bundling

During the build process, all necessary template files and resources are automatically bundled with the executable. This ensures that the application can access these files regardless of where it's run from, making the executable completely portable.

## Troubleshooting

If you encounter issues with the automated build process:

1. Check the GitHub Actions logs for any error messages
2. Verify that all dependencies are properly listed in the build script
3. Test the build locally using the manual build process
4. Ensure that the resource files are correctly bundled with the executable

## Contributing

When contributing changes to the CLEO SPA Setup Tool, keep in mind the cross-platform nature of the application. Test your changes on multiple platforms if possible, or at least ensure that they don't rely on platform-specific features without proper fallbacks.
