import { Link } from 'react-router-dom';
import BrandName from '../components/BrandName';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <BrandName />
            </Link>
            <Link 
              to="/home" 
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
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: January 22, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Welcome to CampusZon! These Terms of Service ("Terms") govern your access to and use of the CampusZon platform, including our website, mobile applications, and related services (collectively, the "Platform").
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            By accessing or using CampusZon, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use the Platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Acceptance of Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">1.</span>
              Acceptance of Terms
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <ul className="list-disc ml-6 space-y-2">
                <li>By creating an account or using CampusZon, you acknowledge that you have read, understood, and agree to be bound by these Terms</li>
                <li>You must be at least 18 years old or have parental/guardian consent to use this Platform</li>
                <li>You represent that you are a current student or affiliated with a recognized educational institution</li>
                <li>These Terms constitute a legally binding agreement between you and CampusZon</li>
              </ul>
            </div>
          </section>

          {/* 2. Account Registration */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">2.</span>
              Account Registration & Responsibilities
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Creation</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You must provide accurate, current, and complete information during registration</li>
                  <li>You must verify your email address through the OTP verification process</li>
                  <li>You are responsible for maintaining the confidentiality of your password</li>
                  <li>One person may only maintain one account</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Security</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You are solely responsible for all activities that occur under your account</li>
                  <li>You must immediately notify us of any unauthorized access or security breach</li>
                  <li>We are not liable for any loss or damage from your failure to protect your account</li>
                  <li>Do not share your login credentials with anyone</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Termination</h3>
                <p className="mb-2">We reserve the right to suspend or terminate your account if you:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Violate these Terms or our policies</li>
                  <li>Engage in fraudulent, illegal, or harmful activities</li>
                  <li>Provide false or misleading information</li>
                  <li>Receive multiple reports of misconduct from other users</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. User Conduct */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">3.</span>
              User Conduct & Prohibited Activities
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="font-semibold">You agree NOT to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Post Prohibited Items:</strong> Weapons, drugs, alcohol, stolen goods, counterfeit items, illegal materials, adult content</li>
                <li><strong>Engage in Fraud:</strong> Misleading descriptions, fake images, price manipulation, fake reviews</li>
                <li><strong>Harass Others:</strong> Offensive language, threats, discrimination, spam, unsolicited contact</li>
                <li><strong>Violate Laws:</strong> Any activity that violates local, state, or national laws</li>
                <li><strong>Misuse Platform:</strong> Scraping data, creating bots, circumventing security, reverse engineering</li>
                <li><strong>Manipulate System:</strong> Creating fake accounts, artificially inflating ratings, token farming</li>
                <li><strong>Infringe Rights:</strong> Copyright infringement, trademark violations, unauthorized use of others' content</li>
              </ul>
            </div>
          </section>

          {/* 4. Listing Items */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">4.</span>
              Listing Items & Content Guidelines
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Seller Obligations</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You must own or have the right to sell/rent the items you list</li>
                  <li>Provide accurate, truthful, and complete descriptions</li>
                  <li>Upload clear, authentic photos of the actual item (max 5 images)</li>
                  <li>Set fair and reasonable prices</li>
                  <li>Respond promptly to buyer inquiries and booking requests</li>
                  <li>Honor confirmed bookings or face penalties</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Content Moderation</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>All images are automatically screened using AI-powered moderation</li>
                  <li>Listings may be reviewed by our moderation team before going live</li>
                  <li>We reserve the right to remove or reject any listing that violates our policies</li>
                  <li>Repeated violations may result in account suspension</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Listing Categories</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Buy:</strong> One-time purchase for permanent ownership</li>
                  <li><strong>Rent:</strong> Temporary usage with agreed rental period and terms</li>
                  <li>Clearly specify which option applies to your listing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Transactions */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">5.</span>
              Transactions & Platform Role
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  ⚠️ Important: CampusZon is a marketplace platform that facilitates connections between buyers and sellers. We are NOT a party to any transaction.
                </p>
              </div>

              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Buyer-Seller Agreement:</strong> All transactions are directly between buyers and sellers</li>
                <li><strong>Payment Arrangement:</strong> Buyers and sellers arrange payment methods (cash, UPI, etc.) directly</li>
                <li><strong>Meeting & Exchange:</strong> Parties arrange pickup/delivery locations and times independently</li>
                <li><strong>No Guarantees:</strong> We do not guarantee item quality, condition, or transaction completion</li>
                <li><strong>Platform Fee:</strong> CampusZon charges tokens to unlock contact information (not a transaction fee)</li>
              </ul>
            </div>
          </section>

          {/* 6. Token System */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">6.</span>
              Token System
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How Tokens Work</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>New users receive 2 free tokens upon registration</li>
                  <li>1 token = 1 contact unlock (reveals seller's phone number)</li>
                  <li>Additional tokens can be purchased through Razorpay</li>
                  <li>Available packages: 10, 25, 50, or 100 tokens</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Token Purchase & Refunds</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Purchased tokens are <strong>non-refundable</strong> as they remain in your account</li>
                  <li>Tokens do not expire and can be used anytime</li>
                  <li>If a seller rejects your booking, you receive 0.5 tokens back (50% refund)</li>
                  <li>Tokens cannot be transferred to other users or converted back to currency</li>
                  <li><strong>Payment receipts</strong> can be downloaded from the Payment History section in your Profile page</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Booking Requirement</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    ⚠️ After unlocking contact info, you MUST click "Book Now" to notify the seller. Failure to book means the seller won't know you're interested!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Returns & Refunds */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">7.</span>
              Return & Refund Policy
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5-Day Return Window</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Buyers have <strong>5 days</strong> from the purchase date to request a return</li>
                  <li>The buyer must pay <strong>10% of the listed price</strong> to the seller as a return/restocking fee</li>
                  <li>Example: ₹1,000 item = ₹100 return fee paid to seller</li>
                  <li>The seller refunds the remaining 90% to the buyer</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Return Conditions</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Item must be in the same condition as when purchased</li>
                  <li>Seller may refuse returns for damaged, used, or personalized items</li>
                  <li>Discuss return terms with seller before purchasing</li>
                  <li>Both parties must agree on return arrangements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rental Damage Policy</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>If a rented item is damaged, the renter must immediately inform the owner</li>
                  <li>Provide photo evidence of the damage</li>
                  <li>Buyer and seller must discuss and mutually agree on compensation amount</li>
                  <li>Consider: original value, damage extent, repair costs, item age</li>
                  <li><strong>Tip:</strong> Take photos/videos before renting to document original condition</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> CampusZon does not mediate disputes over returns or damages. These are resolved directly between buyer and seller.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Payment Processing */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">8.</span>
              Payment Processing
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Token Purchases:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>All token purchases are processed securely through Razorpay</li>
                <li>We support UPI, Credit/Debit Cards, Net Banking, and Wallets</li>
                <li>We do not store your payment card details</li>
                <li>Payment processing is subject to Razorpay's Terms of Service</li>
              </ul>

              <p className="mt-3"><strong>Item Payments:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Payment for items is arranged directly between buyer and seller</li>
                <li>CampusZon does not process, hold, or guarantee item payments</li>
                <li>Use safe payment methods (cash on delivery, verified UPI, etc.)</li>
              </ul>
            </div>
          </section>

          {/* 9. Intellectual Property */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">9.</span>
              Intellectual Property Rights
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Content</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You retain ownership of all content you post (listings, images, reviews)</li>
                  <li>By posting content, you grant CampusZon a license to display, store, and moderate it</li>
                  <li>You represent that you have the right to post all content you upload</li>
                  <li>You are responsible for ensuring your content doesn't infringe others' rights</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Platform Content</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>CampusZon name, logo, design, and features are our intellectual property</li>
                  <li>You may not copy, modify, or distribute our platform content without permission</li>
                  <li>Unauthorized use may result in legal action</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Copyright Infringement</h3>
                <p>If you believe content on CampusZon infringes your copyright, contact us at <a href="mailto:campuszon@gmail.com" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">campuszon@gmail.com</a> with details.</p>
              </div>
            </div>
          </section>

          {/* 10. Limitation of Liability */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">10.</span>
              Limitation of Liability & Disclaimers
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="font-semibold text-red-800 dark:text-red-300 mb-2">
                  IMPORTANT DISCLAIMERS:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>CampusZon is provided "AS IS" without warranties of any kind</li>
                  <li>We do not guarantee platform availability, accuracy, or reliability</li>
                  <li>We are not responsible for user-generated content or actions</li>
                </ul>
              </div>

              <p className="font-semibold">CampusZon is NOT liable for:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Quality, safety, legality, or accuracy of listed items</li>
                <li>Truth or accuracy of user listings, descriptions, or reviews</li>
                <li>Ability of sellers to complete transactions or deliver items</li>
                <li>Ability of buyers to pay or complete transactions</li>
                <li>Disputes between buyers and sellers</li>
                <li>Lost, stolen, damaged, or counterfeit items</li>
                <li>Personal injury or property damage from transactions</li>
                <li>Any indirect, incidental, special, or consequential damages</li>
              </ul>

              <p className="mt-4 text-sm">
                <strong>Maximum Liability:</strong> To the fullest extent permitted by law, CampusZon's total liability shall not exceed the amount you paid for tokens in the past 12 months.
              </p>
            </div>
          </section>

          {/* 11. Indemnification */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">11.</span>
              Indemnification
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-3">
                You agree to indemnify, defend, and hold harmless CampusZon, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any laws or third-party rights</li>
                <li>Your content or listings</li>
                <li>Your transactions with other users</li>
              </ul>
            </div>
          </section>

          {/* 12. Dispute Resolution */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">12.</span>
              Dispute Resolution
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User-to-User Disputes</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Disputes between buyers and sellers must be resolved directly between parties</li>
                  <li>CampusZon is not responsible for mediating or resolving transaction disputes</li>
                  <li>We encourage users to communicate clearly and maintain transaction records</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Platform Disputes</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>For disputes with CampusZon, contact us at campuszon@gmail.com</li>
                  <li>We will attempt to resolve issues informally through good-faith negotiation</li>
                  <li>If informal resolution fails, disputes will be subject to binding arbitration</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 13. Termination */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">13.</span>
              Termination
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">By You</h3>
                <p>You may terminate your account at any time by contacting support. Unused tokens will be forfeited upon account closure.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">By CampusZon</h3>
                <p className="mb-2">We may suspend or terminate your account immediately if:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You violate these Terms or our policies</li>
                  <li>You engage in fraudulent or illegal activities</li>
                  <li>Your account has been inactive for an extended period</li>
                  <li>We are required to do so by law</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Effect of Termination</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Your access to the Platform will be revoked</li>
                  <li>Your listings will be removed</li>
                  <li>Unused tokens will be forfeited</li>
                  <li>Certain provisions of these Terms will survive termination</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 14. Governing Law */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">14.</span>
              Governing Law & Jurisdiction
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-3">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
              <p>
                Any legal action or proceeding arising out of or related to these Terms shall be instituted exclusively in the courts located in India, and you consent to the jurisdiction of such courts.
              </p>
            </div>
          </section>

          {/* 15. Changes to Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">15.</span>
              Changes to These Terms
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-3">
                We reserve the right to modify these Terms at any time. When we make changes:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>We will update the "Last updated" date at the top</li>
                <li>Significant changes will be notified via email or platform notification</li>
                <li>Continued use of CampusZon after changes constitutes acceptance</li>
                <li>If you disagree with changes, you must stop using the Platform</li>
              </ul>
            </div>
          </section>

          {/* 16. Miscellaneous */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">16.</span>
              Miscellaneous
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and CampusZon</li>
                <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
                <li><strong>No Waiver:</strong> Our failure to enforce any right doesn't waive that right</li>
                <li><strong>Assignment:</strong> You may not assign these Terms; we may assign them without notice</li>
                <li><strong>Contact:</strong> For questions about these Terms, contact campuszon@gmail.com</li>
              </ul>
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
                If you have questions or concerns about these Terms of Service, please contact us:
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

        {/* Acknowledgment */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
          <p className="text-center text-gray-700 dark:text-gray-300">
            By using CampusZon, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex justify-center gap-4">
          <Link
            to="/privacy-policy"
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Privacy Policy
          </Link>
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
