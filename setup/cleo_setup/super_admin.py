"""
Super admin setup module for CLEO SPA.
This module provides functionality to set up the first super admin user.
"""
import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
import sys

# Make sure we have jwt and requests modules
try:
    import jwt
    import requests
except ImportError:
    # Try installing them
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyJWT", "requests"])
    import jwt
    import requests

from .utils import log_message

def setup_super_admin_tab(parent, app):
    """Setup the super admin tab in the notebook."""
    # Create a frame with padding
    frame = ttk.Frame(parent, padding="10")
    frame.pack(fill=tk.BOTH, expand=True)
    
    # Add explanation text
    explanation = ttk.Label(
        frame, 
        text="This tab allows you to set up the first super admin user for CLEO SPA.\n"
             "Enter the email and password for the super admin account.",
        wraplength=850,
        justify=tk.LEFT
    )
    explanation.pack(fill=tk.X, pady=(0, 10))
    
    # Create configuration section
    config_frame = ttk.LabelFrame(frame, text="Super Admin Configuration")
    config_frame.pack(fill=tk.X, pady=10)
    
    # Server URL
    url_frame = ttk.Frame(config_frame)
    url_frame.pack(fill=tk.X, pady=5, padx=10)
    
    ttk.Label(url_frame, text="Server URL:").grid(row=0, column=0, sticky=tk.W, pady=5)
    server_url = tk.StringVar(value="http://localhost:3000/api/auth/initsu")
    url_entry = ttk.Entry(url_frame, textvariable=server_url, width=50)
    url_entry.grid(row=0, column=1, sticky=tk.W, pady=5)
    
    # JWT Secret
    jwt_frame = ttk.Frame(config_frame)
    jwt_frame.pack(fill=tk.X, pady=5, padx=10)
    
    ttk.Label(jwt_frame, text="JWT Secret:").grid(row=0, column=0, sticky=tk.W, pady=5)
    jwt_secret = tk.StringVar()
    jwt_secret_entry = ttk.Entry(jwt_frame, textvariable=jwt_secret, width=50)
    jwt_secret_entry.grid(row=0, column=1, sticky=tk.W, pady=5)
    
    # Try to get JWT secret from terraform.tfvars
    try:
        terraform_path = Path(__file__).parent.parent.parent / "terraform" / "terraform.tfvars"
        if terraform_path.exists():
            with open(terraform_path, 'r') as f:
                for line in f:
                    if "inv_jwt_secret" in line:
                        parts = line.strip().split('=')
                        if len(parts) == 2:
                            secret = parts[1].strip().strip('"')
                            jwt_secret.set(secret)
                            break
    except Exception as e:
        print(f"Error loading JWT secret from terraform.tfvars: {e}")
    
    # Credentials section
    creds_frame = ttk.LabelFrame(frame, text="Super Admin Credentials")
    creds_frame.pack(fill=tk.X, pady=10)
    
    # Email
    email_frame = ttk.Frame(creds_frame)
    email_frame.pack(fill=tk.X, pady=5, padx=10)
    
    ttk.Label(email_frame, text="Email:").grid(row=0, column=0, sticky=tk.W, pady=5)
    email = tk.StringVar(value="admin@example.com")
    email_entry = ttk.Entry(email_frame, textvariable=email, width=50)
    email_entry.grid(row=0, column=1, sticky=tk.W, pady=5)
    
    # Password
    password_frame = ttk.Frame(creds_frame)
    password_frame.pack(fill=tk.X, pady=5, padx=10)
    
    ttk.Label(password_frame, text="Password:").grid(row=0, column=0, sticky=tk.W, pady=5)
    password = tk.StringVar(value="Admin123!")
    password_entry = ttk.Entry(password_frame, textvariable=password, width=50, show="*")
    password_entry.grid(row=0, column=1, sticky=tk.W, pady=5)
    
    # Submit button
    submit_button = ttk.Button(
        frame, 
        text="Create Super Admin",
        command=lambda: generate_and_send_jwt(app, server_url.get(), jwt_secret.get(), email.get(), password.get())
    )
    submit_button.pack(pady=10)
    
    # Console output
    console_frame = ttk.LabelFrame(frame, text="Super Admin Setup Console")
    console_frame.pack(fill=tk.BOTH, expand=True, pady=10)
    
    app.su_console = scrolledtext.ScrolledText(
        console_frame, 
        wrap=tk.WORD, 
        bg="black", 
        fg="white", 
        font=("Consolas", 10)
    )
    app.su_console.pack(fill=tk.BOTH, expand=True)
    app.su_console.config(state=tk.DISABLED)
    
    # Add color tags for logging
    app.su_console.tag_config("red", foreground="#FF6B6B")
    app.su_console.tag_config("green", foreground="#76FF03") 
    app.su_console.tag_config("cyan", foreground="#4DD0E1")
    app.su_console.tag_config("white", foreground="white")
    app.su_console.tag_config("orange", foreground="#FFB74D")
    
    # Initial log message
    app.log_su_message("Super Admin setup ready. Enter credentials and server information.", "orange")

