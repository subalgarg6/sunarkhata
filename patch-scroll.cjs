const fs = require('fs');

let content = fs.readFileSync('src/pages/account-creation.js', 'utf8');

const newHandlers = `
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
        };

        const updateMetalUI = () => {
            const rec = document.getElementById('metalReceivable');
            const pay = document.getElementById('metalPayable');
            if (rec && pay) {
                if (metalClass === 'receivable') {
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-secondary/10 text-secondary';
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-white text-on-surface-variant hover:bg-surface-container-low';
                } else {
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-secondary/10 text-secondary';
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-white text-on-surface-variant hover:bg-surface-container-low';
                }
            }
        };

        const updateRupeeUI = () => {
            const rec = document.getElementById('rupeeReceivable');
            const pay = document.getElementById('rupeePayable');
            if (rec && pay) {
                if (rupeeClass === 'receivable') {
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-primary/10 text-primary';
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-white text-on-surface-variant hover:bg-surface-container-low';
                } else {
                    pay.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-primary/10 text-primary';
                    rec.className = 'py-2.5 text-[11px] font-label-bold uppercase transition-colors bg-white text-on-surface-variant hover:bg-surface-container-low';
                }
            }
        };

        document.getElementById('roleSupplier')?.addEventListener('click', () => { role = 'supplier'; updateRoleUI(); });
        document.getElementById('roleTradeCustomer')?.addEventListener('click', () => { role = 'trade_customer'; updateRoleUI(); });

        document.getElementById('metalReceivable')?.addEventListener('click', () => { metalClass = 'receivable'; updateMetalUI(); });
        document.getElementById('metalPayable')?.addEventListener('click', () => { metalClass = 'payable'; updateMetalUI(); });

        document.getElementById('rupeeReceivable')?.addEventListener('click', () => { rupeeClass = 'receivable'; updateRupeeUI(); });
        document.getElementById('rupeePayable')?.addEventListener('click', () => { rupeeClass = 'payable'; updateRupeeUI(); });
`;

// Replace the old event listeners
const regex = /document\.getElementById\('roleSupplier'\)\?\.addEventListener[\s\S]*?document\.getElementById\('rupeePayable'\)\?\.addEventListener\('click', \(\) => \{ rupeeClass = 'payable'; syncInputs\(\); render\(\); \}\);/;

content = content.replace(regex, newHandlers.trim());

fs.writeFileSync('src/pages/account-creation.js', content);
console.log('Patched account-creation.js for scroll bug.');
