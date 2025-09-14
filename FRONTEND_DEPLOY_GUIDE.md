# 🚀 Frontend Deployment Guide

## 🎯 Deploy Frontend to Vercel (Recommended)

### Step 1: Get Your Backend URL
From your Railway dashboard, copy your backend URL (something like):
`https://your-app-name.up.railway.app`

### Step 2: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"New Project"** → **Import Git Repository**
4. Select your `LearningPlanner` repository
5. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 3: Add Environment Variables
In Vercel project settings, add:
```bash
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_APP_NAME=AI Study Planner
VITE_ENVIRONMENT=production
```

### Step 4: Deploy!
Click **Deploy** - Your frontend will be live in ~3-5 minutes!

---

## 🔗 **Alternative: Railway Frontend**

### Deploy Frontend as Separate Railway Service:
1. **Create New Railway Project**
2. **Connect same GitHub repo**
3. **Set Root Directory:** `frontend`
4. **Add Environment Variables:**
   ```bash
   VITE_API_URL=https://your-backend-app.up.railway.app
   NODE_ENV=production
   ```
5. **Deploy!**

---

## 🛠️ **Local Frontend Development**

### Connect Local Frontend to Live Backend:
```bash
cd frontend
npm install

# Create .env.local file
echo "VITE_API_URL=https://your-railway-app.up.railway.app" > .env.local

# Start development server
npm run dev
```

Your frontend will run at `http://localhost:3000` and connect to your live Railway backend!

---

## 🔧 **Redis Connection Verification**

Your Redis should already be working! Railway automatically provides `REDIS_URL`. To verify:

### Check Railway Environment Variables:
In your Railway backend project, you should see:
- ✅ `DATABASE_URL` (PostgreSQL)
- ✅ `REDIS_URL` (Redis)
- ✅ Your custom variables (JWT_SECRET, etc.)

### Test Redis Connection:
```bash
# Test your backend health endpoint
curl https://your-railway-app.up.railway.app/health

# Should return: {"status": "ok", "redis": "connected", "database": "connected"}
```

---

## 🎬 **Complete Demo Setup**

### Full-Stack Demo URLs:
- **Backend API:** `https://your-backend.up.railway.app`
- **Frontend App:** `https://your-frontend.vercel.app`
- **Database:** Auto-managed by Railway
- **Redis:** Auto-managed by Railway

### Demo Flow:
1. **Frontend:** Beautiful UI at Vercel URL
2. **Backend:** Robust API at Railway URL
3. **Database:** PostgreSQL with real data
4. **Redis:** Caching and session management
5. **Complete:** Full-stack application!

---

## 📋 **Environment Variables Summary**

### Backend (Railway):
```bash
# Required
JWT_SECRET=hackathon_jwt_secret_2024_secure_key_for_demo_purposes
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key_for_demo_purposes
NODE_ENV=production
CORS_ORIGIN=*

# Auto-provided by Railway
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Frontend (Vercel):
```bash
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_APP_NAME=AI Study Planner
VITE_ENVIRONMENT=production
```

---

## 🎉 **You're Almost There!**

1. **✅ Backend deployed** - Railway with PostgreSQL + Redis
2. **⏳ Frontend deployment** - Follow Vercel steps above
3. **🎯 Complete demo** - Full-stack application ready!

**Next:** Deploy your frontend to Vercel and you'll have a complete full-stack demo! 🚀