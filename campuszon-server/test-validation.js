/**
 * Test script to verify input validation, password policy, and environment validation
 * Run with: node test-validation.js
 */

import { validatePassword, getPasswordStrength } from './src/utils/passwordPolicy.js';
import { validateEnvironmentVariables } from './src/utils/envValidator.js';

console.log('🧪 CampusZon Security Validation Tests\n');
console.log('='.repeat(60));

// Test 1: Password Policy Validation
console.log('\n📋 TEST 1: Password Policy Validation\n');

const testPasswords = [
  { password: 'weak', expectedValid: false, reason: 'Too short, no uppercase, no numbers' },
  { password: 'password123', expectedValid: false, reason: 'Common password in blacklist' },
  { password: 'Short1', expectedValid: false, reason: 'Less than 8 characters' },
  { password: 'nouppercase1', expectedValid: false, reason: 'No uppercase letter' },
  { password: 'NOLOWERCASE1', expectedValid: false, reason: 'No lowercase letter' },
  { password: 'NoNumbers!', expectedValid: false, reason: 'No numbers' },
  { password: 'Has Spaces1', expectedValid: false, reason: 'Contains spaces' },
  { password: 'SecurePass123', expectedValid: true, reason: 'Meets all requirements' },
  { password: 'MyP@ssw0rd2024', expectedValid: true, reason: 'Strong password' },
  { password: 'Qwerty123', expectedValid: false, reason: 'Common pattern (qwerty)' },
];

testPasswords.forEach(({ password, expectedValid, reason }) => {
  const result = validatePassword(password);
  const strength = getPasswordStrength(password);
  const status = result.isValid === expectedValid ? '✅ PASS' : '❌ FAIL';
  
  console.log(`${status} | Password: "${password}"`);
  console.log(`   Expected: ${expectedValid ? 'VALID' : 'INVALID'} | Actual: ${result.isValid ? 'VALID' : 'INVALID'}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Strength: ${strength}/4`);
  
  if (!result.isValid) {
    console.log(`   Errors: ${result.errors.join(', ')}`);
  }
  console.log('');
});

// Test 2: Environment Variable Validation
console.log('='.repeat(60));
console.log('\n📋 TEST 2: Environment Variable Validation\n');

const envValidation = validateEnvironmentVariables();

if (envValidation.isValid) {
  console.log('✅ All environment variables are valid!\n');
} else {
  console.log('❌ Environment validation failed!\n');
}

if (envValidation.errors.length > 0) {
  console.log('🔴 ERRORS (Critical):');
  envValidation.errors.forEach(error => console.log(`   - ${error}`));
  console.log('');
}

if (envValidation.warnings.length > 0) {
  console.log('⚠️  WARNINGS (Optional features):');
  envValidation.warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('');
}

// Test 3: Sanitization Examples
console.log('='.repeat(60));
console.log('\n📋 TEST 3: HTML Sanitization Examples\n');

const testInputs = [
  { input: '<script>alert("XSS")</script>', type: 'XSS Script Tag' },
  { input: '<img src=x onerror=alert(1)>', type: 'XSS Image Tag' },
  { input: 'Normal text with <b>bold</b>', type: 'Harmless HTML' },
  { input: 'Text with    excessive   spaces', type: 'Excessive Whitespace' },
  { input: '{"$gt": ""}', type: 'NoSQL Injection Attempt' },
];

console.log('These inputs would be sanitized by validation middleware:\n');

testInputs.forEach(({ input, type }) => {
  console.log(`Type: ${type}`);
  console.log(`Input:  "${input}"`);
  console.log(`Note: Sanitization happens in validation middleware`);
  console.log('');
});

// Summary
console.log('='.repeat(60));
console.log('\n📊 SUMMARY\n');

const passwordTests = testPasswords.filter(t => {
  const result = validatePassword(t.password);
  return result.isValid === t.expectedValid;
});

console.log(`Password Policy: ${passwordTests.length}/${testPasswords.length} tests passed`);
console.log(`Environment Validation: ${envValidation.isValid ? 'PASS' : 'FAIL'}`);

if (envValidation.errors.length === 0 && passwordTests.length === testPasswords.length) {
  console.log('\n✅ All security validations working correctly!\n');
} else {
  console.log('\n⚠️  Some validations need attention (see above)\n');
}

console.log('='.repeat(60));
