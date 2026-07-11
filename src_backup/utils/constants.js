export const PURITY_PRESETS = [
  { label: '24K', purity: 100 },
  { label: '22K', purity: 92 },
  { label: '18K', purity: 75 },
];

export const WEIGHT_UNITS = [
  { key: 'gram', label: 'Grams', abbr: 'g', inGrams: 1 },
  { key: 'tola', label: 'Tola', abbr: 'tola', inGrams: 10 },
  { key: 'kg', label: 'Kilograms', abbr: 'kg', inGrams: 1000 },
  { key: 'mt', label: 'Metric Tonne', abbr: 'MT', inGrams: 1000000 },
];

export const ENTRY_TYPES = [
  { key: 'goods_delivery', label: 'Goods Delivery', icon: '📦', sellerCanCreate: true, buyerCanCreate: false, individualCanCreate: true },
  { key: 'metal_payment', label: 'Metal Payment', icon: '🪙', sellerCanCreate: false, buyerCanCreate: true, individualCanCreate: true },
  { key: 'cash_payment', label: 'Cash Payment', icon: '💵', sellerCanCreate: false, buyerCanCreate: true, individualCanCreate: true },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', sellerCanCreate: false, buyerCanCreate: true, individualCanCreate: true },
  { key: 'rate_booking', label: 'Rate Booking', icon: '📊', sellerCanCreate: true, buyerCanCreate: true, individualCanCreate: true },
  { key: 'additional_charge', label: 'Additional Charge', icon: '🏷️', sellerCanCreate: true, buyerCanCreate: false, individualCanCreate: true },
  { key: 'adjustment', label: 'Adjustment', icon: '🔄', sellerCanCreate: true, buyerCanCreate: true, individualCanCreate: true },
  { key: 'note', label: 'Note', icon: '📝', sellerCanCreate: true, buyerCanCreate: true, individualCanCreate: true },
  { key: 'free_entry', label: 'Free Entry', icon: '✏️', sellerCanCreate: false, buyerCanCreate: false, individualCanCreate: true },
];

export const ENTRY_STATUSES = [
  { key: 'instant', label: 'Instant', icon: '⚡', bgClass: 'badge-instant' },
  { key: 'pending', label: 'Pending', icon: '⏳', bgClass: 'badge-pending' },
  { key: 'approved', label: 'Approved', icon: '✅', bgClass: 'badge-approved' },
  { key: 'declined', label: 'Declined', icon: '❌', bgClass: 'badge-declined' },
  { key: 'locked', label: 'Locked', icon: '🔒', bgClass: 'badge-locked' },
  { key: 'expired', label: 'Expired', icon: '⏰', bgClass: 'badge-expired' },
];

export const RATE_EXPIRY_OPTIONS = [
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
];

export const ACCOUNT_MODES = {
  INDIVIDUAL: 'individual',
  MUTUAL: 'mutual',
};

export const ROLES = {
  SELLER: 'seller',
  BUYER: 'buyer',
  OWNER: 'owner',
};

// ── Pricing & Plan Configuration ──
export const ENFORCE_PLAN_LIMITS = true;

export const PLANS = {
  FREE: {
    key: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '₹0',
    period: 'Forever',
    accountLimit: 1,
    transactionLimit: 30,
    features: [
      'Maximum 1 Account',
      'Maximum 30 Lifetime Transactions',
      'Individual Mode',
      'Mutual Mode',
      'Gold Calculator',
      'Basic Features',
    ],
  },
  PRO: {
    key: 'pro',
    name: 'Pro',
    price: 699,
    priceLabel: '₹699',
    period: '/month',
    accountLimit: Infinity,
    transactionLimit: Infinity,
    features: [
      'Unlimited Accounts',
      'Unlimited Transactions',
      'Professional PDF Statements',
      'Excel / CSV Export',
      'Entry Templates',
      'Priority Support',
      'All Future Premium Features',
    ],
  },
};

export const FREE_PLAN_ACCOUNT_LIMIT = PLANS.FREE.accountLimit;
export const FREE_PLAN_TRANSACTION_LIMIT = PLANS.FREE.transactionLimit;
export const PRO_PRICE = PLANS.PRO.price;

// ── Promo Code Configuration ──
export const PROMO_CONFIG = {
  code: 'DIGITALSUNAR',
  rewardDays: 90,         // 3 months Pro free
  validityDays: 30,       // Code valid for 30 days from launch
  redemptionLimit: 1,     // Once per user
  launchDate: '2026-07-01T00:00:00+05:30', // Change to your actual launch date
};
