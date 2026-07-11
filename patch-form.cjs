const fs = require('fs');

let content = fs.readFileSync('src/pages/account-creation.js', 'utf8');

// 1. Add draft state at the top of renderAccountCreation
if (!content.includes('let draft = {')) {
    content = content.replace(
        "let joinError = '';",
        "let joinError = '';\n    let draft = {\n        accountName: '',\n        mobileNumber: '',\n        metalBalance: '',\n        rupeeBalance: ''\n    };"
    );
}

// 2. Change Jama to Lena Hai
content = content.replace(/Receivable \(Jama\)/g, "Receivable (Lena Hai)");
content = content.replace(/Jama/g, "Lena Hai"); // fallback just in case

// 3. Inject draft values into inputs in renderCreationForm
// For accountName
content = content.replace(
    /<input id="accountName" type="text"([^>]*) placeholder="([^"]*)" \/>/,
    '<input id="accountName" type="text"$1 placeholder="$2" value="${draft.accountName}" />'
);

// For accountMobile
content = content.replace(
    /<input id="accountMobile" type="tel"([^>]*) placeholder="([^"]*)" \/>/,
    '<input id="accountMobile" type="tel"$1 placeholder="$2" value="${draft.mobileNumber}" />'
);

// For metalWeight
content = content.replace(
    /<input id="metalWeight" type="number"([^>]*) placeholder="([^"]*)" \/>/,
    '<input id="metalWeight" type="number"$1 placeholder="$2" value="${draft.metalBalance}" />'
);

// For rupeeAmount
content = content.replace(
    /<input id="rupeeAmount" type="number"([^>]*) placeholder="([^"]*)" \/>/,
    '<input id="rupeeAmount" type="number"$1 placeholder="$2" value="${draft.rupeeBalance}" />'
);


// 4. Add type="button" to role and state selectors
content = content.replace(/<button id="roleSupplier" class="([^"]*)">/g, '<button type="button" id="roleSupplier" class="$1">');
content = content.replace(/<button id="roleTradeCustomer" class="([^"]*)">/g, '<button type="button" id="roleTradeCustomer" class="$1">');
content = content.replace(/<button id="metalReceivable" class="([^"]*)">/g, '<button type="button" id="metalReceivable" class="$1">');
content = content.replace(/<button id="metalPayable" class="([^"]*)">/g, '<button type="button" id="metalPayable" class="$1">');
content = content.replace(/<button id="rupeeReceivable" class="([^"]*)">/g, '<button type="button" id="rupeeReceivable" class="$1">');
content = content.replace(/<button id="rupeePayable" class="([^"]*)">/g, '<button type="button" id="rupeePayable" class="$1">');

// 5. Replace saveInputs hack with proper draft syncing
const oldSaveInputs = `        const saveInputs = () => {
            const nameEl = document.getElementById('accountName');
            const mobEl = document.getElementById('accountMobile');
            const metalEl = document.getElementById('metalWeight');
            const rupeeEl = document.getElementById('rupeeAmount');
            if(nameEl) nameEl.setAttribute('value', nameEl.value);
            if(mobEl) mobEl.setAttribute('value', mobEl.value);
            if(metalEl) metalEl.setAttribute('value', metalEl.value);
            if(rupeeEl) rupeeEl.setAttribute('value', rupeeEl.value);
        };
        document.getElementById('accountName')?.addEventListener('input', saveInputs);
        document.getElementById('accountMobile')?.addEventListener('input', saveInputs);
        document.getElementById('metalWeight')?.addEventListener('input', saveInputs);
        document.getElementById('rupeeAmount')?.addEventListener('input', saveInputs);`;

const newSaveInputs = `        const syncInputs = () => {
            const n = document.getElementById('accountName');
            if (n) draft.accountName = n.value;
            const m = document.getElementById('accountMobile');
            if (m) draft.mobileNumber = m.value;
            const mb = document.getElementById('metalWeight');
            if (mb) draft.metalBalance = mb.value;
            const rb = document.getElementById('rupeeAmount');
            if (rb) draft.rupeeBalance = rb.value;
        };
        document.getElementById('accountName')?.addEventListener('input', syncInputs);
        document.getElementById('accountMobile')?.addEventListener('input', syncInputs);
        document.getElementById('metalWeight')?.addEventListener('input', syncInputs);
        document.getElementById('rupeeAmount')?.addEventListener('input', syncInputs);`;

if (content.includes('saveInputs = () => {')) {
    // Regex match to replace the old block
    content = content.replace(/const saveInputs = \(\) => \{[\s\S]*?document\.getElementById\('rupeeAmount'\)\?\.addEventListener\('input', saveInputs\);/, newSaveInputs);
}

// Ensure state buttons sync inputs before render
content = content.replace(/role = 'supplier'; render\(\);/g, "role = 'supplier'; syncInputs(); render();");
content = content.replace(/role = 'trade_customer'; render\(\);/g, "role = 'trade_customer'; syncInputs(); render();");
content = content.replace(/metalClass = 'receivable'; render\(\);/g, "metalClass = 'receivable'; syncInputs(); render();");
content = content.replace(/metalClass = 'payable'; render\(\);/g, "metalClass = 'payable'; syncInputs(); render();");
content = content.replace(/rupeeClass = 'receivable'; render\(\);/g, "rupeeClass = 'receivable'; syncInputs(); render();");
content = content.replace(/rupeeClass = 'payable'; render\(\);/g, "rupeeClass = 'payable'; syncInputs(); render();");

fs.writeFileSync('src/pages/account-creation.js', content);
console.log('Patched account-creation.js');
