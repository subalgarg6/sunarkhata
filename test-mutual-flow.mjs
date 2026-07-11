import crypto from 'crypto';

// Polyfill localStorage and window.crypto for Node.js
class LocalStorage {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorage();
global.window = {
    crypto: {
        getRandomValues: (arr) => {
            const bytes = crypto.randomBytes(arr.length);
            for (let i = 0; i < arr.length; i++) arr[i] = bytes[i];
            return arr;
        }
    }
};

async function runTest() {
    const { createMutualAccount, joinMutualAccount } = await import('./src/services/mutual.service.js');
    
    console.log("Creating Mutual Account for User A...");
    const acc = createMutualAccount({
        userId: 'userA_123',
        role: 'trade_customer',
        otherPartyName: 'Partner B',
        mobileNumber: '1234567890',
        metalBalance: 0,
        metalClass: 'receivable',
        rupeeBalance: 0,
        rupeeClass: 'receivable'
    });
    
    console.log("Generated Invite Code:", acc.invite_code);
    
    console.log("Joining Mutual Account as User B...");
    const joinResult = joinMutualAccount(acc.invite_code, 'userB_456', 'User B Name');
    
    if (joinResult.error) {
        console.error("FAILED TO JOIN:", joinResult.error);
    } else {
        console.log("SUCCESSFULLY JOINED:", joinResult.account);
    }
}

runTest().catch(console.error);
