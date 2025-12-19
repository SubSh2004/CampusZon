import nodemailer from 'nodemailer';

// Send email using Resend HTTP API (no SMTP needed - works on Render!)
const sendWithResendAPI = async (to, subject, html) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `CampusZon <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: [to],
        subject: subject,
        html: html,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Email sent via Resend HTTP API:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend HTTP API error:', error.message);
    throw error;
  }
};

// Send email using Brevo HTTP API (no SMTP needed - works on Render!)
const sendWithBrevoAPI = async (to, subject, html) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'CampusZon',
          email: process.env.EMAIL_FROM || 'campuszon@gmail.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Email sent via Brevo HTTP API:', data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Brevo HTTP API error:', error.message);
    throw error;
  }
};

// Create a persistent transporter (reuse connection)
let transporter = null;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }
  
  // Check if using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log('📧 Using SendGrid for email delivery');
    transporter = (nodemailer.default || nodemailer).createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  // Check if using Brevo/Sendinblue
  else if (process.env.BREVO_API_KEY) {
    console.log('📧 Using Brevo for email delivery');
    transporter = (nodemailer.default || nodemailer).createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_EMAIL,
        pass: process.env.BREVO_API_KEY,
      },
    });
  }
  else {
    // Use Gmail for local development
    console.log('📧 Using Gmail for email delivery');
    transporter = (nodemailer.default || nodemailer).createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }
  
  return transporter;
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    console.log('📧 Attempting to send OTP email to:', email);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">CampusZon Email Verification</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Thank you for signing up for CampusZon! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #6366f1; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #666;">This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this OTP, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">CampusZon - Your Campus Marketplace</p>
      </div>
    `;

    // Use Resend HTTP API if available (Recommended - works perfectly on Render free tier!)
    if (process.env.RESEND_API_KEY) {
      console.log('📧 Using Resend HTTP API for email delivery');
      const result = await sendWithResendAPI(email, 'CampusZon - Email Verification OTP', htmlContent);
      return { success: true };
    }
    
    // Use Brevo HTTP API if available (Requires IP whitelisting)
    if (process.env.BREVO_API_KEY) {
      console.log('📧 Using Brevo HTTP API for email delivery');
      const result = await sendWithBrevoAPI(email, 'CampusZon - Email Verification OTP', htmlContent);
      return { success: true };
    }
    
    // Otherwise use SMTP
    console.log('📧 Using SMTP for email delivery');
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'CampusZon - Email Verification OTP',
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after successful signup
export const sendWelcomeEmail = async (email, username) => {
  try {
    console.log('📧 Attempting to send welcome email to:', email);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CampusZon! 🎉</h1>
        </div>
        
        <p style="font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>
        
        <p style="font-size: 16px; color: #333;">Congratulations! Your CampusZon account has been created successfully.</p>
        
        <p style="font-size: 16px; color: #333;">You can now:</p>
        <ul style="font-size: 15px; color: #555; line-height: 1.8;">
          <li>📦 Browse items from your campus community</li>
          <li>🛍️ List items for sale or rent</li>
          <li>💬 Connect with other students</li>
          <li>🔍 Search for exactly what you need</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">CampusZon - Your Campus Marketplace</p>
      </div>
    `;

    // Use Brevo HTTP API if available (works on Render free tier!)
    if (process.env.BREVO_API_KEY) {
      console.log('📧 Using Brevo HTTP API for welcome email');
      await sendWithBrevoAPI(email, 'Welcome to CampusZon! 🎉', htmlContent);
      return { success: true };
    }

    // Use Resend HTTP API if available
    if (process.env.RESEND_API_KEY) {
      console.log('📧 Using Resend HTTP API for welcome email');
      await sendWithResendAPI(email, 'Welcome to CampusZon! 🎉', htmlContent);
      return { success: true };
    }

    // Otherwise use SMTP
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to CampusZon! 🎉',
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', result.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return { success: false, error: error.message };
  }
};
