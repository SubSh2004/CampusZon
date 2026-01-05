# Google OAuth Setup Guide for CampusZon

## Overview
Google Sign-In has been integrated into both the Login and Signup pages. To make it functional, you need to configure Google OAuth credentials.

## Steps to Set Up Google OAuth

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a Project" at the top
3. Click "New Project"
4. Enter project name: **CampusZon** (or any name you prefer)
5. Click "Create"

### 2. Enable Google+ API
1. In your project dashboard, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (for testing) or **Internal** (if you have a Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: CampusZon
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Save and Continue"
7. On the "Test users" page, add your email for testing, then "Save and Continue"
8. Click "Back to Dashboard"

### 4. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Select **Application type**: Web application
4. **Name**: CampusZon Web Client
5. **Authorized JavaScript origins**: 
   - Add: `http://localhost:5000`
   - Add: `http://localhost:3000`
6. **Authorized redirect URIs**:
   - Add: `http://localhost:5000/api/auth/google/callback`
7. Click "Create"

### 5. Copy Your Credentials
After creation, a popup will show:
- **Client ID**: Copy this (looks like: `123456789-abc.apps.googleusercontent.com`)
- **Client Secret**: Copy this (looks like: `GOCSPX-abc123`)

### 6. Update Your .env File
Open `campuszon-server/.env` and replace the placeholder values:

```env
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### 7. Restart the Server
After updating the `.env` file, restart your backend server:

```bash
# Stop the current server (Ctrl + C)
# Then restart it
cd campuszon-server
npm run dev
```

## How It Works

### User Flow
1. User clicks "Sign in with Google" button on Login or Signup page
2. User is redirected to Google's authentication page
3. User selects their Google account and grants permissions
4. Google redirects back to your backend at `/api/auth/google/callback`
5. Backend creates a JWT token and user account (if new)
6. User is redirected to frontend `/oauth-callback` with user data
7. Frontend saves user data to localStorage and Recoil state
8. If phone/hostel info is missing, user is prompted to complete profile
9. User is redirected to home page

### OAuth Users
- OAuth users get a placeholder password (`google-oauth-{googleId}`)
- They can complete their profile by adding phone number and hostel name
- Phone and hostel fields are optional initially but can be added in Profile page

### Backend Files Created
- `src/config/passport.js` - Passport Google OAuth strategy configuration
- `src/routes/auth.routes.js` - OAuth endpoints (`/api/auth/google`, `/api/auth/google/callback`)

### Frontend Files Created/Modified
- `src/pages/OAuthCallback.tsx` - Handles OAuth redirect and saves user data
- `src/pages/Login.tsx` - Added "Sign in with Google" button
- `src/pages/Signup.tsx` - Added "Sign up with Google" button
- `src/App.tsx` - Added `/oauth-callback` route

## Testing
1. Make sure both servers are running
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. If credentials are configured correctly, you'll be redirected to Google
5. Select your account and grant permissions
6. You should be redirected back and logged in automatically

## Production Deployment
When deploying to production:
1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Add your production domain (e.g., `https://campuszon.com`)
3. Add production callback URL (e.g., `https://campuszon.com/api/auth/google/callback`)
4. Update the redirect URLs in `src/routes/auth.routes.js` to use production domain
5. Update environment variables on your hosting platform (Vercel, Render, etc.)

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches `http://localhost:5000/api/auth/google/callback`
- Check that you added both the origin and the callback URL

### "OAuth failed" message
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correctly set in `.env`
- Restart the server after updating `.env`
- Check server console for error messages

### User not created
- Check MongoDB connection
- Look for errors in server console
- Verify the passport strategy is working (check `src/config/passport.js`)

## Need Help?
If you encounter issues:
1. Check the browser console for frontend errors
2. Check the server console for backend errors
3. Verify all redirect URIs are correctly configured
4. Make sure MongoDB is connected and accepting new users
