import { getCurrentUser } from '../services/auth.service.js';
import { calculateFineGold } from '../utils/business-rules.js';
import { MAX_RUPEE, MAX_METAL_GRAMS } from '../utils/constants.js';
import { formatCurrency, formatIndianNumber } from '../utils/formatters.js';

export function renderCalculatorPage(container) {
  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#/auth';
    return;
  }

  // State
  let grossWeight = '150.00';
  let purity = '91.6'; // 22K default
  let rate = '62500';  // Market rate per 10g

  let focusedInput = 'weight'; // 'weight', 'purity', 'rate'

  function calculate() {
    const w = parseFloat(grossWeight) || 0;
    const p = parseFloat(purity) || 0;
    const r = parseFloat(rate) || 0;

    const fineGold = (w * p) / 100;
    // Rate is per 10g of fine gold
    const totalValue = (fineGold / 10) * r;

    return { fineGold: formatIndianNumber(fineGold, 3), totalValue: totalValue };
  }

  function handleNumpadClick(key) {
    let currentVal = '';
    if (focusedInput === 'weight') currentVal = grossWeight;
    else if (focusedInput === 'purity') currentVal = purity;
    else if (focusedInput === 'rate') currentVal = rate;

    if (key === 'backspace') {
      currentVal = currentVal.slice(0, -1);
      if (currentVal === '') currentVal = '0';
    } else if (key === 'clear') {
      currentVal = '0';
    } else if (key === '.') {
      if (!currentVal.includes('.')) {
        currentVal += '.';
      }
    } else {
      if (currentVal === '0') currentVal = key;
      else currentVal += key;
    }

    if (focusedInput === 'weight') {
      let intPart = (currentVal.split('.')[0] || '').replace(/[^0-9]/g, '');
      if (intPart && BigInt(intPart) > BigInt(MAX_METAL_GRAMS)) return;
      grossWeight = currentVal;
    }
    else if (focusedInput === 'purity') purity = currentVal;
    else if (focusedInput === 'rate') {
      let intPart = (currentVal.split('.')[0] || '').replace(/[^0-9]/g, '');
      if (intPart && BigInt(intPart) > BigInt(MAX_RUPEE)) return;
      rate = currentVal;
    }

    render();
  }

  function handleDirectInput(e, field) {
      let val = e.target.value;
      if (field === 'weight') {
          let intPart = (val.split('.')[0] || '').replace(/[^0-9]/g, '');
          if (intPart && BigInt(intPart) > BigInt(MAX_METAL_GRAMS)) e.target.value = grossWeight;
          else grossWeight = val;
      }
      if (field === 'purity') purity = val;
      if (field === 'rate') {
          let intPart = (val.split('.')[0] || '').replace(/[^0-9]/g, '');
          if (intPart && BigInt(intPart) > BigInt(MAX_RUPEE)) e.target.value = rate;
          else rate = val;
      }
      
      const results = calculate();
      const fgOut = document.getElementById('calcFineGoldOut');
      if (fgOut) fgOut.textContent = results.fineGold;
      const amtOut = document.getElementById('calcAmountOut');
      if (amtOut) amtOut.textContent = formatCurrency(results.totalValue);
  }

  function render() {
    const results = calculate();

    container.innerHTML = `
      <div class="bg-background text-on-background min-h-screen font-body-md antialiased pb-24 md:pb-0 md:pt-16">
          <!-- TopAppBar -->
          <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-margin-desktop h-16 bg-surface-offwhite md:bg-transparent shadow-sm md:shadow-none transition-all duration-300">
              <div class="flex items-center gap-4">
                  <button id="mobileBackBtn" class="md:hidden text-on-surface-variant hover:opacity-80 transition-opacity">
                      <span class="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h1 class="font-headline-md-mobile text-[20px] md:font-headline-md md:text-headline-md font-black text-gold-metallic hidden md:block">
                      ${user.khata_id}
                  </h1>
              </div>
              <div class="flex items-center gap-4 text-on-surface-variant">
                  <button id="desktopBackBtn" class="hidden md:flex text-on-surface-variant hover:opacity-80 transition-opacity items-center gap-2">
                      <span class="material-symbols-outlined">arrow_back</span> Dashboard
                  </button>
                  <div class="w-8 h-8 rounded-full bg-gold-soft text-charcoal-deep font-bold flex items-center justify-center">
                      ${user.full_name?.charAt(0) || 'U'}
                  </div>
              </div>
          </header>

          <main class="max-w-container-max mx-auto px-4 md:px-margin-desktop py-6 md:py-gutter mt-16 md:mt-0">
              <!-- Header -->
              <div class="mb-6 md:mb-gutter flex items-center justify-between">
                  <div>
                      <h2 class="font-headline-lg-mobile text-[24px] md:font-headline-lg md:text-[32px] text-primary font-bold">Gold Calculator</h2>
                      <p class="text-on-surface-variant mt-1 text-sm md:text-base">Calculate fine gold weight and value instantly.</p>
                  </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-gutter">
                  <!-- Calculator Inputs & Numpad Container -->
                  <div class="md:col-span-7 lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(26,28,30,0.04)] border border-surface-variant p-4 md:p-6 flex flex-col h-full">
                      
                      <!-- Inputs Section -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                          <!-- Weight Input -->
                          <div class="relative cursor-pointer" id="focus-weight">
                              <label class="block font-label-md text-[14px] text-on-surface-variant mb-2">Gross Weight</label>
                              <div class="relative">
                                  <input type="text" value="\${grossWeight}" placeholder="0.00" 
                                      class="input-calc w-full px-4 py-3 text-right font-data-mono text-[18px] text-primary bg-surface-offwhite border-0 border-b border-outline-variant focus:border-b-2 focus:border-gold-metallic focus:bg-surface-container-lowest transition-all focus:outline-none focus:ring-0 \${focusedInput === 'weight' ? 'border-b-2 border-gold-metallic bg-surface-container-lowest' : ''}" />
                                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-data-mono text-[16px] pointer-events-none pr-12">g</span>
                              </div>
                          </div>
                          
                          <!-- Purity Input -->
                          <div>
                              <label class="block font-label-md text-[14px] text-on-surface-variant mb-2">Purity</label>
                              <div class="flex flex-col sm:flex-row gap-3">
                                  <div class="relative flex-grow cursor-pointer" id="focus-purity">
                                      <input type="text" value="\${purity}" placeholder="99.9" 
                                          class="input-calc w-full px-4 py-3 text-right font-data-mono text-[18px] text-primary bg-surface-offwhite border-0 border-b border-outline-variant focus:border-b-2 focus:border-gold-metallic focus:bg-surface-container-lowest transition-all focus:outline-none focus:ring-0 \${focusedInput === 'purity' ? 'border-b-2 border-gold-metallic bg-surface-container-lowest' : ''}" />
                                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-data-mono text-[16px] pointer-events-none pr-12">%</span>
                                  </div>
                                  <!-- Quick Purity Chips -->
                                  <div class="flex gap-2 justify-end sm:justify-start">
                                      <button class="purity-chip px-3 py-1 rounded-full border border-gold-metallic bg-gold-soft/20 text-on-secondary-container font-label-md text-[14px] hover:bg-gold-soft transition-colors whitespace-nowrap" data-val="91.6">22K</button>
                                      <button class="purity-chip px-3 py-1 rounded-full border border-outline-variant bg-surface-container text-on-surface-variant font-label-md text-[14px] hover:bg-surface-variant transition-colors whitespace-nowrap" data-val="100">24K</button>
                                      <button class="purity-chip px-3 py-1 rounded-full border border-outline-variant bg-surface-container text-on-surface-variant font-label-md text-[14px] hover:bg-surface-variant transition-colors whitespace-nowrap" data-val="75">18K</button>
                                  </div>
                              </div>
                          </div>
                          
                          <!-- Rate Input -->
                          <div class="sm:col-span-2 relative cursor-pointer" id="focus-rate">
                              <label class="block font-label-md text-[14px] text-on-surface-variant mb-2">Market Rate (per 10g)</label>
                              <div class="relative max-w-sm">
                                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-data-mono text-[18px] pointer-events-none">₹</span>
                                  <input type="text" value="\${rate}" placeholder="0" 
                                      class="input-calc w-full pl-10 pr-4 py-3 text-right font-data-mono text-[18px] text-primary bg-surface-offwhite border-0 border-b border-outline-variant focus:border-b-2 focus:border-gold-metallic focus:bg-surface-container-lowest transition-all focus:outline-none focus:ring-0 \${focusedInput === 'rate' ? 'border-b-2 border-gold-metallic bg-surface-container-lowest' : ''}" />
                              </div>
                          </div>
                      </div>

                      <div class="flex-grow"></div>

                      <!-- Custom Numpad -->
                      <div class="grid grid-cols-4 gap-3 max-w-sm mx-auto mt-6 w-full">
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="7">7</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="8">8</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="9">9</button>
                          <button class="numpad-btn aspect-square bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-surface-variant transition-transform active:scale-95" data-key="backspace">
                              <span class="material-symbols-outlined">backspace</span>
                          </button>
                          
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="4">4</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="5">5</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="6">6</button>
                          <button class="numpad-btn aspect-square bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-lg flex items-center justify-center font-bold text-xl hover:bg-surface-variant transition-transform active:scale-95" data-key="clear">C</button>
                          
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="1">1</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="2">2</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="3">3</button>
                          <button class="numpad-btn row-span-2 bg-gold-metallic text-on-primary rounded-lg flex items-center justify-center shadow-sm hover:opacity-90 transition-transform active:scale-95" data-key="enter">
                              <span class="material-symbols-outlined text-[32px]">keyboard_return</span>
                          </button>
                          
                          <button class="numpad-btn col-span-2 bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key="0">0</button>
                          <button class="numpad-btn aspect-square bg-surface-container-low border border-surface-variant rounded-lg flex items-center justify-center font-headline-md text-[24px] text-primary hover:bg-surface-container transition-transform active:scale-95" data-key=".">.</button>
                      </div>
                  </div>

                  <!-- Output Display Panel -->
                  <div class="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
                      <!-- Result Card -->
                      <div class="bg-charcoal-deep rounded-xl p-8 flex flex-col justify-center relative overflow-hidden shadow-lg h-full min-h-[300px]">
                          <div class="absolute -right-12 -top-12 w-48 h-48 bg-gold-metallic/5 rounded-full blur-2xl pointer-events-none"></div>
                          <div class="relative z-10 space-y-8">
                              <div>
                                  <p class="font-label-md text-[14px] text-outline mb-1 uppercase tracking-wider">Fine Gold Weight</p>
                                  <div class="flex items-baseline gap-2">
                                      <span class="font-display-lg text-[48px] text-on-primary tracking-tight">\${results.fineGold}</span>
                                      <span class="font-data-mono text-[18px] text-gold-metallic">g</span>
                                  </div>
                              </div>
                              <div class="h-px w-full bg-outline-variant/20"></div>
                              <div>
                                  <p class="font-label-md text-[14px] text-outline mb-1 uppercase tracking-wider">Total Value</p>
                                  <div class="flex items-baseline gap-2">
                                  <span class="font-display-lg text-[40px] md:text-[48px] text-on-primary tracking-tight" style="overflow:hidden; text-overflow:ellipsis;">\${formatCurrency(results.totalValue)}</span>
                              </div>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Action Buttons -->
                      <div class="grid grid-cols-2 gap-4">
                          <button id="copyBtn" class="w-full py-4 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[14px] text-primary flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
                              <span class="material-symbols-outlined text-[20px]">content_copy</span>
                              Copy Values
                          </button>
                          <button id="addLedgerBtn" class="w-full py-4 bg-charcoal-deep text-on-primary rounded-lg font-label-md text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                              <span class="material-symbols-outlined text-[20px]">add_task</span>
                              Add to Ledger
                          </button>
                      </div>
                      <p class="text-[11px] text-on-surface-variant/60 text-center mt-4 leading-relaxed px-4">Calculations are generated from information entered by users. Verify independently before making financial decisions.</p>
                  </div>
          </main>
      </div>
    `;
    
    attachListeners();
  }

  function attachListeners() {
    document.getElementById('mobileBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');
    document.getElementById('desktopBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');

    // Focus fields
    document.getElementById('focus-weight')?.addEventListener('click', () => { focusedInput = 'weight'; render(); });
    document.getElementById('focus-purity')?.addEventListener('click', () => { focusedInput = 'purity'; render(); });
    document.getElementById('focus-rate')?.addEventListener('click', () => { focusedInput = 'rate'; render(); });

    // Direct input handler (for keyboard users)
    const inputs = document.querySelectorAll('.input-calc');
    inputs[0].addEventListener('input', (e) => handleDirectInput(e, 'weight'));
    inputs[1].addEventListener('input', (e) => handleDirectInput(e, 'purity'));
    inputs[2].addEventListener('input', (e) => handleDirectInput(e, 'rate'));

    // Purity Chips
    document.querySelectorAll('.purity-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        purity = chip.dataset.val;
        focusedInput = 'purity';
        render();
      });
    });

    // Numpad Keys
    document.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === 'enter') {
          // move focus to next
          if (focusedInput === 'weight') focusedInput = 'purity';
          else if (focusedInput === 'purity') focusedInput = 'rate';
          else if (focusedInput === 'rate') focusedInput = 'weight';
          render();
        } else {
          handleNumpadClick(key);
        }
      });
    });

    document.getElementById('copyBtn')?.addEventListener('click', () => {
        const results = calculate();
        const text = `Fine Gold: ${results.fineGold}g | Total Value: ${formatCurrency(results.totalValue)}`;
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    });

    document.getElementById('addLedgerBtn')?.addEventListener('click', () => {
        window.location.hash = '#/new-individual';
    });
  }

  render();
}