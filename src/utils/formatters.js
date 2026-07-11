import { WEIGHT_UNITS } from './constants.js';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Indian number formatting: 1000000 → ₹10,00,000
 * Handles negative numbers with a leading minus sign.
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return currencyFormatter.format(amount);
}

/**
 * Format number with Indian grouping (no ₹ symbol): 1000000 → 10,00,000
 */
export function formatIndianNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
}

/**
 * Abbreviate currency for compact display.
 *  < 1000       → ₹999
 *  < 1,00,000   → ₹24.5K
 *  < 1,00,00,000 → ₹2.4L
 *  >= 1,00,00,000 → ₹1.2Cr
 */
export function abbreviateCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}₹${abs}`;
  }
  if (abs < 100000) {
    const val = abs / 1000;
    return `${sign}₹${parseFloat(val.toFixed(1))}K`;
  }
  if (abs < 10000000) {
    const val = abs / 100000;
    return `${sign}₹${parseFloat(val.toFixed(1))}L`;
  }
  const val = abs / 10000000;
  return `${sign}₹${parseFloat(val.toFixed(2))}Cr`;
}

/**
 * Look up a weight unit definition by key.
 * Falls back to gram if the key is unknown.
 */
function getUnit(unitKey) {
  return WEIGHT_UNITS.find((u) => u.key === unitKey) || WEIGHT_UNITS[0];
}

/**
 * Decimal-place rules per unit key.
 */
const DECIMAL_MAP = {
  gram: 3,
  tola: 4,
  kg: 3,
  mt: 6,
};

/**
 * Convert grams to the specified unit.
 */
export function convertWeight(grams, toUnit) {
  const unit = getUnit(toUnit);
  return grams / unit.inGrams;
}

/**
 * Format weight with unit: 47335, 'gram' → '47.335 g'
 */
export function formatWeight(grams, unit = 'gram') {
  const unitDef = getUnit(unit);
  const converted = grams / unitDef.inGrams;
  const decimals = DECIMAL_MAP[unit] ?? 3;
  const formatted = parseFloat(converted.toFixed(decimals));
  return `${formatted} ${unitDef.abbr}`;
}

/**
 * Format rate: 10000, 'gram' → '₹10,000/g'
 */
export function formatRate(rate, unit = 'gram') {
  if (rate === null || rate === undefined || isNaN(rate)) return '₹0/g';
  const unitDef = getUnit(unit);
  const formatted = numberFormatter.format(rate);
  return `₹${formatted}/${unitDef.abbr}`;
}

/**
 * Relative time: Date → '2 hours ago', '3 days ago', 'just now'
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const target = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diffMs = now - target;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) return 'just now';
  if (diffSec < 60) return 'just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

/**
 * Format date: Date → 'Jun 28, 2026'
 */
export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return dateFormatter.format(d);
}

/**
 * Format time: Date → '2:20 PM'
 */
export function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return timeFormatter.format(d);
}

/**
 * Format date+time: Date → 'Jun 28, 2:20 PM'
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return dateTimeFormatter.format(d);
}
