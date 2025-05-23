import subprocess
import sys

PG_VERSION = "latest"
PG_PORT = "5432"
PG_USER = "postgres"
PG_PASSWORD = "mysecretpassword"
PG_DB = "postgres"
CONTAINER_NAME = "local_postgres"


def run_command(command, check_error=True, capture_output=False):
    try:
        if capture_output:
            result = subprocess.run(
                command, shell=True, check=check_error, capture_output=True, text=True
            )
            return result.stdout.strip()
        else:
            subprocess.run(command, shell=True, check=check_error)
        return True
    except subprocess.CalledProcessError as e:
        print(
            f"Error executing command: {' '.join(command) if isinstance(command, list) else command}",
            file=sys.stderr,
        )
        print(f"Return code: {e.returncode}", file=sys.stderr)
        if e.stderr:
            print(f"Error output: {e.stderr.strip()}", file=sys.stderr)
        return False
    except FileNotFoundError:
        print(
            f"Command not found. Make sure '{command[0] if isinstance(command, list) else command.split(' ')[0]}' is in your PATH.",
            file=sys.stderr,
        )
        return False


def check_docker():
    print("Checking for Docker installation...")
    if not run_command("docker --version", check_error=False):
        print(
            "Docker is not installed or not found in PATH. Please install Docker Desktop.",
            file=sys.stderr,
        )
        print(
            "Visit https://docs.docker.com/get-docker/ for installation instructions.",
            file=sys.stderr,
        )
        sys.exit(1)
    print("Docker found.")

    print("Checking if Docker daemon is running...")
    if not run_command("docker info", check_error=False):
        print(
            "Docker daemon is not running. Please start Docker Desktop.",
            file=sys.stderr,
        )
        sys.exit(1)
    print("Docker daemon is running.")


def stop_and_remove_existing_container():
    print(f"Checking for existing container named '{CONTAINER_NAME}'...")
    existing_containers = run_command(
        f"docker ps -a --format '{{.Names}}'", capture_output=True, check_error=False
    )

    if existing_containers and CONTAINER_NAME in existing_containers.splitlines():
        print(
            f"Container '{CONTAINER_NAME}' already exists. Stopping and removing it..."
        )
        if not run_command(f"docker stop {CONTAINER_NAME}"):
            print(f"Failed to stop container '{CONTAINER_NAME}'.", file=sys.stderr)
            sys.exit(1)
        if not run_command(f"docker rm {CONTAINER_NAME}"):
            print(f"Failed to remove container '{CONTAINER_NAME}'.", file=sys.stderr)
            sys.exit(1)
        print("Existing container removed.")
    else:
        print(f"No existing container named '{CONTAINER_NAME}' found.")


def pull_postgres_image():
    print(f"Pulling PostgreSQL image: postgres:{PG_VERSION}...")
    if not run_command(f"docker pull postgres:{PG_VERSION}"):
        print("Failed to pull PostgreSQL image. Exiting.", file=sys.stderr)
        sys.exit(1)
    print("PostgreSQL image pulled successfully.")


def create_or_replace_volume():
    print(f"Creating or replacing Docker volume '{CONTAINER_NAME}_data'...")
    if not run_command(
        f"docker volume create {CONTAINER_NAME}_data", check_error=False
    ):
        print(
            f"Volume '{CONTAINER_NAME}_data' already exists. Removing it first...",
            file=sys.stderr,
        )
        if not run_command(f"docker volume rm {CONTAINER_NAME}_data"):
            print(
                f"Failed to remove existing volume '{CONTAINER_NAME}_data'.",
                file=sys.stderr,
            )
            sys.exit(1)
        if not run_command(f"docker volume create {CONTAINER_NAME}_data"):
            print("Failed to create new volume. Exiting.", file=sys.stderr)
            sys.exit(1)
    print("Volume created or replaced successfully.")


def run_postgres_container():
    print(f"Running PostgreSQL container '{CONTAINER_NAME}' on port {PG_PORT}...")

    docker_run_cmd = [
        "docker",
        "run",
        "--name",
        CONTAINER_NAME,
        "-e",
        f"POSTGRES_USER={PG_USER}",
        "-e",
        f"POSTGRES_PASSWORD={PG_PASSWORD}",
        "-e",
        f"POSTGRES_DB={PG_DB}",
        "-d",
        "-p",
        f"{PG_PORT}:5432",
        "-v",
        f"{CONTAINER_NAME}_data:/var/lib/postgresql/data",
        "postgres",
    ]

    if not run_command(docker_run_cmd):
        print("Failed to start PostgreSQL container. Exiting.", file=sys.stderr)
        sys.exit(1)

    print("\nPostgreSQL container started successfully!")
    print(f"It is running on port {PG_PORT} on your host machine.")
    print("\n--- Connection Details ---")
    print(f"Host: localhost")
    print(f"Port: {PG_PORT}")
    print(f"User: {PG_USER}")
    print(f"Password: {PG_PASSWORD}")
    print(f"Database: {PG_DB}")
    print("\nYou can connect to your database using a client like psql or DBeaver.")
    print(f"Example psql command (if psql is installed locally):")
    print(f"  psql -h localhost -p {PG_PORT} -U {PG_USER} -d {PG_DB}")
    print("\n--- Docker Management Commands ---")
    print(f"To stop the container: docker stop {CONTAINER_NAME}")
    print(f"To remove the container: docker rm {CONTAINER_NAME}")
    print(f"To view logs: docker logs {CONTAINER_NAME}")
    print(f"To connect to the container's shell: docker exec -it {CONTAINER_NAME} bash")


if __name__ == "__main__":
    print("--- PostgreSQL Docker Setup Script (Python) ---")
    check_docker()
    stop_and_remove_existing_container()
    pull_postgres_image()
    run_postgres_container()
    print("\nScript finished.")
