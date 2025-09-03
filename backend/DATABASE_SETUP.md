# Database Setup Guide

This guide will help you set up PostgreSQL and Redis for the AI Study Planner application.

## Prerequisites

You need to have Docker installed on your system. If you don't have Docker, you can install it from [https://docker.com](https://docker.com).

## Quick Setup with Docker Compose

1. **Start the database services:**
   ```bash
   docker compose up -d postgres redis
   ```

2. **Verify the services are running:**
   ```bash
   docker compose ps
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

4. **Test database connections:**
   ```bash
   npm run test:db
   ```

## Manual Setup (Alternative)

### PostgreSQL Setup

1. **Install PostgreSQL:**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Start PostgreSQL service:**
   - macOS: `brew services start postgresql`
   - Ubuntu: `sudo systemctl start postgresql`
   - Windows: Use Services app or pg_ctl

3. **Create database:**
   ```bash
   createdb ai_study_planner
   ```

### Redis Setup

1. **Install Redis:**
   - macOS: `brew install redis`
   - Ubuntu: `sudo apt-get install redis-server`
   - Windows: Use WSL or download from [redis.io](https://redis.io/download)

2. **Start Redis service:**
   - macOS: `brew services start redis`
   - Ubuntu: `sudo systemctl start redis`
   - Windows: `redis-server`

## Environment Configuration

Make sure your `.env` file in the backend directory has the correct database URLs:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_study_planner"
REDIS_URL="redis://localhost:6379"
```

## Troubleshooting

### Connection Issues

1. **PostgreSQL not accessible:**
   - Check if PostgreSQL is running: `pg_isready`
   - Verify port 5432 is not blocked
   - Check database exists: `psql -l`

2. **Redis not accessible:**
   - Check if Redis is running: `redis-cli ping`
   - Verify port 6379 is not blocked

3. **Permission Issues:**
   - Make sure the postgres user has the correct permissions
   - For Redis, check if authentication is required

### Docker Issues

1. **Docker not found:**
   - Install Docker Desktop from [docker.com](https://docker.com)
   - Make sure Docker daemon is running

2. **Port conflicts:**
   - Check if ports 5432 or 6379 are already in use
   - Modify docker-compose.yml to use different ports if needed

## Database Schema

The application uses Prisma ORM with the following main entities:
- Users (Parents)
- ChildProfiles
- StudyPlans
- StudyActivities
- ProgressRecords
- Achievements
- HelpRequests

Run `npx prisma studio` to view and manage your database through a web interface.