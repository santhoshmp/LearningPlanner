# AI Study Planner Deployment Guide

This guide provides instructions for deploying the AI Study Planner application to a production environment.

## Prerequisites

- Docker and Docker Compose installed on the server
- Domain name configured with DNS pointing to your server
- SSL certificates for your domain

## Initial Setup

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/ai-study-planner.git
   cd ai-study-planner
   ```

2. Create a `.env` file based on the provided example:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your production settings:
   ```bash
   nano .env
   ```

4. Create directories for SSL certificates:
   ```bash
   mkdir -p nginx/ssl
   ```

5. Copy your SSL certificates to the appropriate directory:
   ```bash
   cp /path/to/fullchain.pem nginx/ssl/
   cp /path/to/privkey.pem nginx/ssl/
   ```

## Database Setup

1. Start the database container:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d postgres
   ```

2. Wait for the database to initialize (check with `docker-compose -f docker-compose.prod.yml logs postgres`)

3. Run database migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

## Deployment

1. Build and start all services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. Verify that all services are running:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. Check the logs for any errors:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

## Scheduled Backups

1. Make the backup script executable:
   ```bash
   chmod +x backend/scripts/backup-database.sh
   ```

2. Set up a cron job to run daily backups:
   ```bash
   crontab -e
   ```

3. Add the following line to run backups daily at 2 AM:
   ```
   0 2 * * * cd /path/to/ai-study-planner && ./backend/scripts/backup-database.sh >> ./backups/backup.log 2>&1
   ```

## Monitoring

1. Check application health:
   ```bash
   curl https://yourdomain.com/health
   ```

2. View application logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

3. Monitor container resource usage:
   ```bash
   docker stats
   ```

## Updating the Application

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart the services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. Run any new database migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

## Troubleshooting

### Database Connection Issues
- Check that the database container is running: `docker-compose -f docker-compose.prod.yml ps postgres`
- Verify database credentials in the `.env` file
- Check database logs: `docker-compose -f docker-compose.prod.yml logs postgres`

### API Connection Issues
- Check that the backend container is running: `docker-compose -f docker-compose.prod.yml ps backend`
- Verify API logs: `docker-compose -f docker-compose.prod.yml logs backend`
- Check Nginx configuration: `docker-compose -f docker-compose.prod.yml exec nginx nginx -t`

### SSL Certificate Issues
- Verify certificate paths in `nginx/conf.d/default.conf`
- Check certificate expiration: `openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep "Not After"`
- Renew certificates if needed and restart Nginx: `docker-compose -f docker-compose.prod.yml restart nginx`