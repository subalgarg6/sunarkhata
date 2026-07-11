import fs from 'fs';
import path from 'path';

// Mock localStorage for node
const mockStorage = {};
global.localStorage = {
  getItem: key => mockStorage[key] || null,
  setItem: (key, val) => mockStorage[key] = val,
  removeItem: key => delete mockStorage[key]
};

// We need to test the logic exactly as it is in position-engine and individual.service.js
import { normalizePosition, applySignedDelta } from './src/utils/position-engine.js';
function metalToRupee(fineGold, rate) { return fineGold * (rate / 10); }
function rupeeToMetal(rupee, rate) { return rate > 0 ? rupee / (rate / 10) : 0; }

function simulateConversion(sourceLedger, acc, amount, rate) {
  if (sourceLedger === 'metal') {
    const rupeeAmt = metalToRupee(amount, rate);
    
    const sourceSign = Math.sign(normalizePosition(acc.metal_balance, acc.metal_class).signedBalance);
    if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
    if (amount > Math.abs(normalizePosition(acc.metal_balance, acc.metal_class).signedBalance)) throw new Error('Cannot adjust more than the available source balance.');

    const sourceDelta = -sourceSign * Math.abs(amount);
    const targetDelta = sourceSign * Math.abs(rupeeAmt);
    
    const mr = applySignedDelta(acc.metal_balance, acc.metal_class, sourceDelta);
    acc.metal_balance = mr.newValue;
    acc.metal_class = mr.newPosition;
    
    const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, targetDelta);
    acc.rupee_balance = rr.newValue;
    acc.rupee_class = rr.newPosition;
  } else {
    const metalGrams = rupeeToMetal(amount, rate);
    
    const sourceSign = Math.sign(normalizePosition(acc.rupee_balance, acc.rupee_class).signedBalance);
    if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
    if (amount > Math.abs(normalizePosition(acc.rupee_balance, acc.rupee_class).signedBalance)) throw new Error('Cannot adjust more than the available source balance.');

    const sourceDelta = -sourceSign * Math.abs(amount);
    const targetDelta = sourceSign * Math.abs(metalGrams);
    
    const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, sourceDelta);
    acc.rupee_balance = rr.newValue;
    acc.rupee_class = rr.newPosition;
    
    const mr = applySignedDelta(acc.metal_balance, acc.metal_class, targetDelta);
    acc.metal_balance = mr.newValue;
    acc.metal_class = mr.newPosition;
  }
  return acc;
}

function runTests() {
  console.log("--- RUNNING TESTS ---");
  
  // 1. METAL PAYABLE
  let acc1 = { metal_balance: 100, metal_class: 'payable', rupee_balance: 0, rupee_class: 'receivable' };
  acc1 = simulateConversion('metal', acc1, 10, 70000);
  console.log(`Test 1 (Metal Payable): Metal = ${acc1.metal_balance} ${acc1.metal_class}, Rupee = ${acc1.rupee_balance} ${acc1.rupee_class}`);

  // 2. METAL RECEIVABLE
  let acc2 = { metal_balance: 100, metal_class: 'receivable', rupee_balance: 0, rupee_class: 'receivable' };
  acc2 = simulateConversion('metal', acc2, 10, 70000);
  console.log(`Test 2 (Metal Receivable): Metal = ${acc2.metal_balance} ${acc2.metal_class}, Rupee = ${acc2.rupee_balance} ${acc2.rupee_class}`);

  // 3. RUPEE PAYABLE
  let acc3 = { metal_balance: 0, metal_class: 'payable', rupee_balance: 70000, rupee_class: 'payable' };
  acc3 = simulateConversion('rupee', acc3, 70000, 70000);
  console.log(`Test 3 (Rupee Payable): Metal = ${acc3.metal_balance} ${acc3.metal_class}, Rupee = ${acc3.rupee_balance} ${acc3.rupee_class}`);

  // 4. RUPEE RECEIVABLE
  let acc4 = { metal_balance: 0, metal_class: 'payable', rupee_balance: 70000, rupee_class: 'receivable' };
  acc4 = simulateConversion('rupee', acc4, 70000, 70000);
  console.log(`Test 4 (Rupee Receivable): Metal = ${acc4.metal_balance} ${acc4.metal_class}, Rupee = ${acc4.rupee_balance} ${acc4.rupee_class}`);

  // 5. MAX LIMIT OK
  let acc5 = { metal_balance: 10, metal_class: 'payable', rupee_balance: 0, rupee_class: 'receivable' };
  acc5 = simulateConversion('metal', acc5, 10, 70000);
  console.log(`Test 5 (Max Limit OK): Metal = ${acc5.metal_balance} ${acc5.metal_class}, Rupee = ${acc5.rupee_balance} ${acc5.rupee_class}`);

  // 6. MAX LIMIT EXCEEDED
  let acc6 = { metal_balance: 10, metal_class: 'payable', rupee_balance: 0, rupee_class: 'receivable' };
  try {
      simulateConversion('metal', acc6, 20, 70000);
      console.log(`Test 6 (Max Limit Exceeded): FAILED, allowed conversion over limit!`);
  } catch (e) {
      console.log(`Test 6 (Max Limit Exceeded): PASSED, threw error: ${e.message}`);
  }

  // 7. ZERO SOURCE BALANCE
  let acc7 = { metal_balance: 0, metal_class: 'payable', rupee_balance: 0, rupee_class: 'receivable' };
  try {
      simulateConversion('metal', acc7, 10, 70000);
      console.log(`Test 7 (Zero Source Balance): FAILED, allowed zero balance conversion!`);
  } catch (e) {
      console.log(`Test 7 (Zero Source Balance): PASSED, threw error: ${e.message}`);
  }
}

runTests();
