# 🚀 CampusZon Deployment Guide

## Free & Reliable Deployment Stack
- **Frontend**: Vercel (Free, Fast, Reliable)
- **Backend**: Render (Free tier, Auto-deploy from GitHub)
- **Databases**: MongoDB Atlas (Already setup) + Render PostgreSQL (Free)

---

## 📋 Prerequisites

1. Create accounts on:
   - [GitHub](https://github.com) (to store your code)
   - [Vercel](https://vercel.com) (for frontend)
   - [Render](https://render.com) (for backend)

2. Install Git if not already installed

---

## 🔧 Step 1: Prepare Your Code for Deployment

### A. Update Backend CORS Settings

Edit `campuszon-server/src/index.js` and update CORS to accept your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));
```

### B. Update Frontend API URLs

Edit `campuszon-client/src/` files to use environment variables:

Replace hardcoded `http://localhost:5000` with:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## 📦 Step 2: Push to GitHub

```bash
# In the root directory (Campus-Kart)
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/campus-kart.git
git branch -M main
git push -u origin main
```

---

## 🖥️ Step 3: Deploy Backend on Render

### A. Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `campuszon-db`
   - **Database**: `campuszon`
   - **User**: (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### B. Deploy Backend Server

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `campuszon-backend` (or any name)
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `campuszon-server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. Add Environment Variables (click "Advanced"):
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   POSTGRES_URI=your_render_postgres_internal_url
   JWT_SECRET=your_super_secret_jwt_key_change_this
   EMAIL_USER=campuszon@gmail.com
   EMAIL_PASS=your_gmail_app_password
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_secret
   GOOGLE_CALLBACK_URL=https://your-backend-name.onrender.com/auth/google/callback
   FRONTEND_URL=https://your-frontend-name.vercel.app
   PORT=5000
   ```

5. Click **"Create Web Service"**
6. Wait for deployment (takes 2-5 minutes)
7. Copy your backend URL: `https://your-backend-name.onrender.com`

---

## 🌐 Step 4: Deploy Frontend on Vercel

### A. Update Environment Variables

1. Edit `campuszon-client/.env.production`:
   ```
   VITE_API_URL=https://your-backend-name.onrender.com
   VITE_SOCKET_URL=https://your-backend-name.onrender.com
   ```

2. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update production API URLs"
   git push
   ```

### B. Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `campuszon-client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-name.onrender.com
   VITE_SOCKET_URL=https://your-backend-name.onrender.com
   ```

6. Click **"Deploy"**
7. Wait for deployment (takes 1-2 minutes)
8. Your site will be live at: `https://your-app.vercel.app`

---

## ✅ Step 5: Final Configuration

### A. Update Backend CORS

Go back to Render and update the `FRONTEND_URL` environment variable with your actual Vercel URL.

### B. Update Google OAuth Callback

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update OAuth redirect URLs to include your production URLs

### C. Update MongoDB IP Whitelist

1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` to allow all (Render uses dynamic IPs)

---

## 🎉 You're Live!

Your CampusZon website is now accessible at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`

---

## 📝 Important Notes

### Free Tier Limitations:
- **Render Free**: Server sleeps after 15 mins of inactivity (cold start ~30 seconds)
- **Vercel Free**: Unlimited bandwidth, but limited builds
- **MongoDB Atlas Free**: 512 MB storage

### Recommendations:
- Use a custom domain (free on Vercel)
- Set up automatic deployments (already enabled)
- Monitor usage in dashboards

---

## 🔄 Updating Your Site

After deployment, any push to GitHub will:
- ✅ Auto-deploy frontend on Vercel (instant)
- ✅ Auto-deploy backend on Render (2-5 mins)

```bash
# Make changes, then:
git add .
git commit -m "Your update message"
git push
```

---

## 🆘 Troubleshooting

### Backend not connecting?
- Check Render logs
- Verify environment variables
- Check MongoDB Atlas IP whitelist

### Frontend can't reach backend?
- Check CORS settings
- Verify API URLs in .env.production
- Check Render service status

### Database errors?
- Check PostgreSQL connection string
- Verify MongoDB Atlas connection
- Check Render database status

---

## 📞 Need Help?

Common issues:
1. **CORS errors**: Update FRONTEND_URL in Render
2. **API not found**: Check VITE_API_URL is correct
3. **Database connection**: Verify connection strings

Good luck! 🚀
