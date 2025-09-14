# 🚀 Railway Environment Variables Setup

## Required Environment Variables for Railway

Add these in your Railway dashboard under "Variables" tab:

### **Core Application**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=hackathon_jwt_secret_2024_secure_key_railway
JWT_REFRESH_SECRET=hackathon_jwt_refresh_secret_2024_secure_key_railway
```

### **Database & Cache**
```bash
# Railway will auto-provide these:
DATABASE_URL=postgresql://... (auto-generated)
REDIS_URL=redis://... (auto-generated)
```

### **CORS & Frontend**
```bash
CORS_ORIGIN=*
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### **Email (Optional - for testing)**
```bash
SENDGRID_API_KEY=your_sendgrid_key_or_leave_empty
EMAIL_FROM=noreply@aistudyplanner.com
```

### **AI APIs (Optional - for demo)**
```bash
ANTHROPIC_API_KEY=your_key_or_demo_placeholder
GEMINI_API_KEY=your_key_or_demo_placeholder
```

### **OAuth (Optional - for demo)**
```bash
OAUTH_ENCRYPTION_KEY=hackathon_oauth_encryption_key_32_chars_min_2024
GOOGLE_CLIENT_ID=demo_google_client_id
GOOGLE_CLIENT_SECRET=demo_google_client_secret
```

## 🎯 **Quick Setup Steps:**

1. **In Railway Dashboard:**
   - Go to your LearningPlanner project
   - Click "Variables" tab
   - Add the variables above (start with the Core Application ones)

2. **Generate Domain:**
   - Click "Generate Domain" 
   - Copy the URL (e.g., `https://learningplanner-production-xxxx.up.railway.app`)

3. **Test Health Check:**
   ```bash
   curl https://your-railway-url.up.railway.app/health
   ```

4. **Deploy Frontend to Vercel:**
   - Use the Railway URL as `VITE_API_URL`

## 🚨 **Minimal Setup (Just to get it working):**
If you want to get it working FAST, just add these 4 variables:
```bash
NODE_ENV=production
JWT_SECRET=hackathon_jwt_secret_2024_secure_key_railway
JWT_REFRESH_SECRET=hackathon_jwt_refresh_secret_2024_secure_key_railway
CORS_ORIGIN=*
```

Railway auto-provides DATABASE_URL and REDIS_URL, so you'll be good to go!