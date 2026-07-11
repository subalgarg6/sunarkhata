import { getCurrentUser } from '../services/auth.service.js';
import { createIndividualAccount } from '../services/individual.service.js';
import { createMutualAccount } from '../services/mutual.service.js';

export function renderAccountCreation(container, type) {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/auth'; return; }

  // type is either 'individual' or 'mutual'
  let role = 'vendor'; // default
  let metalClass = 'payable'; // default (Naam)
  let rupeeClass = 'payable'; // default (Naam)

  function render() {
    container.innerHTML = `
      <div class="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:items-center md:justify-center">
          <!-- Top Navigation for Mobile -->
          <header class="md:hidden flex items-center justify-between p-margin-mobile bg-surface-offwhite sticky top-0 z-50">
              <button id="mobileBackBtn" class="p-2 -ml-2 text-on-surface-variant rounded-full hover:bg-surface-container-low transition-colors">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">arrow_back</span>
              </button>
              <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">New ${type === 'mutual' ? 'Mutual' : 'Individual'} Account</h1>
              <div class="w-10"></div>
          </header>
          
          <main class="flex-1 w-full max-w-4xl md:my-10 bg-surface-offwhite md:bg-surface-container-lowest md:rounded-xl md:shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
              <!-- Desktop Header -->
              <div class="hidden md:flex items-center justify-between px-10 py-6 border-b border-surface-variant bg-surface-offwhite">
                  <div>
                      <h1 class="font-headline-md text-headline-md text-primary">Create New ${type === 'mutual' ? 'Mutual' : 'Individual'} Account</h1>
                      <p class="text-on-surface-variant text-sm">Register a new ledger for your gold or cash transactions.</p>
                  </div>
                  <button id="desktopCloseBtn" class="p-2 text-on-surface-variant rounded-full hover:bg-surface-container-low transition-colors">
                      <span class="material-symbols-outlined">close</span>
                  </button>
              </div>
              
              <div class="flex-1 p-margin-mobile md:p-10">
                  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <!-- Left Column: Identity & Metadata -->
                      <div class="lg:col-span-5 space-y-8">
                          <!-- Decorative Image -->
                          <div class="hidden md:flex justify-center p-6 bg-surface-container-low rounded-xl">
                              <img alt="Gold ledger trust icons" class="h-32 w-32 object-contain" src="https://lh3.googleusercontent.com/aida/AP1WRLv5MWdpsS4AV1bqb9lrdJpWYXLxnWHexL6S-xHJGTjZJIqIBQtWH92nCEMk5hN1HVf5z3NUb3wWEDa2Orjg3TLUgdySqJKtX4yDG98OYxJxPEJStqpqiiOzVN-KQ-ZImXe5NPAAM08OUMpr9J1a_IVjdnBVmtCIHUetU0Wggfl3vGkAgjbeUITAGhJ6ylSasVbPbQhhaF0rMk8LXn7beSO9wMYYAypZmVdwKGVCxz2Gdcq7KY2m97f68w8"/>
                          </div>
                          <!-- Role Selection -->
                          <section class="space-y-4">
                              <h2 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Account Type</h2>
                              <div class="grid grid-cols-2 gap-4">
                                  <button class="role-card active flex flex-col items-center justify-center p-6 border border-gold-metallic rounded-lg transition-all duration-200 bg-gold-soft cursor-pointer shadow-[0_0_0_1px_theme('colors.gold-metallic')]" data-role="vendor">
                                      <span class="material-symbols-outlined text-3xl mb-2 text-gold-metallic">storefront</span>
                                      <span class="font-label-md text-label-md text-primary">Vendor</span>
                                  </button>
                                  <button class="role-card flex flex-col items-center justify-center p-6 border border-outline-variant rounded-lg transition-all duration-200 bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer" data-role="customer">
                                      <span class="material-symbols-outlined text-3xl mb-2 text-on-surface-variant">person</span>
                                      <span class="font-label-md text-label-md text-on-surface-variant">Customer</span>
                                  </button>
                              </div>
                          </section>
                          <!-- Name Input -->
                          <section>
                              <div class="relative mb-6">
                                  <input class="w-full py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:border-gold-metallic focus:ring-0 peer text-body-lg text-primary outline-none" id="accountName" placeholder=" " required type="text"/>
                                  <label class="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant transition-all duration-200 peer-focus:-top-2 peer-focus:text-[12px] peer-focus:font-semibold peer-focus:text-gold-metallic peer-valid:-top-2 peer-valid:text-[12px] peer-valid:font-semibold peer-valid:text-gold-metallic" for="accountName">Name the Vendor</label>
                              </div>
                              <div class="relative mt-6 pt-2">
                                  <label class="block text-[12px] font-semibold text-on-surface-variant mb-1" for="contactNumber">Mobile Number (Optional)</label>
                                  <input class="w-full py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:border-gold-metallic focus:ring-0 text-body-lg text-primary outline-none" id="contactNumber" placeholder="Enter mobile number" type="tel"/>
                              </div>
                          </section>
                      </div>
                      
                      <!-- Right Column: Opening Balance Setup -->
                      <div class="lg:col-span-7 space-y-6">
                          <h2 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider md:mb-2">Initial Balances</h2>
                          <div class="space-y-6">
                              <!-- Metal Balance Card -->
                              <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                                  <div class="flex items-center gap-3 mb-6">
                                      <div class="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center text-gold-metallic">
                                          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">weight</span>
                                      </div>
                                      <h3 class="font-headline-md text-body-lg font-semibold text-primary">Metal Balance</h3>
                                  </div>
                                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                      <div class="relative">
                                          <input class="w-full py-2 bg-transparent border-0 border-b-2 border-outline-variant focus:border-gold-metallic focus:ring-0 peer text-body-lg text-primary outline-none" id="metalWeight" placeholder=" " step="0.001" type="number" value="0"/>
                                          <label class="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant transition-all duration-200 peer-focus:-top-2 peer-focus:text-[12px] peer-focus:font-semibold peer-focus:text-gold-metallic peer-valid:-top-2 peer-valid:text-[12px] peer-valid:font-semibold peer-valid:text-gold-metallic" for="metalWeight">Weight (g)</label>
                                      </div>
                                      <div class="relative flex items-center h-[42px] border-b-2 border-outline-variant mt-auto">
                                          <span class="text-body-lg text-on-surface-variant">24K Pure Gold</span>
                                      </div>
                                  </div>
                                  <div class="flex bg-surface-container-highest p-1 rounded-lg">
                                      <button class="metal-toggle-btn flex-1 py-2 font-label-md text-sm rounded-md transition-colors cursor-pointer text-on-surface-variant hover:text-primary" data-val="receivable">Receivable (Jama)</button>
                                      <button class="metal-toggle-btn active flex-1 py-2 font-label-md text-sm rounded-md transition-colors shadow-sm cursor-pointer bg-charcoal-deep text-on-primary" data-val="payable">Payable (Naam)</button>
                                  </div>
                              </div>
                              
                              <!-- Rupee Balance Card -->
                              <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                                  <div class="flex items-center gap-3 mb-6">
                                      <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                                          <span class="text-xl font-bold">₹</span>
                                      </div>
                                      <h3 class="font-headline-md text-body-lg font-semibold text-primary">Rupee Balance</h3>
                                  </div>
                                  <div class="relative mb-6">
                                      <input class="w-full py-2 bg-transparent border-0 border-b-2 border-outline-variant focus:border-gold-metallic focus:ring-0 peer text-body-lg text-primary outline-none" id="rupeeAmount" placeholder=" " type="number" value="0"/>
                                      <label class="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant transition-all duration-200 peer-focus:-top-2 peer-focus:text-[12px] peer-focus:font-semibold peer-focus:text-gold-metallic peer-valid:-top-2 peer-valid:text-[12px] peer-valid:font-semibold peer-valid:text-gold-metallic" for="rupeeAmount">Amount (₹)</label>
                                  </div>
                                  <div class="flex bg-surface-container-highest p-1 rounded-lg">
                                      <button class="rupee-toggle-btn flex-1 py-2 font-label-md text-sm rounded-md transition-colors cursor-pointer text-on-surface-variant hover:text-primary" data-val="receivable">Receivable (Jama)</button>
                                      <button class="rupee-toggle-btn active flex-1 py-2 font-label-md text-sm rounded-md transition-colors shadow-sm cursor-pointer bg-charcoal-deep text-on-primary" data-val="payable">Payable (Naam)</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- Footer Actions -->
              <div class="sticky bottom-0 p-margin-mobile md:px-10 md:py-8 bg-surface-offwhite md:bg-surface-container-low border-t border-surface-variant z-40 flex items-center justify-between">
                  <button class="hidden md:flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md">
                      <span class="material-symbols-outlined">help</span>
                      <span>Need help?</span>
                  </button>
                  <div class="flex gap-4 w-full md:w-auto">
                      <button id="createBtn" class="flex-1 md:flex-none md:px-10 bg-charcoal-deep text-on-primary font-label-md text-label-md py-4 rounded-lg shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                          <span>Create Account</span>
                          <span class="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                  </div>
              </div>
          </main>
      </div>
    `;

    attachListeners();
  }

  function goBack() {
      window.location.hash = '#/dashboard';
  }

  function attachListeners() {
      document.getElementById('mobileBackBtn')?.addEventListener('click', goBack);
      document.getElementById('desktopCloseBtn')?.addEventListener('click', goBack);

      // Role selection
      document.querySelectorAll('.role-card').forEach(card => {
          card.addEventListener('click', function() {
              document.querySelectorAll('.role-card').forEach(c => {
                  c.classList.remove('active', 'bg-gold-soft', 'border-gold-metallic', "shadow-[0_0_0_1px_theme('colors.gold-metallic')]");
                  c.classList.add('bg-surface-container-lowest', 'border-outline-variant');
                  c.querySelector('.material-symbols-outlined').classList.remove('text-gold-metallic');
                  c.querySelector('.material-symbols-outlined').classList.add('text-on-surface-variant');
                  c.querySelector('span:last-child').classList.remove('text-primary');
                  c.querySelector('span:last-child').classList.add('text-on-surface-variant');
              });
              
              this.classList.add('active', 'bg-gold-soft', 'border-gold-metallic', "shadow-[0_0_0_1px_theme('colors.gold-metallic')]");
              this.classList.remove('bg-surface-container-lowest', 'border-outline-variant');
              this.querySelector('.material-symbols-outlined').classList.add('text-gold-metallic');
              this.querySelector('.material-symbols-outlined').classList.remove('text-on-surface-variant');
              this.querySelector('span:last-child').classList.add('text-primary');
              this.querySelector('span:last-child').classList.remove('text-on-surface-variant');
              
              role = this.dataset.role;
              const typeText = this.querySelector('span:last-child').innerText;
              const label = document.querySelector('label[for="accountName"]');
              if (label) label.innerText = `Name the ${typeText}`;
          });
      });

      // Metal Toggle
      document.querySelectorAll('.metal-toggle-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              document.querySelectorAll('.metal-toggle-btn').forEach(b => {
                  b.classList.remove('active', 'bg-charcoal-deep', 'text-on-primary', 'shadow-sm');
                  b.classList.add('text-on-surface-variant');
              });
              this.classList.add('active', 'bg-charcoal-deep', 'text-on-primary', 'shadow-sm');
              this.classList.remove('text-on-surface-variant');
              metalClass = this.dataset.val;
          });
      });

      // Rupee Toggle
      document.querySelectorAll('.rupee-toggle-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              document.querySelectorAll('.rupee-toggle-btn').forEach(b => {
                  b.classList.remove('active', 'bg-charcoal-deep', 'text-on-primary', 'shadow-sm');
                  b.classList.add('text-on-surface-variant');
              });
              this.classList.add('active', 'bg-charcoal-deep', 'text-on-primary', 'shadow-sm');
              this.classList.remove('text-on-surface-variant');
              rupeeClass = this.dataset.val;
          });
      });

      // Form submission
      document.getElementById('createBtn')?.addEventListener('click', () => {
          const name = document.getElementById('accountName').value.trim();
          if (!name) { alert('Please provide a name'); return; }

          const w = parseFloat(document.getElementById('metalWeight').value) || 0;
          const p = 100; // Force 24K Pure Gold
          const r = parseFloat(document.getElementById('rupeeAmount').value) || 0;

          // Compute fine gold equivalent
          const fineGold = w;

          try {
              if (type === 'individual') {
                  const account = createIndividualAccount({
                      userId: user.id,
                      role: role === 'vendor' ? 'supplier' : 'trade_customer',
                      otherPartyName: name,
                      metalBalance: fineGold,
                      metalClass: metalClass,
                      rupeeBalance: r,
                      rupeeClass: rupeeClass,
                      purityRecord: p < 100 ? { purity: p, description: `Initial ${p}% purity` } : null
                  });
                  window.location.hash = `#/account/${account.id}`;
              } else {
                  const account = createMutualAccount({
                      userId: user.id,
                      role: role === 'vendor' ? 'supplier' : 'trade_customer',
                      otherPartyName: name,
                      metalBalance: fineGold,
                      metalClass: metalClass,
                      rupeeBalance: r,
                      rupeeClass: rupeeClass,
                      purityRecord: p < 100 ? { purity: p, description: `Initial ${p}% purity` } : null
                  });
                  window.location.hash = `#/mutual/${account.id}`;
              }
          } catch (e) {
              alert(e.message);
          }
      });
  }

  render();
}
