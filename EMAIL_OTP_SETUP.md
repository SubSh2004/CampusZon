# Email OTP Setup Guide for CampusZon

## Overview
OTP (One-Time Password) email verification has been added to the signup process. Users must verify their email before completing registration.

## How It Works

### User Flow:
1. **Step 1**: User enters their email address
2. **System sends 6-digit OTP** to the email
3. **Step 2**: User enters the OTP received  
4. **System verifies OTP** (valid for 10 minutes)
5. **Step 3**: User completes profile (username, phone, hostel, password)
6. **Account created** successfully

## Email Configuration

### Option 1: Gmail (Recommended for Testing)

1. **Go to** your Google Account settings
2. **Enable 2-Step Verification** (if not already enabled)
3. **Create App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (type "CampusZon")
   - Click "Generate"
   - **Copy the 16-character password**

4. **Update `.env` file** in `campuszon-server`:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Option 2: Other Email Services

You can use any SMTP service. Update `src/utils/emailService.js`:

**For Outlook/Hotmail:**
```javascript
service: 'hotmail',
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
}
```

**For Custom SMTP:**
```javascript
host: 'smtp.yourprovider.com',
port: 587,
secure: false, // true for port 465
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
}
```

## Features

### Backend:
- **POST /api/user/send-otp** - Sends OTP to email
- **POST /api/user/verify-otp** - Verifies the OTP
- **OTP Model** - Stores OTPs in MongoDB with 10-minute expiry
- **Email Service** - Sends beautifully formatted OTP emails

### Frontend:
- **3-Step Signup Process**:
  1. Email verification
  2. OTP input
  3. Complete profile
- **Real-time validation**
- **Error handling**
- **Professional OTP input field**

### Security:
- ✅ OTPs expire after 10 minutes
- ✅ Only one OTP per email at a time
- ✅ OTPs are deleted after successful verification
- ✅ Email must be verified before signup
- ✅ Cannot reuse expired OTPs

## Testing

1. **Install nodemailer** (if not already installed):
   ```bash
   cd campuszon-server
   npm install nodemailer
   ```

2. **Configure email** in `.env`

3. **Restart backend server**

4. **Test the flow**:
   - Go to signup page
   - Enter your email
   - Check your inbox for OTP
   - Enter the 6-digit code
   - Complete your profile

## Troubleshooting

### "Failed to send OTP email"
- Check EMAIL_USER and EMAIL_PASS in `.env`
- Make sure you're using App Password for Gmail (not regular password)
- Verify 2-Step Verification is enabled for Gmail
- Check server console for detailed error messages

### "Invalid or expired OTP"
- OTP expires after 10 minutes
- Make sure you're entering the correct 6-digit code
- Try requesting a new OTP

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check server logs for email sending errors
- Gmail may block if too many emails sent quickly

## Email Template

The OTP email includes:
- Professional design with CampusZon branding
- Large, easy-to-read 6-digit OTP
- Expiry information (10 minutes)
- Security message
- Responsive HTML layout

## Database Schema

**OTP Model** (MongoDB):
```javascript
{
  email: String (required, lowercase),
  otp: String (required, 6 digits),
  createdAt: Date (auto-expires after 10 minutes)
}
```

## API Endpoints

### Send OTP
```
POST /api/user/send-otp
Body: { "email": "user@university.edu" }
Response: { "success": true, "message": "OTP sent successfully" }
```

### Verify OTP
```
POST /api/user/verify-otp
Body: { "email": "user@university.edu", "otp": "123456" }
Response: { "success": true, "message": "OTP verified successfully" }
```

### Signup (after OTP verification)
```
POST /api/user/signup
Body: {
  "username": "johndoe",
  "email": "user@university.edu",
  "password": "password123",
  "phoneNumber": "+91 1234567890",
  "hostelName": "Hostel A"
}
```

## Production Recommendations

1. **Use professional email service** (SendGrid, AWS SES, Mailgun)
2. **Add rate limiting** to prevent spam
3. **Log OTP requests** for security monitoring
4. **Add email templates** with your branding
5. **Consider SMS OTP** as alternative/backup
6. **Add resend OTP** button with cooldown timer
7. **Track failed attempts** and block suspicious activity

## Future Enhancements

- ✨ SMS OTP option
- ✨ Resend OTP with cooldown (60 seconds)
- ✨ Rate limiting (max 3 OTPs per 5 minutes)
- ✨ Email verification status in user model
- ✨ Custom email templates per organization
- ✨ OTP length configuration
- ✨ Multiple language support for emails
