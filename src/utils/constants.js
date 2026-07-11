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

// Transaction type labels per Master Specification §20
// Keys are formed as: `${section}_${action}`
export const TRANSACTION_LABELS = {
  // Legacy keys (backward compat)
  metal_increase: 'Metal Added',
  metal_decrease: 'Metal Reduced',
  rate_booking: 'Book Rate',
  convert_to_metal: 'Rupee to Metal',
  convert_to_rupee: 'Metal to Rupee',
  opening_metal: 'Opening Metal Balance',
  opening_rupee: 'Opening Rupee Balance',
  rupee_increase: 'Rupee Added',
  rupee_decrease: 'Rupee Reduced',
  reversal: 'Reversal',
  // Explicit opcode labels (Metal)
  metal_increase_receivable: 'Metal Given',
  metal_decrease_receivable: 'Metal Received',
  metal_increase_payable: 'Metal Received',
  metal_decrease_payable: 'Metal Paid',
  metal_rate_booking: 'Rate Booking Adjustment',
  metal_convert_metal_to_rupee: 'Metal to Rupee Adjustment',
  metal_convert_rupee_to_metal: 'Rupee to Metal Adjustment',
  // Explicit opcode labels (Rupee)
  rupee_increase_receivable: 'Rupee Given',
  rupee_decrease_receivable: 'Rupee Received',
  rupee_increase_payable: 'Rupee Received',
  rupee_decrease_payable: 'Rupee Paid',
  rupee_convert_rupee_to_metal: 'Rupee to Metal Adjustment',
  rupee_convert_metal_to_rupee: 'Metal to Rupee Adjustment',
};

export const ENTRY_STATUSES = [
  { key: 'instant', label: 'Instant', bgClass: 'badge-instant' },
  { key: 'pending', label: 'Pending Approval', bgClass: 'badge-pending' },
  { key: 'approved', label: 'Approved', bgClass: 'badge-approved' },
  { key: 'rejected', label: 'Rejected', bgClass: 'badge-rejected' },
  { key: 'expired', label: 'Expired', bgClass: 'badge-expired' },
  { key: 'cancelled', label: 'Cancelled', bgClass: 'badge-cancelled' },
  { key: 'pending_cancellation', label: 'Pending Cancellation', bgClass: 'badge-pending' },
];

// Approval duration options for mutual transactions (Spec §30)
export const APPROVAL_DURATION_OPTIONS = [
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
  SUPPLIER: 'supplier',
  TRADE_CUSTOMER: 'trade_customer',
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
  rewardDays: 90,
  validityDays: 30,
  redemptionLimit: 1,
  launchDate: '2026-07-01T00:00:00+05:30',
};

// ── Legal & Compliance ──
export const CURRENT_TERMS_VERSION = "1.0";

export const PLACEHOLDER_PAIRS = [
    "Casting Ring, Jadau Set",
    "Flyover Chain, Meena Bangle",
    "Kundan Necklace, Plain Chudi",
    "Casting Bracelet, Yellow Set",
    "Turkish Tops, Plain Ring",
    "Kundan Bangle, Meena Set",
    "Fancy Chain, Jadau Necklace",
    "Casting Kada, Polki Set",
    "Plain Bangle, Turkish Bracelet",
    "Kundan Ring, Meena Chudi",
    "Machine Chain, Antique Necklace",
    "Jadau Bangle, Casting Set",
    "Plain Set, Turkish Bangle",
    "Kundan Set, Meena Tops",
    "Fancy Ring, Polki Haar",
    "Plain Chain, Jadau Ring",
    "Turkish Ring, Plain Bracelet",
    "Kundan Tops, Meena Necklace",
    "Polki Necklace, Jadau Chudi",
    "Handmade Chain, Antique Set",
    "Turkish Kada, Casting Bangle",
    "Plain Necklace, Meena Kada",
    "Jadau Haar, Kundan Haar",
    "Casting Tops, Antique Bangle",
    "Classic Ring, Fancy Bracelet",
    "Designer Kada, Plain Kada",
    "Choker Set, Plain Tops",
    "Meena Ring, Casting Chain",
    "Kundan Chudi, Turkish Set",
    "Fancy Set, Plain Chain"
];
