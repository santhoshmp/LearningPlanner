# 🔧 Environment Variables Guide - AI Study Planner

## 🎯 Hackathon Deployment (Minimal Setup)

Your app is designed to work as a **fully functional prototype** without external API keys!

### ✅ Required Variables (Only These!)

```bash
# Authentication & Security
JWT_SECRET=hackathon_jwt_secret_2024_secure_key
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key

# Application Environment
NODE_ENV=production
CORS_ORIGIN=*
```

**That's it!** Your app will work with just these 4 variables.

---

## 🚀 What Works Without API Keys

### Core Functionality ✅
- **User Authentication** - Complete parent/child login system
- **Child Profiles** - Create and manage multiple children
- **Study Plans** - Template-based study plan generation
- **Activities** - Interactive learning activities
- **Progress Tracking** - Complete analytics and progress monitoring
- **Badge System** - Achievement tracking with 15+ badge categories
- **Parent Dashboard** - Comprehensive progress analytics
- **Mobile Responsive** - Works perfectly on all devices
- **Accessibility** - WCAG 2.1 AA compliant

### Built-in Features ✅
- **Mock Data Generation** - Realistic demo data for testing
- **Template System** - Pre-built study plans and activities
- **Content Safety** - Built-in content filtering
- **Error Handling** - Graceful fallbacks throughout the app
- **Performance Optimization** - Caching and optimization built-in

---

## 🤖 Optional: Enhanced AI Features

Add these for full AI-powered functionality:

```bash
# AI Services (Optional)
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here

# Email Services (Optional)
SENDGRID_API_KEY=your_sendgrid_key_here
EMAIL_FROM=noreply@yourdomain.com
```

### What AI Keys Enable:
- **Dynamic Study Plan Generation** - AI creates personalized learning paths
- **Interactive Help Assistant** - Claude provides learning assistance
- **Content Analysis** - AI-powered content safety and recommendations
- **Adaptive Learning** - Plans adjust based on child's progress

---

## 🏗️ Platform-Specific Setup

### Railway.app (Recommended)
```bash
JWT_SECRET=hackathon_jwt_secret_2024_secure_key
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key
NODE_ENV=production
CORS_ORIGIN=*
```

### Vercel
```bash
# Same as Railway, plus:
FRONTEND_URL=https://your-app.vercel.app
```

### AWS Lightsail
```bash
# Same as Railway, plus:
PORT=80
LOG_LEVEL=info
```

---

## 🔒 Security Notes

### JWT Secrets
- Use long, random strings (32+ characters)
- Different secrets for JWT_SECRET and JWT_REFRESH_SECRET
- Never commit real secrets to version control

### CORS Configuration
- Use `*` for hackathon demos
- In production, specify exact domains: `https://yourdomain.com`

---

## 🗄️ Database Configuration

### Automatic (Railway/Vercel)
- **No configuration needed!**
- Platform auto-provisions PostgreSQL
- `DATABASE_URL` is automatically set

### Manual (if needed)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 📧 Email Configuration (Optional)

### Development/Demo
```bash
EMAIL_FROM=noreply@aistudyplanner.com
# No SENDGRID_API_KEY needed - uses mock email service
```

### Production
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

---

## 🎮 Demo Mode Settings

These are automatically enabled for hackathon deployments:

```bash
DEMO_MODE=true
ENABLE_MOCK_DATA=true
CONTENT_SAFETY_ENABLED=true
```

---

## 🔍 Debugging Variables

If you need to troubleshoot:

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

---

## 📋 Complete Example Configurations

### Minimal Hackathon Setup
```bash
JWT_SECRET=hackathon_jwt_secret_2024_secure_key_for_demo_purposes
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key_for_demo
NODE_ENV=production
CORS_ORIGIN=*
```

### Enhanced with AI
```bash
JWT_SECRET=hackathon_jwt_secret_2024_secure_key_for_demo_purposes
JWT_REFRESH_SECRET=hackathon_refresh_secret_2024_secure_key_for_demo
NODE_ENV=production
CORS_ORIGIN=*
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
GEMINI_API_KEY=AIzaSyB-your-gemini-key-here
SENDGRID_API_KEY=SG.your-sendgrid-key-here
EMAIL_FROM=noreply@yourdomain.com
```

---

## 🎉 Ready to Deploy!

Your AI Study Planner is designed to be hackathon-ready with minimal configuration. The app includes comprehensive fallback mechanisms, so you can focus on showcasing the features rather than wrestling with API configurations.

**Next Step:** Choose your deployment platform and use the minimal setup above! 🚀