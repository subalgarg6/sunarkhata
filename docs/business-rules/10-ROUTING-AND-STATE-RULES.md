# 10. ROUTING AND STATE RULES

## Transaction Context Retention
A critical requirement is that users remain in their current context when performing actions.
- When clicking transaction actions (e.g., Increase Payable, Metal to Rupee, Book Rate), the application must NOT redirect back to the Dashboard, Account List, New Account form, or Root route.
- Transaction actions open INSIDE the current account context (e.g., via a modal, bottom sheet, or drawer).

## Post-Transaction Success
After a successful transaction:
1. The transaction is persisted.
2. The correct ledger balance updates.
3. Accounting classes flip if zero is crossed.
4. Transaction history updates.
5. The transaction form closes.
6. The user REMAINS inside the SAME account.
7. The user REMAINS in the SAME ledger section.

## Avoid Generic Redirects
- Do NOT use generic navigation calls like `navigate("/")`, `navigate("/dashboard")`, or `navigate(-1)` after a transaction unless explicitly dictated by a unique workflow.
- Account detail routes must be stable and deep-linkable (e.g., `/account/:accountId` or `/mutual/:accountId`).

## State Management
- Metal/Rupee active section state can be maintained via component state, nested route, query parameter, or hash state.
- Refreshing the PWA should not corrupt the active account view.
- Rely on the project's existing persistence architecture; do not invent a secondary, competing state management system.
