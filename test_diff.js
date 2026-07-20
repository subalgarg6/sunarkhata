import fs from 'fs';
import path from 'path';

// read the html from transaction.js by creating a fake DOM environment
const transactionJsPath = path.join(process.cwd(), 'src/pages/transaction.js');
let code = fs.readFileSync(transactionJsPath, 'utf-8');

// We need to extract the getScreenHTML function logic to run it
function extractFunction(name, content) {
    const startIdx = content.indexOf(`function ${name}(`);
    if (startIdx === -1) return null;
    let braceCount = 0;
    let i = content.indexOf('{', startIdx);
    let endIdx = i;
    for (; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
            endIdx = i + 1;
            break;
        }
    }
    return content.substring(startIdx, endIdx);
}

const getScreenHTMLCode = extractFunction('getScreenHTML', code);

// We'll create a fake context
function simulateRender(actionType) {
    let ledgerType = 'rupee';
    let contextType = 'individual';
    let showBookRate = false;
    let metalMethod = 'direct_metal';
    let purityRows = [{ weight: 0, purity: 0, labour: 0, mention: '' }];
    let state = { rupeeAmt: '' };
    
    // Fake functions
    function fmtG(g) { return parseFloat(g || 0).toFixed(3); }
    function fmtR(r) { return r; }
    function calcFineGoldRow(row) { return 0; }
    const PLACEHOLDER_PAIRS = ['X', 'Y', 'Z'];

    // Evaluate the body of getScreenHTML
    const bodyStart = getScreenHTMLCode.indexOf('{') + 1;
    const bodyEnd = getScreenHTMLCode.lastIndexOf('}');
    const body = getScreenHTMLCode.substring(bodyStart, bodyEnd);
    
    // wrap in a function
    const fn = new Function('actionType', 'ledgerType', 'contextType', 'showBookRate', 'metalMethod', 'purityRows', 'state', 'fmtG', 'fmtR', 'calcFineGoldRow', 'PLACEHOLDER_PAIRS', body);
    return fn(actionType, ledgerType, contextType, showBookRate, metalMethod, purityRows, state, fmtG, fmtR, calcFineGoldRow, PLACEHOLDER_PAIRS);
}

const incHTML = simulateRender('increase_payable');
const decHTML = simulateRender('decrease_payable');

fs.writeFileSync('inc.html', incHTML);
fs.writeFileSync('dec.html', decHTML);

console.log("Difference:");
const incLines = incHTML.split('\n');
const decLines = decHTML.split('\n');

for (let i = 0; i < Math.max(incLines.length, decLines.length); i++) {
    if (incLines[i] !== decLines[i]) {
        console.log(`Line ${i+1}`);
        console.log(`INC: ${incLines[i]}`);
        console.log(`DEC: ${decLines[i]}`);
    }
}
