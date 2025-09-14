# 🚀 AI Study Planner - Hackathon Deployment Guide

## 🎯 Fastest Deployment Options (Ranked by Speed)

### Option 1: Railway.app (⚡ 5 minutes - RECOMMENDED)

**Perfect for hackathons - zero configuration needed!**

1. **Fork this repository** to your GitHub
2. Go to [Railway.app](https://railway.app) and sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your forked `ai-study-planner` repository
5. **Add environment variables:**
   ```
   JWT_SECRET=hackathon_jwt_secret_2024_secure_key
   JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key
   NODE_ENV=production
   CORS_ORIGIN=*
   ```
   
   **Optional (for AI features):**
   ```
   ANTHROPIC_API_KEY=your_anthropic_key_here
   GEMINI_API_KEY=your_gemini_key_here
   ```
6. Click **Deploy** - Railway will automatically detect and build your app!
7. **Your app will be live in ~3-5 minutes** with a URL like: `https://ai-study-planner-production.up.railway.app`

**Cost:** Free tier (500 hours/month) - perfect for hackathons!

---

### Option 2: Vercel (Frontend) + Railway (Backend) (⚡ 7 minutes)

**Best for showcasing the UI quickly**

#### Deploy Frontend to Vercel:
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Build settings:**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Root Directory: `frontend`
4. Deploy!

#### Deploy Backend to Railway:
1. Create new Railway project
2. Select your repo, set root directory to `backend`
3. Add environment variables (same as above)
4. Deploy!

**Result:** Lightning-fast frontend + robust backend

---

### Option 3: AWS Lightsail (⚡ 15 minutes)

**Most professional setup for hackathon judges**

```bash
# 1. Run our automated script
cd aws-deployment
./lightsail-deploy.sh

# 2. SSH into your server (IP provided by script)
ssh ubuntu@YOUR_INSTANCE_IP

# 3. Deploy the app
git clone https://github.com/yourusername/ai-study-planner.git
cd ai-study-planner
docker-compose -f docker-compose.hackathon.yml up -d --build
```

**Cost:** $3.50/month (delete after hackathon)

---

## 🔑 Required Environment Variables

### ✅ Minimal Setup (App works without API keys!)

```bash
# Essential (only these are required)
JWT_SECRET=hackathon_jwt_secret_2024
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024
NODE_ENV=production
```

### 🚀 Enhanced Setup (for full AI features)

```bash
# Add these for AI-powered features
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here

# Optional for email features
SENDGRID_API_KEY=your_sendgrid_key_here
EMAIL_FROM=noreply@yourdomain.com
```

**Good News:** Your app is designed to work as a prototype without external API keys! It includes:
- ✅ Mock data generation for demo purposes
- ✅ Fallback study plan templates
- ✅ Built-in content safety filters
- ✅ Complete UI/UX functionality

## 🎬 Demo Preparation Checklist

### Before Deployment:
- [ ] Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
- [ ] Test the app locally: `docker-compose up`
- [ ] Prepare your demo script/story
- [ ] Take screenshots for your submission

### After Deployment:
- [ ] Test all major features on the live URL
- [ ] Create a parent account and child profile
- [ ] Generate a study plan to show AI functionality
- [ ] Test the child dashboard and activity completion
- [ ] Update your `HACKATHON_SUBMISSION.md` with the live URL

## 🎯 Demo Flow for Judges

1. **Landing Page** → Show the clean, professional design
2. **Parent Registration** → Quick signup process
3. **Child Profile Creation** → Show the child-safe onboarding
4. **AI Study Plan Generation** → Demonstrate the AI integration
5. **Child Dashboard** → Show the gamified learning experience
6. **Parent Analytics** → Display progress tracking and insights
7. **Safety Features** → Highlight parental controls and content filtering

## 🚨 Quick Fixes for Common Issues

### Database Connection Error:
```bash
# Railway/Vercel: Database auto-provisions, no action needed
# Lightsail: Restart the backend container
docker-compose restart backend
```

### API Key Issues:
```bash
# Check environment variables are set
echo $ANTHROPIC_API_KEY
# If empty, add to your deployment platform's env vars
```

### Build Failures:
```bash
# Clear cache and rebuild
docker-compose down
docker-compose up --build
```

### Frontend Not Loading:
```bash
# Check if backend is running
curl http://your-domain.com/health
# Should return: {"status": "ok"}
```

## 📱 Mobile-Friendly Testing

Your app is responsive! Test these URLs on mobile:
- `/` - Landing page
- `/child/dashboard` - Child interface (touch-friendly)
- `/parent/dashboard` - Parent analytics
- `/child/login` - Child login with PIN

## 🏆 Hackathon Submission Template

Update your `HACKATHON_SUBMISSION.md`:

```markdown
## 🔗 Live Demo
**URL:** https://your-deployed-app.com
**Test Account:** 
- Parent Email: demo@parent.com / Password: Demo123!
- Child PIN: 1234

## 🎥 Video Demo
[Optional: Record a 2-minute walkthrough]

## 🛠️ Technology Stack
- Frontend: React 18 + TypeScript + MUI + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- AI: Anthropic Claude + Google Gemini
- Deployment: Railway.app / AWS Lightsail
- Testing: Jest + Cypress + React Testing Library
```

## 💡 Pro Tips for Hackathon Success

1. **Deploy Early:** Get a working version online ASAP, then iterate
2. **Test on Mobile:** Judges often test on phones
3. **Prepare Demo Data:** Pre-populate with interesting study plans
4. **Have Backups:** Deploy to 2 platforms if possible
5. **Document Everything:** Clear README and submission docs
6. **Show Real Value:** Focus on the AI-powered personalization
7. **Highlight Safety:** Emphasize child-safe features for judges

## 🆘 Emergency Support

If you run into issues:

1. **Check the logs:**
   ```bash
   # Railway: View logs in dashboard
   # Lightsail: docker-compose logs
   # Vercel: Check function logs
   ```

2. **Fallback plan:** Deploy frontend-only to Vercel with mock data
3. **Contact:** Create GitHub issue with deployment logs

## 🎉 You're Ready!

Choose your deployment method and get your AI Study Planner live for the hackathon. The Railway option is your fastest path to success!

**Good luck! 🚀**