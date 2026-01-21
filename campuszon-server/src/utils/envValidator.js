/**
 * Environment Variable Validation
 * Validates all required environment variables at server startup
 * Prevents server from starting with missing or invalid configuration
 */

import validator from 'validator';

/**
 * Required environment variables with their validation rules
 */
const envVarRules = {
  // Database
  MONGODB_URI: {
    required: true,
    validate: (value) => {
      if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
        return 'MONGODB_URI must start with mongodb:// or mongodb+srv://';
      }
      return null;
    }
  },
  
  // Authentication
  JWT_SECRET: {
    required: true,
    validate: (value) => {
      if (value.length < 32) {
        return 'JWT_SECRET must be at least 32 characters for security';
      }
      return null;
    }
  },
  
  // Payment Gateway
  RAZORPAY_KEY_ID: {
    required: false, // Optional but recommended
    validate: (value) => {
      if (value && value.length < 10) {
        return 'RAZORPAY_KEY_ID seems invalid (too short)';
      }
      return null;
    }
  },
  
  RAZORPAY_KEY_SECRET: {
    required: false,
    validate: (value) => {
      if (value && value.length < 10) {
        return 'RAZORPAY_KEY_SECRET seems invalid (too short)';
      }
      return null;
    }
  },
  
  // Image Upload
  IMGBB_API_KEY: {
    required: false,
    validate: (value) => {
      if (value && value.length < 10) {
        return 'IMGBB_API_KEY seems invalid (too short)';
      }
      return null;
    }
  },
  
  // Frontend URL
  FRONTEND_URL: {
    required: true,
    validate: (value) => {
      if (!validator.isURL(value, { require_protocol: true })) {
        return 'FRONTEND_URL must be a valid URL with protocol (http:// or https://)';
      }
      return null;
    }
  },
  
  // OAuth (Google)
  GOOGLE_CLIENT_ID: {
    required: false,
    validate: (value) => {
      if (value && !value.includes('.apps.googleusercontent.com')) {
        return 'GOOGLE_CLIENT_ID format seems invalid';
      }
      return null;
    }
  },
  
  GOOGLE_CLIENT_SECRET: {
    required: false,
    validate: (value) => {
      if (value && value.length < 10) {
        return 'GOOGLE_CLIENT_SECRET seems invalid (too short)';
      }
      return null;
    }
  },
  
  GOOGLE_CALLBACK_URL: {
    required: false,
    validate: (value) => {
      if (value && !validator.isURL(value, { require_protocol: true })) {
        return 'GOOGLE_CALLBACK_URL must be a valid URL';
      }
      return null;
    }
  },
  
  // Node Environment
  NODE_ENV: {
    required: false,
    validate: (value) => {
      if (value && !['development', 'production', 'test'].includes(value)) {
        return 'NODE_ENV must be one of: development, production, test';
      }
      return null;
    }
  },
  
  // Server Port
  PORT: {
    required: false,
    validate: (value) => {
      if (value) {
        const port = parseInt(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          return 'PORT must be a number between 1 and 65535';
        }
      }
      return null;
    }
  }
};

/**
 * Validate all environment variables
 * @returns {Object} - { isValid: boolean, errors: string[], warnings: string[] }
 */
export const validateEnvironmentVariables = () => {
  const errors = [];
  const warnings = [];
  
  console.log('\n🔍 Validating Environment Variables...\n');
  
  // Check each environment variable
  for (const [varName, rules] of Object.entries(envVarRules)) {
    const value = process.env[varName];
    
    // Check if required variable is missing
    if (rules.required && !value) {
      errors.push(`❌ CRITICAL: ${varName} is required but not set`);
      continue;
    }
    
    // Warn about optional but recommended variables
    if (!rules.required && !value) {
      warnings.push(`⚠️  Optional: ${varName} is not set (some features may not work)`);
      continue;
    }
    
    // Validate the value if it exists and has a validator
    if (value && rules.validate) {
      const validationError = rules.validate(value);
      if (validationError) {
        errors.push(`❌ ${varName}: ${validationError}`);
      } else {
        console.log(`✅ ${varName}: Valid`);
      }
    } else if (value) {
      console.log(`✅ ${varName}: Set`);
    }
  }
  
  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  // Print errors
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  ${error}`));
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate environment and exit if critical errors found
 * Call this at server startup before any other initialization
 */
export const validateAndExitOnError = () => {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    console.error('❌ CRITICAL: Environment validation failed!');
    console.error('Server cannot start with invalid or missing environment variables.\n');
    console.error('Please check your .env file and ensure all required variables are set correctly.\n');
    
    // Exit with error code
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed!\n');
  return validation;
};

/**
 * Get sanitized environment info for logging (without sensitive values)
 */
export const getSanitizedEnvInfo = () => {
  const env = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 5000;
  
  return {
    NODE_ENV: env,
    PORT: port,
    hasMongoDb: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasRazorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    hasImgBB: !!process.env.IMGBB_API_KEY,
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    frontendUrl: process.env.FRONTEND_URL
  };
};

export default {
  validateEnvironmentVariables,
  validateAndExitOnError,
  getSanitizedEnvInfo
};
