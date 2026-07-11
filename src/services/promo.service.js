export function validatePromoCode(code, userId) {
  if (!code) return { valid: false, message: 'Please enter a valid promo code' };
  const c = code.trim().toUpperCase();
  if (c === 'FREEPRO' || c === 'BULLION100') {
    return { valid: true, message: 'Promo code is valid!' };
  }
  return { valid: false, message: 'Invalid or expired promo code.' };
}

export function redeemPromoCode(userId) {
  // Give 1 year of pro
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  // Actually update local storage to mock plan
  let plans = {};
  try {
    plans = JSON.parse(localStorage.getItem('sk_user_plans') || '{}');
  } catch (e) {}
  
  plans[userId] = {
    plan: 'PRO',
    expiresAt: expiresAt.toISOString(),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('sk_user_plans', JSON.stringify(plans));
  
  return expiresAt.toISOString();
}
