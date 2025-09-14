# 🚀 AI Study Planner - 5-Minute Hackathon Deployment

## ⚡ Super Quick Deploy (Railway - Recommended)

### Step 1: Prepare Your Repo
```bash
# Make sure your code is on GitHub
git add .
git commit -m "Ready for hackathon deployment"
git push origin main
```

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `ai-study-planner` repository
5. **Railway will auto-detect your Node.js project**
6. **Add these environment variables in Railway dashboard:**
   ```
   JWT_SECRET=hackathon_jwt_secret_2024_secure_key_for_demo_purposes
   JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key_for_demo_purposes
   NODE_ENV=production
   CORS_ORIGIN=*
   PORT=3001
   ```
7. Click **Deploy**
8. **Done!** Your app will be live in ~5-8 minutes

**Your live URL:** `https://your-app-name.up.railway.app`

---

## 🎯 What Works Without API Keys

Your app is fully functional as a prototype:

✅ **Complete UI/UX** - All components and layouts work  
✅ **User Authentication** - Parent/child login system  
✅ **Child Profiles** - Create and manage child accounts  
✅ **Study Plans** - Template-based study plan generation  
✅ **Progress Tracking** - Activity completion and analytics  
✅ **Badge System** - Achievement tracking and rewards  
✅ **Analytics Dashboard** - Parent progress monitoring  
✅ **Mobile Responsive** - Works on all devices  
✅ **Accessibility** - WCAG 2.1 AA compliant  

---

## 🤖 Optional: Add AI Features

If you want the full AI experience, add these to Railway:

```bash
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**Get Anthropic API Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and get $5 free credits
3. Create API key

---

## 🎬 Demo Flow for Judges

1. **Landing Page** → Professional design showcase
2. **Parent Registration** → Quick signup process
3. **Child Profile Creation** → Child-safe onboarding
4. **Study Plan Creation** → Template-based generation
5. **Child Dashboard** → Gamified learning interface
6. **Activity Completion** → Progress tracking demo
7. **Parent Analytics** → Progress monitoring dashboard

---

## 🆘 Troubleshooting

### Railway Build Failed (Nixpacks Error)?
**Solution:** I've added the necessary config files:
- ✅ `package.json` at root level
- ✅ `nixpacks.toml` for build configuration
- ✅ `Procfile` for start command

**If still failing:**
1. Try **Render.com** instead (Option 2 above)
2. Or deploy backend only to Railway:
   - Create new Railway project
   - Set **Root Directory** to `backend`
   - Use start command: `npm start`

### Build Failed?
- Check that your repo has both `frontend/` and `backend/` folders
- Make sure `package.json` files exist in both directories
- Verify you've pushed the new config files to GitHub

### App Not Loading?
- Check deployment logs in the platform dashboard
- Verify environment variables are set correctly
- Make sure PORT is set to 3001

### Database Issues?
- Railway/Render auto-provision PostgreSQL
- No manual database setup needed
- Database URL is automatically provided

### Quick Fix: Backend-Only Deployment
If full-stack deployment fails, deploy just the backend:
1. Create new Railway/Render project
2. Set root directory to `backend`
3. Add environment variables
4. Your API will be live for testing

---

## 🏆 Alternative Deployment Options

### Option 2: Render.com (More Reliable)
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New Web Service"**
4. Connect your GitHub repo
5. **Settings:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: `Node`
6. Add the same environment variables as Railway
7. Deploy!

### Option 3: Vercel (Frontend Only Demo)
1. Go to [Vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set build command: `cd frontend && npm run build`
4. Set output directory: `frontend/dist`
5. Deploy!

### Option 4: Local Demo
```bash
# Quick local demo
docker-compose -f docker-compose.hackathon.yml up -d --build
# Access at: http://localhost
```

---

## 📝 Update Your Submission

After deployment, update your `HACKATHON_SUBMISSION.md`:

```markdown
## 🔗 Live Demo
**URL:** https://your-app-name.up.railway.app

## 🎥 Demo Credentials
- Parent Email: demo@parent.com / Password: Demo123!
- Child PIN: 1234

## 🛠️ Technology Stack
- Frontend: React 18 + TypeScript + MUI + Tailwind
- Backend: Node.js + Express + TypeScript + PostgreSQL
- Deployment: Railway.app
- AI: Anthropic Claude (optional)
```

---

## 🎉 You're Ready!

Your AI Study Planner is now live and ready for the hackathon judges!

**Total Time:** ~5 minutes  
**Cost:** Free (Railway free tier)  
**Features:** Fully functional prototype  

Good luck! 🚀