#!/bin/bash

# Load environment variables
source .env

# Set backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup the database
echo "Backing up database to $BACKUP_FILE..."
docker exec ai-study-planner-db pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully."
  
  # Remove backups older than 30 days
  find $BACKUP_DIR -name "db_backup_*.sql.gz" -type f -mtime +30 -delete
  echo "Removed backups older than 30 days."
else
  echo "Backup failed!"
  exit 1
fi