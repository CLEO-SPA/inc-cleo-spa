#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# --- Configuration ---
EC2_USER="ec2-user"
EC2_HOST="ec2-52-221-184-205.ap-southeast-1.compute.amazonaws.com"
PROJECT_NAME="cleo-spa"
PROJECT_DIR="/home/$EC2_USER/$PROJECT_NAME"
SSH_KEY="$HOME/.ssh/soc-dit-inc-2425-02.pem"

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate prerequisites
validate_prerequisites() {
    # Check for required tools
    for tool in rsync ssh docker-compose; do
        if ! command -v $tool &> /dev/null; then
            error "$tool is not installed"
            exit 1
        fi
    done

    # Validate SSH key
    if [ ! -f "$SSH_KEY" ]; then
        error "SSH key not found at $SSH_KEY"
        exit 1
    fi
}

# Main deployment function
deploy() {
    log "🚀 Starting deployment to AWS EC2..."

    # Validate prerequisites
    validate_prerequisites

    # Ensure correct SSH key permissions
    chmod 400 "$SSH_KEY"

    # Build frontend
    log "🎨 Building frontend..."
    cd client
    npm ci
    npm run build
    cd ..

    # Sync project files
    log "📂 Syncing project files to EC2..."
    rsync -avz --delete -e "ssh -i $SSH_KEY" \
        --exclude '.git/' \
        --exclude 'node_modules/' \
        --exclude '.github/' \
        --exclude 'client/node_modules' \
        "." "$EC2_USER@$EC2_HOST:$PROJECT_DIR/"

    # Deploy on EC2
    log "🔗 Connecting to EC2 and deploying..."
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# Navigate to project directory
cd "$HOME/cleo-spa"

# Create .env file if it doesn't exist (optional, adjust as needed)
# echo "$ENV_CONTENT" > ./server/.env

# Deployment steps
log() {
    echo -e "\033[0;32m[DEPLOY]\033[0m $1"
}

error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}

# Deploy with Docker Compose
log "🚀 Deploying services..."
docker compose up -d --build

# Health check
log "🩺 Checking service health..."
attempt=1
max_attempts=30

while [ $attempt -le $max_attempts ]; do
    # Check if all services are running and healthy
    if ! docker compose ps | grep -qE "starting|unhealthy|Exit"; then
        log "✅ Deployment successful!"
        docker compose ps
        break
    fi

    log "Attempt $attempt: Waiting for services to stabilize..."
    sleep 10
    ((attempt++))
done

# Final status check
if docker compose ps | grep -qE "Exit|unhealthy"; then
    error "Deployment failed - some containers exited or are unhealthy"
    docker compose logs
    exit 1
fi

# Show recent logs
log "📜 Recent service logs:"
docker compose logs --tail=50
DEPLOY_SCRIPT

    # Deployment complete
    log "🎉 Deployment completed successfully!"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run deployment
deploy