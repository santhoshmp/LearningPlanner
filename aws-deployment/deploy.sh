#!/bin/bash

# AI Study Planner - AWS Deployment Script
# This script deploys the application using AWS App Runner with RDS and ElastiCache

set -e

echo "🚀 Starting AI Study Planner AWS Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o 'AWSCLIV2.pkg'"
    echo "   sudo installer -pkg AWSCLIV2.pkg -target /"
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Not logged in to AWS. Please run: aws configure"
    exit 1
fi

# Set variables
APP_NAME="ai-study-planner"
REGION="us-east-1"
DB_NAME="aistudyplanner"
DB_USERNAME="postgres"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

echo "📋 Configuration:"
echo "   App Name: $APP_NAME"
echo "   Region: $REGION"
echo "   Database: $DB_NAME"

# Create RDS PostgreSQL instance
echo "🗄️  Creating RDS PostgreSQL instance..."
DB_INSTANCE_ID="$APP_NAME-db"

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --publicly-accessible \
    --region $REGION \
    --no-multi-az \
    --no-storage-encrypted \
    --backup-retention-period 7 \
    --port 5432 \
    --no-deletion-protection

echo "⏳ Waiting for RDS instance to be available..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $REGION

# Get RDS endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "✅ RDS instance created: $DB_ENDPOINT"

# Create ElastiCache Redis cluster
echo "🔄 Creating ElastiCache Redis cluster..."
REDIS_CLUSTER_ID="$APP_NAME-redis"

aws elasticache create-cache-cluster \
    --cache-cluster-id $REDIS_CLUSTER_ID \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1 \
    --region $REGION

echo "⏳ Waiting for Redis cluster to be available..."
aws elasticache wait cache-cluster-available --cache-cluster-id $REDIS_CLUSTER_ID --region $REGION

# Get Redis endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id $REDIS_CLUSTER_ID \
    --show-cache-node-info \
    --region $REGION \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text)

echo "✅ Redis cluster created: $REDIS_ENDPOINT"

# Create environment variables file for App Runner
cat > .env.aws << EOF
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME
REDIS_URL=redis://$REDIS_ENDPOINT:6379
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your_anthropic_key_here}
GEMINI_API_KEY=${GEMINI_API_KEY:-your_gemini_key_here}
SENDGRID_API_KEY=${SENDGRID_API_KEY:-your_sendgrid_key_here}
EMAIL_FROM=noreply@aistudyplanner.com
CORS_ORIGIN=*
LOG_LEVEL=info
PORT=80
EOF

echo "📝 Environment variables created in .env.aws"

# Create App Runner service configuration
cat > apprunner-service.json << EOF
{
    "ServiceName": "$APP_NAME",
    "SourceConfiguration": {
        "AutoDeploymentsEnabled": false,
        "CodeRepository": {
            "RepositoryUrl": "https://github.com/yourusername/ai-study-planner",
            "SourceCodeVersion": {
                "Type": "BRANCH",
                "Value": "main"
            },
            "CodeConfiguration": {
                "ConfigurationSource": "REPOSITORY",
                "CodeConfigurationValues": {
                    "Runtime": "DOCKER",
                    "BuildCommand": "docker-compose -f docker-compose.aws.yml build",
                    "StartCommand": "docker-compose -f docker-compose.aws.yml up",
                    "RuntimeEnvironmentVariables": {
                        "NODE_ENV": "production",
                        "DATABASE_URL": "postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME",
                        "REDIS_URL": "redis://$REDIS_ENDPOINT:6379",
                        "JWT_SECRET": "$JWT_SECRET",
                        "JWT_REFRESH_SECRET": "$JWT_REFRESH_SECRET",
                        "CORS_ORIGIN": "*",
                        "LOG_LEVEL": "info",
                        "PORT": "80"
                    }
                }
            }
        }
    },
    "InstanceConfiguration": {
        "Cpu": "0.25 vCPU",
        "Memory": "0.5 GB"
    },
    "HealthCheckConfiguration": {
        "Protocol": "HTTP",
        "Path": "/health",
        "Interval": 10,
        "Timeout": 5,
        "HealthyThreshold": 1,
        "UnhealthyThreshold": 5
    }
}
EOF

echo "🚀 App Runner configuration created"

echo ""
echo "🎉 AWS Infrastructure Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub if you haven't already"
echo "2. Update the repository URL in apprunner-service.json"
echo "3. Add your API keys to the environment variables:"
echo "   - ANTHROPIC_API_KEY"
echo "   - GEMINI_API_KEY (optional)"
echo "   - SENDGRID_API_KEY (optional)"
echo ""
echo "4. Create the App Runner service:"
echo "   aws apprunner create-service --cli-input-json file://apprunner-service.json --region $REGION"
echo ""
echo "📊 Resource Information:"
echo "   Database: $DB_ENDPOINT"
echo "   Redis: $REDIS_ENDPOINT"
echo "   Database Password: $DB_PASSWORD"
echo "   Redis Password: $REDIS_PASSWORD"
echo ""
echo "💡 Save these credentials securely!"
echo ""
echo "🔗 After deployment, your app will be available at the App Runner service URL"
echo "   You can find it in the AWS Console or by running:"
echo "   aws apprunner list-services --region $REGION"