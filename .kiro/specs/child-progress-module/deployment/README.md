# Child Progress Module Deployment Guide

## Overview

This directory contains all the necessary files and documentation for deploying the Child Progress Module to various environments. The deployment supports Docker Compose for local/staging environments and Kubernetes for production environments.

## Quick Start

### Local Development Deployment

```bash
# 1. Clone the repository and navigate to the project root
cd /path/to/ai-study-planner

# 2. Copy environment template
cp .env.example .env

# 3. Configure environment variables (see environment-config.md)
nano .env

# 4. Deploy using the child progress module script
./.kiro/specs/child-progress-module/deployment/deploy-child-progress-module.sh development

# 5. Verify deployment
curl http://localhost:3001/health
curl http://localhost:3000
```

### Production Deployment

```bash
# 1. Prepare production environment
./.kiro/specs/child-progress-module/deployment/deploy-child-progress-module.sh production

# 2. For Kubernetes deployment
kubectl apply -f .kiro/specs/child-progress-module/deployment/kubernetes/
```

## File Structure

```
deployment/
├── README.md                           # This file
├── deploy-child-progress-module.sh     # Main deployment script
├── environment-config.md               # Environment configuration guide
├── docker-compose.child-progress.yml   # Docker Compose configuration
├── kubernetes/
│   └── child-progress-deployment.yaml  # Kubernetes deployment manifests
├── monitoring/
│   ├── prometheus.yml                  # Prometheus configuration
│   └── grafana/                        # Grafana dashboards
├── nginx/
│   └── nginx.conf                      # Nginx configuration
└── scripts/
    ├── backup.sh                       # Backup script
    ├── restore.sh                      # Restore script
    └── health-check.sh                 # Health check script
```

## Deployment Methods

### 1. Docker Compose Deployment

**Best for:** Development, staging, small production deployments

**Prerequisites:**
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB disk space

**Steps:**

1. **Prepare Environment**
   ```bash
   # Copy and configure environment file
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

2. **Deploy Services**
   ```bash
   # Using the deployment script (recommended)
   ./deploy-child-progress-module.sh production
   
   # Or manually with Docker Compose
   docker-compose -f docker-compose.child-progress.yml up -d
   ```

3. **Verify Deployment**
   ```bash
   # Check service health
   docker-compose -f docker-compose.child-progress.yml ps
   
   # Check logs
   docker-compose -f docker-compose.child-progress.yml logs -f backend
   ```

### 2. Kubernetes Deployment

**Best for:** Production environments, high availability, scalability

**Prerequisites:**
- Kubernetes 1.21+
- kubectl configured
- Helm 3.0+ (optional)
- Ingress controller (nginx)
- Cert-manager for SSL

**Steps:**

1. **Prepare Secrets**
   ```bash
   # Create namespace
   kubectl create namespace ai-study-planner
   
   # Create secrets
   kubectl create secret generic child-progress-secrets \
     --from-literal=DATABASE_URL="postgresql://..." \
     --from-literal=REDIS_PASSWORD="..." \
     --from-literal=JWT_SECRET="..." \
     -n ai-study-planner
   ```

2. **Deploy Application**
   ```bash
   # Apply all manifests
   kubectl apply -f kubernetes/child-progress-deployment.yaml
   
   # Check deployment status
   kubectl get pods -n ai-study-planner
   kubectl get services -n ai-study-planner
   ```

3. **Configure Ingress**
   ```bash
   # Verify ingress
   kubectl get ingress -n ai-study-planner
   
   # Check SSL certificate
   kubectl describe certificate ai-study-planner-tls -n ai-study-planner
   ```

## Environment Configuration

### Required Environment Variables

See `environment-config.md` for comprehensive configuration details.

**Critical Variables:**
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis
REDIS_URL="redis://host:6379"
REDIS_PASSWORD="secure_password"

# JWT Secrets
JWT_SECRET="your_jwt_secret_minimum_32_characters"
JWT_REFRESH_SECRET="your_refresh_secret_minimum_32_characters"

# Child Progress Module
FEATURE_CHILD_PROGRESS_MODULE=true
BADGE_PROCESSING_ENABLED=true
CHILD_AUTH_ENABLED=true
```

### Environment-Specific Settings

**Development:**
- Relaxed security settings
- Debug logging enabled
- Mock external services
- Extended session timeouts

**Staging:**
- Production-like configuration
- Real external services
- Performance monitoring
- Load testing capabilities

**Production:**
- Maximum security settings
- Optimized performance
- Full monitoring and alerting
- Backup and disaster recovery

## Database Setup

### Initial Setup

1. **Run Migrations**
   ```bash
   # Using deployment script (automatic)
   ./deploy-child-progress-module.sh production
   
   # Manual migration
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Seed Data**
   ```bash
   # Seed master data
   npm run seed
   
   # Create test data (development only)
   npm run seed:test
   ```

### Database Optimization

The deployment includes optimized PostgreSQL settings:

```sql
-- Performance settings applied automatically
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
```

## Monitoring and Observability

### Health Checks

**Application Health:**
```bash
# Backend health
curl http://localhost:3001/health

# Child progress specific health
curl http://localhost:3001/health/child-progress

