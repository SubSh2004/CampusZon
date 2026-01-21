import { body, param, query, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Middleware to handle validation errors
 * Returns 400 with detailed error messages if validation fails
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Custom sanitizer for HTML content
 * Removes all HTML tags and potentially dangerous content
 */
const sanitizeHtmlContent = (value) => {
  if (!value) return value;
  
  return sanitizeHtml(value, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    textFilter: (text) => {
      // Remove excessive whitespace
      return text.replace(/\s+/g, ' ').trim();
    }
  });
};

/**
 * Validation rules for user registration/signup
 */
export const validateUserSignup = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_\s]+$/).withMessage('Username can only contain letters, numbers, underscores, and spaces')
    .customSanitizer(sanitizeHtmlContent),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      // Additional email validation
      if (!validator.isEmail(value)) {
        throw new Error('Invalid email address');
      }
      return true;
    }),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits')
    .customSanitizer(value => value.replace(/\D/g, '')),
  
  body('hostelName')
    .trim()
    .notEmpty().withMessage('Hostel name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Hostel name must be 2-100 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
export const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for item creation
 */
export const validateItemCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isNumeric().withMessage('Price must be a number')
    .isFloat({ min: 0, max: 1000000 }).withMessage('Price must be between 0 and 1,000,000')
    .customSanitizer(value => parseFloat(value)),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Books', 'Electronics', 'Clothing', 'Furniture', 
      'Sports', 'Stationery', 'Rent', 'Services', 'Other'
    ]).withMessage('Invalid category'),
  
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  
  body('userName')
    .trim()
    .notEmpty().withMessage('User name is required')
    .isLength({ min: 2, max: 50 }).withMessage('User name must be 2-50 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('userPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),
  
  body('userHostel')
    .trim()
    .notEmpty().withMessage('Hostel name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Hostel name must be 2-100 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('userEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * Validation rules for item update
 */
export const validateItemUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('price')
    .optional()
    .isNumeric().withMessage('Price must be a number')
    .isFloat({ min: 0, max: 1000000 }).withMessage('Price must be between 0 and 1,000,000'),
  
  body('category')
    .optional()
    .trim()
    .isIn([
      'Books', 'Electronics', 'Clothing', 'Furniture', 
      'Sports', 'Stationery', 'Rent', 'Services', 'Other'
    ]).withMessage('Invalid category'),
  
  body('available')
    .optional()
    .isBoolean().withMessage('Available must be true or false'),
  
  handleValidationErrors
];

/**
 * Validation for MongoDB ObjectID parameters
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

/**
 * Validation for booking creation
 */
export const validateBookingCreation = [
  body('itemId')
    .trim()
    .notEmpty().withMessage('Item ID is required')
    .isMongoId().withMessage('Invalid item ID format'),
  
  body('itemTitle')
    .trim()
    .notEmpty().withMessage('Item title is required')
    .isLength({ min: 1, max: 100 }).withMessage('Item title too long')
    .customSanitizer(sanitizeHtmlContent),
  
  body('itemPrice')
    .notEmpty().withMessage('Item price is required')
    .isNumeric().withMessage('Price must be a number')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  
  body('sellerId')
    .trim()
    .notEmpty().withMessage('Seller ID is required')
    .isMongoId().withMessage('Invalid seller ID format'),
  
  body('sellerName')
    .trim()
    .notEmpty().withMessage('Seller name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Seller name must be 2-50 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message too long (max 500 characters)')
    .customSanitizer(sanitizeHtmlContent),
  
  handleValidationErrors
];

/**
 * Validation for OTP sending
 */
export const validateOTPRequest = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * Validation for OTP verification
 */
export const validateOTPVerification = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  
  handleValidationErrors
];

/**
 * Validation for password reset
 */
export const validatePasswordReset = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  
  handleValidationErrors
];

/**
 * Validation for search queries
 */
export const validateSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long')
    .customSanitizer(sanitizeHtmlContent)
    .customSanitizer(value => {
      // Remove regex special characters for safety
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Validation for email domain
 */
export const validateEmailDomain = [
  query('emailDomain')
    .trim()
    .notEmpty().withMessage('Email domain is required')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}[a-zA-Z0-9]$/)
    .withMessage('Invalid email domain format'),
  
  handleValidationErrors
];

/**
 * Validation for adding/updating reviews
 */
export const validateReview = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  
  body('userName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('User name must be 1-100 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .notEmpty().withMessage('Review text cannot be empty')
    .isLength({ min: 1, max: 500 }).withMessage('Review must be 1-500 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  handleValidationErrors
];

/**
 * Validation for adding/updating replies to reviews
 */
export const validateReply = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  
  body('userName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('User name must be 1-100 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  body('replyText')
    .trim()
    .notEmpty().withMessage('Reply text cannot be empty')
    .isLength({ min: 1, max: 500 }).withMessage('Reply must be 1-500 characters')
    .customSanitizer(sanitizeHtmlContent),
  
  param('reviewIndex')
    .isInt({ min: 0 }).withMessage('Invalid review index'),
  
  handleValidationErrors
];

/**
 * Validation for deleting replies
 */
export const validateReplyDelete = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  
  param('reviewIndex')
    .isInt({ min: 0 }).withMessage('Invalid review index'),
  
  param('replyIndex')
    .isInt({ min: 0 }).withMessage('Invalid reply index'),
  
  handleValidationErrors
];

export default {
  validateUserSignup,
  validateUserLogin,
  validateItemCreation,
  validateItemUpdate,
  validateObjectId,
  validateBookingCreation,
  validateOTPRequest,
  validateOTPVerification,
  validatePasswordReset,
  validateSearchQuery,
  validateEmailDomain,
  validateReview,
  validateReply,
  validateReplyDelete,
  handleValidationErrors
};