def generate_and_send_jwt(app, request_url, jwt_secret_key, email, password):
    """Generate JWT token and send request to create super admin."""
    jwt_algorithm = "HS256"  # Default algorithm
    
    app.su_console.config(state=tk.NORMAL)
    app.su_console.delete(1.0, tk.END)
    app.su_console.config(state=tk.DISABLED)
    
    app.log_su_message(f"Attempting to generate JWT for: {email}", "cyan")
    
    if not email or not password:
        messagebox.showerror("Input Error", "Email and Password cannot be empty.")
        app.log_su_message("Error: Email and Password cannot be empty.", "red")
        return
    
    if not jwt_secret_key or not request_url:
        missing_vars = []
        if not jwt_secret_key:
            missing_vars.append("JWT Secret Key")
        if not request_url:
            missing_vars.append("Server URL")
        error_message = f"Error: Missing required fields: {', '.join(missing_vars)}."
        app.log_su_message(error_message, "red")
        messagebox.showerror("Configuration Error", error_message)
        return
    
    try:
        payload = {
            "email": email,
            "password": password,
            "iat": datetime.now(timezone.utc),  # Issued at time
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),  # Expiration time
        }
        app.log_su_message("JWT Payload created.", "white")
        
        encoded_jwt = jwt.encode(payload, jwt_secret_key, algorithm=jwt_algorithm)
        app.log_su_message(f"JWT Encoded: {encoded_jwt[:30]}...", "white")  # Show a snippet
        
        headers = {
            "Content-Type": "application/json",
        }
        
        if request_url.endswith("/"):
            full_request_url = request_url + encoded_jwt
        else:
            full_request_url = request_url + "/" + encoded_jwt
        
        app.log_su_message(f"Sending request to: {full_request_url}", "white")
        
        response = requests.post(
            full_request_url,
            headers=headers,
            timeout=10,
        )
        
        if response.status_code == 201:
            app.log_su_message(f"Success! Status: {response.status_code}", "green")
            try:
                response_data = response.json()  # Try to parse JSON response
                app.log_su_message(f"Response: {response_data}", "green")
            except requests.exceptions.JSONDecodeError:
                app.log_su_message(f"Response (not JSON): {response.text}", "green")
            messagebox.showinfo(
                "Success", f"Super admin created successfully! Status Code: {response.status_code}"
            )
        else:
            app.log_su_message(f"Failed! Status: {response.status_code}", "red")
            try:
                error_data = response.json()  # Try to parse JSON error response
                app.log_su_message(f"Error Response: {error_data}", "red")
                messagebox.showerror(
                    "Request Failed",
                    f"Status Code: {response.status_code}\nDetails: {error_data.get('error', response.text)}",
                )
            except requests.exceptions.JSONDecodeError:
                app.log_su_message(f"Error Response (not JSON): {response.text}", "red")
                messagebox.showerror(
                    "Request Failed",
                    f"Status Code: {response.status_code}\nResponse: {response.text}",
                )
    
    except jwt.ExpiredSignatureError:
        app.log_su_message("JWT Error: Token has expired.", "red")
        messagebox.showerror("JWT Error", "Token has expired.")
    except jwt.InvalidTokenError as e:
        app.log_su_message(f"JWT Error: Invalid token - {str(e)}", "red")
        messagebox.showerror("JWT Error", f"Invalid token: {e}")
    except requests.exceptions.ConnectionError as e:
        app.log_su_message(f"Request Error: Connection failed - {str(e)}", "red")
        messagebox.showerror(
            "Request Error",
            f"Connection failed: {e}\nIs the server at {request_url} running?",
        )
    except requests.exceptions.Timeout as e:
        app.log_su_message(f"Request Error: Request timed out - {str(e)}", "red")
        messagebox.showerror("Request Error", f"Request timed out: {e}")
    except requests.exceptions.RequestException as e:
        app.log_su_message(f"Request Error: HTTP Request failed - {str(e)}", "red")
        messagebox.showerror("Request Error", f"HTTP Request failed: {e}")
    except Exception as e:
        # Catch any other unexpected errors
        app.log_su_message(f"Error: An unexpected error occurred - {str(e)}", "red")
        messagebox.showerror("Error", f"An unexpected error occurred: {e}")
