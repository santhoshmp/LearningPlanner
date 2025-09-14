#!/bin/bash

# AI Study Planner - AWS Lightsail Deployment (Easiest Option)
# This is the simplest way to deploy for hackathons

set -e

echo "🚀 AI Study Planner - Lightsail Deployment (Hackathon Ready!)"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Installing..."
    echo "For macOS: brew install awscli"
    echo "For others: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Variables
INSTANCE_NAME="ai-study-planner-hackathon"
BLUEPRINT_ID="ubuntu_20_04"
BUNDLE_ID="nano_2_0"  # $3.50/month
REGION="us-east-1"

echo "📋 Configuration:"
echo "   Instance: $INSTANCE_NAME"
echo "   Plan: Lightsail Nano ($3.50/month)"
echo "   Region: $REGION"
echo ""

# Create Lightsail instance
echo "🖥️  Creating Lightsail instance..."

aws lightsail create-instances \
    --instance-names $INSTANCE_NAME \
    --availability-zone ${REGION}a \
    --blueprint-id $BLUEPRINT_ID \
    --bundle-id $BUNDLE_ID \
    --region $REGION

echo "⏳ Waiting for instance to be running..."
sleep 30

# Get instance IP
INSTANCE_IP=$(aws lightsail get-instance \
    --instance-name $INSTANCE_NAME \
    --region $REGION \
    --query 'instance.publicIpAddress' \
    --output text)

echo "✅ Instance created with IP: $INSTANCE_IP"

# Create startup script
cat > startup-script.sh << 'EOF'
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install -y git

# Clone repository
cd /home/ubuntu
git clone https://github.com/yourusername/ai-study-planner.git
cd ai-study-planner

# Create environment file
cat > .env << 'ENVEOF'
# Database Configuration (using SQLite for simplicity)
DATABASE_URL=file:./dev.db

# JWT Authentication
JWT_SECRET=hackathon_jwt_secret_2024
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024

# API Keys (add your real keys here)
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
SENDGRID_API_KEY=your_sendgrid_key_here

# Email Configuration
EMAIL_FROM=noreply@aistudyplanner.com

# CORS Configuration
CORS_ORIGIN=*

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=80
ENVEOF

# Create simplified docker-compose for hackathon
cat > docker-compose.hackathon.yml << 'DOCKEREOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./dev.db
      - JWT_SECRET=hackathon_jwt_secret_2024
      - JWT_REFRESH_SECRET=hackathon_refresh_secret_2024
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - CORS_ORIGIN=*
      - PORT=3001
    volumes:
      - ./backend/dev.db:/app/dev.db
    networks:
      - app-network
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    networks:
      - app-network
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/conf.d/aws.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: always

networks:
  app-network:
    driver: bridge
DOCKEREOF

# Build and start the application
sudo docker-compose -f docker-compose.hackathon.yml up -d --build

# Setup database
sudo docker-compose -f docker-compose.hackathon.yml exec backend npx prisma migrate deploy
sudo docker-compose -f docker-compose.hackathon.yml exec backend npx prisma db seed

echo "🎉 Deployment complete!"
echo "Your app is running at: http://$(curl -s ifconfig.me)"
EOF

# Upload and run startup script
echo "📤 Uploading startup script..."
aws lightsail put-instance-public-ports \
    --instance-name $INSTANCE_NAME \
    --port-infos fromPort=80,toPort=80,protocol=TCP \
    --region $REGION

# Create a simple deployment instruction file
cat > HACKATHON_DEPLOY_INSTRUCTIONS.md << EOF
# 🚀 Hackathon Deployment Instructions

## Quick Deploy to AWS Lightsail (Easiest!)

### Prerequisites
1. AWS Account (free tier works)
2. AWS CLI installed and configured
3. Your API keys ready

### Step 1: Deploy Infrastructure
\`\`\`bash
cd aws-deployment
./lightsail-deploy.sh
\`\`\`

### Step 2: Connect to Your Server
\`\`\`bash
# Get your instance IP
aws lightsail get-instance --instance-name ai-study-planner-hackathon --region us-east-1

# SSH into your server
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@YOUR_INSTANCE_IP
\`\`\`

### Step 3: Deploy Your App
\`\`\`bash
# On the server
git clone https://github.com/yourusername/ai-study-planner.git
cd ai-study-planner

# Add your API keys to .env file
nano .env

# Deploy with Docker
docker-compose -f docker-compose.hackathon.yml up -d --build

# Setup database
docker-compose -f docker-compose.hackathon.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.hackathon.yml exec backend npx prisma db seed
\`\`\`

### Step 4: Access Your App
Your app will be available at: \`http://YOUR_INSTANCE_IP\`

## Alternative: One-Click Deploy with Railway (Even Easier!)

1. Fork this repository
2. Go to [Railway.app](https://railway.app)
3. Click "Deploy from GitHub"
4. Select your forked repository
5. Add environment variables:
   - \`ANTHROPIC_API_KEY\`
   - \`JWT_SECRET\`
   - \`JWT_REFRESH_SECRET\`
6. Deploy!

## Alternative: Vercel + PlanetScale (Frontend Only)

If you want to deploy just the frontend for demo:

1. Fork this repository
2. Go to [Vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set build command: \`cd frontend && npm run build\`
5. Set output directory: \`frontend/dist\`
6. Deploy!

## Environment Variables Needed

\`\`\`bash
# Required
ANTHROPIC_API_KEY=your_key_here
JWT_SECRET=any_random_string
JWT_REFRESH_SECRET=another_random_string

# Optional (for full functionality)
GEMINI_API_KEY=your_gemini_key
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=your_email@domain.com
\`\`\`

## Troubleshooting

### If deployment fails:
1. Check Docker logs: \`docker-compose logs\`
2. Restart services: \`docker-compose restart\`
3. Check ports: \`sudo netstat -tlnp | grep :80\`

### If database issues:
1. Reset database: \`docker-compose exec backend npx prisma migrate reset\`
2. Reseed data: \`docker-compose exec backend npx prisma db seed\`

## Cost Estimate
- AWS Lightsail: $3.50/month (can be stopped after hackathon)
- Railway: Free tier available
- Vercel: Free for personal projects

## Demo URLs
After deployment, update your HACKATHON_SUBMISSION.md with:
- Live Demo URL
- GitHub Repository
- Video Demo (optional)

Good luck with your hackathon! 🎉
EOF

echo ""
echo "🎉 Lightsail Deployment Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: ./lightsail-deploy.sh"
echo "2. SSH into your instance: ssh ubuntu@$INSTANCE_IP"
echo "3. Follow the instructions in HACKATHON_DEPLOY_INSTRUCTIONS.md"
echo ""
echo "💡 Your instance IP: $INSTANCE_IP"
echo "💰 Cost: ~$3.50/month (can be deleted after hackathon)"
echo ""
echo "🔗 Alternative quick options:"
echo "   - Railway.app (one-click deploy)"
echo "   - Vercel.com (frontend only)"
echo "   - Render.com (full-stack)"
echo ""
echo "📖 Full instructions: HACKATHON_DEPLOY_INSTRUCTIONS.md"