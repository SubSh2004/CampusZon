import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

interface FAQSection {
  title: string;
  icon: JSX.Element;
  items: FAQItem[];
}

export default function FAQ() {
  const [openSection, setOpenSection] = useState<string | null>('account');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
    setOpenQuestion(null);
  };

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const faqSections: { [key: string]: FAQSection } = {
    account: {
      title: 'Account & Registration',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      items: [
        {
          question: 'How do I create an account?',
          answer: (
            <div>
              <p className="mb-2">You can create an account in two ways:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click "Sign Up" and fill in your details (name, email, phone, hostel name)</li>
                <li>Use "Continue with Google" for quick registration</li>
              </ol>
              <p className="mt-2">All students from registered hostels can join CampusZon!</p>
            </div>
          ),
        },
        {
          question: 'Do I need to verify my email or phone?',
          answer: 'Yes! You\'ll receive an OTP (One-Time Password) on your email to verify your account. This ensures the security of your account and helps maintain a trusted community.',
        },
        {
          question: 'I forgot my password. How do I reset it?',
          answer: (
            <div>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click on "Forgot Password" on the login page</li>
                <li>Enter your registered email address</li>
                <li>You\'ll receive an OTP to verify your identity</li>
                <li>Create a new password</li>
              </ol>
            </div>
          ),
        },
        {
          question: 'Can I change my profile information?',
          answer: 'Yes! Go to your Profile page and you can update your username, phone number, hostel name, and other details. Your email cannot be changed for security reasons.',
        },
      ],
    },
    buying: {
      title: 'Buying Items',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      items: [
        {
          question: 'How do I search for items?',
          answer: 'Use the search bar on the home page to search by item name, category, or keywords. You can also filter by price range, condition, and category to find exactly what you need.',
        },
        {
          question: 'What\'s the difference between Buy and Rent?',
          answer: (
            <div>
              <p className="mb-2"><strong>Buy:</strong> One-time purchase where you own the item permanently.</p>
              <p><strong>Rent:</strong> Pay a rental fee to use the item for a specific period (e.g., per day, per week, per semester). Perfect for textbooks, tools, or items you only need temporarily!</p>
            </div>
          ),
        },
        {
          question: 'What are tokens and how do they work?',
          answer: (
            <div>
              <p className="mb-2">Tokens are CampusZon\'s virtual currency used to unlock seller contact information:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Each new user gets <strong>2 free tokens</strong> to start</li>
                <li>1 token = unlock 1 seller\'s contact details (phone number)</li>
                <li>Purchase more tokens via Razorpay when you run out</li>
                <li>Available packages: 10, 25, 50, or 100 tokens</li>
              </ul>
              <p className="mt-2">This system helps prevent spam and maintains a serious, committed buyer community.</p>
            </div>
          ),
        },
        {
          question: 'How do I unlock a seller\'s contact information?',
          answer: (
            <div>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click on any item you\'re interested in</li>
                <li>Click the "Unlock Contact" button</li>
                <li>1 token will be deducted from your balance</li>
                <li>You\'ll see the seller\'s phone number and can contact them directly via WhatsApp or call</li>
              </ol>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-semibold">⚠️ Important: You can unlock the same seller multiple times if needed, but we recommend saving their contact!</p>
            </div>
          ),
        },
        {
          question: 'How do I book an item?',
          answer: (
            <div>
              <p className="mb-2">After unlocking the seller's contact information:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click the "Book Now" button on the item page</li>
                <li>Contact the seller via phone or WhatsApp</li>
                <li>Arrange pickup, payment, and other details directly with the seller</li>
              </ol>
              <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">⚠️ IMPORTANT: You MUST click "Book Now" after unlocking contact info, otherwise the item won't be marked as booked and the seller won't be notified!</p>
            </div>
          ),
        },
        {
          question: 'What payment methods are accepted?',
          answer: (
            <div>
              <p className="mb-2"><strong>For Tokens:</strong> Purchase via Razorpay (UPI, Cards, Net Banking, Wallets)</p>
              <p><strong>For Items:</strong> Payment method is decided between buyer and seller (cash, UPI, etc.)</p>
            </div>
          ),
        },
        {
          question: 'Can I get a refund?',
          answer: (
            <div>
              <p className="mb-2"><strong>Tokens:</strong> No refunds on purchased tokens as they remain in your account for future use.</p>              <p className="mb-2"><strong>Booking Rejection:</strong> If a seller rejects your booking, you will receive 0.5 tokens back as a refund (50% of the unlock cost).</p>              <p><strong>Item Purchases:</strong> Refunds depend on the seller's policy. Always discuss return/refund terms with the seller before completing the transaction.</p>
            </div>
          ),
        },
        {
          question: 'What is the return policy for purchased items?',
          answer: (
            <div>
              <p className="mb-2"><strong>5-Day Return Window:</strong> Buyers have 5 days from the purchase date to return an item if needed.</p>
              <p className="mb-2"><strong>Return Fee:</strong> To return an item, the buyer must pay 10% of the listed price to the seller as a restocking/handling fee.</p>
              <p className="mb-3"><strong>Example:</strong> If an item was listed for ₹1,000, the buyer pays ₹100 to the seller to process the return.</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>⚠️ Important:</strong> Discuss return conditions with the seller before purchasing. The seller may refuse returns for certain items (personalized, damaged by buyer, etc.).
                </p>
              </div>
            </div>
          ),
        },
        {
          question: 'What if a rented item gets damaged?',
          answer: (
            <div>
              <p className="mb-2">If an item is damaged during the rental period:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Inform the seller immediately with photos of the damage</li>
                <li>The buyer and seller will discuss and mutually agree on a fair compensation amount</li>
                <li>Consider factors like: original item value, extent of damage, repair costs, age of item</li>
                <li>Payment for damages is arranged directly between buyer and seller</li>
              </ol>
              <p className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                💡 Tip: Before renting, take photos/videos of the item's condition to avoid disputes. Discuss potential damage scenarios upfront.
              </p>
            </div>
          ),
        },
      ],
    },
    selling: {
      title: 'Adding & Managing Items',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      items: [
        {
          question: 'How do I add/list an item?',
          answer: (
            <div>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click "Add Item" from the navigation menu</li>
                <li>Fill in item details (name, description, price, category, condition)</li>
                <li>Upload clear photos (up to 5 images)</li>
                <li>Choose whether it\'s for Buy or Rent</li>
                <li>Submit for moderation review</li>
              </ol>
              <p className="mt-2">Your listing will be live after approval (usually within a few hours).</p>
            </div>
          ),
        },
        {
          question: 'What are the image requirements?',
          answer: (
            <div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Maximum 5 images per listing</li>
                <li>Clear, well-lit photos showing the actual item</li>
                <li>No inappropriate or offensive content</li>
                <li>Images are automatically moderated using AI</li>
                <li>Accepted formats: JPG, PNG, WebP</li>
              </ul>
            </div>
          ),
        },
        {
          question: 'How should I price my items?',
          answer: (
            <div>
              <p className="mb-2">Pricing tips:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Check similar items on the platform for market rates</li>
                <li>Consider condition (new, like new, good, fair)</li>
                <li>Be realistic - overpriced items don\'t sell</li>
                <li>For rentals: price per day/week/semester clearly</li>
                <li>Factor in depreciation and usage</li>
              </ul>
            </div>
          ),
        },
        {
          question: 'How do I manage my listings?',
          answer: 'Go to your Profile page to see all your active listings. You can edit details, update availability, mark items as sold/rented, or delete listings anytime.',
        },
        {
          question: 'When will I receive payment?',
          answer: 'CampusZon doesn\'t process item payments - you receive payment directly from the buyer using your preferred method (cash, UPI, etc.). Arrange payment terms with the buyer when they contact you.',
        },
        {
          question: 'How do I mark an item as sold?',
          answer: 'Go to your Profile → My Items → Find the sold item → Click "Mark as Sold". This removes it from active listings while keeping it in your history.',
        },
      ],
    },
    safety: {
      title: 'Safety & Trust',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      items: [
        {
          question: 'How do I verify if a seller is trustworthy?',
          answer: (
            <div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Check their profile - verified email and hostel name</li>
                <li>Read reviews from other buyers</li>
                <li>Look at their other listings</li>
                <li>Ask questions before unlocking contact</li>
                <li>All users must verify their campus email</li>
              </ul>
            </div>
          ),
        },
        {
          question: 'How do I report inappropriate items or users?',
          answer: 'Click the "Report" button on any item listing. Our moderation team will review and take appropriate action within 24 hours. You can report for: fake items, inappropriate content, scams, harassment, or policy violations.',
        },
        {
          question: 'Where should I meet the seller?',
          answer: (
            <div>
              <p className="mb-2">Safety tips for meetings:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Meet in public campus areas (library, cafeteria, main gate)</li>
                <li>Avoid meeting in private rooms initially</li>
                <li>Inspect items thoroughly before payment</li>
                <li>Bring a friend if you\'re unsure</li>
                <li>Use campus security if needed</li>
              </ul>
            </div>
          ),
        },
        {
          question: 'How do I avoid scams?',
          answer: (
            <div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Never pay in advance without seeing the item</li>
                <li>Don\'t share passwords or OTPs</li>
                <li>Verify item condition before payment</li>
                <li>Be cautious of deals that seem too good to be true</li>
                <li>Only transact with verified campus students</li>
                <li>Report suspicious behavior immediately</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    technical: {
      title: 'Technical Issues',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      items: [
        {
          question: 'I can\'t log in. What should I do?',
          answer: (
            <div>
              <p className="mb-2">Try these steps:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Double-check your email and password</li>
                <li>Use "Forgot Password" to reset if needed</li>
                <li>Clear browser cache and cookies</li>
                <li>Try a different browser</li>
                <li>Check if your account email is verified</li>
                <li>Contact support if issue persists</li>
              </ol>
            </div>
          ),
        },
        {
          question: 'My payment failed. What now?',
          answer: (
            <div>
              <p className="mb-2">Common solutions:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Check your internet connection</li>
                <li>Verify sufficient balance in your payment method</li>
                <li>Try a different payment method</li>
                <li>Check if your bank/UPI app is working</li>
                <li>Wait a few minutes and retry</li>
                <li>Contact us if money was deducted but tokens not received</li>
              </ul>
            </div>
          ),
        },
        {
          question: 'I can\'t upload images. Help!',
          answer: (
            <div>
              <p className="mb-2">Image upload troubleshooting:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Check file size (max 5MB per image)</li>
                <li>Use JPG, PNG, or WebP format only</li>
                <li>Ensure stable internet connection</li>
                <li>Try compressing large images</li>
                <li>Clear browser cache</li>
                <li>Try from a different device/browser</li>
              </ul>
            </div>
          ),
        },
        {
          question: 'Which browsers are supported?',
          answer: 'CampusZon works best on latest versions of Chrome, Firefox, Safari, and Edge. For best experience, keep your browser updated and enable JavaScript.',
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find answers to common questions about using CampusZon
          </p>
        </div>

        {/* Contact Banner */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                We're here to help! Contact us anytime.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:campuszon@gmail.com"
                  className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support
                </a>
                <a
                  href="https://wa.me/919332425174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-4">
          {Object.entries(faqSections).map(([key, section]) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(key)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-indigo-600 dark:text-indigo-400">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    openSection === key ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Questions */}
              {openSection === key && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {section.items.map((item, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {item.question}
                          </h3>
                          <svg
                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                              openQuestion === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {openQuestion === index && (
                        <div className="px-6 pb-4 text-gray-700 dark:text-gray-300">
                          {typeof item.answer === 'string' ? (
                            <p>{item.answer}</p>
                          ) : (
                            item.answer
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ready to get started?
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Browse Items
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