# Frontend health
curl http://localhost:3000
```

**Service Health:**
```bash
# Database connectivity
docker-compose exec backend npx prisma db pull

# Redis connectivity
docker-compose exec redis redis-cli ping
```

### Monitoring Stack

The deployment includes:

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization and dashboards
3. **Application logs** - Structured logging with Winston
4. **Performance metrics** - Child progress specific metrics

**Access Monitoring:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### Key Metrics to Monitor

**Child Progress Module Metrics:**
- Badge processing latency
- Progress update frequency
- Child authentication success rate
- Session timeout rates
- Cache hit rates
- Database query performance

**System Metrics:**
- CPU and memory usage
- Database connections
- Redis memory usage
- Response times
- Error rates

## Security Considerations

### Child-Specific Security

1. **Authentication Security**
   - PIN-based authentication
   - Session timeout (20 minutes default)
   - Failed login lockout
   - Device tracking

2. **Data Protection**
   - COPPA compliance
   - Data minimization
   - Encrypted storage
   - Secure transmission

3. **Monitoring and Alerts**
   - Suspicious activity detection
   - Parent notifications
   - Security event logging
   - Emergency logout capabilities

### Network Security

```bash
# Firewall rules (example for Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3001/tcp   # Block direct backend access
sudo ufw deny 5432/tcp   # Block direct database access
sudo ufw deny 6379/tcp   # Block direct Redis access
```

## Backup and Recovery

### Automated Backups

The deployment script creates backups before deployment:

```bash
# Backup location
/tmp/child-progress-backup-YYYYMMDD-HHMMSS/
├── database_backup.sql
├── backend_src/
├── frontend_src/
├── .env.backup
└── docker-compose.yml.backup
```

### Manual Backup

```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres ai_study_planner > backup.sql

# Application files backup
tar -czf app-backup.tar.gz backend/src frontend/src

# Configuration backup
cp .env .env.backup
```

### Recovery Process

```bash
# Using deployment script rollback
./deploy-child-progress-module.sh rollback /path/to/backup

# Manual recovery
docker-compose exec postgres psql -U postgres -d ai_study_planner < backup.sql
```

## Performance Optimization

### Caching Strategy

1. **Redis Caching**
   - Badge definitions (1 hour TTL)
   - Progress summaries (5 minutes TTL)
   - Session data (20 minutes TTL)
   - Analytics data (10 minutes TTL)

2. **Database Optimization**
   - Optimized indexes for child progress queries
   - Connection pooling
   - Query optimization
   - Batch processing for badge awards

3. **Frontend Optimization**
   - Lazy loading for components
   - Code splitting
   - Asset optimization
   - CDN integration (production)

### Scaling Considerations

**Horizontal Scaling:**
- Multiple backend instances
- Load balancer configuration
- Session affinity for WebSocket connections
- Database read replicas

**Vertical Scaling:**
- Increased memory for caching
- More CPU cores for processing
- SSD storage for database
- Network bandwidth optimization

## Troubleshooting

### Common Issues

1. **Badge Processing Delays**
   ```bash
   # Check badge processing logs
   docker-compose logs backend | grep badge
   
   # Verify Redis connectivity
   docker-compose exec redis redis-cli ping
   
   # Check badge processing queue
   docker-compose exec backend node -e "console.log(require('./dist/services/childBadgeService').getQueueStatus())"
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   docker-compose exec backend npx prisma db pull
   
   # Verify database logs
   docker-compose logs postgres
   
   # Check connection pool status
   docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
   ```

3. **Frontend Loading Issues**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Verify API connectivity
   curl http://localhost:3001/health
   
   # Check browser console for errors
   ```

### Performance Issues

1. **Slow Badge Processing**
   - Enable badge caching
   - Increase Redis memory
   - Optimize badge eligibility queries
   - Enable batch processing

2. **Database Performance**
   - Check slow query log
   - Analyze query execution plans
   - Add missing indexes
   - Optimize connection pool settings

3. **High Memory Usage**
   - Monitor cache usage
   - Check for memory leaks
   - Optimize image sizes
   - Increase swap space if needed

### Getting Help

**Log Locations:**
- Application logs: `/app/logs/` (in container)
- Database logs: Docker logs
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/`

**Debug Commands:**
```bash
# Check all service status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres

# Check resource usage
docker stats
```

**Support Channels:**
- Technical Documentation: See `docs/` directory
- Issue Tracking: GitHub Issues
- Emergency Support: Check deployment logs and health endpoints

## Maintenance

### Regular Maintenance Tasks

1. **Daily**
   - Check service health
   - Monitor error rates
   - Review security alerts

2. **Weekly**
   - Update dependencies
   - Review performance metrics
   - Clean up old logs

3. **Monthly**
   - Security updates
   - Database maintenance
   - Backup verification
   - Performance optimization review

### Update Process

```bash
# 1. Backup current deployment
./deploy-child-progress-module.sh backup

# 2. Update application code
git pull origin main

# 3. Deploy updates
./deploy-child-progress-module.sh production

# 4. Verify deployment
./deploy-child-progress-module.sh verify
```

This deployment guide provides comprehensive instructions for deploying and maintaining the Child Progress Module in various environments while ensuring security, performance, and reliability.