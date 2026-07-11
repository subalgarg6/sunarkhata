const fs = require('fs');
let constants = fs.readFileSync('src/utils/constants.js', 'utf8');

if (!constants.includes('CURRENT_TERMS_VERSION')) {
    constants += `\n// ── Legal & Compliance ──\nexport const CURRENT_TERMS_VERSION = "1.0";\n`;
    fs.writeFileSync('src/utils/constants.js', constants);
    console.log('Patched constants.js');
}
