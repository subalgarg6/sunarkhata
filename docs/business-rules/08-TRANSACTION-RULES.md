# 08. TRANSACTION RULES

## Auditability & History
Every transaction must be recorded with sufficient detail to maintain a clear audit trail. This includes:
- Transaction ID, Account ID, Ledger type, Action type
- Amount/Weight and accounting direction
- Previous balance & resulting balance
- Previous accounting class & resulting accounting class
- Rate (if used) & Rate unit
- Mention (if provided)
- Created timestamp & Account mode
- Approval state & Linked transaction ID (where applicable)

## Transaction MENTION
- Every transaction form must provide an optional "Mention" or "Transaction Mention" field.
- This serves as a human-readable note (e.g., "Invoice 124", "Gold received").
- It must be saved and displayed alongside the transaction in the history view.

## Adjustment Rules
- Adjustments must operate inside the currently active ledger (Metal affects Metal, Rupee affects Rupee).
- Adjustments utilize the central zero-crossing accounting engine.
- Upon completion, the system must remain in the same account/ledger and immediately update the history.

## Cancellation & Reversal
- Users can request the cancellation of the LAST eligible transaction within **1 hour** of its creation.
- **Individual Accounts**: Cancellation must create a reversal transaction to preserve audit history; do NOT simply hard-delete the database row.
- **Mutual Accounts**: The cancellation request requires approval from the other party. The original transaction remains in effect until the cancellation is approved. Upon approval, a reversal is created and the original transaction is appropriately flagged.
