# 04. RUPEE LEDGER RULES

## Core Principles
The Rupee ledger exists permanently on every account.

## Accounting State
The Rupee balance always possesses a single accounting state at any given time:
- **RECEIVABLE / JAMA**
- **PAYABLE / NAAM**

## Zero-Crossing & Display
- Do NOT maintain or display a negative balance. 
- The displayed monetary balance must always be an absolute, positive numerical value.
- When an operation reduces the balance below zero, it crosses zero, flipping the accounting state.
  - Example: A ₹100,000 PAYABLE balance adjusted with an Increase Receivable of ₹125,000 results in a **₹25,000 RECEIVABLE** balance.

## Centralized Mathematical Model
Recommended internal handling:
- Receivable = positive signed value
- Payable = negative signed value
UI interpretation:
- `absolute(value)` is displayed.
- `value > 0` → RECEIVABLE
- `value < 0` → PAYABLE
- `value == 0` → ZERO (neutral)

## Rupee Actions
- When RECEIVABLE: Actions represent Increase Receivable / Decrease Receivable.
- When PAYABLE: Actions represent Increase Payable / Decrease Payable.
- The user is never forced to manually flip the state from Receivable to Payable—the central engine automatically crosses the zero boundary.
- Transaction forms must open inline within the current account, and the user must remain in the RUPEE ledger section upon success.
