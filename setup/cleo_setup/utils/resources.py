#!/usr/bin/env python3
"""
Resource utilities for the CLEO SPA Setup application.
"""
import os
import sys
import tempfile
from pathlib import Path
from .database import get_resource, extract_resource_to_file

def get_resource_path(resource_name):
    """
    Get the path to a resource, extracting it to a temporary file if needed.
    
    Args:
        resource_name (str): The name of the resource.
        
    Returns:
        str: The path to the resource or None if not found.
    """
    # First, check if we're in development mode and the file exists directly
    dev_resource_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'resources', resource_name)
    if os.path.exists(dev_resource_path):
        return dev_resource_path
    
    # In PyInstaller mode, check _MEIPASS
    if hasattr(sys, '_MEIPASS'):
        resource_path = os.path.join(sys._MEIPASS, 'cleo_setup', 'resources', resource_name)
        if os.path.exists(resource_path):
            return resource_path
    
    # If we couldn't find the resource directly, try to extract it from the database
    # Create a temporary directory if needed
    temp_dir = os.path.join(tempfile.gettempdir(), 'cleo_spa_resources')
    os.makedirs(temp_dir, exist_ok=True)
    
    # Extract the resource to a temporary file
    temp_file = os.path.join(temp_dir, resource_name)
    if extract_resource_to_file(resource_name, temp_file):
        return temp_file
    
    # Resource not found
    return None

def get_template_content(template_name):
    """
    Get the content of a template from the database.
    
    Args:
        template_name (str): The name of the template.
        
    Returns:
        str: The content of the template or None if not found.
    """
    resource = get_resource(template_name)
    if resource:
        return resource[0]
    return None

def save_template_to_file(template_name, target_path):
    """
    Save a template to a file.
    
    Args:
        template_name (str): The name of the template.
        target_path (str): The path to save the template to.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    return extract_resource_to_file(template_name, target_path)

def get_project_root():
    """
    Get the path to the project root directory.
    
    Returns:
        Path: The path to the project root directory.
    """
    # If we're in development mode
    if os.path.exists(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'setup.py')):
        return Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    # If we're in PyInstaller mode
    if hasattr(sys, '_MEIPASS'):
        return Path(os.getcwd())
    
    # Default to current directory
    return Path(os.getcwd())
