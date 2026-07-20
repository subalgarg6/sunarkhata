import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Globals mock for mutual.service.js to run in Node
global.window = {
  crypto: {
    getRandomValues: (arr) => crypto.webcrypto.getRandomValues(arr)
  },
  dispatchEvent: (event) => console.log('Event dispatched:', event.type),
  localStorage: {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null
  }
};
global.CustomEvent = class CustomEvent {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
  }
};
global.localStorage = global.window.localStorage;

async function runTest() {
  try {
    const { 
      createMutualAccount, 
      getMutualAccount,
      refreshInviteCode,
      previewMutualAccountByCode,
      joinMutualAccount,
      addMutualTransaction,
      approveTransaction,
      requestCancelTransaction,
      approveCancelTransaction,
      requestCloseMutualAccount,
      approveCloseMutualAccount,
      initMutualRealtime
    } = await import('./src/services/mutual.service.js');

    // Re-initialize mutual realtime (this sets up the channel)
    initMutualRealtime();

    const userA_email = `test1@test.com`;
    const userB_email = `test2@test.com`;
    const password = 'TestPassword123!';

    // Login or Create A
    let signInA = await supabase.auth.signInWithPassword({ email: userA_email, password });
    if (signInA.error) {
      console.log("SignIn A failed, attempting signup...");
      let { data: dataA, error: errA } = await supabase.auth.signUp({ email: userA_email, password, options: { data: { full_name: 'User A' } } });
      if (errA) throw new Error("SignUp A failed: " + errA.message);
      signInA = await supabase.auth.signInWithPassword({ email: userA_email, password });
    }
    const userA = signInA.data.user;
    console.log(`User A authenticated: ${userA.id}`);

    // Login or Create B
    let signInB = await supabase.auth.signInWithPassword({ email: userB_email, password });
    if (signInB.error) {
      console.log("SignIn B failed, attempting signup...");
      let { data: dataB, error: errB } = await supabase.auth.signUp({ email: userB_email, password, options: { data: { full_name: 'User B' } } });
      if (errB) throw new Error("SignUp B failed: " + errB.message);
      signInB = await supabase.auth.signInWithPassword({ email: userB_email, password });
    }
    const userB = signInB.data.user;
    console.log(`User B authenticated: ${userB.id}`);

    // To test with the service module, we will mock supabase instance inside the module
    // The mutual.service.js imports `supabase` from `../supabase.js`.
    // Let's just pass userA ID for the operations. 
    // Wait, the RLS policies rely on auth.uid() from the request!
    // Since mutual.service.js uses the singleton `supabase` instance, it will use whatever auth is currently set.
    
    console.log("\n--- TEST 1: Create Mutual Account (User A) ---");
    await supabase.auth.signInWithPassword({ email: userA_email, password });
    
    const newAccount = await createMutualAccount({
      userId: userA.id,
      role: 'supplier',
      otherPartyName: 'User B',
      mobileNumber: '1234567890',
      metalBalance: 0,
      metalClass: 'receivable',
      rupeeBalance: 0,
      rupeeClass: 'receivable'
    });
    
    console.log("Account created:", newAccount.id, "Invite code:", newAccount.invite_code);
    if (!newAccount.invite_code) throw new Error("Invite code missing");
    
    console.log("\n--- TEST 2: Preview Invite Code (User B) ---");
    // Switch to User B
    await supabase.auth.signInWithPassword({ email: userB_email, password });
    
    const preview = await previewMutualAccountByCode(newAccount.invite_code);
    if (preview.error) throw new Error("Preview failed: " + preview.error);
    console.log("Preview successful, partner sees name:", preview.account.other_party_name);
    
    console.log("\n--- TEST 3: Join Mutual Account (User B) ---");
    const joinRes = await joinMutualAccount(newAccount.invite_code, userB.id, 'User B');
    if (joinRes.error) throw new Error("Join failed: " + joinRes.error);
    console.log("Join successful! Status:", joinRes.account.status);

    console.log("\n--- TEST 4: Fetch Account (User A) ---");
    await supabase.auth.signInWithPassword({ email: userA_email, password });
    const fetchedA = await getMutualAccount(newAccount.id);
    if (!fetchedA) throw new Error("User A could not fetch account");
    console.log("User A fetched account. Partner ID:", fetchedA.partner_id);

    console.log("\n--- TEST 5: Propose Transaction (User A) ---");
    const txn = {
      section: 'metal',
      action: 'increase_receivable',
      amount: 10,
      mention: '10g test'
    };
    // inject created_by
    txn.created_by = userA.id;
    const addedTxn = await addMutualTransaction(newAccount.id, txn);
    console.log("Transaction proposed:", addedTxn.id, "Status:", addedTxn.status);

    console.log("\n--- TEST 6: Approve Transaction (User B) ---");
    await supabase.auth.signInWithPassword({ email: userB_email, password });
    const approvedAcc = await approveTransaction(newAccount.id, addedTxn.id);
    console.log("Transaction approved. New metal balance:", approvedAcc.metal_balance);
    if (approvedAcc.metal_balance !== 10) throw new Error("Balance not updated");

    console.log("\n--- TEST 7: Request Cancel Transaction (User A) ---");
    await supabase.auth.signInWithPassword({ email: userA_email, password });
    const reqCancel = await requestCancelTransaction(newAccount.id, addedTxn.id, userA.id);
    if (reqCancel.error) throw new Error("Request cancel failed: " + reqCancel.error);
    console.log("Cancellation requested successfully.");

    console.log("\n--- TEST 8: Approve Cancellation (User B) ---");
    await supabase.auth.signInWithPassword({ email: userB_email, password });
    const accAfterCancel = await approveCancelTransaction(newAccount.id, addedTxn.id);
    console.log("Cancellation approved. Restored metal balance:", accAfterCancel.metal_balance);
    if (accAfterCancel.metal_balance !== 0) throw new Error("Balance not restored to 0");

    console.log("\n--- TEST 9: Request Account Closure (User A) ---");
    await supabase.auth.signInWithPassword({ email: userA_email, password });
    const closeReq = await requestCloseMutualAccount(newAccount.id, userA.id, 'User A');
    if (closeReq.error) throw new Error("Close request failed: " + closeReq.error);
    console.log("Close request successful.");

    console.log("\n--- TEST 10: Approve Account Closure (User B) ---");
    await supabase.auth.signInWithPassword({ email: userB_email, password });
    const closeApp = await approveCloseMutualAccount(newAccount.id, userB.id, 'User B');
    if (closeApp.error) throw new Error("Close approval failed: " + closeApp.error);
    console.log("Account successfully deleted/closed.");
    
    // Verify deletion
    const verifyDel = await getMutualAccount(newAccount.id);
    if (verifyDel) throw new Error("Account was not actually deleted");
    console.log("Verified: Account no longer exists.");

    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);

  } catch (err) {
    console.error("\nTEST FAILED:", err);
    process.exit(1);
  }
}

runTest();
