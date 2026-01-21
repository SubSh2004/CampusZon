import passwordValidator from 'password-validator';

/**
 * Password Policy Configuration
 * 
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - No spaces allowed
 * - Not in common password blacklist
 */

// Create password schema
const schema = new passwordValidator();

schema
  .is().min(8)                                      // Minimum 8 characters
  .is().max(128)                                    // Maximum 128 characters
  .has().uppercase(1)                               // Must have at least 1 uppercase letter
  .has().lowercase(1)                               // Must have at least 1 lowercase letter
  .has().digits(1)                                  // Must have at least 1 digit
  .has().not().spaces();                            // Should not have spaces

// Common password blacklist (case-insensitive exact matches)
const commonPasswords = [
  'password123',
  'admin123',
  'welcome123',
  'qwerty123',
  '12345678',
  'password1',
  'passw0rd',
  'letmein',
  'monkey123',
  'dragon123',
  'master123',
  'trustno1',
  'superman123',
  'password',
  'iloveyou',
  'welcome'
].map(p => p.toLowerCase());

/**
 * Validate password against policy
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const result = schema.validate(password, { details: true });
  
  // Check against common password blacklist (case-insensitive)
  const isCommonPassword = commonPasswords.includes(password.toLowerCase());
  
  if (result === true && !isCommonPassword) {
    return {
      isValid: true,
      errors: []
    };
  }
  
  // Convert validation errors to user-friendly messages
  const errorMessages = [];
  
  if (result !== true) {
    errorMessages.push(...result.map(error => {
      switch (error.validation) {
        case 'min':
          return 'Password must be at least 8 characters long';
        case 'max':
          return 'Password must not exceed 128 characters';
        case 'uppercase':
          return 'Password must contain at least one uppercase letter';
        case 'lowercase':
          return 'Password must contain at least one lowercase letter';
        case 'digits':
          return 'Password must contain at least one number';
        case 'spaces':
          return 'Password must not contain spaces';
        default:
          return 'Password does not meet security requirements';
      }
    }));
  }
  
  if (isCommonPassword) {
    errorMessages.push('This password is too common. Please choose a stronger password');
  }
  
  return {
    isValid: errorMessages.length === 0,
    errors: errorMessages
  };
};

/**
 * Express middleware to validate password in request body
 */
export const passwordPolicyMiddleware = (req, res, next) => {
  const password = req.body.password || req.body.newPassword;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  const validation = validatePassword(password);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: validation.errors,
      requirements: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        noSpaces: true
      }
    });
  }
  
  next();
};

/**
 * Get password strength score (0-4)
 * 0 = Very Weak
 * 1 = Weak
 * 2 = Fair
 * 3 = Good
 * 4 = Strong
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  
  if (!password) return 0;
  
  // Length bonus
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety bonus
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters
  
  // Cap at 4
  return Math.min(score, 4);
};

export default {
  validatePassword,
  passwordPolicyMiddleware,
  getPasswordStrength,
  schema
};
