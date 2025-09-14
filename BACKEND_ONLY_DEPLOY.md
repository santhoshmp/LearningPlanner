# 🚀 Backend-Only Deployment (Fastest Option)

If the full-stack deployment is giving you trouble, deploy just the backend API for your hackathon demo.

## ⚡ Railway Backend Deployment

### Step 1: Create New Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `ai-study-planner` repository
4. **Important:** Set **Root Directory** to `backend`

### Step 2: Configure Environment Variables
Add these in Railway dashboard:
```bash
NODE_ENV=production
JWT_SECRET=hackathon_jwt_secret_2024_secure_key_for_demo_purposes
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key_for_demo_purposes
CORS_ORIGIN=*
PORT=3001
LOG_LEVEL=info
DEMO_MODE=true
ENABLE_MOCK_DATA=true
```

### Step 3: Deploy
- Railway will auto-detect the Node.js backend
- Build command: `npm run build`
- Start command: `npm start`
- **Done!** Your API will be live in ~3-5 minutes

## 🎯 What You Get

Your backend API will be fully functional with:

✅ **All API Endpoints** - Complete REST API  
✅ **Authentication** - Parent/child login system  
✅ **Database** - Auto-provisioned PostgreSQL  
✅ **Study Plans** - Template-based generation  
✅ **Progress Tracking** - Activity completion API  
✅ **Analytics** - Progress monitoring endpoints  
✅ **Badge System** - Achievement tracking API  

## 🔗 API Testing

Your live API will be at: `https://your-app-name.up.railway.app`

### Test Endpoints:
```bash
# Health check
GET https://your-app-name.up.railway.app/health

# Register parent
POST https://your-app-name.up.railway.app/auth/register
{
  "email": "demo@parent.com",
  "password": "Demo123!",
  "name": "Demo Parent"
}

# Login
POST https://your-app-name.up.railway.app/auth/login
{
  "email": "demo@parent.com",
  "password": "Demo123!"
}
```

## 📱 Frontend Options

### Option 1: Local Frontend
```bash
# Run frontend locally, pointing to your live API
cd frontend
npm install
VITE_API_URL=https://your-app-name.up.railway.app npm run dev
```

### Option 2: Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-app-name.up.railway.app
   ```
5. Deploy!

## 🎬 Demo Strategy

For hackathon judges:

1. **Show the API** - Use Postman/Insomnia to demo endpoints
2. **Database Admin** - Show Railway database with real data
3. **Architecture Diagram** - Explain the full-stack design
4. **Code Walkthrough** - Show the comprehensive codebase
5. **Future Vision** - Explain how the frontend connects

## 🏆 Why This Works for Hackathons

- ✅ **Fast Deployment** - Backend up in minutes
- ✅ **Real Database** - Persistent data storage
- ✅ **Complete API** - All functionality accessible
- ✅ **Professional** - Shows backend architecture skills
- ✅ **Scalable** - Easy to add frontend later

## 🔧 Alternative: Render.com

If Railway doesn't work:

1. Go to [Render.com](https://render.com)
2. **New Web Service** → Connect GitHub
3. **Root Directory:** `backend`
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm start`
6. Add same environment variables
7. Deploy!

Your backend API will be production-ready and perfect for demonstrating your hackathon project! 🚀