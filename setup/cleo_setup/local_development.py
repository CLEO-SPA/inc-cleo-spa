"""
Local development functionality for CLEO SPA setup.
"""
import subprocess
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox

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
    
    # Add output console
    console_frame = ttk.LabelFrame(frame, text="Local Environment Console")
    console_frame.pack(fill=tk.BOTH, expand=True, pady=10)
    
    app.local_console = scrolledtext.ScrolledText(console_frame, wrap=tk.WORD, bg="black", fg="white", font=("Consolas", 10))
    app.local_console.pack(fill=tk.BOTH, expand=True)
    app.local_console.config(state=tk.DISABLED)

def update_docker_compose_config(app):
    """Update the Docker Compose configuration file with user settings."""
    try:
        # Get the path to compose.yml
        compose_path = Path(__file__).parent.parent.parent / "compose.yml"
        
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
            
        # Create a .env file for the server if it doesn't exist
        server_env_path = Path(__file__).parent.parent.parent / "server" / ".env"
        if not server_env_path.exists():
            with open(server_env_path, 'w') as f:
                f.write(f"""# Database URLs - local development
PROD_DB_URL=postgresql://{app.local_db_user.get()}:{app.local_db_password.get()}@localhost:{app.db_port.get()}/{app.local_db_name.get()}
SIM_DB_URL=postgresql://{app.local_db_user.get()}:{app.local_db_password.get()}@localhost:{app.sim_db_port.get()}/{app.local_sim_db_name.get()}

# JWT secrets
AUTH_JWT_SECRET=local_development_auth_jwt_secret
INV_JWT_SECRET=local_development_inv_jwt_secret
RMB_TOKEN=rmb-token
SESSION_SECRET=local_development_session_secret

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
    project_root = Path(__file__).parent.parent.parent
    
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
