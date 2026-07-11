# 01. CORE ACCOUNTING RULES

## Purpose
SunarKhata is a digital jeweller ledger, not a generic cashbook or accounting app.

## The Dual-Ledger Constraint
Every account contains **TWO PERMANENT LEDGER SECTIONS**:
1. **METAL**
2. **RUPEE**

## Immutable Existence
- Both ledgers must exist indefinitely, regardless of their opening balance.
- An opening balance only dictates the numerical value starting point, never the rendering condition of the ledger itself.
- Do NOT conditionally render the Metal or Rupee ledgers based on:
  - `balance > 0`
  - `balance !== 0`
  - A truthy balance value
  - The existence of prior transactions
  - The existence of an opening balance

## Approved Terminology
- **Receivable (Jama)**: Value is owed *to* the user by the other party.
- **Payable (Naam)**: Value is owed *by* the user to the other party.
- Forbidden terms: Asset, Liability, Owe, Owed.
- This applies consistently across the UI, labels, states, forms, and internal architectures where applicable.
