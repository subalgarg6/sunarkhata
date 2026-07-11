const fs = require('fs');

let content = fs.readFileSync('src/pages/transaction.js', 'utf8');

// 1. Add getActionLabels import
if (!content.includes('getActionLabels')) {
    content = content.replace(
        "import { isCustomerMetalPayable } from '../utils/business-rules.js';",
        "import { isCustomerMetalPayable } from '../utils/business-rules.js';\nimport { getActionLabels } from '../utils/position-engine.js';"
    );
}

// 2. Add sourceOperation state
content = content.replace(
    /convertRate: '',\s*convertRupee: '',/,
    "convertRate: '',\n        convertRupee: '',\n        sourceOperation: '',"
);

// 3. Update syncState
content = content.replace(
    /if \(document\.getElementById\('convertRupeeInp'\)\) state\.convertRupee = document\.getElementById\('convertRupeeInp'\)\.value;/,
    "if (document.getElementById('convertRupeeInp')) state.convertRupee = document.getElementById('convertRupeeInp').value;\n        const selectedOp = document.querySelector('input[name=\"sourceOp\"]:checked');\n        if (selectedOp) state.sourceOperation = selectedOp.value;"
);

// 4. Update submitTxn calls
content = content.replace(
    /await submitTxn\(\{ section: 'metal', action: 'convert_metal_to_rupee', amount: metal, rate: rate, mention: state\.narration \}\);/,
    "if (!state.sourceOperation) throw new Error('Select a direction for the conversion.');\n                    await submitTxn({ section: 'metal', action: 'convert_metal_to_rupee', amount: metal, rate: rate, mention: state.narration, sourceOperation: state.sourceOperation });"
);

content = content.replace(
    /await submitTxn\(\{ section: 'rupee', action: 'convert_rupee_to_metal', amount: rupee, rate: rate, mention: state\.narration \}\);/,
    "if (!state.sourceOperation) throw new Error('Select a direction for the conversion.');\n                    await submitTxn({ section: 'rupee', action: 'convert_rupee_to_metal', amount: rupee, rate: rate, mention: state.narration, sourceOperation: state.sourceOperation });"
);

// 5. Replace HTML for convert_metal_to_rupee
const metal_to_rupee_html = `        else if (actionType === 'convert_metal_to_rupee') {
            const metalG = parseFloat(state.convertMetal) || 0;
            const rate = parseFloat(state.convertRate) || 0;
            const rVal = rate > 0 ? (metalG / 10) * rate : 0;
            const title = contextType === 'mutual' ? 'Propose Conversion' : 'Convert Metal to Rupee';
            const labels = getActionLabels(metalPos);
            
            return \`
            <div class="fixed inset-0 bg-surface z-50 flex flex-col h-[100dvh] w-full animate-in slide-in-from-bottom duration-300">
                \${getTopHeader(title)}
                <main class="flex-1 overflow-y-auto p-4 pb-32">
                    <div class="max-w-[800px] mx-auto">
                        <div class="mb-6 bg-surface-container-low p-4 rounded-xl border border-surface-variant">
                            <p class="font-label-bold text-on-surface-variant mb-3 uppercase tracking-wider text-xs">Select Direction for Metal Ledger</p>
                            <div class="flex flex-col gap-2">
                                <label class="flex items-center gap-3 p-3 rounded-lg border border-surface-variant cursor-pointer hover:bg-surface-container transition-colors \${state.sourceOperation === labels.action1Op ? 'bg-primary-container text-on-primary border-primary' : 'bg-white'}">
                                    <input type="radio" name="sourceOp" value="\${labels.action1Op}" class="hidden" \${state.sourceOperation === labels.action1Op ? 'checked' : ''}>
                                    <span class="font-bold flex-1">\${labels.action1Label}</span>
                                </label>
                                <label class="flex items-center gap-3 p-3 rounded-lg border border-surface-variant cursor-pointer hover:bg-surface-container transition-colors \${state.sourceOperation === labels.action2Op ? 'bg-primary-container text-on-primary border-primary' : 'bg-white'}">
                                    <input type="radio" name="sourceOp" value="\${labels.action2Op}" class="hidden" \${state.sourceOperation === labels.action2Op ? 'checked' : ''}>
                                    <span class="font-bold flex-1">\${labels.action2Label}</span>
                                </label>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-secondary">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Fine Gold (g)</label>
                            <input id="convertMetalInp" class="w-full bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus:border-primary font-data-mono text-xl font-bold text-primary outline-none transition-colors" type="number" step="any" placeholder="0.000" value="\${state.convertMetal}" />
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-primary mt-4">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Gold Rate (per 10g)</label>
                            <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus-within:border-primary transition-colors">
                                <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                                <input id="convertRateInp" class="font-data-mono text-xl font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="number" step="any" placeholder="0" value="\${state.convertRate}" />
                            </div>
                        </div>
                        
                        <div class="bg-primary text-white rounded-xl p-5 shadow-md flex flex-col relative overflow-hidden mt-2">
                            <label class="block font-label-bold opacity-80 mb-1 uppercase tracking-wider relative z-10 text-xs">Calculated Rupee Value</label>
                            <div class="flex items-baseline gap-2 mb-2 relative z-10">
                                <span class="text-title-lg opacity-80">₹</span>
                                <span class="text-display-lg font-bold tracking-tight text-4xl">\${fmtR(rVal)}</span>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant mt-2">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">TRANSACTION MENTION (OPTIONAL)</label>
                            <textarea id="txnNarration" class="w-full border border-surface-variant rounded-lg p-3 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] bg-surface-container-low resize-none outline-none transition-all" placeholder="Add notes (e.g., Party Ref)...">\${state.narration}</textarea>
                        </div>
                    </div>
                </main>
            \`;
        }`;

