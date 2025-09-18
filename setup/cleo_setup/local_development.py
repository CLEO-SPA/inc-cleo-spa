"""
Local development functionality for CLEO SPA setup.
"""
import subprocess
import threading
import time
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
    
    ttk.Button(
        button_frame, 
        text="Initialize Databases", 
        command=lambda: threading.Thread(target=initialize_databases, args=(app,), daemon=True).start()
    ).pack(side=tk.LEFT, padx=5)
    
    ttk.Button(
        button_frame, 
        text="Force Reinitialize", 
        command=lambda: threading.Thread(target=lambda: initialize_databases(app, force=True), daemon=True).start()
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
        from .utils import get_project_root
        
        # Get the extracted project root directory
        project_root = get_project_root()
        
        # Get the path to compose.yml in the extracted project
        compose_path = project_root / "compose.yml"
        
        app.log_local_message(f"Updating Docker Compose configuration in extracted project: {project_root}", "cyan")
        
        # Create a new compose file with updated values
        updated_content = f"""version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: ./server/Dockerfile
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
        
        # Ensure the server directory exists in the extracted project
        server_dir = project_root / "server"
        server_dir.mkdir(exist_ok=True, parents=True)
        
        if not server_env_path.exists():
            app.log_local_message(f"Creating new .env file in extracted project: {server_env_path}", "cyan")
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
            env_status = f"Created new .env file at {server_env_path}"
        else:
            env_status = f".env file already exists at {server_env_path}"
        
        messagebox.showinfo(
            "Success", 
            f"Docker Compose configuration has been updated successfully!\n\nFiles updated in extracted project:\n- {compose_path}\n- {env_status}"
        )
        
    except Exception as e:
        messagebox.showerror("Error", f"Failed to update Docker Compose configuration: {str(e)}")

def run_docker_compose_command(app, command):
    """Run a Docker Compose command."""
    # Check if Docker is installed
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True, text=True,
                      creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
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
            cwd=project_root,  # Set working directory to project root
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
        )
        
        # Stream output to the console
        for line in iter(process.stdout.readline, ''):
            app.log_local_message(line.rstrip())
        
        process.stdout.close()
        return_code = process.wait()
        
        if return_code == 0:
            app.log_local_message(f"\nCommand completed successfully!", "green")
            
            # If we started the environment, initialize databases with SQL files
            if command == "up" or command == "rebuild":
                app.log_local_message("\n---- INITIALIZING DATABASES ----", "yellow")
                initialize_databases(app)
                
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

def get_database_container_name(app, service_name):
    """Get the actual container name for a database service."""
    from .utils import get_project_root
    
    project_root = get_project_root()
    
    try:
        # Try to get container name using docker-compose ps
        cmd = ["docker-compose", "-f", str(project_root / "compose.yml"), "ps", "-q", service_name]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root,
                              creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
        
        if result.returncode == 0 and result.stdout.strip():
            container_id = result.stdout.strip().split('\n')[0]
            
            # Get container name from ID
            cmd = ["docker", "inspect", "--format", "{{.Name}}", container_id]
            result = subprocess.run(cmd, capture_output=True, text=True,
                                  creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
            
            if result.returncode == 0:
                container_name = result.stdout.strip().lstrip('/')  # Remove leading slash
                return container_name
        
        # Fallback to common naming patterns
        project_name = project_root.name.lower().replace('-', '').replace('_', '')
        possible_names = [
            f"{project_name}-{service_name}-1",
            f"{project_name}_{service_name}_1",
            f"{service_name}",
            f"{project_root.name}-{service_name}-1"
        ]
        
        for name in possible_names:
            cmd = ["docker", "ps", "--filter", f"name={name}", "--format", "{{.Names}}"]
            result = subprocess.run(cmd, capture_output=True, text=True,
                                  creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().split('\n')[0]
        
        app.log_local_message(f"Could not find container for service '{service_name}'", "red")
        return None
        
    except Exception as e:
        app.log_local_message(f"Error finding container name: {str(e)}", "red")
        return None

def wait_for_database_ready(app, db_config, max_retries=30, retry_delay=2):
    """Wait for database to be ready for connections."""
    app.log_local_message(f"Waiting for database {db_config['database']} to be ready...", "cyan")
    
    for attempt in range(max_retries):
        try:
            # Try to connect using docker exec instead of direct connection
            docker_cmd = [
                "docker", "exec", db_config['container_name'],
                "pg_isready", "-h", "localhost", "-p", "5432", 
                "-U", db_config['user'], "-d", db_config['database']
            ]
            
            result = subprocess.run(docker_cmd, capture_output=True, text=True, timeout=5,
                                  creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
            
            if result.returncode == 0:
                app.log_local_message(f"Database {db_config['database']} is ready!", "green")
                return True
            else:
                app.log_local_message(f"Attempt {attempt + 1}/{max_retries}: Database not ready yet...", "yellow")
                
        except Exception as e:
            app.log_local_message(f"Attempt {attempt + 1}/{max_retries}: {str(e)}", "yellow")
        
        if attempt < max_retries - 1:
            time.sleep(retry_delay)
    
    app.log_local_message(f"Database {db_config['database']} failed to become ready after {max_retries} attempts", "red")
    return False

def execute_sql_file_in_container(app, db_config, sql_file_path):
    """Execute a SQL file inside the database container."""
    try:
        # Read the SQL file content
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Use docker exec to run psql command
        docker_cmd = [
            "docker", "exec", "-i", db_config['container_name'],
            "psql", "-h", "localhost", "-p", "5432",
            "-U", db_config['user'], "-d", db_config['database']
        ]
        
        app.log_local_message(f"Executing {sql_file_path.name} in {db_config['database']}...", "cyan")
        
        # Execute the SQL
        process = subprocess.Popen(
            docker_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
            encoding='utf-8'
        )
        
        stdout, stderr = process.communicate(input=sql_content)
        
        if process.returncode == 0:
            app.log_local_message(f"Successfully executed {sql_file_path.name}", "green")
            if stdout.strip():
                app.log_local_message(f"Output: {stdout.strip()}", "cyan")
        else:
            app.log_local_message(f"Error executing {sql_file_path.name}: {stderr}", "red")
            return False
            
        return True
        
    except Exception as e:
        app.log_local_message(f"Error executing {sql_file_path.name}: {str(e)}", "red")
        return False

def execute_sql_files_in_directory(app, db_config, sql_dir_path):
    """Execute all SQL files in a directory and return success/failure counts."""
    if not sql_dir_path.exists():
        return {'success': 0, 'failed': 0}
    
    sql_files = sorted([f for f in sql_dir_path.iterdir() if f.suffix.lower() == '.sql'])
    success_count = 0
    failed_count = 0
    
    for sql_file in sql_files:
        if execute_sql_file_in_container(app, db_config, sql_file):
            success_count += 1
        else:
            failed_count += 1
    
    return {'success': success_count, 'failed': failed_count}

def check_database_initialized(app, db_config):
    """Check if database is already initialized by looking for specific tables."""
    try:
        # Check if some key tables exist
        docker_cmd = [
            "docker", "exec", db_config['container_name'],
            "psql", "-h", "localhost", "-p", "5432",
            "-U", db_config['user'], "-d", db_config['database'],
            "-c", "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('members', 'employees', 'statuses');"
        ]
        
        result = subprocess.run(docker_cmd, capture_output=True, text=True,
                              creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
        
        if result.returncode == 0:
            # Parse the count from the output
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if line.strip().isdigit():
                    count = int(line.strip())
                    return count >= 3  # If we have at least 3 of the key tables
        
        return False
        
    except Exception as e:
        app.log_local_message(f"Error checking database initialization: {str(e)}", "yellow")
        return False

def initialize_databases(app, force=False):
    """Initialize both databases with SQL files from server/sql directory."""
    from .utils import get_project_root
    
    project_root = get_project_root()
    sql_dir = project_root / "server" / "sql"
    
    if not sql_dir.exists():
        app.log_local_message("SQL directory not found. Skipping database initialization.", "yellow")
        return
    
    # Get actual container names
    db_container = get_database_container_name(app, "db")
    db_sim_container = get_database_container_name(app, "db-sim")
    
    if not db_container or not db_sim_container:
        app.log_local_message("Could not find database containers. Make sure containers are running.", "red")
        return
    
    # Database configurations
    db_configs = [
        {
            'container_name': db_container,
            'database': app.local_db_name.get(),
            'user': app.local_db_user.get(),
            'password': app.local_db_password.get(),
            'port': app.db_port.get(),
            'name': 'Main Database'
        },
        {
            'container_name': db_sim_container,
            'database': app.local_sim_db_name.get(),
            'user': app.local_db_user.get(),
            'password': app.local_db_password.get(),
            'port': app.sim_db_port.get(),
            'name': 'Simulation Database'
        }
    ]
    
    for db_config in db_configs:
        app.log_local_message(f"\nInitializing {db_config['name']} (Container: {db_config['container_name']})...", "yellow")
        
        # Wait for database to be ready
        if not wait_for_database_ready(app, db_config):
            app.log_local_message(f"Skipping initialization of {db_config['name']} - database not ready", "red")
            continue
        
        # Check if database is already initialized (unless force is True)
        if not force and check_database_initialized(app, db_config):
            app.log_local_message(f"{db_config['name']} appears to be already initialized. Skipping...", "green")
            continue
        
        if force:
            app.log_local_message(f"Force reinitializing {db_config['name']}...", "yellow")
        else:
            app.log_local_message(f"Database {db_config['name']} needs initialization. Proceeding...", "cyan")
        
        app.log_local_message(f"SQL execution order: 1) schema.sql, 2) subdirectories, 3) remaining root files", "cyan")
        
        # Initialize counters
        total_success = 0
        total_failed = 0
        
        # STEP 1: Execute schema.sql FIRST if it exists
        schema_file = sql_dir / "schema.sql"
        if schema_file.exists():
            app.log_local_message(f"[STEP 1] Executing schema.sql for {db_config['name']}...", "cyan")
            if execute_sql_file_in_container(app, db_config, schema_file):
                total_success += 1
            else:
                total_failed += 1
        else:
            app.log_local_message(f"[STEP 1] schema.sql not found, skipping...", "yellow")
        
        # STEP 2: Execute SQL files in subdirectories
        subdirectories = [d for d in sql_dir.iterdir() if d.is_dir()]
        
        if subdirectories:
            app.log_local_message(f"[STEP 2] Processing {len(subdirectories)} subdirectories...", "cyan")
            for subdir in sorted(subdirectories):
                app.log_local_message(f"Processing {subdir.name} directory for {db_config['name']}...", "cyan")
                counts = execute_sql_files_in_directory(app, db_config, subdir)
                total_success += counts['success']
                total_failed += counts['failed']
        else:
            app.log_local_message(f"[STEP 2] No subdirectories found, skipping...", "yellow")
        
        # STEP 3: Execute any remaining SQL files in the root sql directory (excluding schema.sql)
        root_sql_files = [f for f in sql_dir.iterdir() 
                         if f.suffix.lower() == '.sql' and f.name != 'schema.sql']
        
        if root_sql_files:
            app.log_local_message(f"[STEP 3] Processing {len(root_sql_files)} remaining root SQL files...", "cyan")
            for sql_file in sorted(root_sql_files):
                if execute_sql_file_in_container(app, db_config, sql_file):
                    total_success += 1
                else:
                    total_failed += 1
        else:
            app.log_local_message(f"[STEP 3] No additional root SQL files found, skipping...", "yellow")
        
        # Display final counts
        app.log_local_message(f"\n==== EXECUTION SUMMARY for {db_config['name']} ====", "green")
        app.log_local_message(f"✅ Successfully executed: {total_success} SQL files", "green")
        if total_failed > 0:
            app.log_local_message(f"❌ Failed to execute: {total_failed} SQL files", "red")
        else:
            app.log_local_message(f"❌ Failed to execute: {total_failed} SQL files", "green")
        app.log_local_message(f"📊 Total SQL files processed: {total_success + total_failed}", "cyan")
        
        app.log_local_message(f"Finished initializing {db_config['name']}", "green")

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
