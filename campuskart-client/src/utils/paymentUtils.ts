// Payment Types and Interfaces

export interface PaymentDetails {
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  sellerName: string;
  amount: number;
  tier?: 'basic' | 'premium' | 'standard';
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  config?: {
    display?: {
      blocks?: Record<string, any>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentRecord {
  _id: string;
  itemId: {
    _id: string;
    title: string;
    price: number;
  };
  type: 'unlock_basic' | 'unlock_premium' | 'transaction' | 'featured_listing';
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata: {
    tier?: string;
    sellerName?: string;
    itemTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UnlockResponse {
  success: boolean;
  requiresPayment?: boolean;
  order?: {
    id: string;
    amount: number;
    currency: string;
  };
  payment?: string;
  sellerInfo?: {
    name: string;
    hostel: string;
    email?: string;
    phone?: string;
  };
  remainingCredits?: number;
  unlock?: any;
}

// Razorpay utility functions
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPaymentDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    case 'failed':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    case 'refunded':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  }
};

export const getPaymentTypeLabel = (type: string): string => {
  switch (type) {
    case 'unlock_basic':
      return 'Basic Unlock';
    case 'unlock_premium':
      return 'Premium Unlock';
    case 'transaction':
      return 'Transaction';
    case 'featured_listing':
      return 'Featured Listing';
    default:
      return type;
  }
};

// Payment validation
export const validatePaymentDetails = (details: PaymentDetails): boolean => {
  return !!(
    details.itemId &&
    details.itemTitle &&
    details.amount > 0 &&
    details.sellerName
  );
};

// Test card details for development
export const TEST_CARDS = {
  success: {
    number: '4111 1111 1111 1111',
    cvv: '123',
    expiry: '12/25',
    name: 'Test User',
  },
  failure: {
    number: '4000 0000 0000 0002',
    cvv: '123',
    expiry: '12/25',
    name: 'Test Failure',
  },
};
