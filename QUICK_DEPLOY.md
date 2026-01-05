# 🚀 Quick Deploy CampusZon (5 Minutes!)

## ✅ What You Get
- **Frontend**: https://your-app.vercel.app (Your public website)
- **Backend**: https://your-api.onrender.com (API server)
- **100% FREE** and reliable

---

## 📋 Before You Start

You need accounts on:
1. **GitHub** - https://github.com/signup
2. **Vercel** - https://vercel.com/signup (Sign in with GitHub)
3. **Render** - https://render.com/signup (Sign in with GitHub)

---

## 🎯 STEP 1: Push to GitHub (2 minutes)

Open terminal in CampusZon folder and run:

```bash
# Initialize git
git init
git add .
git commit -m "Ready for deployment"

# Create repository on GitHub.com (click + icon → New repository)
# Name it: campus-kart
# Then run these (replace YOUR_USERNAME):

git remote add origin https://github.com/YOUR_USERNAME/campus-kart.git
git branch -M main
git push -u origin main
```

✅ Your code is now on GitHub!

---

## 🎯 STEP 2: Deploy Backend on Render (3 minutes)

### 2A. Create PostgreSQL Database
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - Name: `campuszon-db`
   - Plan: **Free**
4. Click **"Create Database"**
5. **Copy the "Internal Database URL"** (you'll need this!)

### 2B. Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Click **"Connect GitHub"** → Select your `campus-kart` repository
3. Settings:
   - **Name**: `campuskart-api` (or any name you want)
   - **Root Directory**: `campuskart-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. Click **"Advanced"** and add these Environment Variables:

```
NODE_ENV=production
MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
POSTGRES_URI=YOUR_RENDER_POSTGRES_URL_FROM_STEP_2A
JWT_SECRET=make_this_a_random_long_string_change_it
EMAIL_USER=campuszon@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD
PORT=5000
```

5. Click **"Create Web Service"**
6. Wait 2-5 minutes for deployment
7. **Copy your backend URL**: `https://campuszon-api.onrender.com`

✅ Backend is live!

---

## 🎯 STEP 3: Deploy Frontend on Vercel (1 minute)

### 3A. Update API URL
1. Open `campuskart-client/.env.production` file
2. Replace with your Render backend URL:
```
VITE_API_URL=https://campuskart-api.onrender.com
VITE_SOCKET_URL=https://campuskart-api.onrender.com
```

3. Save and push to GitHub:
```bash
git add .
git commit -m "Update production API URL"
git push
```

### 3B. Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to your `campuszon` repository
4. Settings:
   - **Framework**: `Vite`
   - **Root Directory**: `campuszon-client`
   - **Build Command**: Leave default (npm run build)
   - **Output Directory**: Leave default (dist)

5. Click **"Deploy"**
6. Wait 1-2 minutes
7. **Your website is LIVE!** 🎉

Example: `https://campuszon-abc123.vercel.app`

✅ Frontend is live!

---

## 🎯 STEP 4: Final Configuration (1 minute)

### Update Backend to Accept Frontend
1. Go back to Render dashboard
2. Open your backend service (`campuszon-api`)
3. Go to **"Environment"** tab
4. Add new variable:
```
FRONTEND_URL=https://campuszon-abc123.vercel.app
```
(Use your actual Vercel URL)

5. Click **"Save Changes"** (backend will auto-redeploy)

✅ Everything connected!

---

## 🎉 YOU'RE DONE!

Your CampusZon is now live at:
**https://campuszon-abc123.vercel.app**

Share this link with anyone! 🌐

---

## 📱 What Happens Now?

- **Automatic Updates**: Every time you push to GitHub:
  - Frontend updates automatically (Vercel)
  - Backend updates automatically (Render)
  
- **Free Tier Notes**:
  - Backend sleeps after 15 mins (wakes up in ~30 sec on first visit)
  - Frontend is always instant
  - MongoDB Atlas: 512 MB free storage

---

## 🔧 Common Issues

### "Cannot connect to backend"
- Wait 30 seconds on first visit (backend waking up)
- Check CORS: Make sure `FRONTEND_URL` is set in Render

### "Database connection failed"
- MongoDB Atlas: Network Access → Allow 0.0.0.0/0
- PostgreSQL: Check connection string in Render

### "Authentication not working"
- Update Google OAuth redirect URLs to include production URLs
- Update environment variables in Render

---

## 📊 Monitor Your App

- **Vercel**: https://vercel.com/dashboard (Check deployments)
- **Render**: https://dashboard.render.com (Check logs & health)
- **MongoDB**: https://cloud.mongodb.com (Check database usage)

---

## 🎓 Pro Tips

1. **Custom Domain**: Add free custom domain in Vercel settings
2. **Auto-deploy**: Already enabled! Just push to GitHub
3. **Logs**: Check Render logs if something breaks
4. **Keep alive**: Use UptimeRobot.com to ping backend every 5 mins

---

Need help? Check the full DEPLOYMENT_GUIDE.md for troubleshooting!

**Happy deploying! 🚀**
