# -*- mode: python ; coding: utf-8 -*-
import sys
import os
from pathlib import Path

block_cipher = None

# Base directory where the script is located
base_dir = os.path.dirname(os.path.abspath(SPECPATH))
setup_dir = os.path.join(base_dir, 'setup')
cleo_setup_dir = os.path.join(setup_dir, 'cleo_setup')

# Determine OS-specific resources
if sys.platform == 'win32':
    icon_file = os.path.join(cleo_setup_dir, 'resources', 'cleo_icon.ico')
    icon_exists = os.path.exists(icon_file)
    console = True
elif sys.platform == 'darwin':
    icon_file = os.path.join(cleo_setup_dir, 'resources', 'cleo_icon.icns')
    icon_exists = os.path.exists(icon_file)
    console = False
else:  # Linux
    icon_file = os.path.join(cleo_setup_dir, 'resources', 'cleo_icon.png')
    icon_exists = os.path.exists(icon_file)
    console = True

# Find all template files
template_files = []
resource_paths = [
    # Terraform files
    os.path.join(base_dir, 'terraform'),
    # Docker compose files
    base_dir,
    # Server environment files
    os.path.join(base_dir, 'server'),
    # Any other resources
    os.path.join(cleo_setup_dir, 'resources')
]

for resource_path in resource_paths:
    if os.path.exists(resource_path):
        for root, dirs, files in os.walk(resource_path):
            for file in files:
                if file.endswith(('.template', '.tfvars', '.yml', '.yaml', '.env', '.example')):
                    src_path = os.path.join(root, file)
                    # Destination will be in resources folder with the same name
                    dst_path = os.path.join('cleo_setup', 'resources', file)
                    template_files.append((src_path, dst_path))

# Get all Python files in cleo_setup directory
package_files = []
for root, dirs, files in os.walk(cleo_setup_dir):
    for file in files:
        if file.endswith('.py'):
            src_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_path, base_dir)
            package_files.append(rel_path)

# Define the analysis
a = Analysis(
    [os.path.join(cleo_setup_dir, 'app.py')],
    pathex=[base_dir],
    binaries=[],
    datas=template_files,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe_kwargs = {
    'name': 'CLEO_SPA_SETUP',
    'debug': False,
    'bootloader_ignore_signals': False,
    'strip': False,
    'upx': True,
    'console': console,
    'disable_windowed_traceback': False,
    'target_arch': None,
    'codesign_identity': None,
    'entitlements_file': None,
}

# Add icon if it exists
if icon_exists:
    exe_kwargs['icon'] = icon_file

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    **exe_kwargs
)

if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='CLEO_SPA_SETUP.app',
        icon=icon_file if icon_exists else None,
        bundle_identifier=None,
    )
