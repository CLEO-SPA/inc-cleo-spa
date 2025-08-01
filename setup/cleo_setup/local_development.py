"""
Local development functionality for CLEO SPA setup.
"""
import subprocess
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, simpledialog

def setup_local_dev_tab(app, parent):
    """Set up the local development tab UI."""
    # Create a frame with padding
    frame = ttk.Frame(parent, padding="10")
    frame.pack(fill=tk.BOTH, expand=True)
    
    # Add explanation text
    explanation = ttk.Label(
        frame, 
        text="This tab allows you to manage a local development environment using Docker Compose.\n"
                "Start the local environment to run the application with databases for development and testing.",
        wraplength=850,
        justify=tk.LEFT
    )
    explanation.pack(fill=tk.X, pady=(0, 10))
    
    # Add configuration options
    config_frame = ttk.LabelFrame(frame, text="Local Environment Configuration")
    config_frame.pack(fill=tk.X, pady=10)
    
    # DB credentials
    db_frame = ttk.Frame(config_frame)
    db_frame.pack(fill=tk.X, pady=5, padx=10)
    
    ttk.Label(db_frame, text="Database User:").grid(row=0, column=0, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(db_frame, textvariable=app.local_db_user, width=20).grid(row=0, column=1, sticky=tk.W, pady=5)
    
    ttk.Label(db_frame, text="Database Password:").grid(row=0, column=2, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(db_frame, textvariable=app.local_db_password, width=20, show="*").grid(row=0, column=3, sticky=tk.W, pady=5)
    
    ttk.Label(db_frame, text="Main DB Name:").grid(row=1, column=0, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(db_frame, textvariable=app.local_db_name, width=20).grid(row=1, column=1, sticky=tk.W, pady=5)
    
    ttk.Label(db_frame, text="Simulation DB Name:").grid(row=1, column=2, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(db_frame, textvariable=app.local_sim_db_name, width=20).grid(row=1, column=3, sticky=tk.W, pady=5)
    
    # Ports configuration
    ports_frame = ttk.Frame(config_frame)
    ports_frame.pack(fill=tk.X, pady=5, padx=10)
    
    ttk.Label(ports_frame, text="Backend Port:").grid(row=0, column=0, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(ports_frame, textvariable=app.backend_port, width=10).grid(row=0, column=1, sticky=tk.W, pady=5)
    
    ttk.Label(ports_frame, text="Frontend Port:").grid(row=0, column=2, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(ports_frame, textvariable=app.frontend_port, width=10).grid(row=0, column=3, sticky=tk.W, pady=5)
    
    ttk.Label(ports_frame, text="DB Port:").grid(row=1, column=0, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(ports_frame, textvariable=app.db_port, width=10).grid(row=1, column=1, sticky=tk.W, pady=5)
    
    ttk.Label(ports_frame, text="Sim DB Port:").grid(row=1, column=2, sticky=tk.W, pady=5, padx=5)
    ttk.Entry(ports_frame, textvariable=app.sim_db_port, width=10).grid(row=1, column=3, sticky=tk.W, pady=5)
    
    # Update compose.yml button
    ttk.Button(
        config_frame, 
        text="Update Docker Compose Configuration", 
        command=lambda: update_docker_compose_config(app)
    ).pack(pady=10)
    
    # Add action buttons
    button_frame = ttk.Frame(frame)
    button_frame.pack(fill=tk.X, pady=10)
    
    ttk.Button(
        button_frame, 
        text="Start Local Environment", 
        command=lambda: run_docker_compose_command(app, "up")
    ).pack(side=tk.LEFT, padx=5)
    
    ttk.Button(
        button_frame, 
        text="Stop Local Environment", 
        command=lambda: run_docker_compose_command(app, "down")
    ).pack(side=tk.LEFT, padx=5)
    
    ttk.Button(
        button_frame, 
        text="View Logs", 
        command=lambda: run_docker_compose_command(app, "logs")
    ).pack(side=tk.LEFT, padx=5)
    
    ttk.Button(
        button_frame, 
        text="Rebuild Containers", 
        command=lambda: run_docker_compose_command(app, "rebuild")
    ).pack(side=tk.LEFT, padx=5)
    
    ttk.Button(
        button_frame, 
        text="Edit .env File", 
        command=lambda: edit_env_file(app)
    ).pack(side=tk.LEFT, padx=5)
    
    # Add output console
    console_frame = ttk.LabelFrame(frame, text="Local Environment Console")
    console_frame.pack(fill=tk.BOTH, expand=True, pady=10)
    
    app.local_console = scrolledtext.ScrolledText(console_frame, wrap=tk.WORD, bg="black", fg="white", font=("Consolas", 10))
    app.local_console.pack(fill=tk.BOTH, expand=True)
    app.local_console.config(state=tk.DISABLED)

def update_docker_compose_config(app):
    """Update the Docker Compose configuration file with user settings."""
    try:
        from .utils import get_resource_path, get_project_root
        
        # Get the project root directory
        project_root = get_project_root()
        
        # Get the path to compose.yml
        compose_path = project_root / "compose.yml"
        
        # Create a new compose file with updated values
        updated_content = f"""version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - '{app.backend_port.get()}:3000'
    depends_on:
      db:
        condition: service_healthy
      db-sim:
        condition: service_healthy
    env_file:
      - ./server/.env
    environment:
      # Override database URLs to use Docker service names
      PROD_DB_URL: postgresql://{app.local_db_user.get()}:{app.local_db_password.get()}@db/{app.local_db_name.get()}
      SIM_DB_URL: postgresql://{app.local_db_user.get()}:{app.local_db_password.get()}@db-sim/{app.local_sim_db_name.get()}
      LOCAL_FRONTEND_URL: http://localhost:{app.frontend_port.get()}
      LOCAL_BACKEND_URL: http://localhost:{app.backend_port.get()}
    volumes:
      - ./server/.env:/usr/src/app/.env

  frontend:
    build:
      context: ./client
      args:
        VITE_API_URL: /api
    ports:
      - '{app.frontend_port.get()}:80' # Map to default Vite port
    depends_on:
      - backend

  db:
    image: postgres:latest
    environment:
      POSTGRES_DB: {app.local_db_name.get()}
      POSTGRES_USER: {app.local_db_user.get()}
      POSTGRES_PASSWORD: {app.local_db_password.get()}
    ports:
      - {app.db_port.get()}:5432
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U {app.local_db_user.get()} -d {app.local_db_name.get()}']
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - db-data:/var/lib/postgresql/data

  db-sim:
    image: postgres:latest
    environment:
      POSTGRES_DB: {app.local_sim_db_name.get()}
      POSTGRES_USER: {app.local_db_user.get()}
      POSTGRES_PASSWORD: {app.local_db_password.get()}
    ports:
      - {app.sim_db_port.get()}:5432
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U {app.local_db_user.get()} -d {app.local_sim_db_name.get()}']
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - db-sim-data:/var/lib/postgresql/data

volumes:
  db-data:
  db-sim-data:
"""
        
        # Write the updated content
        with open(compose_path, 'w') as f:
            f.write(updated_content)
            
        # Create .env file for the server if it doesn't exist
        server_env_path = project_root / "server" / ".env"
        
        # Ensure the server directory exists
        server_dir = project_root / "server"
        server_dir.mkdir(exist_ok=True, parents=True)
        
        if not server_env_path.exists():
            # Create the .env file from scratch with current configuration
            with open(server_env_path, 'w') as f:
                f.write(f"""# Database URLs - local development
PROD_DB_URL=postgresql://{app.local_db_user.get()}:{app.local_db_password.get()}@localhost:{app.db_port.get()}/{app.local_db_name.get()}
SIM_DB_URL=postgresql://{app.local_db_user.get()}:{app.local_db_password.get()}@localhost:{app.sim_db_port.get()}/{app.local_sim_db_name.get()}

# JWT secrets
AUTH_JWT_SECRET={app.auth_jwt_secret.get() or 'local_development_auth_jwt_secret'}
INV_JWT_SECRET={app.inv_jwt_secret.get() or 'local_development_inv_jwt_secret'}
RMB_TOKEN={app.remember_token.get() or 'rmb-token'}
SESSION_SECRET={app.session_secret.get() or 'local_development_session_secret'}

# CORS URLs
LOCAL_FRONTEND_URL=http://localhost:{app.frontend_port.get()}
LOCAL_BACKEND_URL=http://localhost:{app.backend_port.get()}
""")
        
        messagebox.showinfo(
            "Success", 
            "Docker Compose configuration has been updated successfully!"
        )
        
    except Exception as e:
        messagebox.showerror("Error", f"Failed to update Docker Compose configuration: {str(e)}")

def run_docker_compose_command(app, command):
    """Run a Docker Compose command."""
    # Check if Docker is installed
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True, text=True)
    except (subprocess.SubprocessError, FileNotFoundError):
        messagebox.showerror(
            "Docker Not Found", 
            "Docker is required but not found on your system. Please install Docker and try again."
        )
        return
        
    # Run the command in a separate thread to avoid freezing the UI
    threading.Thread(target=_run_docker_compose, args=(app, command), daemon=True).start()

def _run_docker_compose(app, command):
    """Execute Docker Compose commands."""
    from .utils import get_project_root
    
    project_root = get_project_root()
    
    # Clear the console before running a new command
    app.local_console.config(state=tk.NORMAL)
    app.local_console.delete(1.0, tk.END)
    app.local_console.config(state=tk.DISABLED)
    
    app.log_local_message(f"Running docker-compose {command}...", "cyan")
    
    try:
        if command == "up":
            # Start containers in detached mode
            cmd = ["docker-compose", "-f", str(project_root / "compose.yml"), "up", "-d"]
            app.log_local_message("Starting local environment in the background...", "cyan")
            
        elif command == "down":
            # Stop and remove containers
            cmd = ["docker-compose", "-f", str(project_root / "compose.yml"), "down"]
            app.log_local_message("Stopping local environment...", "cyan")
            
        elif command == "logs":
            # Follow logs
            cmd = ["docker-compose", "-f", str(project_root / "compose.yml"), "logs", "--follow"]
            app.log_local_message("Displaying logs (Ctrl+C to stop)...", "cyan")
            
        elif command == "rebuild":
            # Rebuild and restart containers
            cmd = ["docker-compose", "-f", str(project_root / "compose.yml"), "up", "--build", "-d"]
            app.log_local_message("Rebuilding and restarting containers...", "cyan")
            
        else:
            app.log_local_message(f"Unknown command: {command}", "red")
            return
            
        # Execute the command
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
            cwd=project_root  # Set working directory to project root
        )
        
        # Stream output to the console
        for line in iter(process.stdout.readline, ''):
            app.log_local_message(line.rstrip())
        
        process.stdout.close()
        return_code = process.wait()
        
        if return_code == 0:
            app.log_local_message(f"\nCommand completed successfully!", "green")
            
            # If we started the environment, display access URLs
            if command == "up" or command == "rebuild":
                app.log_local_message("\n---- LOCAL ENVIRONMENT INFORMATION ----", "green")
                app.log_local_message(f"Frontend URL: http://localhost:{app.frontend_port.get()}", "cyan")
                app.log_local_message(f"Backend API: http://localhost:{app.backend_port.get()}", "cyan")
                app.log_local_message(f"Main Database: localhost:{app.db_port.get()} (User: {app.local_db_user.get()}, DB: {app.local_db_name.get()})", "cyan")
                app.log_local_message(f"Simulation Database: localhost:{app.sim_db_port.get()} (User: {app.local_db_user.get()}, DB: {app.local_sim_db_name.get()})", "cyan")
        else:
            app.log_local_message(f"\nCommand failed with return code {return_code}", "red")
            
    except KeyboardInterrupt:
        app.log_local_message("\nOperation cancelled by user", "yellow")
    except Exception as e:
        app.log_local_message(f"Error: {str(e)}", "red")

def edit_env_file(app):
    """Edit environment variables in the .env file."""
    try:
        from .utils import get_project_root
        
        project_root = get_project_root()
        server_env_path = project_root / "server" / ".env"
        
        # Check if the .env file exists
        if not server_env_path.exists():
            app.log_local_message("Creating new .env file...", "cyan")
            update_docker_compose_config(app)
        
        # Read the current content
        with open(server_env_path, 'r') as f:
            current_content = f.read()
        
        # Create a dialog to edit the file
        env_editor = tk.Toplevel(app.root)
        env_editor.title("Edit Environment Variables")
        env_editor.geometry("800x600")
        
        # Add explanation
        ttk.Label(
            env_editor,
            text="Edit the environment variables below. These will be used by the local development environment.",
            wraplength=780,
            padding=10
        ).pack(fill=tk.X)
        
        # Add text editor
        text_editor = scrolledtext.ScrolledText(env_editor, wrap=tk.WORD, font=("Consolas", 10))
        text_editor.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        text_editor.insert(tk.END, current_content)
        
        # Make sure INV_JWT_SECRET matches the one from the app
        if app.inv_jwt_secret.get():
            text = text_editor.get("1.0", tk.END)
            lines = text.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith("INV_JWT_SECRET="):
                    new_lines.append(f"INV_JWT_SECRET={app.inv_jwt_secret.get()}")
                else:
                    new_lines.append(line)
            text_editor.delete("1.0", tk.END)
            text_editor.insert("1.0", '\n'.join(new_lines))
        
        # Add buttons
        button_frame = ttk.Frame(env_editor)
        button_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Button(
            button_frame,
            text="Save",
            command=lambda: save_env_file(server_env_path, text_editor.get("1.0", tk.END), env_editor, app)
        ).pack(side=tk.RIGHT, padx=5)
        
        ttk.Button(
            button_frame,
            text="Cancel",
            command=env_editor.destroy
        ).pack(side=tk.RIGHT, padx=5)
        
    except Exception as e:
        messagebox.showerror("Error", f"Failed to edit environment file: {str(e)}")

def save_env_file(file_path, content, dialog, app):
    """Save the edited environment variables."""
    try:
        with open(file_path, 'w') as f:
            f.write(content)
        
        app.log_local_message("Environment variables updated successfully.", "green")
        dialog.destroy()
        
        # Update the JWT secrets in the app based on the new content
        lines = content.split('\n')
        for line in lines:
            if line.startswith("AUTH_JWT_SECRET="):
                value = line[len("AUTH_JWT_SECRET="):].strip()
                app.auth_jwt_secret.set(value)
            elif line.startswith("INV_JWT_SECRET="):
                value = line[len("INV_JWT_SECRET="):].strip()
                app.inv_jwt_secret.set(value)
            elif line.startswith("RMB_TOKEN="):
                value = line[len("RMB_TOKEN="):].strip()
                app.remember_token.set(value)
            elif line.startswith("SESSION_SECRET="):
                value = line[len("SESSION_SECRET="):].strip()
                app.session_secret.set(value)
                
        messagebox.showinfo("Success", "Environment variables saved successfully!")
        
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save environment file: {str(e)}")
