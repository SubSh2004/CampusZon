# 🎯 Deployment Checklist

Use this checklist to track your deployment progress!

## ✅ Pre-Deployment Preparation

- [ ] Create GitHub account (https://github.com/signup)
- [ ] Create Vercel account (https://vercel.com/signup)
- [ ] Create Render account (https://render.com/signup)
- [ ] Have MongoDB Atlas connection string ready
- [ ] Have Gmail App Password ready (for email OTP)
- [ ] Have Google OAuth credentials (if using Google login)

---

## ✅ Step 1: Push to GitHub

- [ ] Open terminal in CampusZon folder
- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Ready for deployment"`
- [ ] Create new repository on GitHub.com
- [ ] Run: `git remote add origin https://github.com/YOUR_USERNAME/campuszon.git`
- [ ] Run: `git branch -M main`
- [ ] Run: `git push -u origin main`
- [ ] ✅ Verify code is on GitHub

---

## ✅ Step 2: Deploy Backend (Render)

### PostgreSQL Database
- [ ] Go to Render dashboard
- [ ] Create new PostgreSQL database
- [ ] Name: `campuszon-db`
- [ ] Plan: Free
- [ ] Copy "Internal Database URL"
- [ ] ✅ Database created

### Backend Service
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Root Directory: `campuszon-server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Add Environment Variables:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI` (your MongoDB Atlas URL)
  - [ ] `POSTGRES_URI` (from database step)
  - [ ] `JWT_SECRET` (random string)
  - [ ] `EMAIL_USER` (your Gmail)
  - [ ] `EMAIL_PASS` (Gmail app password)
  - [ ] `PORT=5000`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (2-5 minutes)
- [ ] Copy backend URL (e.g., https://campuszon-api.onrender.com)
- [ ] Test backend: Open `YOUR_BACKEND_URL/health` in browser
- [ ] ✅ Backend is live!

---

## ✅ Step 3: Deploy Frontend (Vercel)

### Update API URLs
- [ ] Open `campuszon-client/.env.production`
- [ ] Update `VITE_API_URL` with your Render backend URL
- [ ] Update `VITE_SOCKET_URL` with your Render backend URL
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Update production API URL"`
- [ ] Run: `git push`

### Vercel Deployment
- [ ] Go to Vercel dashboard
- [ ] Click "Add New Project"
- [ ] Import GitHub repository
- [ ] Framework: Vite
- [ ] Root Directory: `campuszon-client`
- [ ] Add Environment Variables:
  - [ ] `VITE_API_URL` (your Render backend URL)
  - [ ] `VITE_SOCKET_URL` (your Render backend URL)
- [ ] Click "Deploy"
- [ ] Wait for deployment (1-2 minutes)
- [ ] Copy frontend URL (e.g., https://campuszon.vercel.app)
- [ ] ✅ Frontend is live!

---

## ✅ Step 4: Final Configuration

### Update Backend CORS
- [ ] Go to Render dashboard
- [ ] Open backend service
- [ ] Go to Environment tab
- [ ] Add `FRONTEND_URL` = your Vercel URL
- [ ] Save changes (backend will redeploy)
- [ ] ✅ CORS configured

### MongoDB Atlas
- [ ] Go to MongoDB Atlas
- [ ] Network Access → IP Whitelist
- [ ] Add `0.0.0.0/0` (allow all)
- [ ] ✅ Database accessible

### Google OAuth (if using)
- [ ] Go to Google Cloud Console
- [ ] Update OAuth redirect URLs
- [ ] Add: `https://YOUR_BACKEND_URL/auth/google/callback`
- [ ] Add: `https://YOUR_FRONTEND_URL/oauth-callback`
- [ ] ✅ OAuth configured

---

## ✅ Step 5: Testing

- [ ] Open your Vercel URL in browser
- [ ] Test signup with email
- [ ] Test login
- [ ] Test creating an item
- [ ] Test viewing items
- [ ] Test chat feature
- [ ] Test booking feature
- [ ] Test notifications
- [ ] ✅ All features working!

---

## ✅ Optional Enhancements

- [ ] Add custom domain in Vercel
- [ ] Set up UptimeRobot to keep backend alive
- [ ] Configure email alerts in Render
- [ ] Add analytics (Google Analytics, etc.)
- [ ] Set up error tracking (Sentry, etc.)

---

## 📝 Important URLs

Write down your URLs here:

**GitHub Repository**: https://github.com/_________________/campuszon

**Backend (Render)**: https://________________________________.onrender.com

**Frontend (Vercel)**: https://________________________________.vercel.app

**MongoDB Atlas**: https://cloud.mongodb.com

**Render Dashboard**: https://dashboard.render.com

**Vercel Dashboard**: https://vercel.com/dashboard

---

## 🆘 Troubleshooting

### Backend won't start
- [ ] Check Render logs for errors
- [ ] Verify all environment variables are set
- [ ] Check MongoDB connection string
- [ ] Check PostgreSQL connection string

### Frontend can't connect to backend
- [ ] Check CORS settings in backend
- [ ] Verify `FRONTEND_URL` in Render
- [ ] Check `VITE_API_URL` in Vercel
- [ ] Wait 30 seconds (backend waking up from sleep)

### Database errors
- [ ] Check MongoDB Atlas IP whitelist
- [ ] Verify connection strings
- [ ] Check database status in dashboards

### Features not working
- [ ] Check browser console for errors
- [ ] Check Render logs
- [ ] Verify all environment variables
- [ ] Test in incognito mode

---

## 🎉 Success!

Once all checkboxes are ✅, your CampusZon is LIVE! 🚀

Share your website: ________________________________

---

**Need help?** 
- Check DEPLOYMENT_GUIDE.md for detailed docs
- Check Render logs for backend issues
- Check browser console for frontend issues
