#!/usr/bin/env python3
"""
Database utilities for the CLEO SPA Setup application.
Provides functions to work with SQLite resource database.
"""
import os
import sys
import sqlite3
from pathlib import Path
import importlib.metadata
import tempfile

def get_db_path():
    """Get the path to the SQLite database file."""
    # Check if there's a local resources.db in the same directory as the executable
    if getattr(sys, 'frozen', False):
        # When running as compiled executable
        exe_dir = Path(sys.executable).parent
        local_db_path = exe_dir / 'cleo_resources' / 'resources.db'
        
        # Create the cleo_resources directory if it doesn't exist
        os.makedirs(local_db_path.parent, exist_ok=True)
        
        return str(local_db_path)
    
    # In development mode, use the resources directory
    if os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'resources')):
        return os.path.join(os.path.dirname(__file__), '..', 'resources', 'resources.db')
    
    # In frozen mode (PyInstaller), use _MEIPASS if available
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, 'cleo_setup', 'resources', 'resources.db')
    
    # Default to user's temp directory if we can't find the database
    return os.path.join(tempfile.gettempdir(), 'cleo_spa_resources.db')

def get_connection():
    """Get a connection to the SQLite database."""
    db_path = get_db_path()
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    try:
        conn = sqlite3.connect(db_path)
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def get_resource(name):
    """
    Get a resource from the database.
    
    Args:
        name (str): The name of the resource.
        
    Returns:
        tuple: (content, type, version) or None if not found
    """
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT content, type, version FROM resources WHERE name = ?", (name,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return result
        return None
    except sqlite3.Error as e:
        print(f"Error retrieving resource {name}: {e}")
        conn.close()
        return None

def get_resource_content(name):
    """
    Get only the content of a resource from the database.
    
    Args:
        name (str): The name of the resource.
        
    Returns:
        str or bytes: The content of the resource or None if not found
    """
    resource = get_resource(name)
    if resource:
        return resource[0]
    return None

def extract_resource_to_file(name, target_path, mode='w'):
    """
    Extract a resource from the database to a file.
    
    Args:
        name (str): The name of the resource.
        target_path (str): The path to save the resource to.
        mode (str): The file mode to use ('w' for text, 'wb' for binary).
        
    Returns:
        bool: True if successful, False otherwise.
    """
    resource = get_resource(name)
    if not resource:
        return False
    
    content, _, _ = resource
    
    try:
        with open(target_path, mode) as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error writing resource {name} to {target_path}: {e}")
        return False

def list_resources():
    """
    List all resources in the database.
    
    Returns:
        list: A list of tuples (name, type, version)
    """
    conn = get_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name, type, version FROM resources")
        results = cursor.fetchall()
        conn.close()
        return results
    except sqlite3.Error as e:
        print(f"Error listing resources: {e}")
        conn.close()
        return []

def get_version():
    """Get the version of the application."""
    try:
        version = importlib.metadata.version("cleo-setup")
        return version
    except importlib.metadata.PackageNotFoundError:
        return "0.0.0"

def initialize_database():
    """
    Initialize the database with necessary tables.
    
    Returns:
        sqlite3.Connection: Database connection object
    """
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Create resources table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            content BLOB NOT NULL,
            type TEXT NOT NULL,
            version TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create db_version table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS db_version (
            id INTEGER PRIMARY KEY,
            version TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Check if version record exists
        cursor.execute("SELECT COUNT(*) FROM db_version WHERE id = 1")
        count = cursor.fetchone()[0]
        
        # Get app version
        version = get_version()
        
        if count == 0:
            # Insert initial version
            cursor.execute("INSERT INTO db_version (id, version) VALUES (1, ?)", (version,))
        else:
            # Update version
            cursor.execute("UPDATE db_version SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1", (version,))
        
        conn.commit()
        return conn
    except sqlite3.Error as e:
        print(f"Error initializing database: {e}")
        if conn:
            conn.close()
        return None

def add_resource(conn, name, content, resource_type, version):
    """
    Add or update a resource in the database.
    
    Args:
        conn (sqlite3.Connection): Database connection
        name (str): The name of the resource.
        content (str or bytes): The content of the resource.
        resource_type (str): The type of the resource.
        version (str): The version of the resource.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        cursor = conn.cursor()
        
        # Check if resource exists
        cursor.execute("SELECT COUNT(*) FROM resources WHERE name = ?", (name,))
        count = cursor.fetchone()[0]
        
        if count == 0:
            # Insert new resource
            cursor.execute(
                "INSERT INTO resources (name, content, type, version) VALUES (?, ?, ?, ?)",
                (name, content, resource_type, version)
            )
        else:
            # Update existing resource
            cursor.execute(
                "UPDATE resources SET content = ?, type = ?, version = ?, created_at = CURRENT_TIMESTAMP WHERE name = ?",
                (content, resource_type, version, name)
            )
        
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error adding resource {name}: {e}")
        return False
