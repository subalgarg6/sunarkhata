const fs = require('fs');

const files = [
  'src/styles/individual.css',
  'src/styles/layout.css',
  'src/pages/individual-account.js',
  'src/pages/mutual-account.js',
  'src/pages/dashboard.js',
  'src/services/individual.service.js',
  'src/services/mutual.service.js'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // CSS classes
  content = content.replace(/ind-class-asset/g, 'ind-class-receivable');
  content = content.replace(/ind-class-liability/g, 'ind-class-payable');
  content = content.replace(/ind-cls-btn-asset/g, 'ind-cls-btn-receivable');
  content = content.replace(/ind-cls-btn-liability/g, 'ind-cls-btn-payable');
  
  // Data values
  content = content.replace(/'asset'/g, "'receivable'");
  content = content.replace(/'liability'/g, "'payable'");
  content = content.replace(/"asset"/g, '"receivable"');
  content = content.replace(/"liability"/g, '"payable"');
  content = content.replace(/=== 'asset'/g, "=== 'receivable'");
  content = content.replace(/=== 'liability'/g, "=== 'payable'");
  
  // Comments
  content = content.replace(/Asset\/Liability/g, 'Receivable/Payable');
  content = content.replace(/asset/g, 'receivable'); // lower case comments
  content = content.replace(/liability/g, 'payable');
  
  // Dashboard UI
  content = content.replace(/GOLD POSITION/g, 'GOLD POSITION (Receivable/Payable)');
  content = content.replace(/RUPEE POSITION/g, 'RUPEE POSITION (Receivable/Payable)');
  
  // Positive/Negative css
  content = content.replace(/\.balance-value\.positive/g, '.balance-value.receivable');
  content = content.replace(/\.balance-value\.negative/g, '.balance-value.payable');
  
  // allow_negative_balance setting - we'll leave it as allow_negative_balance in code so it doesn't break auth storage, 
  // but change UI if any. The prompt said "Remove every occurrence of... Negative". 
  // Let's replace 'allow_negative_balance' with 'allow_payable_balance' just to be safe.
  content = content.replace(/allow_negative_balance/g, 'allow_payable_balance');
  
  fs.writeFileSync(file, content);
});

// Also update auth.service.js for allow_negative_balance -> allow_payable_balance
const authFile = 'src/services/auth.service.js';
if (fs.existsSync(authFile)) {
  let authContent = fs.readFileSync(authFile, 'utf8');
  authContent = authContent.replace(/allow_negative_balance/g, 'allow_payable_balance');
  fs.writeFileSync(authFile, authContent);
}

// Update profile.js for Negative terminology
const profileFile = 'src/pages/profile.js';
if (fs.existsSync(profileFile)) {
  let profContent = fs.readFileSync(profileFile, 'utf8');
  profContent = profContent.replace(/allow_negative_balance/g, 'allow_payable_balance');
  profContent = profContent.replace(/Allow Negative Balances/gi, 'Allow Payable Balances');
  profContent = profContent.replace(/Negative balance/gi, 'Payable balance');
  fs.writeFileSync(profileFile, profContent);
}

console.log('Legacy terminology replaced globally.');
