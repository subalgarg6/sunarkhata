import { applyPositionChange, normalizePosition, toSigned } from './src/utils/position-engine.js';

function runTest(initBal, initClass, op, amt) {
    const res = applyPositionChange(initBal, initClass, op, amt);
    console.log(`${initBal} ${initClass} + ${op} ${amt} => ${res.newValue} ${res.newPosition}`);
}

console.log("--- B. Calculate and report ---");
runTest(0, 'neutral', 'increase_receivable', 1000);
runTest(0, 'neutral', 'increase_payable', 1000);
runTest(1000, 'receivable', 'increase_payable', 1500);
runTest(1000, 'payable', 'increase_receivable', 1500);
runTest(1000, 'payable', 'decrease_payable', 400);
runTest(1000, 'receivable', 'decrease_receivable', 400);

console.log("--- C. Legacy zero ---");
const c = normalizePosition(0, 'payable');
console.log(`balance 0 + class payable = ${c.balance} ${c.cls}`);

console.log("--- D. Legacy payable ---");
console.log(`balance 1000 + class payable = signed ${toSigned(1000, 'payable')}`);
