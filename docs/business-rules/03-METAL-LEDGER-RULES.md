# 03. METAL LEDGER RULES

## Core Principles
The Metal ledger exists permanently on every account.
Metal is **ALWAYS** stored, calculated, and displayed in **GRAMS**.

## Accounting State
Like Rupee, the Metal ledger possesses an accounting state:
- **RECEIVABLE / JAMA**
- **PAYABLE / NAAM**

## Zero-Crossing & Display
- The displayed Metal balance remains an absolute, positive numerical value (e.g., 50 g, not -50 g).
- The underlying accounting class (Receivable/Payable) dictates the direction of the balance.
- If a transaction reduces a balance below zero, the balance crosses zero, and the accounting state flips to the opposite class.
  - Example: A 100 g RECEIVABLE balance reduced by an Increase Payable of 150 g results in a **50 g PAYABLE** balance (NOT -50 g RECEIVABLE).

## Fine Gold / Purity Rule
- Where applicable (e.g., direct Metal transactions with purity constraints), the following formula applies:
  `Fine Gold = Original Weight × ((Purity - Labour) / 100)`
- The system must not silently alter or assume purity if explicit purity fields are in use.

## Transaction Actions
When in the Metal section, clicking relevant transaction actions must:
1. Open the action within the SAME context (modal/drawer/sheet).
2. Apply the effect to the Metal ledger.
3. Keep the user in the SAME account and METAL section upon success.
