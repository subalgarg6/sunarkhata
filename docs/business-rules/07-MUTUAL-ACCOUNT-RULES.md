# 07. MUTUAL ACCOUNT RULES

## Setup & Invitation
When a user selects MUTUAL mode, they have two paths:
1. **Create Mutual Account**: The user defines the initial parameters (similar to an Individual account setup).
2. **Join with Invite Code**: The user pastes a valid invite code to connect to an existing Mutual account.

## Invite Codes
- The system generates a secure, high-entropy invite code (e.g., 20+ mixed characters) upon creation.
- Invite codes must NOT be predictable or sequential.
- The code expires or rotates every 5 minutes.
- The UI must display the invite code, an expiry countdown, and a copy-to-clipboard action.

## Accounting Mirror Rule
Mutual accounts use a shared canonical ledger. The perspectives of the two connected parties are perfect mathematical mirrors:
- If Party A's balance is **100 g RECEIVABLE**, Party B's balance must strictly evaluate to **100 g PAYABLE**.
- If Party A's balance is **₹500,000 PAYABLE**, Party B's balance must strictly evaluate to **₹500,000 RECEIVABLE**.
- Do NOT store two independently editable balances; derive perspectives from a single source of truth.

## Transaction Approval
- Any transaction created in a Mutual account begins in a `PENDING_APPROVAL` state.
- The transaction has no effect on the final committed balance until the opposite party approves it.
- The opposing party can APPROVE or REJECT the pending transaction.
- The transaction record tracks the creator, the approving party, the creation time, deadlines, and state changes.
