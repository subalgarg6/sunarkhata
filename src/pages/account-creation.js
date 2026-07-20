import { getCurrentUser } from '../services/auth.service.js';
import { updateIndividualAccount, createIndividualAccount } from '../services/individual.service.js';
import { updateMutualAccount, createMutualAccount, joinMutualAccount, previewMutualAccountByCode } from '../services/mutual.service.js';
import { getOtherPartyNameLabel, getOtherPartyNamePlaceholder } from '../utils/position-engine.js';
import { calculateFineGold } from '../utils/business-rules.js';
import { formatCurrency, formatIndianNumber, applyIndianInputFormatting, applyMetalInputFormatting } from '../utils/formatters.js';
import { PLACEHOLDER_PAIRS, MAX_RUPEE, MAX_METAL_GRAMS, MAX_ACCOUNT_NAME_LENGTH, MAX_MENTION_LENGTH } from '../utils/constants.js';

export function renderAccountCreation(container, mode) {
    const user = getCurrentUser();
    if (!user) { window.location.hash = '#/auth'; return; }

    let isEdit = false;
    let editAccount = null;
    let accType = 'individual';

    if (typeof mode === 'object' && mode !== null) {
        isEdit = mode.isEdit;
        editAccount = mode.account;
        accType = mode.type || editAccount.type;
    } else {
        accType = mode || 'individual';
    }

    let role = isEdit ? (editAccount.role || editAccount.creator_role || 'trade_customer') : 'trade_customer';
    let metalClass = 'payable';
    let rupeeClass = 'payable';
    let mutualStep = isEdit ? 'create' : 'choose';
    let joinError = '';
    let previewAccount = null;
    let reviewInviteCode = '';
    let nextMetalItemId = 2;
    const userDefaultPurity = parseFloat(user.default_purity) || 100;
    
    let draft = {
        accountName: isEdit ? (editAccount.other_party_name || '') : '',
        mobileNumber: isEdit ? (editAccount.mobile_number || '') : '',
        metalItems: [{ id: 1, mention: '', weight: '', purity: userDefaultPurity, labour: '' }],
        rupeeBalance: ''
    };

    function render() {
        const nameLabel = getOtherPartyNameLabel(role);
        const namePlaceholder = getOtherPartyNamePlaceholder(role);

        // For mutual, show intermediate step first
        let mutualContent = '';
        if (accType === 'mutual' && mutualStep === 'choose') {
            mutualContent = renderMutualChoice();
        } else if (accType === 'mutual' && mutualStep === 'join') {
            mutualContent = renderJoinForm();
        } else if (accType === 'mutual' && mutualStep === 'review') {
            mutualContent = renderReviewForm();
        }
        // mutualStep === 'create' falls through to normal creation form

        const showCreationForm = accType === 'individual' || (accType === 'mutual' && mutualStep === 'create');

        container.innerHTML = `
        <div class="bg-surface text-on-background font-body-md overflow-hidden h-screen w-full flex flex-col">
            <!-- Header Strip -->
            <div class="sticky top-0 w-full bg-surface/90 backdrop-blur-md px-4 py-3 z-20 flex justify-between items-center border-b border-surface-variant">
                <div class="flex items-center gap-3">
                    <button id="backBtn" class="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors p-1 -ml-1 rounded-full hover:bg-surface-container-low">arrow_back</button>
                    <span class="font-display-md text-[18px] text-primary font-bold">${isEdit ? 'Edit Account' : 'New Account'}</span>
                </div>
            </div>

            <!-- Main Workspace Area -->
            <main class="flex-1 overflow-y-auto bg-surface relative">
                <div class="max-w-[800px] mx-auto px-4 py-6">
                    <!-- Title Section -->
                    <header class="mb-6">
                        <p class="font-body-sm text-on-surface-variant leading-relaxed">Create an Individual ledger or connect a Mutual ledger for shared accounting transparency.</p>
                    </header>

                    <div class="space-y-8">
                        <!-- Account Type Selection (Hidden in Edit Mode) -->
                        ${!isEdit ? `
                        <section class="grid grid-cols-1 gap-3">
                            <label class="cursor-pointer group">
                                <input type="radio" name="acc_type" class="hidden peer" value="individual" ${accType === 'individual' ? 'checked' : ''} />
                                <div class="p-4 border-2 border-surface-variant rounded-lg peer-checked:border-primary peer-checked:bg-white transition-all flex items-center gap-4 h-full">
                                    <div class="w-10 h-10 shrink-0 rounded bg-surface-container flex items-center justify-center text-primary">
                                        <span class="material-symbols-outlined">person</span>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-title-lg font-bold text-primary text-[15px]">Individual</h4>
                                        <p class="text-[12px] text-on-surface-variant">Single-entry ledger managed solely by you.</p>
                                    </div>
                                    <div class="ml-auto opacity-0 peer-checked:opacity-100">
                                        <span class="material-symbols-outlined text-primary">check_circle</span>
                                    </div>
                                </div>
                            </label>

                            <label class="cursor-pointer group">
                                <input type="radio" name="acc_type" class="hidden peer" value="mutual" ${accType === 'mutual' ? 'checked' : ''} />
                                <div class="p-4 border-2 border-surface-variant rounded-lg peer-checked:border-primary peer-checked:bg-white transition-all flex items-center gap-4 h-full">
                                    <div class="w-10 h-10 shrink-0 rounded bg-surface-container flex items-center justify-center text-primary">
                                        <span class="material-symbols-outlined">group</span>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-title-lg font-bold text-primary text-[15px]">Mutual</h4>
                                        <p class="text-[12px] text-on-surface-variant">Collaborative ledger shared between two parties.</p>
                                    </div>
                                    <div class="ml-auto opacity-0 peer-checked:opacity-100">
                                        <span class="material-symbols-outlined text-primary">check_circle</span>
                                    </div>
                                </div>
                            </label>
                        </section>
                        ` : ''}

                        ${accType === 'mutual' && mutualStep !== 'create' ? mutualContent : ''}

                        ${showCreationForm ? renderCreationForm(nameLabel, namePlaceholder) : ''}
                    </div>
                </div>
            </main>

            ${showCreationForm ? `
            <!-- Sticky Bottom CTA -->
            <div class="w-full border-t border-surface-variant z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-auto">
                <div class="max-w-[800px] mx-auto px-4 py-4">
                    <button id="createBtn" class="w-full bg-primary hover:bg-black text-on-primary py-3.5 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 text-[15px]">
                        <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                        ${isEdit ? 'Save Changes' : 'Create Account'}
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
        `;
        attachListeners();
    }

    function renderMutualChoice() {
        return `
        <section class="space-y-4">
            <h3 class="font-label-bold text-on-surface-variant uppercase text-[11px] tracking-widest">Connect Mutual Ledger</h3>
            <div class="grid grid-cols-1 gap-3">
                <button type="button" id="mutualJoinBtn" class="p-5 border-2 border-surface-variant rounded-lg hover:border-primary transition-all flex items-center gap-4 text-left group">
                    <div class="w-12 h-12 shrink-0 rounded-lg bg-gold-soft flex items-center justify-center text-gold-metallic">
                        <span class="material-symbols-outlined text-2xl">vpn_key</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-title-lg font-bold text-primary text-[15px]">Have an Invite Code</h4>
                        <p class="text-[12px] text-on-surface-variant mt-1">Join an existing mutual account using a code from your partner.</p>
                    </div>
                    <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                <button type="button" id="mutualCreateBtn" class="p-5 border-2 border-surface-variant rounded-lg hover:border-primary transition-all flex items-center gap-4 text-left group">
                    <div class="w-12 h-12 shrink-0 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-2xl">add_circle</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-title-lg font-bold text-primary text-[15px]">Create New Mutual Account</h4>
                        <p class="text-[12px] text-on-surface-variant mt-1">Set up a new shared ledger and invite your partner with a code.</p>
                    </div>
                    <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
            </div>
        </section>
        `;
    }

    function renderJoinForm() {
        return `
        <section class="space-y-4">
            <h3 class="font-label-bold text-on-surface-variant uppercase text-[11px] tracking-widest">Join Mutual Account</h3>
            <div class="bg-white border border-surface-variant rounded-lg p-5 space-y-4 shadow-sm">
                <div>
                    <label class="block font-label-bold text-on-surface-variant text-[11px] uppercase mb-2">Invite Code</label>
                    <input id="inviteCodeInput" type="text" class="w-full bg-surface-container-low border-surface-variant border rounded px-4 py-3 text-body-md font-mono tracking-widest uppercase focus:border-primary focus:outline-none transition-colors text-center text-lg" placeholder="Enter 20-character code" maxlength="24" />
                </div>
                ${joinError ? `<p class="text-error-crimson text-xs">${joinError}</p>` : ''}
                <button type="button" id="joinBtn" class="w-full bg-primary hover:bg-black text-on-primary py-3 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">handshake</span>
                    Join Mutual Account
                </button>
                <button type="button" id="joinBackBtn" class="w-full text-on-surface-variant text-sm hover:text-primary transition-colors py-2">
                    Back to options
                </button>
            </div>
        </section>
        `;
    }

    function renderReviewForm() {
        if (!previewAccount) return '';
        
        return `
        <section class="space-y-4">
            <h3 class="font-label-bold text-on-surface-variant uppercase text-[11px] tracking-widest">Review Mutual Account</h3>
            <div class="bg-white border border-surface-variant rounded-lg p-5 space-y-4 shadow-sm">
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center pb-2 border-b border-surface-variant/50">
                        <span class="text-xs text-on-surface-variant font-label-bold uppercase">Account Name</span>
                        <span class="text-sm font-bold text-primary">${previewAccount.other_party_name || 'Unnamed'}</span>
                    </div>
                    <div class="flex justify-between items-center pb-2 border-b border-surface-variant/50">
                        <span class="text-xs text-on-surface-variant font-label-bold uppercase">Creator Role</span>
                        <span class="text-sm text-primary capitalize">${previewAccount.creator_role === 'supplier' ? 'Supplier' : 'Trade Customer'}</span>
                    </div>
                    <div class="flex justify-between items-center pb-2 border-b border-surface-variant/50">
                        <span class="text-xs text-on-surface-variant font-label-bold uppercase">Metal Balance</span>
                        <span class="text-sm font-bold ${previewAccount.metal_class === 'payable' ? 'text-error-crimson' : 'text-success-green'}">
                            ${formatIndianNumber(previewAccount.metal_balance, 3)} g ${previewAccount.metal_class === 'payable' ? '(Payable)' : '(Receivable)'}
                        </span>
                    </div>
                    <div class="flex justify-between items-center pb-2">
                        <span class="text-xs text-on-surface-variant font-label-bold uppercase">Rupee Balance</span>
                        <span class="text-sm font-bold ${previewAccount.rupee_class === 'payable' ? 'text-error-crimson' : 'text-success-green'}">
                            ₹ ${formatCurrency(previewAccount.rupee_balance)} ${previewAccount.rupee_class === 'payable' ? '(Payable)' : '(Receivable)'}
                        </span>
                    </div>
                </div>
                
                <div class="pt-2">
                    <p class="text-xs text-on-surface-variant italic mb-4">By joining, you agree to synchronize your ledger with this account.</p>
                    
                    <div class="flex gap-3">
                        <button type="button" id="reviewCancelBtn" class="flex-1 bg-surface-container-low hover:bg-surface-container text-on-surface-variant py-3 rounded-lg font-bold transition-colors">
                            Cancel
                        </button>
                        <button type="button" id="reviewApproveBtn" class="flex-1 bg-primary hover:bg-black text-on-primary py-3 rounded-lg font-bold shadow-md transition-all">
                            Join & Approve
                        </button>
                    </div>
                </div>
            </div>
        </section>
        `;
    }

    function renderCreationForm(nameLabel, namePlaceholder) {
        return `
        <!-- Profile Details -->
        <section class="bg-white p-4 border border-surface-variant rounded-lg space-y-5 shadow-sm">
            <div class="grid grid-cols-1 gap-5">
                <div>
                    <label class="block font-label-bold text-on-surface-variant text-[11px] uppercase mb-2">Role Selection</label>
                    <div class="grid grid-cols-2 gap-0 border border-primary rounded-sm overflow-hidden">
                        <button type="button" id="roleSupplier" class="py-2.5 text-body-sm font-label-bold transition-colors ${role === 'supplier' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}">Supplier</button>
                        <button type="button" id="roleTradeCustomer" class="py-2.5 text-body-sm font-label-bold transition-colors ${role === 'trade_customer' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}">Trade Customer</button>
                    </div>
                </div>
                <div>
                    <label id="accountNameLabel" class="block font-label-bold text-on-surface-variant text-[11px] uppercase mb-2">${nameLabel}</label>
                    <input id="accountName" type="text" class="w-full bg-surface-container-low border-surface-variant border rounded px-4 py-3 text-body-md focus:border-primary focus:outline-none transition-colors" placeholder="${namePlaceholder}" value="${draft.accountName}" maxlength="${MAX_ACCOUNT_NAME_LENGTH}" />
                </div>
                <div>
                    <label class="block font-label-bold text-on-surface-variant text-[11px] uppercase mb-2">Mobile Number (Optional)</label>
                    <div class="flex items-center w-full bg-surface-container-low border-surface-variant border rounded px-4 py-3 focus-within:border-primary transition-colors">
                        <span class="text-body-md text-on-surface-variant mr-1 select-none">+91</span>
                        <input id="accountMobile" type="tel" inputmode="numeric" maxlength="11" class="w-full bg-transparent text-body-md focus:outline-none p-0 border-none" placeholder="00000 00000" value="${(() => {
                            let d = (draft.mobileNumber || '').replace(/^\+?91\s*/, '').replace(/\D/g, '').substring(0, 10);
                            return d.length > 5 ? d.substring(0, 5) + ' ' + d.substring(5) : d;
                        })()}" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Initial Balances (Hidden in Edit Mode) -->
        ${!isEdit ? `
        <section class="space-y-4">
            <h3 class="font-label-bold text-on-surface-variant uppercase text-[11px] tracking-widest">Initial Balances</h3>
            <div class="grid grid-cols-1 gap-4">
                
                <!-- Metal Balance -->
                <div class="bg-white border-l-[3px] border-l-gold-metallic border border-surface-variant p-4 rounded shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-label-bold font-bold text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined text-gold-metallic text-[18px]">database</span>
                            Metal Balance
                        </h4>
                        <span class="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-bold">24K Fine Gold</span>
                    </div>
                    
                    <div class="space-y-4 mb-4">
                        ${draft.metalItems.map((item, index) => `
                        <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-3 sm:p-4 shadow-sm flex flex-col gap-3 relative">
                            <div class="flex justify-between items-center border-b border-surface-variant pb-2">
                                <span class="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase">Item ${index + 1}</span>
                                ${index > 0 ? `
                                <button type="button" class="remove-metal-item-btn w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-error-crimson hover:bg-error-container/20 transition-colors -mr-1 -mt-1 rounded-full" data-index="${index}">
                                    <span class="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                                ` : ''}
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                <div class="flex flex-col gap-1 col-span-1 sm:col-span-2 min-w-0">
                                    <label class="text-xs font-medium text-on-surface-variant">Original Weight (g)</label>
                                    <input data-index="${index}" data-field="weight" class="metal-item-input w-full h-12 md:h-10 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-primary text-base min-w-0" type="number" inputmode="decimal" step="any" placeholder="0.000" value="${item.weight}">
                                </div>
                                <div class="flex flex-col gap-1 min-w-0">
                                    <label class="text-xs font-medium text-on-surface-variant">Purity (%)</label>
                                    <input data-index="${index}" data-field="purity" class="metal-item-input w-full h-12 md:h-10 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-primary text-base min-w-0" type="number" inputmode="decimal" step="any" placeholder="0" value="${item.purity}">
                                </div>
                                <div class="flex flex-col gap-1 min-w-0">
                                    <label class="text-xs font-medium text-on-surface-variant">Labour (%)</label>
                                    <input data-index="${index}" data-field="labour" class="metal-item-input w-full h-12 md:h-10 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-primary text-base min-w-0" type="number" inputmode="decimal" step="any" placeholder="0" value="${item.labour}">
                                    <div class="text-[10px] text-on-surface-variant mt-1 ml-1" id="raw-display-ac-${index}">Raw = ${item.labour || 0}%</div>
                                </div>
                                <div class="flex flex-col gap-1 col-span-1 sm:col-span-2 min-w-0">
                                    <label class="text-xs font-medium text-on-surface-variant">Mention Tags (Optional)</label>
                                    <input data-index="${index}" data-field="mention" class="metal-item-input mention-input w-full h-12 md:h-10 px-3 bg-surface border border-surface-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-data-mono text-on-surface text-base min-w-0" type="text" placeholder="e.g. ${PLACEHOLDER_PAIRS[index % 30].toLowerCase()}, etc." value="${item.mention || ''}" maxlength="${MAX_MENTION_LENGTH}">
                                </div>
                                <div class="col-span-1 sm:col-span-2 flex justify-between items-center bg-surface-container rounded-lg px-3 py-2">
                                    <span class="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Fine Gold</span>
                                    <span id="fineGoldDisplay-${index}" class="font-data-mono text-primary font-bold text-sm">${formatIndianNumber(calculateFineGold(item.weight, item.purity, item.labour), 3)} g</span>
                                </div>
                            </div>
                        </div>
                        `).join('')}
                    </div>

                    <div class="flex justify-end mb-4">
                        <button type="button" id="addMetalItemBtn" class="text-xs font-label-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">add</span>
                            ADD ITEM
                        </button>
                    </div>

                    <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm flex flex-col mb-4 border-l-4 border-l-gold-metallic min-w-0">
                        <label class="block font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider text-xs">Calculated Fine Gold (24K)</label>
                        <div class="flex items-baseline gap-2 mt-1 w-full overflow-x-auto min-w-0 whitespace-nowrap pb-1">
                            <span id="calculatedFineGoldDisplay" class="text-on-surface-variant text-xl font-medium">0.000 g</span>
                            <span id="calculatedFineGoldUnit" class="font-title-lg text-on-surface-variant font-normal hidden">g</span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-0 border border-gold-metallic rounded-sm overflow-hidden">
                            <button type="button" id="metalReceivable" class="py-2.5 text-[11px] font-label-bold uppercase transition-colors ${metalClass === 'receivable' ? 'bg-gold-metallic/20 text-gold-metallic' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}">Receivable (Lena Hai)</button>
                            <button type="button" id="metalPayable" class="py-2.5 text-[11px] font-label-bold uppercase transition-colors ${metalClass === 'payable' ? 'bg-gold-metallic/20 text-gold-metallic' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}">Payable (Dena Hai)</button>
                        </div>
                    </div>
                </div>

                <!-- Rupee Balance -->
                <div class="bg-white border-l-[3px] border-l-primary border border-surface-variant p-4 rounded shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-label-bold font-bold text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[18px]">currency_rupee</span>
                            Rupee Balance
                        </h4>
                        <span class="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-bold">INR</span>
                    </div>
                    <div class="space-y-4 min-w-0">
                        <div class="relative min-w-0">
                            <input id="rupeeAmount" type="text" inputmode="decimal" class="w-full border-surface-variant border rounded-sm pl-7 pr-4 py-2.5 font-mono-data text-title-lg focus:border-primary focus:outline-none transition-colors min-w-0" placeholder="0.00" value="${draft.rupeeBalance}" />
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-body-sm font-label-bold text-on-surface-variant">₹</span>
                        </div>

                        <div class="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm flex flex-col border-l-4 border-l-primary min-w-0">
                            <label class="block font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider text-xs">Calculated Rupee Balance</label>
                            <div class="flex items-baseline gap-2 mt-1 w-full overflow-x-auto min-w-0 whitespace-nowrap pb-1">
                                <span id="calculatedRupeeDisplay" class="${(parseFloat(draft.rupeeBalance) || 0) === 0 ? 'text-on-surface-variant text-xl font-medium' : 'font-display-lg text-3xl text-primary font-bold leading-none'}">${(parseFloat(draft.rupeeBalance) || 0) === 0 ? '₹ 0.00' : formatCurrency(parseFloat(draft.rupeeBalance) || 0)}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-0 border border-primary rounded-sm overflow-hidden">
                            <button type="button" id="rupeeReceivable" class="py-2.5 text-[11px] font-label-bold uppercase transition-colors ${rupeeClass === 'receivable' ? 'bg-primary/10 text-primary' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}">Receivable (Lena Hai)</button>
                            <button type="button" id="rupeePayable" class="py-2.5 text-[11px] font-label-bold uppercase transition-colors ${rupeeClass === 'payable' ? 'bg-primary/10 text-primary' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}">Payable (Dena Hai)</button>
                        </div>
                    </div>
                </div>
                
            </div>
        </section>
        ` : ``}

        <!-- Disclaimer -->
        <div class="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-variant rounded-sm italic">
            <span class="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0 mt-0.5">info</span>
            <div class="space-y-2">
                <p class="text-[11px] text-on-surface-variant leading-relaxed">
                    Balances, totals and calculations shown in SunarKhata are generated from information entered by users. Users should review and verify their records against their physical inventory, invoices, cash records and business documents before relying on them for financial, contractual or legal decisions.
                </p>
                ${accType === 'mutual' ? `
                <p class="text-[11px] text-on-surface-variant leading-relaxed mt-2 font-bold">Mutual Account Disclaimer:</p>
                <p class="text-[11px] text-on-surface-variant leading-relaxed">
                    Mutual Accounts simply synchronize bookkeeping records between connected businesses. SunarKhata does not participate in the underlying transaction, does not confirm deliveries or payments, and does not determine who is correct during disagreements. Mutual Accounts improve transparency but do not replace contracts, invoices or business agreements.
                </p>
                ` : ''}
            </div>
        </div>
        `;
    }

    function attachListeners() {
        const getScaleClass = (len) => {
            if (len < 12) return 'text-3xl';
            if (len < 16) return 'text-2xl';
            if (len < 20) return 'text-xl';
            return 'text-lg';
        };

        const applyScaleClass = (el, text) => {
            if (!el) return;
            el.classList.remove('text-3xl', 'text-2xl', 'text-xl', 'text-lg');
            el.classList.add(getScaleClass(text.length));
        };

        document.getElementById('backBtn')?.addEventListener('click', () => {
            if (accType === 'mutual' && mutualStep !== 'choose') {
                mutualStep = 'choose';
                render();
            } else {
                window.location.hash = '#/dashboard';
            }
        });

        document.querySelectorAll('input[name="acc_type"]').forEach(el => {
            el.addEventListener('change', (e) => {
                accType = e.target.value;
                mutualStep = accType === 'mutual' ? 'choose' : 'create';
                render();
            });
        });

        // Mutual choice buttons
        document.getElementById('mutualJoinBtn')?.addEventListener('click', () => {
            mutualStep = 'join';
            render();
        });
        document.getElementById('mutualCreateBtn')?.addEventListener('click', () => {
            mutualStep = 'create';
            render();
        });
        document.getElementById('joinBackBtn')?.addEventListener('click', () => {
            mutualStep = 'choose';
            joinError = '';
            render();
        });

        // Join button
        document.getElementById('joinBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const originalHtml = btn.innerHTML;
            const code = (document.getElementById('inviteCodeInput')?.value || '').trim().toUpperCase();
            if (!code) { joinError = 'Please enter an invite code.'; render(); return; }

            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Joining...';

            const result = await previewMutualAccountByCode(code);
            if (result.error) {
                joinError = result.error;
                render();
            } else {
                previewAccount = result.account;
                reviewInviteCode = code;
                mutualStep = 'review';
                joinError = '';
                render();
            }
        });

        document.getElementById('reviewCancelBtn')?.addEventListener('click', () => {
            mutualStep = 'join';
            previewAccount = null;
            reviewInviteCode = '';
            render();
        });

        document.getElementById('reviewApproveBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Approving...';
            
            const partnerName = user.full_name || user.fullName || 'Partner';
            const result = await joinMutualAccount(reviewInviteCode, user.id, partnerName);
            if (result.error) {
                joinError = result.error;
                mutualStep = 'join';
                render();
            } else {
                window.location.hash = `#/mutual/${result.account.id}`;
            }
        });



        // Role buttons
        const updateRoleUI = () => {
            const supplier = document.getElementById('roleSupplier');
            const customer = document.getElementById('roleTradeCustomer');
            if (supplier && customer) {
                if (role === 'supplier') {
                    supplier.className = 'py-3 text-[12px] font-label-bold uppercase transition-colors bg-primary text-on-primary';
                    customer.className = 'py-3 text-[12px] font-label-bold uppercase transition-colors bg-surface-container-low text-on-surface-variant hover:bg-surface-container';
                } else {
                    customer.className = 'py-3 text-[12px] font-label-bold uppercase transition-colors bg-primary text-on-primary';
                    supplier.className = 'py-3 text-[12px] font-label-bold uppercase transition-colors bg-surface-container-low text-on-surface-variant hover:bg-surface-container';
                }
            }

            const nameLabelEl = document.getElementById('accountNameLabel');
            const nameInput = document.getElementById('accountName');
            if (nameLabelEl && nameInput) {
                nameLabelEl.textContent = getOtherPartyNameLabel(role);
                nameInput.placeholder = getOtherPartyNamePlaceholder(role);
            }
        };

        const updateMetalUI = () => {
            const rec = document.getElementById('metalReceivable');
            const pay = document.getElementById('metalPayable');
            const fgDisplay = document.getElementById('calculatedFineGoldDisplay');
            
            if (fgDisplay) {
                let totalFg = 0;
                draft.metalItems.forEach((item, index) => {
                    const itemFg = Math.abs(calculateFineGold(item.weight, item.purity, item.labour));
                    totalFg += itemFg;
                    const itemFgDisplay = document.getElementById(`fineGoldDisplay-${index}`);
                    if (itemFgDisplay) {
                        itemFgDisplay.textContent = formatIndianNumber(itemFg, 3) + ' g';
                    }
                    const rawDisplay = document.getElementById(`raw-display-ac-${index}`);
                    if (rawDisplay) {
                        rawDisplay.textContent = `Raw = ${item.labour || 0}%`;
                    }
                });
                const fgUnit = document.getElementById('calculatedFineGoldUnit');
                const formattedFg = formatIndianNumber(totalFg, 3);
                if (totalFg === 0) {
                    fgDisplay.className = 'text-on-surface-variant text-xl font-medium';
                    fgDisplay.innerHTML = '0.000 g';
                    if (fgUnit) fgUnit.classList.add('hidden');
                } else {
                    fgDisplay.className = 'font-display-lg text-3xl text-primary font-bold leading-none';
                    fgDisplay.textContent = formattedFg;
                    applyScaleClass(fgDisplay, formattedFg);
                    if (fgUnit) fgUnit.classList.remove('hidden');
                }
            }

            if (rec && pay) {
                if (metalClass === 'receivable') {
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-gold-metallic/20 text-gold-metallic';
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors text-on-surface-variant hover:bg-surface-container-low';
                } else {
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors text-on-surface-variant hover:bg-surface-container-low';
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-gold-metallic/20 text-gold-metallic';
                }
            }
        };

        const updateRupeeUI = () => {
            const rec = document.getElementById('rupeeReceivable');
            const pay = document.getElementById('rupeePayable');
            const rupeeDisplay = document.getElementById('calculatedRupeeDisplay');

            if (rupeeDisplay) {
                const val = parseFloat(draft.rupeeBalance) || 0;
                if (val === 0) {
                    rupeeDisplay.className = 'text-on-surface-variant text-xl font-medium';
                    rupeeDisplay.innerHTML = '₹ 0.00';
                } else {
                    rupeeDisplay.className = 'font-display-lg text-3xl text-primary font-bold leading-none';
                    const formatted = formatCurrency(val);
                    rupeeDisplay.textContent = formatted;
                    applyScaleClass(rupeeDisplay, formatted);
                }
            }

            if (rec && pay) {
                if (rupeeClass === 'receivable') {
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-primary/10 text-primary';
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors text-on-surface-variant hover:bg-surface-container-low';
                } else {
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-primary/10 text-primary';
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors text-on-surface-variant hover:bg-surface-container-low';
                }
            }
        };

        document.getElementById('roleSupplier')?.addEventListener('click', () => { role = 'supplier'; updateRoleUI(); });
        document.getElementById('roleTradeCustomer')?.addEventListener('click', () => { role = 'trade_customer'; updateRoleUI(); });

        document.getElementById('metalReceivable')?.addEventListener('click', () => { metalClass = 'receivable'; updateMetalUI(); });
        document.getElementById('metalPayable')?.addEventListener('click', () => { metalClass = 'payable'; updateMetalUI(); });

        document.getElementById('rupeeReceivable')?.addEventListener('click', () => { rupeeClass = 'receivable'; updateRupeeUI(); });
        document.getElementById('rupeePayable')?.addEventListener('click', () => { rupeeClass = 'payable'; updateRupeeUI(); });

        // Maintain input values across re-renders
        const syncInputs = () => {
            const n = document.getElementById('accountName');
            if (n) draft.accountName = n.value;
            const m = document.getElementById('accountMobile');
            if (m) draft.mobileNumber = m.value.replace(/\D/g, '');
            
            document.querySelectorAll('.metal-item-input').forEach(input => {
                const idx = parseInt(input.dataset.index);
                const field = input.dataset.field;
                if (draft.metalItems[idx]) {
                    draft.metalItems[idx][field] = input.value;
                }
            });

            const rb = document.getElementById('rupeeAmount');
            if (rb) draft.rupeeBalance = rb.value.replace(/,/g, '');
            
            updateMetalUI();
            updateRupeeUI();
        };

        document.getElementById('accountName')?.addEventListener('input', syncInputs);
        document.getElementById('accountMobile')?.addEventListener('input', (e) => {
            const input = e.target;
            let cursor = input.selectionStart;
            const oldVal = input.getAttribute('data-last-val') || '';
            let val = input.value;
            
            if (oldVal.length - val.length === 1 && oldVal[cursor] === ' ') {
                val = val.substring(0, cursor - 1) + val.substring(cursor);
            }
            
            let digits = val;
            if (digits.includes('+91')) digits = digits.replace('+91', '');
            digits = digits.replace(/\D/g, '');
            if (digits.length > 10 && digits.startsWith('91')) digits = digits.substring(2);
            digits = digits.substring(0, 10);
            
            let formatted = digits;
            if (digits.length > 5) {
                formatted = digits.substring(0, 5) + ' ' + digits.substring(5);
            }
            
            let newCursor = cursor;
            if (formatted.length > val.length && cursor === 6) {
                newCursor++;
            } else if (formatted.length !== val.length) {
                let rawBefore = val.substring(0, cursor).replace(/\D/g, '').length;
                newCursor = rawBefore;
                if (rawBefore > 5) newCursor++;
            }
            
            input.value = formatted;
            input.setAttribute('data-last-val', formatted);
            input.setSelectionRange(newCursor, newCursor);
            syncInputs();
        });
        document.getElementById('rupeeAmount')?.addEventListener('input', syncInputs);
        applyIndianInputFormatting(document.getElementById('rupeeAmount'));

        document.querySelectorAll('.metal-item-input').forEach(input => {
            input.addEventListener('input', syncInputs);
        });
        document.querySelectorAll('.metal-item-input[data-field="weight"]').forEach(input => {
            applyMetalInputFormatting(input);
        });

        document.getElementById('addMetalItemBtn')?.addEventListener('click', () => {
            syncInputs();
            const scrollContainer = container.querySelector('main.overflow-y-auto');
            const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
            draft.metalItems.push({ id: nextMetalItemId++, mention: '', weight: '', purity: userDefaultPurity, labour: '' });
            render();
            const newScrollContainer = container.querySelector('main.overflow-y-auto');
            if (newScrollContainer) newScrollContainer.scrollTop = scrollTop;
        });

        document.querySelectorAll('.remove-metal-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                syncInputs();
                const scrollContainer = container.querySelector('main.overflow-y-auto');
                const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
                const idx = parseInt(e.currentTarget.dataset.index);
                draft.metalItems.splice(idx, 1);
                render();
                const newScrollContainer = container.querySelector('main.overflow-y-auto');
                if (newScrollContainer) newScrollContainer.scrollTop = scrollTop;
            });
        });

        document.getElementById('createBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const originalHtml = btn.innerHTML;
            const name = document.getElementById('accountName').value.trim();
            let phone = document.getElementById('accountMobile').value.replace(/\D/g, '');
            
            if (!name) { alert('Please provide a name'); return; }
            if (phone.length > 0) {
                if (phone.length !== 10) {
                    alert('Please enter a valid 10-digit mobile number.');
                    return;
                }
            }

            const w = draft.metalItems.reduce((sum, item) => sum + Math.abs(calculateFineGold(item.weight, item.purity, item.labour)), 0);
            const rElem = document.getElementById('rupeeAmount');
            const r = rElem ? Math.abs(parseFloat(rElem.value.replace(/,/g, '')) || 0) : 0;

            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Processing...';
                
                if (isEdit) {
                    if (accType === 'individual') {
                        updateIndividualAccount(editAccount.id, {
                            other_party_name: name,
                            mobile_number: phone,
                            role: role
                        });
                        // dispatch custom event or reload dashboard to refresh
                        window.dispatchEvent(new Event('hashchange'));
                    } else {
                        await updateMutualAccount(editAccount.id, {
                            other_party_name: name,
                            mobile_number: phone,
                            role: role
                        });
                        window.dispatchEvent(new Event('hashchange'));
                    }
                } else if (accType === 'individual' || (accType === 'mutual' && mutualStep === 'create')) {
                    if (accType === 'individual') {
                        const account = createIndividualAccount({
                            userId: user.id,
                            role: role,
                            otherPartyName: name,
                            mobileNumber: phone,
                            metalBalance: w,
                            metalClass: metalClass,
                            rupeeBalance: r,
                            rupeeClass: rupeeClass,
                        });
                        window.location.hash = `#/account/${account.id}`;
                    } else {
                        const account = await createMutualAccount({
                            userId: user.id,
                            role: role,
                            otherPartyName: name,
                            mobileNumber: phone,
                            metalBalance: w,
                            metalClass: metalClass,
                            rupeeBalance: r,
                            rupeeClass: rupeeClass,
                        });
                        window.location.hash = `#/mutual/${account.id}`;
                    }
                }
            } catch (e) {
                alert(e.message);
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        });
    }

    render();
}

