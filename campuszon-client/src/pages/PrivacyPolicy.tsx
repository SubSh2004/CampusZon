import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              CampusZon
            </Link>
            <Link 
              to="/" 
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: January 22, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            At CampusZon, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our campus marketplace platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Information We Collect */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">1.</span>
              Information We Collect
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
                <p className="mb-2">When you register and use CampusZon, we collect:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Account Information:</strong> Name, username, email address, phone number, hostel name</li>
                  <li><strong>Profile Data:</strong> Profile picture (optional), bio, preferences</li>
                  <li><strong>Authentication Data:</strong> Password (encrypted), login credentials, OTP verification records</li>
                  <li><strong>OAuth Data:</strong> If you sign up with Google, we receive your name, email, and profile picture from Google</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Transaction Information</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Listings:</strong> Item details, descriptions, images, pricing, categories</li>
                  <li><strong>Token Purchases:</strong> Payment transaction details (processed by Razorpay), purchase history</li>
                  <li><strong>Bookings:</strong> Booking history, unlock history, communication records</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Usage Data</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Search queries and browsing behavior</li>
                  <li>Items viewed, unlocked, and booked</li>
                  <li>Reviews and ratings submitted</li>
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Timestamps and session duration</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User-Generated Content</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Images uploaded for item listings</li>
                  <li>Reviews and comments</li>
                  <li>Messages and communications</li>
                  <li>Reports and feedback</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">2.</span>
              How We Use Your Information
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Provide Services:</strong> Create and manage your account, process transactions, facilitate bookings</li>
                <li><strong>Communication:</strong> Send booking confirmations, notifications, updates, and support responses</li>
                <li><strong>Platform Improvement:</strong> Analyze usage patterns, improve search functionality, enhance user experience</li>
                <li><strong>Security & Safety:</strong> Verify user identity, prevent fraud, moderate content using AI, enforce terms of service</li>
                <li><strong>Personalization:</strong> Show relevant items, customize search results, provide recommendations</li>
                <li><strong>Payment Processing:</strong> Process token purchases through our payment partner (Razorpay)</li>
                <li><strong>Compliance:</strong> Comply with legal obligations and resolve disputes</li>
              </ul>
            </div>
          </section>

          {/* 3. Information Sharing & Disclosure */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">3.</span>
              Information Sharing & Disclosure
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">With Other Users</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Public Profile:</strong> Your username, hostel name, and profile picture are visible to all users</li>
                  <li><strong>Item Listings:</strong> Your username and items you list are publicly visible</li>
                  <li><strong>After Unlocking:</strong> When someone unlocks your contact, they receive your phone number</li>
                  <li><strong>Reviews:</strong> Your username and reviews you write are publicly visible</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">With Service Providers</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Payment Processing:</strong> Razorpay processes token purchase payments securely</li>
                  <li><strong>Cloud Storage:</strong> MongoDB Atlas stores your data with enterprise-grade security</li>
                  <li><strong>Image Moderation:</strong> AI-powered content moderation services scan uploaded images</li>
                  <li><strong>Email Services:</strong> Email service providers send OTPs and notifications</li>
                  <li><strong>Hosting:</strong> Vercel (frontend) and Render (backend) host our platform</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Legal Requirements</h3>
                <p className="mb-2">We may disclose your information if required to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Comply with legal obligations, court orders, or government requests</li>
                  <li>Protect our rights, property, or safety, and that of our users</li>
                  <li>Prevent fraud, illegal activities, or violations of our Terms of Service</li>
                  <li>Investigate security incidents or technical issues</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  ⚠️ We never sell your personal information to third parties for marketing purposes.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Data Security */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">4.</span>
              Data Security
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Encryption:</strong> All passwords are hashed using bcrypt. Data transmission uses HTTPS/SSL encryption</li>
                <li><strong>Secure Storage:</strong> Data stored on MongoDB Atlas with encryption at rest and access controls</li>
                <li><strong>Authentication:</strong> JWT tokens with secure expiration and refresh mechanisms</li>
                <li><strong>Payment Security:</strong> PCI-DSS compliant payment processing through Razorpay (we don't store card details)</li>
                <li><strong>Access Control:</strong> Role-based access, admin moderation, and automated security monitoring</li>
                <li><strong>Image Moderation:</strong> AI-powered content filtering to prevent inappropriate content</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                While we strive to protect your information, no method of transmission over the internet is 100% secure. Please use strong passwords and protect your login credentials.
              </p>
            </div>
          </section>

          {/* 5. Data Retention */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">5.</span>
              Data Retention
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Active Accounts:</strong> We retain your data as long as your account is active</li>
                <li><strong>Deleted Accounts:</strong> Upon account deletion, personal data is removed within 30 days</li>
                <li><strong>Transaction Records:</strong> Payment and booking records retained for 7 years for legal/accounting purposes</li>
                <li><strong>Listings:</strong> Deleted item listings are archived for 90 days, then permanently deleted</li>
                <li><strong>Backup Data:</strong> Backup systems may retain data for up to 90 days</li>
              </ul>
            </div>
          </section>

          {/* 6. Your Rights & Choices */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">6.</span>
              Your Rights & Choices
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>You have the following rights regarding your data:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Access:</strong> View and download your personal information from your Profile page</li>
                <li><strong>Correction:</strong> Update your profile information, contact details, and preferences anytime</li>
                <li><strong>Deletion:</strong> Request account deletion by contacting support (some data retained for legal compliance)</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (transactional emails still sent for bookings/security)</li>
                <li><strong>Restrict Processing:</strong> Request limitation on how we use your data</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:campuszon@gmail.com" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                  campuszon@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* 7. Cookies & Tracking */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">7.</span>
              Cookies & Tracking Technologies
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We use the following technologies:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Authentication tokens stored in localStorage for login persistence</li>
                <li><strong>Functional Cookies:</strong> Theme preferences (dark/light mode), language settings</li>
                <li><strong>Session Data:</strong> Temporary storage for cart items, search filters, navigation state</li>
              </ul>
              <p className="mt-4">
                You can clear cookies and localStorage through your browser settings. Note that this will log you out and reset your preferences.
              </p>
            </div>
          </section>

          {/* 8. Third-Party Links */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">8.</span>
              Third-Party Services
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>CampusZon integrates with third-party services that have their own privacy policies:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Google OAuth:</strong> For authentication - governed by Google's Privacy Policy</li>
                <li><strong>Razorpay:</strong> For payment processing - governed by Razorpay's Privacy Policy</li>
                <li><strong>WhatsApp:</strong> External links for contacting sellers - governed by Meta's Privacy Policy</li>
              </ul>
              <p className="mt-4">
                We are not responsible for the privacy practices of these third-party services. Please review their policies before using them.
              </p>
            </div>
          </section>

          {/* 9. Children's Privacy */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">9.</span>
              Children's Privacy
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300">
              <p>
                CampusZon is intended for college/university students aged 18 and above. We do not knowingly collect personal information from individuals under 18. If you are under 18, please do not use this platform or provide any personal information. If we discover that we have collected information from someone under 18, we will delete it immediately.
              </p>
            </div>
          </section>

          {/* 10. Changes to Privacy Policy */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">10.</span>
              Changes to This Privacy Policy
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-3">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. When we make changes:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>We will update the "Last updated" date at the top of this page</li>
                <li>Significant changes will be notified via email or platform notification</li>
                <li>Continued use of CampusZon after changes constitutes acceptance</li>
              </ul>
              <p className="mt-3">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
              </p>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <strong>Email:</strong>
                  <a href="mailto:campuszon@gmail.com" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    campuszon@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <strong>Phone:</strong>
                  <a href="tel:+919332425174" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    +91 9332425174
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <strong>WhatsApp:</strong>
                  <a href="https://wa.me/919332425174" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    +91 9332425174
                  </a>
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                We will respond to your inquiry within 7 business days.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
