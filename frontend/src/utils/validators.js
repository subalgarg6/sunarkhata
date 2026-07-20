/**
 * Validate Khata ID: 4-30 chars, [a-z0-9_] only, must start with a letter.
 * @param {string} id
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateKhataId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Khata ID is required' };
  }

  const trimmed = id.trim();

  if (trimmed.length < 4) {
    return { valid: false, error: 'Khata ID must be at least 4 characters' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Khata ID must be 30 characters or fewer' };
  }

  if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
    if (!/^[a-z]/.test(trimmed)) {
      return { valid: false, error: 'Khata ID must start with a lowercase letter' };
    }
    return { valid: false, error: 'Khata ID can only contain lowercase letters, numbers, and underscores' };
  }

  return { valid: true, error: null };
}

/**
 * Alias for validateKhataId — validates usernames with the same rules.
 * @param {string} username
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateUsername(username) {
  const result = validateKhataId(username);
  // Translate error messages to use 'Username' instead of 'Khata ID'
  if (result.error) {
    result.error = result.error.replace(/Khata ID/g, 'Username');
  }
  return result;
}

/**
 * Validate an email address (basic format check).
 * @param {string} email
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  // RFC 5322 simplified: local@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  return { valid: true, error: null };
}

export function validatePassword(password) {
  const pw = password || '';

  const length = pw.length >= 8 && pw.length <= 16;
  const uppercase = /[A-Z]/.test(pw);
  const number = /[0-9]/.test(pw);

  const valid = length && uppercase && number;
  return {
    length,
    uppercase,
    number,
    valid,
    error: valid ? null : 'Password must be 8-16 characters, with at least 1 uppercase letter and 1 number.'
  };
}

/**
 * Check that password and confirm-password match.
 * @param {string} password
 * @param {string} confirm
 * @returns {boolean}
 */
export function passwordsMatch(password, confirm) {
  return password === confirm && password.length > 0;
}

/**
 * Validate that a value is present (non-empty after trimming).
 * @param {*} value
 * @returns {boolean}
 */
export function isRequired(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

/**
 * Validate that a value is a positive number (> 0).
 * @param {*} value
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate that a value is a percentage between 0.01 and 100 inclusive.
 * @param {*} value
 * @returns {boolean}
 */
export function isValidPercentage(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0.01 && num <= 100;
}
