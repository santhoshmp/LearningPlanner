#!/bin/bash

# Child Progress Module Deployment Script
# This script handles the deployment of the child progress module features
# including database migrations, service updates, and configuration deployment

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
DEPLOYMENT_ENV="${1:-production}"
BACKUP_DIR="/tmp/child-progress-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if required environment files exist
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log_error "Environment file .env not found in project root"
        exit 1
    fi
    
    # Check if database is accessible
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npx prisma db pull >/dev/null 2>&1; then
        log_warning "Database connection test failed. Continuing with deployment..."
    fi
    
    log_success "Prerequisites check completed"
}

# Create backup
create_backup() {
    log_info "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log_info "Backing up database..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres pg_dump -U postgres ai_study_planner > "$BACKUP_DIR/database_backup.sql"
    
    # Backup current application files
    log_info "Backing up application files..."
    cp -r "$PROJECT_ROOT/backend/src" "$BACKUP_DIR/backend_src"
    cp -r "$PROJECT_ROOT/frontend/src" "$BACKUP_DIR/frontend_src"
    
    # Backup configuration files
    cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/.env.backup"
    cp "$PROJECT_ROOT/docker-compose.yml" "$BACKUP_DIR/docker-compose.yml.backup"
    
    log_success "Backup created at $BACKUP_DIR"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations for child progress module..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npx prisma generate
    
    # Run migrations
    log_info "Applying database migrations..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npx prisma migrate deploy
    
    # Verify migrations
    log_info "Verifying migration status..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npx prisma migrate status
    
    log_success "Database migrations completed"
}

# Deploy backend services
deploy_backend() {
    log_info "Deploying backend services..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend
    log_info "Building backend application..."
    docker-compose build backend
    
    # Update backend services
    log_info "Updating backend container..."
    docker-compose up -d backend
    
    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Backend failed to start within 60 seconds"
        exit 1
    fi
    
    log_success "Backend deployment completed"
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend application..."
    
    cd "$PROJECT_ROOT"
    
    # Build frontend
    log_info "Building frontend application..."
    docker-compose build frontend
    
    # Update frontend services
    log_info "Updating frontend container..."
    docker-compose up -d frontend
    
    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Frontend failed to start within 60 seconds"
        exit 1
    fi
    
    log_success "Frontend deployment completed"
}

# Update Redis cache
update_cache() {
    log_info "Updating Redis cache configuration..."
    
    # Clear existing cache to ensure fresh data
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T redis redis-cli FLUSHALL
    
    # Warm up cache with essential data
    log_info "Warming up cache with badge definitions..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend node -e "
        const { BadgeService } = require('./dist/services/childBadgeService');
        BadgeService.warmupCache().then(() => console.log('Cache warmed up'));
    "
    
    log_success "Cache update completed"
}

# Run post-deployment tests
run_tests() {
    log_info "Running post-deployment tests..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Run child progress module tests
    log_info "Running child progress service tests..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npm test -- --testPathPattern="childProgress|childBadge|childAuth" --verbose
    
    # Run API endpoint tests
    log_info "Running child API endpoint tests..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npm test -- --testPathPattern="child.test.ts" --verbose
    
    # Run integration tests
    log_info "Running child integration tests..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npm test -- --testPathPattern="childAuth.integration|childProgress.integration" --verbose
    
    log_success "Post-deployment tests completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check service health
    log_info "Checking service health..."
    
    # Backend health check
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        log_success "Backend service is healthy"
    else
        log_error "Backend service health check failed"
        return 1
    fi
    
    # Frontend health check
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        log_success "Frontend service is healthy"
    else
        log_error "Frontend service health check failed"
        return 1
    fi
    
    # Database connectivity check
    if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T backend npx prisma db pull >/dev/null 2>&1; then
        log_success "Database connectivity verified"
    else
        log_error "Database connectivity check failed"
        return 1
    fi
    
    # Redis connectivity check
    if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis connectivity verified"
    else
        log_error "Redis connectivity check failed"
        return 1
    fi
    
    # Child API endpoints check
    log_info "Testing child API endpoints..."
    
    # Test child authentication endpoint
    if curl -f -X POST http://localhost:3001/api/child/auth/session >/dev/null 2>&1; then
        log_success "Child authentication endpoint is accessible"
    else
        log_warning "Child authentication endpoint test failed (may require authentication)"
    fi
    
    log_success "Deployment verification completed"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Restore database
        log_info "Restoring database from backup..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U postgres -d ai_study_planner < "$BACKUP_DIR/database_backup.sql"
        
        # Restore application files
        log_info "Restoring application files..."
        rm -rf "$PROJECT_ROOT/backend/src"
        rm -rf "$PROJECT_ROOT/frontend/src"
        cp -r "$BACKUP_DIR/backend_src" "$PROJECT_ROOT/backend/src"
        cp -r "$BACKUP_DIR/frontend_src" "$PROJECT_ROOT/frontend/src"
        
        # Restore configuration
        cp "$BACKUP_DIR/.env.backup" "$PROJECT_ROOT/.env"
        cp "$BACKUP_DIR/docker-compose.yml.backup" "$PROJECT_ROOT/docker-compose.yml"
        
        # Restart services
        log_info "Restarting services..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" restart
        
        log_success "Rollback completed"
    else
        log_error "Backup directory not found. Cannot rollback."
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up deployment artifacts..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Clean up temporary files
    rm -rf /tmp/child-progress-deploy-*
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting Child Progress Module deployment for environment: $DEPLOYMENT_ENV"
    
    # Trap errors and rollback if needed
    trap 'log_error "Deployment failed. Starting rollback..."; rollback; exit 1' ERR
    
    # Run deployment steps
    check_prerequisites
    create_backup
    run_migrations
    deploy_backend
    deploy_frontend
    update_cache
    run_tests
    verify_deployment
    cleanup
    
    log_success "Child Progress Module deployment completed successfully!"
    log_info "Backup location: $BACKUP_DIR"
    log_info "Services are running at:"
    log_info "  - Frontend: http://localhost:3000"
    log_info "  - Backend API: http://localhost:3001"
    log_info "  - Backend Health: http://localhost:3001/health"
}

# Handle command line arguments
case "${1:-}" in
    "production"|"staging"|"development")
        main
        ;;
    "rollback")
        if [[ -n "${2:-}" ]]; then
            BACKUP_DIR="$2"
            rollback
        else
            log_error "Please specify backup directory for rollback"
            exit 1
        fi
        ;;
    "verify")
        verify_deployment
        ;;
    "test")
        run_tests
        ;;
    *)
        echo "Usage: $0 {production|staging|development|rollback <backup_dir>|verify|test}"
        echo ""
        echo "Commands:"
        echo "  production   - Deploy to production environment"
        echo "  staging      - Deploy to staging environment"
        echo "  development  - Deploy to development environment"
        echo "  rollback     - Rollback to previous version using specified backup"
        echo "  verify       - Verify current deployment"
        echo "  test         - Run post-deployment tests only"
        exit 1
        ;;
esac