content = content.replace(
    /else if \(actionType === 'convert_metal_to_rupee'\) \{[\s\S]*?<\/main>\n\s*\`;\n\s*\}/,
    metal_to_rupee_html
);

// 6. Replace HTML for convert_rupee_to_metal
const rupee_to_metal_html = `        else if (actionType === 'convert_rupee_to_metal') {
            const rupee = parseFloat(state.convertRupee) || 0;
            const rate = parseFloat(state.convertRate) || 0;
            const metalG = rate > 0 ? rupee / (rate / 10) : 0;
            const title = contextType === 'mutual' ? 'Propose Conversion' : 'Convert Rupee to Metal';
            const rupeePos = (contextType === 'mutual' ? (account.my_rupee_class || account.rupee_class) : account.rupee_class) || 'payable';
            const labels = getActionLabels(rupeePos);
            
            return \`
            <div class="fixed inset-0 bg-surface z-50 flex flex-col h-[100dvh] w-full animate-in slide-in-from-bottom duration-300">
                \${getTopHeader(title)}
                <main class="flex-1 overflow-y-auto p-4 pb-32">
                    <div class="max-w-[800px] mx-auto">
                        <div class="mb-6 bg-surface-container-low p-4 rounded-xl border border-surface-variant">
                            <p class="font-label-bold text-on-surface-variant mb-3 uppercase tracking-wider text-xs">Select Direction for Rupee Ledger</p>
                            <div class="flex flex-col gap-2">
                                <label class="flex items-center gap-3 p-3 rounded-lg border border-surface-variant cursor-pointer hover:bg-surface-container transition-colors \${state.sourceOperation === labels.action1Op ? 'bg-primary-container text-on-primary border-primary' : 'bg-white'}">
                                    <input type="radio" name="sourceOp" value="\${labels.action1Op}" class="hidden" \${state.sourceOperation === labels.action1Op ? 'checked' : ''}>
                                    <span class="font-bold flex-1">\${labels.action1Label}</span>
                                </label>
                                <label class="flex items-center gap-3 p-3 rounded-lg border border-surface-variant cursor-pointer hover:bg-surface-container transition-colors \${state.sourceOperation === labels.action2Op ? 'bg-primary-container text-on-primary border-primary' : 'bg-white'}">
                                    <input type="radio" name="sourceOp" value="\${labels.action2Op}" class="hidden" \${state.sourceOperation === labels.action2Op ? 'checked' : ''}>
                                    <span class="font-bold flex-1">\${labels.action2Label}</span>
                                </label>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-primary">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Rupee Amount</label>
                            <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus-within:border-primary transition-colors">
                                <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                                <input id="convertRupeeInp" class="font-data-mono text-xl font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="number" step="any" placeholder="0" value="\${state.convertRupee}" />
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant border-l-4 border-l-primary mt-4">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">Gold Rate (per 10g)</label>
                            <div class="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-3 border border-surface-variant focus-within:border-primary transition-colors">
                                <span class="text-title-lg text-on-surface-variant font-medium">₹</span>
                                <input id="convertRateInp" class="font-data-mono text-xl font-bold w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-primary" type="number" step="any" placeholder="0" value="\${state.convertRate}" />
                            </div>
                        </div>
                        
                        <div class="bg-primary text-white rounded-xl p-5 shadow-md flex flex-col relative overflow-hidden mt-2">
                            <label class="block font-label-bold opacity-80 mb-1 uppercase tracking-wider relative z-10 text-xs">Calculated Fine Gold</label>
                            <div class="flex items-baseline gap-2 mb-2 relative z-10">
                                <span class="text-display-lg font-bold tracking-tight text-4xl">\${fmtG(metalG)}</span>
                                <span class="text-title-lg opacity-80">g</span>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-variant mt-2">
                            <label class="block font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider text-xs">TRANSACTION MENTION (OPTIONAL)</label>
                            <textarea id="txnNarration" class="w-full border border-surface-variant rounded-lg p-3 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] bg-surface-container-low resize-none outline-none transition-all" placeholder="Add notes (e.g., Party Ref)...">\${state.narration}</textarea>
                        </div>
                    </div>
                </main>
            \`;
        }`;

content = content.replace(
    /else if \(actionType === 'convert_rupee_to_metal'\) \{[\s\S]*?<\/main>\n\s*\`;\n\s*\}/,
    rupee_to_metal_html
);

// Add listener to radio buttons
content = content.replace(
    /\['bookRupeeInp', 'bookRateInp', 'convertMetalInp',/,
    "document.querySelectorAll('input[name=\"sourceOp\"]').forEach(el => {\n            el.addEventListener('change', () => { syncState(); render(); });\n        });\n        ['bookRupeeInp', 'bookRateInp', 'convertMetalInp',"
);

fs.writeFileSync('src/pages/transaction.js', content);
console.log('Done!');
