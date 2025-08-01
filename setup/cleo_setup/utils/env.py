#!/usr/bin/env python3
"""
Environment variable handling for the CLEO SPA Setup application.
"""
import os
import re
from pathlib import Path
from .resources import get_template_content, save_template_to_file

def load_env_file(env_path):
    """
    Load environment variables from a .env file.
    
    Args:
        env_path (str): The path to the .env file.
        
    Returns:
        dict: A dictionary of environment variables.
    """
    env_vars = {}
    
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue
                
                # Parse variable
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print(f"Error loading .env file: {e}")
    
    return env_vars

def save_env_file(env_path, env_vars, comments=None):
    """
    Save environment variables to a .env file.
    
    Args:
        env_path (str): The path to the .env file.
        env_vars (dict): A dictionary of environment variables.
        comments (dict, optional): A dictionary of comments for each variable.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        # Read existing file to preserve comments and formatting
        existing_lines = []
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                existing_lines = f.readlines()
        
        # Process existing lines to update values
        new_lines = []
        used_keys = set()
        
        for line in existing_lines:
            stripped = line.strip()
            # Keep comments and empty lines
            if not stripped or stripped.startswith('#'):
                new_lines.append(line)
                continue
            
            # Update values for existing variables
            if '=' in stripped:
                key, _ = stripped.split('=', 1)
                key = key.strip()
                if key in env_vars:
                    new_lines.append(f"{key}={env_vars[key]}\n")
                    used_keys.add(key)
                else:
                    new_lines.append(line)
        
        # Add any new variables
        for key, value in env_vars.items():
            if key not in used_keys:
                # Add comment if provided
                if comments and key in comments:
                    new_lines.append(f"\n# {comments[key]}\n")
                new_lines.append(f"{key}={value}\n")
        
        # Write the updated file
        with open(env_path, 'w') as f:
            f.writelines(new_lines)
        
        return True
    except Exception as e:
        print(f"Error saving .env file: {e}")
        return False

def create_env_file_from_template(template_name, target_path, variables=None):
    """
    Create a .env file from a template.
    
    Args:
        template_name (str): The name of the template.
        target_path (str): The path to save the .env file to.
        variables (dict, optional): A dictionary of variables to replace in the template.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    # Get template content
    content = get_template_content(template_name)
    if not content:
        return False
    
    # Replace variables if provided
    if variables:
        for key, value in variables.items():
            content = content.replace(f"${{{key}}}", value)
            content = content.replace(f"${key}", value)
    
    # Write to target file
    try:
        with open(target_path, 'w') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error creating .env file: {e}")
        return False

def update_env_variable(env_path, key, value):
    """
    Update a single environment variable in a .env file.
    
    Args:
        env_path (str): The path to the .env file.
        key (str): The variable key.
        value (str): The variable value.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    env_vars = load_env_file(env_path)
    env_vars[key] = value
    return save_env_file(env_path, env_vars)

def get_env_variable(env_path, key, default=None):
    """
    Get a single environment variable from a .env file.
    
    Args:
        env_path (str): The path to the .env file.
        key (str): The variable key.
        default: The default value to return if the key is not found.
        
    Returns:
        str: The variable value or default if not found.
    """
    env_vars = load_env_file(env_path)
    return env_vars.get(key, default)
