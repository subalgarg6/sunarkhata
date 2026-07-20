import { getCurrentUser } from '../services/auth.service.js';
import { getAccount, addTransaction } from '../services/individual.service.js';
import { getMutualAccount, addMutualTransaction, isAccountLocked } from '../services/mutual.service.js';
import { isCustomerMetalPayable, calculateFineGold } from '../utils/business-rules.js';
import { getActionLabels, normalizePosition } from '../utils/position-engine.js';
import { getPerspectiveTitle, getPerspectiveMetalClass, getPerspectiveRupeeClass, getPerspectiveRole } from '../utils/mutual-perspective.js';
import { PLACEHOLDER_PAIRS, MAX_RUPEE, MAX_METAL_GRAMS, MAX_MENTION_LENGTH } from '../utils/constants.js';
import { applyIndianInputFormatting, parseIndianNumber, applyMetalInputFormatting, formatIndianNumber, formatCurrency } from '../utils/formatters.js';

export async function renderTransaction(container, { contextType, accountId, actionType, ledgerType, onSuccess, onClose }) {
    const user = getCurrentUser();
    if (!user) { window.location.hash = '#/auth'; return; }

    let account = null;
    let submitTxn = null;

    if (contextType === 'individual') {
        account = getAccount(accountId);
        submitTxn = async (txn) => {
            addTransaction(accountId, txn);
        };
    } else if (contextType === 'mutual') {
        account = await getMutualAccount(accountId);
        submitTxn = async (txn) => {
            txn.created_by = user.id;
            await addMutualTransaction(accountId, txn);
        };
    }

    if (!account) return onClose();

    if (contextType === 'mutual' && isAccountLocked(account)) {
        alert('This mutual account is currently locked for closure. No new transactions can be initiated.');
        return onClose();
    }

    const partyName = contextType === 'mutual' ? getPerspectiveTitle(account, user.id) : (account.other_party_name || account.partnerName || 'Unknown');
    // Position perspective (so the UI correctly detects if they are natively receivable or payable)
    const metalPos = (contextType === 'mutual' ? getPerspectiveMetalClass(account, user.id) : account.metal_class) || 'payable'; 
    const rupeePos = (contextType === 'mutual' ? getPerspectiveRupeeClass(account, user.id) : account.rupee_class) || 'receivable';
    const role = (contextType === 'mutual' ? getPerspectiveRole(account, user.id) : account.role);

    // Book Rate Eligibility
    const showBookRate = isCustomerMetalPayable(role, metalPos) && (actionType === 'decrease_payable' || actionType === 'rate_booking');
    
    let metalMethod = 'direct_metal'; // 'direct_metal' or 'book_rate'
    if (actionType === 'rate_booking') {
        metalMethod = 'book_rate';
        if (!showBookRate) metalMethod = 'direct_metal'; // fallback
    }

    // For metal row purity converter
    const userDefaultPurity = parseFloat(user.default_purity) || 100;
    let purityRows = [ { id: 1, weight: '', purity: userDefaultPurity, labour: 0, mention: '' } ];

    // Local state for overlay
    let state = {
        narration: '',
        bookRupee: '',
        bookRate: '',
        convertMetal: '',
        convertRate: '',
        convertRupee: '',
        sourceOperation: '',
        rupeeAmt: ''
    };

    function calcFineGoldRow(row) {
        return calculateFineGold(row.weight, row.purity, row.labour);
    }

    function fmtG(g) { return formatIndianNumber(g, 3); }
    function fmtR(r) { return new Intl.NumberFormat('en-IN').format(Math.round(parseFloat(r || 0))); }

    function getScreenHTML() {
        if (actionType.startsWith('increase_') || actionType.startsWith('decrease_') || actionType === 'rate_booking') {
            
            // Re-derive user-facing semantic strings from the actionType
            let isInc = actionType.startsWith('increase');
            let positionText = actionType.includes('receivable') ? 'Receivable' : 'Payable';
            
            // If they entered via Rate Booking, explicitly label as Rate Booking
            let titleText = actionType === 'rate_booking' ? 'Book Rate' : `${isInc ? 'Increase' : 'Decrease'} ${positionText}`;
            const title = contextType === 'mutual' ? `Propose ${titleText}` : titleText;
            
            let rupeePlaceholder = 'e.g. Cash Payment';
            if (actionType === 'decrease_receivable') rupeePlaceholder = 'e.g. Bank Transfer';
            if (actionType === 'increase_payable') rupeePlaceholder = 'e.g. Advance Payment';
            if (actionType === 'decrease_payable') rupeePlaceholder = 'e.g. UPI Payment';

            if (ledgerType === 'rupee') {
                const accentColor = isInc ? 'text-success-emerald' : 'text-error-crimson';
                const accentBg = isInc ? 'bg-success-emerald/10' : 'bg-error-crimson/10';
                const accentBorder = isInc ? 'bg-success-emerald' : 'bg-error-crimson';
                const iconName = isInc ? 'arrow_upward' : 'arrow_downward';

                return `
                <div class="fixed inset-0 z-[60] flex flex-col items-center justify-end md:justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-0 md:p-4">
                    <div class="flex flex-col bg-surface w-full md:w-[440px] max-h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <header class="px-6 py-5 border-b border-surface-variant flex justify-between items-center shrink-0">
                            <div>
                                <span class="font-label-bold text-[10px] text-secondary uppercase tracking-widest block mb-1">Rupee Transaction</span>
                                <h1 class="font-display-md text-xl text-primary leading-tight font-bold">${title}</h1>
                            </div>
                            <button id="cancelHeaderBtn" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </header>
                        
                        <main class="flex-1 overflow-y-auto p-6 bg-surface-container-lowest relative">
                            <div class="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-surface-variant relative overflow-hidden">
                                <!-- Subtle top accent border -->
                                <div class="absolute top-0 left-0 w-full h-[4px] ${accentBorder} opacity-90"></div>
                                
                                <div class="flex items-center gap-2 mb-6 mt-1">
                                    <div class="w-8 h-8 rounded-full ${accentBg} ${accentColor} flex items-center justify-center">
                                        <span class="material-symbols-outlined text-[18px]">${iconName}</span>
                                    </div>
                                    <label class="block font-label-bold text-on-surface-variant uppercase tracking-widest text-[11px]">Transaction Amount</label>
                                </div>

                                <div class="flex items-center gap-2 bg-surface-container-lowest rounded-xl px-3 py-4 border border-surface-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all mb-6">
                                    <span class="text-title-lg text-on-surface-variant font-medium mt-1">₹</span>
                                    <input id="rupeeAmtInp" class="font-data-mono text-[28px] h-[40px] font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary placeholder-outline/30 tracking-tight" style="font-size: 28px;" type="text" inputmode="decimal" placeholder="0" value="${state.rupeeAmt}" />
                                </div>
                                
                                <div class="flex flex-col gap-2">
                                    <label class="font-body-sm font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">Transaction Mention (Optional)</label>
                                    <input id="txnNarration" class="w-full h-12 px-4 border border-surface-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/40 bg-surface-container-lowest text-body-md" placeholder="${rupeePlaceholder}" type="text" value="${state.narration}" maxlength="${MAX_MENTION_LENGTH}"/>
                                </div>
                            </div>
                        </main>
                        
                        <footer class="p-6 border-t border-surface-variant shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                            <div class="flex gap-3 w-full">
                                <button id="cancelBtn" class="flex-1 h-12 border border-surface-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-all">
                                    Cancel
                                </button>
                                <button id="commitBtn" class="flex-[2] h-12 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-[18px]">check_circle</span>
                                    ${contextType === 'mutual' ? 'Propose Transaction' : 'Confirm Transaction'}
                                </button>
                            </div>
                            <p class="text-[10px] text-on-surface-variant/60 text-center mt-2 leading-relaxed px-4">These records are maintained by users. Please verify against your own business records.</p>
                        </footer>
                    </div>
                </div>
                `;
            }
            
            let totalFine = 0;
            purityRows.forEach(r => totalFine += calcFineGoldRow(r));

            // Setup Segmented control if eligible (only when dealing with metal and not explicit rate_booking)
            let segmentedHTML = '';
            if (showBookRate && ledgerType === 'metal' && actionType !== 'rate_booking') {
                segmentedHTML = `
                <div class="flex p-1 bg-surface-container-high rounded-lg w-full mb-4">
                    <button id="directMetalBtn" class="flex-1 px-4 py-3 min-h-[48px] md:min-h-[44px] font-label-bold text-label-bold rounded transition-colors ${metalMethod === 'direct_metal' ? 'bg-surface-container-lowest text-primary shadow-sm border border-surface-variant/50' : 'text-on-surface-variant hover:text-primary'}">
                        Direct Metal
                    </button>
                    <button id="bookRateBtn" class="flex-1 px-4 py-3 min-h-[48px] md:min-h-[44px] font-label-bold text-label-bold rounded transition-colors ${metalMethod === 'book_rate' ? 'bg-surface-container-lowest text-primary shadow-sm border border-surface-variant/50' : 'text-on-surface-variant hover:text-primary'}">
                        Book Rate
                    </button>
                </div>
                `;
            }

            let formHTML = '';
            if (ledgerType === 'metal') {
                if (metalMethod === 'direct_metal') {
                    let rowsHTML = purityRows.map((r, i) => `
                    <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm flex flex-col gap-4 relative">
                        <div class="flex justify-between items-center border-b border-surface-variant pb-2">
                            <span class="font-label-bold text-on-surface-variant tracking-wider uppercase text-xs">Item ${i+1}</span>
                            ${purityRows.length > 1 ? `
                            <button class="remove-row-btn w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error-crimson hover:bg-error-container/20 transition-colors -mr-2 -mt-2 rounded-full" data-index="${i}">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                            ` : ''}
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1.5 col-span-2">
                                <label class="font-body-sm text-on-surface-variant">Original Weight (g)</label>
                                <input class="w-full h-11 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-primary row-input text-lg" data-field="weight" data-index="${i}" type="number" inputmode="decimal" step="any" placeholder="0.000" value="${r.weight}">
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="font-body-sm text-on-surface-variant">Purity (%)</label>
                                <input class="w-full h-11 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-primary row-input text-lg" data-field="purity" data-index="${i}" type="number" inputmode="decimal" step="any" value="${r.purity}">
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="font-body-sm text-on-surface-variant">Labour (%)</label>
                                <input class="w-full h-11 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-primary row-input text-lg" data-field="labour" data-index="${i}" type="number" inputmode="decimal" step="any" value="${r.labour}">
                                <div class="text-[10px] text-on-surface-variant mt-0.5 ml-1" id="raw-display-tx-${i}">Raw = ${r.labour || 0}%</div>
                            </div>
                            <div class="flex flex-col gap-1.5 justify-end col-span-2 mt-2">
                                <div class="h-11 px-4 bg-surface-container-low rounded-lg border border-surface-variant flex items-center justify-between">
                                    <span class="font-body-sm text-on-surface-variant font-bold">Fine Gold:</span>
                                    <span id="row-fine-${i}" class="font-data-mono font-bold text-primary text-lg">${fmtG(calcFineGoldRow(r))} g</span>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1.5 col-span-2 mt-2">
                                <label class="font-body-sm font-bold text-on-surface uppercase tracking-wider text-xs">Transaction Mention (Optional)</label>
                                <input class="w-full h-11 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/50 row-input text-sm" data-field="mention" data-index="${i}" placeholder="e.g. ${PLACEHOLDER_PAIRS[i % 30].toLowerCase()}, etc." type="text" value="${r.mention || ''}" maxlength="${MAX_MENTION_LENGTH}">
                            </div>
                        </div>
                    </div>
                    `).join('');

                    formHTML = `
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-4" id="purity-cards-container">
                            ${rowsHTML}
                        </div>
                        <button id="addRowBtn" class="w-full h-12 bg-surface hover:bg-surface-container-low transition-colors text-primary font-label-bold flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-variant mt-2 text-sm uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[18px]">add_circle</span>
                            Add Item
                        </button>
                    </div>
                    
                    <div class="bg-surface-container-lowest border border-surface-variant p-5 rounded-xl border-l-4 border-l-gold-metallic flex flex-col mt-6 shadow-sm">
                        <span class="font-label-bold text-on-surface-variant uppercase tracking-widest text-xs">Total Fine Gold (24K)</span>
                        <div class="flex items-baseline gap-2 mt-1">
                            <span id="totalFineGold" class="${totalFine === 0 ? 'text-on-surface-variant text-2xl font-medium' : 'font-display-lg text-4xl text-primary font-bold leading-none'}">${totalFine === 0 ? '0.000 g' : fmtG(totalFine)}</span>
                            <span id="totalFineGoldUnit" class="font-title-lg text-on-surface-variant font-normal ${totalFine === 0 ? 'hidden' : ''}">g</span>
                        </div>
                    </div>
                    `;
                } else {
                    // Book Rate Form
                    const rVal = parseFloat(state.bookRupee || 0);
                    const gRate = parseFloat(state.bookRate || 0);
                    const fineGold = gRate > 0 ? (rVal / (gRate / 10)) : 0;
                    
                    formHTML = `
                    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-secondary mb-4 border border-surface-variant">
                        <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Rupee Amount</label>
                        <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-surface-variant focus-within:border-primary transition-colors">
                            <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                            <input id="bookRupeeInp" class="text-headline-sm font-bold font-data-mono w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="text" inputmode="decimal" value="${state.bookRupee}" placeholder="0" />
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-primary mb-4 border border-surface-variant">
                        <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Gold Rate (per 10g)</label>
                        <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-surface-variant focus-within:border-primary transition-colors">
                            <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                            <input id="bookRateInp" class="text-headline-sm font-bold font-data-mono w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="number" inputmode="decimal" step="any" value="${state.bookRate}" placeholder="0" />
                        </div>
                    </div>
                    
                    <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden mt-6 border-l-4 border-l-gold-metallic">
                        <label class="block font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider text-xs">Calculated Fine Gold (24K)</label>
                        <div class="flex items-baseline gap-2 mb-2">
                            <span id="bookFineGold" class="${fineGold === 0 ? 'text-on-surface-variant text-2xl font-medium' : 'font-display-lg text-4xl text-primary font-bold leading-none'}">${fineGold === 0 ? '0.000 g' : fmtG(fineGold)}</span>
                            <span id="bookFineGoldUnit" class="font-title-lg text-on-surface-variant font-normal ${fineGold === 0 ? 'hidden' : ''}">g</span>
                        </div>
                        <div class="pt-3 border-t border-surface-variant">
                            <p class="text-[11px] text-on-surface-variant italic">Calculated: Rupee Amount ÷ (Gold Rate ÷ 10)</p>
                        </div>
                    </div>
                    `;
                }
            }

            return `
            <div class="fixed inset-0 bg-surface-container-lowest z-50 flex flex-col h-[100dvh] w-full animate-in slide-in-from-bottom duration-300">
                <header class="px-4 py-4 border-b border-surface-variant flex justify-between items-center bg-surface w-full max-w-[800px] mx-auto shrink-0">
                    <div>
                        <span class="font-label-bold text-[10px] text-secondary uppercase tracking-widest block mb-1">${ledgerType} Transaction</span>
                        <h1 class="font-display-md text-xl text-primary leading-tight font-bold">${title}</h1>
                    </div>
                    <button id="cancelHeaderBtn" class="w-10 h-12 md:h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </header>
                <main class="flex-1 overflow-y-auto p-4 bg-surface w-full max-w-[800px] mx-auto relative">
                    <div class="flex flex-col pt-2 pb-24">
                    ${segmentedHTML}
                    ${formHTML}
                    ${(ledgerType === 'metal' && metalMethod === 'direct_metal') ? '' : `
                    <div class="flex flex-col gap-2 mt-6">
                        <label class="font-body-sm font-bold text-on-surface uppercase tracking-wider text-xs">Transaction Mention (Optional)</label>
                        <input id="txnNarration" class="w-full h-12 px-4 border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/50" placeholder="e.g. Invoice #1025" type="text" value="${state.narration}" maxlength="${MAX_MENTION_LENGTH}"/>
                    </div>
                    `}
                    </div>
                </main>
                <footer class="fixed bottom-0 left-0 right-0 p-4 border-t border-surface-variant pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
                    <div class="max-w-[800px] mx-auto flex gap-3 w-full">
                        <button id="cancelBtn" class="flex-1 h-12 border-2 border-surface-variant text-primary font-bold rounded-lg hover:bg-surface-container-low transition-all">
                            Cancel
                        </button>
                        <button id="commitBtn" class="flex-[2] h-12 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-black transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[20px]">check_circle</span>
                            ${contextType === 'mutual' ? 'Propose Transaction' : 'Confirm Transaction'}
                        </button>
                    </div>
                    <p class="text-[10px] text-on-surface-variant/60 text-center mt-2 leading-relaxed px-4">These records are maintained by users. Please verify against your own business records.</p>
                </footer>
            </div>
            `;
        } 
        else if (actionType === 'convert_metal_to_rupee') {
            const metalG = parseFloat(state.convertMetal) || 0;
            const rate = parseFloat(state.convertRate) || 0;
            const rVal = rate > 0 ? (metalG / 10) * rate : 0;
            const title = contextType === 'mutual' ? 'Propose Conversion' : 'Convert Metal to Rupee';
            
            return `
            <div class="fixed inset-0 bg-surface z-50 flex flex-col h-[100dvh] w-full animate-in slide-in-from-bottom duration-300">
                <header class="bg-surface sticky top-0 z-50 flex items-center justify-between px-4 py-4 border-b border-surface-variant shrink-0 w-full max-w-[800px] mx-auto">
                    <button id="cancelHeaderBtn" class="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors p-1 -ml-1 rounded-full hover:bg-surface-container-low w-10 h-12 md:h-10 justify-center">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 class="font-headline-sm text-primary flex-1 text-center pr-10 font-bold">${title}</h1>
                </header>
                <main class="flex-1 overflow-y-auto bg-surface w-full max-w-[800px] mx-auto">
                    <div class="flex flex-col p-4 md:p-6 pb-24 gap-6">
                        <p class="text-on-surface-variant font-body-sm text-center">Settle metal balances into currency at current market rates.</p>
                        <div class="flex items-center justify-center gap-4 bg-surface-container-lowest border border-surface-variant rounded-full py-3 px-6 w-max mx-auto shadow-sm">
                            <span class="font-label-bold text-on-surface-variant flex items-center gap-1 text-sm">
                                <span class="material-symbols-outlined text-[18px]">layers</span> METAL
                            </span>
                            <span class="material-symbols-outlined text-outline text-[24px]">arrow_forward</span>
                            <span class="font-label-bold text-primary flex items-center gap-1 text-sm">
                                <span class="material-symbols-outlined text-[18px]">currency_rupee</span> RUPEE
                            </span>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-secondary">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Fine Gold (g)</label>
                            <input id="convertMetalInp" class="w-full bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus:border-primary font-data-mono text-xl font-bold text-primary outline-none transition-colors" type="number" inputmode="decimal" step="any" placeholder="0.000" value="${state.convertMetal}" />
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-primary">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Gold Rate (per 10g)</label>
                            <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus-within:border-primary transition-colors">
                                <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                                <input id="convertRateInp" class="font-data-mono text-xl font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="number" inputmode="decimal" step="any" placeholder="0" value="${state.convertRate}" />
                            </div>
                        </div>
                        
                        <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden mt-2 border-l-4 border-l-gold-metallic">
                            <label class="block font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider text-xs">Rupee Amount</label>
                            <div class="flex items-baseline gap-2 mb-2">
                                <span id="convertRupeeOut" class="${rVal === 0 ? 'text-on-surface-variant text-2xl font-medium' : 'font-display-lg text-4xl text-primary font-bold leading-none'}">${rVal === 0 ? '₹ 0.00' : formatCurrency(rVal)}</span>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant mt-2">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">TRANSACTION MENTION (OPTIONAL)</label>
                            <textarea id="txnNarration" class="w-full border border-surface-variant rounded-lg p-3 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] bg-surface-container-low resize-none outline-none transition-all" placeholder="Add notes (e.g., Party Ref)..." maxlength="${MAX_MENTION_LENGTH}">${state.narration}</textarea>
                        </div>
                    </div>
                </main>
                <div class="fixed bottom-0 left-0 right-0 border-t border-surface-variant p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
                    <div class="flex gap-3 max-w-[800px] mx-auto w-full">
                        <button id="cancelBtn" class="flex-1 py-3.5 text-primary font-bold bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-lg border-2 border-surface-variant">
                            Cancel
                        </button>
                        <button id="commitBtn" class="flex-[2] py-3.5 bg-primary text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md">
                            ${contextType === 'mutual' ? 'Propose Conversion' : 'Confirm Conversion'}
                            <span class="material-symbols-outlined text-[20px]">check_circle</span>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }
        else if (actionType === 'convert_rupee_to_metal') {
            const rupee = parseFloat(state.convertRupee) || 0;
            const rate = parseFloat(state.convertRate) || 0;
            const metalG = rate > 0 ? rupee / (rate / 10) : 0;
            const title = contextType === 'mutual' ? 'Propose Conversion' : 'Convert Rupee to Metal';
            
            return `
            <div class="fixed inset-0 bg-surface z-50 flex flex-col h-[100dvh] w-full animate-in slide-in-from-bottom duration-300">
                <header class="bg-surface sticky top-0 z-50 flex items-center justify-between px-4 py-4 border-b border-surface-variant shrink-0 w-full max-w-[800px] mx-auto">
                    <button id="cancelHeaderBtn" class="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors p-1 -ml-1 rounded-full hover:bg-surface-container-low w-10 h-12 md:h-10 justify-center">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 class="font-headline-sm text-primary flex-1 text-center pr-10 font-bold">${title}</h1>
                </header>
                <main class="flex-1 overflow-y-auto bg-surface w-full max-w-[800px] mx-auto">
                    <div class="flex flex-col p-4 md:p-6 pb-24 gap-6">
                        <p class="text-on-surface-variant font-body-sm text-center">Settle rupee balances into metal at current market rates.</p>
                        <div class="flex items-center justify-center gap-4 bg-surface-container-lowest border border-surface-variant rounded-full py-3 px-6 w-max mx-auto shadow-sm">
                            <span class="font-label-bold text-primary flex items-center gap-1 text-sm">
                                <span class="material-symbols-outlined text-[18px]">currency_rupee</span> RUPEE
                            </span>
                            <span class="material-symbols-outlined text-outline text-[24px]">arrow_forward</span>
                            <span class="font-label-bold text-on-surface-variant flex items-center gap-1 text-sm">
                                <span class="material-symbols-outlined text-[18px]">layers</span> METAL
                            </span>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-primary">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Rupee Amount</label>
                            <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus-within:border-primary transition-colors">
                                <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                                <input id="convertRupeeInp" class="font-data-mono text-xl font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="text" inputmode="decimal" placeholder="0" value="${state.convertRupee}" />
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-primary">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Gold Rate (per 10g)</label>
                            <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus-within:border-primary transition-colors">
                                <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                                <input id="convertRateInp" class="font-data-mono text-xl font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="number" inputmode="decimal" step="any" placeholder="0" value="${state.convertRate}" />
                            </div>
                        </div>
                        
                        <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden mt-2 border-l-4 border-l-gold-metallic">
                            <label class="block font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider text-xs">Calculated Fine Gold</label>
                            <div class="flex items-baseline gap-2 mb-2">
                                <span id="convertMetalOut" class="${metalG === 0 ? 'text-on-surface-variant text-2xl font-medium' : 'font-display-lg text-4xl text-primary font-bold leading-none'}">${metalG === 0 ? '0.000 g' : fmtG(metalG)}</span>
                                <span id="convertMetalOutUnit" class="font-title-lg text-on-surface-variant font-normal ${metalG === 0 ? 'hidden' : ''}">g</span>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant mt-2">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">TRANSACTION MENTION (OPTIONAL)</label>
                            <textarea id="txnNarration" class="w-full border border-surface-variant rounded-lg p-3 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] bg-surface-container-low resize-none outline-none transition-all" placeholder="Add notes (e.g., Party Ref)..." maxlength="${MAX_MENTION_LENGTH}">${state.narration}</textarea>
                        </div>
                    </div>
                </main>
                <div class="fixed bottom-0 left-0 right-0 border-t border-surface-variant p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
                    <div class="flex gap-3 max-w-[800px] mx-auto w-full">
                        <button id="cancelBtn" class="flex-1 py-3.5 text-primary font-bold bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-lg border-2 border-surface-variant">
                            Cancel
                        </button>
                        <button id="commitBtn" class="flex-[2] py-3.5 bg-primary text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md">
                            ${contextType === 'mutual' ? 'Propose Conversion' : 'Confirm Conversion'}
                            <span class="material-symbols-outlined text-[20px]">check_circle</span>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }
    }

    function render() {
        container.innerHTML = getScreenHTML();
        attachListeners();
    }

    function syncState() {
        if (document.getElementById('txnNarration')) {
            state.narration = document.getElementById('txnNarration').value;
        }
        if (document.getElementById('bookRupeeInp')) state.bookRupee = document.getElementById('bookRupeeInp').value.replace(/,/g, '');
        if (document.getElementById('bookRateInp')) state.bookRate = document.getElementById('bookRateInp').value;
        if (document.getElementById('convertMetalInp')) state.convertMetal = document.getElementById('convertMetalInp').value;
        if (document.getElementById('convertRateInp')) state.convertRate = document.getElementById('convertRateInp').value;
        if (document.getElementById('convertRupeeInp')) state.convertRupee = document.getElementById('convertRupeeInp').value.replace(/,/g, '');
        const selectedOp = document.querySelector('input[name="sourceOp"]:checked');
        if (selectedOp) state.sourceOperation = selectedOp.value;
        if (document.getElementById('rupeeAmtInp')) state.rupeeAmt = document.getElementById('rupeeAmtInp').value.replace(/,/g, '');
    }

    function attachListeners() {
        const scaleRupeeFont = () => {
            const inp = document.getElementById('rupeeAmtInp');
            if (inp) {
                inp.style.fontSize = '28px';
                let size = 28;
                while (inp.scrollWidth > inp.clientWidth && size >= 16) {
                    size -= 1;
                    inp.style.fontSize = size + 'px';
                }
            }
        };

        document.getElementById('cancelBtn')?.addEventListener('click', () => { onClose(); });
        document.getElementById('cancelHeaderBtn')?.addEventListener('click', () => { onClose(); });

        document.getElementById('directMetalBtn')?.addEventListener('click', () => {
            syncState();
            metalMethod = 'direct_metal';
            render();
        });
        document.getElementById('bookRateBtn')?.addEventListener('click', () => {
            syncState();
            metalMethod = 'book_rate';
            render();
        });

        document.getElementById('addRowBtn')?.addEventListener('click', () => {
            syncState();
            purityRows.push({ id: Date.now(), weight: '', purity: userDefaultPurity, labour: 0, mention: '' });
            render();
        });

        document.querySelectorAll('.remove-row-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                syncState();
                const idx = parseInt(e.currentTarget.dataset.index);
                purityRows.splice(idx, 1);
                render();
            });
        });

        document.querySelectorAll('.row-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                const field = e.currentTarget.dataset.field;
                purityRows[idx][field] = e.currentTarget.value;
                syncState();
                
                // Update live calculations directly instead of rendering
                const rowElem = document.getElementById(`row-fine-${idx}`);
                if (rowElem) rowElem.textContent = fmtG(calcFineGoldRow(purityRows[idx])) + ' g';
                
                const rawElem = document.getElementById(`raw-display-tx-${idx}`);
                if (rawElem) rawElem.textContent = `Raw = ${purityRows[idx].labour || 0}%`;
                
                const totalElem = document.getElementById('totalFineGold');
                if (totalElem) {
                    let totalFine = 0;
                    purityRows.forEach(r => totalFine += calcFineGoldRow(r));
                    const uElem = document.getElementById('totalFineGoldUnit');
                    if (totalFine === 0) {
                        totalElem.className = 'text-on-surface-variant text-2xl font-medium';
                        totalElem.innerHTML = '0.000 g';
                        if (uElem) uElem.classList.add('hidden');
                    } else {
                        totalElem.className = 'font-display-lg text-4xl text-primary font-bold leading-none';
                        totalElem.textContent = fmtG(totalFine);
                        if (uElem) uElem.classList.remove('hidden');
                    }
                }
            });
        });

        document.querySelectorAll('input[name="sourceOp"]').forEach(el => {
            el.addEventListener('change', () => { syncState(); render(); });
        });
        ['bookRupeeInp', 'bookRateInp', 'convertMetalInp', 'convertRateInp', 'convertRupeeInp', 'rupeeAmtInp', 'txnNarration'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                syncState();
                
                // Live recalculation without full re-render
                if (id === 'bookRupeeInp' || id === 'bookRateInp') {
                    const rVal = parseFloat(state.bookRupee || 0);
                    const gRate = parseFloat(state.bookRate || 0);
                    const fineGold = gRate > 0 ? (rVal / (gRate / 10)) : 0;
                    const fgElem = document.getElementById('bookFineGold');
                    if (fgElem) {
                        const uElem = document.getElementById('bookFineGoldUnit');
                        if (fineGold === 0) {
                            fgElem.className = 'text-on-surface-variant text-2xl font-medium';
                            fgElem.innerHTML = '0.000 g';
                            if (uElem) uElem.classList.add('hidden');
                        } else {
                            fgElem.className = 'font-display-lg text-4xl text-primary font-bold leading-none';
                            fgElem.textContent = fmtG(fineGold);
                            if (uElem) uElem.classList.remove('hidden');
                        }
                    }
                }
                
                if (id === 'convertMetalInp' || id === 'convertRateInp') {
                    const mVal = parseFloat(state.convertMetal || 0);
                    const cRate = parseFloat(state.convertRate || 0);
                    const rVal = mVal * (cRate / 10);
                    const rOut = document.getElementById('convertRupeeOut');
                    if (rOut) {
                        if (rVal === 0) {
                            rOut.className = 'text-on-surface-variant text-2xl font-medium';
                            rOut.innerHTML = '₹ 0.00';
                        } else {
                            rOut.className = 'font-display-lg text-4xl text-primary font-bold leading-none';
                            rOut.textContent = formatCurrency(rVal);
                        }
                    }
                }
                
                if (id === 'rupeeAmtInp') {
                    scaleRupeeFont();
                }
                

                if (id === 'convertRupeeInp' || id === 'convertRateInp') {
                    const rupee = parseFloat(state.convertRupee) || 0;
                    const rate = parseFloat(state.convertRate) || 0;
                    const metalG = rate > 0 ? rupee / (rate / 10) : 0;
                    const mOut = document.getElementById('convertMetalOut');
                    if (mOut) {
                        const uElem = document.getElementById('convertMetalOutUnit');
                        if (metalG === 0) {
                            mOut.className = 'text-on-surface-variant text-2xl font-medium';
                            mOut.innerHTML = '0.000 g';
                            if (uElem) uElem.classList.add('hidden');
                        } else {
                            mOut.className = 'font-display-lg text-4xl text-primary font-bold leading-none';
                            mOut.textContent = fmtG(metalG);
                            if (uElem) uElem.classList.remove('hidden');
                        }
                    }
                }
            });
        });

        document.getElementById('commitBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            if (btn.disabled) return;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');

            syncState();
            
            try {
                if (actionType.startsWith('increase_') || actionType.startsWith('decrease_') || actionType === 'rate_booking') {
                    if (ledgerType === 'metal') {
                        if (metalMethod === 'direct_metal') {
                            let totalFine = 0;
                            let valid = true;
                            purityRows.forEach(r => {
                                const w = parseFloat(r.weight) || 0;
                                if (w <= 0) valid = false;
                                totalFine += calcFineGoldRow(r);
                            });
                            if (!valid || totalFine <= 0) throw new Error('Enter valid weights for all rows');
                            
                            for (let r of purityRows) {
                                const fine = calcFineGoldRow(r);
                                await submitTxn({ section: 'metal', action: actionType, amount: fine, mention: r.mention || '' });
                            }
                            
                        } else if (metalMethod === 'book_rate') {
                            const rVal = parseFloat(state.bookRupee) || 0;
                            const rate = parseFloat(state.bookRate) || 0;
                            if (rVal <= 0 || rate <= 0) throw new Error('Enter valid Rupee Amount and Rate');
                            
                            // For book rate, action is explicitly 'rate_booking' internally so position-engine can infer mapping
                            // Book Rate ALWAYS acts as a decrease to Payable metal.
                            await submitTxn({ section: 'metal', action: 'rate_booking', rupee_amount: rVal, rate: rate, mention: state.narration, sourceOperation: 'decrease_payable' });
                        }
                    } else if (ledgerType === 'rupee') {
                        const amt = parseFloat(state.rupeeAmt) || 0;
                        if (amt <= 0) throw new Error('Enter a valid amount');
                        
                        await submitTxn({ section: 'rupee', action: actionType, amount: amt, mention: state.narration });
                    }
                } 
                else if (actionType === 'convert_metal_to_rupee') {
                    const metal = parseFloat(state.convertMetal) || 0;
                    const rate = parseFloat(state.convertRate) || 0;
                    if (metal <= 0 || rate <= 0) throw new Error('Enter valid Metal and Rate');
                    
                    const metalBal = parseFloat(account.metal_balance) || 0;
                    const canonicalMetal = normalizePosition(metalBal, metalPos).signedBalance;
                    if (canonicalMetal === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
                    if (metal > Math.abs(canonicalMetal)) throw new Error('Cannot adjust more than the available source balance.');
                    
                    const sourceOp = `decrease_${metalPos}`;
                    await submitTxn({ section: 'metal', action: 'convert_metal_to_rupee', amount: metal, rate: rate, mention: state.narration, sourceOperation: sourceOp });
                }
                else if (actionType === 'convert_rupee_to_metal') {
                    const rupee = parseFloat(state.convertRupee) || 0;
                    const rate = parseFloat(state.convertRate) || 0;
                    if (rupee <= 0 || rate <= 0) throw new Error('Enter valid Rupee and Rate');
                    
                    const rupeeBal = parseFloat(account.rupee_balance) || 0;
                    const canonicalRupee = normalizePosition(rupeeBal, rupeePos).signedBalance;
                    if (canonicalRupee === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
                    if (rupee > Math.abs(canonicalRupee)) throw new Error('Cannot adjust more than the available source balance.');
                    
                    const sourceOp = `decrease_${rupeePos}`;
                    await submitTxn({ section: 'rupee', action: 'convert_rupee_to_metal', amount: rupee, rate: rate, mention: state.narration, sourceOperation: sourceOp });
                }
                
                onSuccess();
            } catch (e) {
                alert(e.message);
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });

        applyIndianInputFormatting(document.getElementById('rupeeAmtInp'));
        applyIndianInputFormatting(document.getElementById('bookRupeeInp'));
        applyIndianInputFormatting(document.getElementById('convertRupeeInp'));
        
        applyMetalInputFormatting(document.getElementById('convertMetalInp'));
        document.querySelectorAll('.row-input[data-field="weight"]').forEach(inp => applyMetalInputFormatting(inp));

        scaleRupeeFont();
    }

    render();
}

