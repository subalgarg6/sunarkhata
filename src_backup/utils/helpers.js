/**
 * Generate a UUID v4 string using crypto.randomUUID when available,
 * with a manual fallback for older browsers.
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 UUID via getRandomValues
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 2);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate an invite code in the format SK-XXXXXX
 * where X is a random uppercase alphanumeric character.
 * @returns {string}
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SK-';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Debounce a function — delays invoking `fn` until `delay` ms
 * have elapsed since the last invocation.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Deep clone an object via JSON round-trip.
 * Not suitable for objects with functions, Dates, undefined, etc.
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format a number to a fixed number of decimal places,
 * stripping unnecessary trailing zeros.
 * @param {number} num
 * @param {number} decimals
 * @returns {string}
 */
export function toFixed(num, decimals = 3) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return parseFloat(Number(num).toFixed(decimals)).toString();
}

/**
 * Escape HTML special characters to prevent XSS when inserting into innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(str).replace(/[&<>"']/g, (ch) => map[ch]);
}

/**
 * Truncate a string to `maxLen` characters, appending '…' if truncated.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 30) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Parse an Indian-formatted number string, stripping commas and whitespace.
 * Returns NaN for unparseable input.
 * @param {string} str
 * @returns {number}
 */
export function parseIndianNumber(str) {
  if (!str) return NaN;
  const cleaned = String(str).replace(/[,\s₹]/g, '').trim();
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

/**
 * Extract initials from a name string.
 * 'Ramesh Kumar' → 'RK', 'Sharma' → 'SH', '' → '?'
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
