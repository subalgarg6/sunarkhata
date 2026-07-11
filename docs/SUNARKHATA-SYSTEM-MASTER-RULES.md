# SUNARKHATA SYSTEM MASTER RULES

**"Any future developer or AI agent modifying SunarKhata must read this document and all files inside /docs/business-rules/ before modifying account, ledger, transaction, conversion, Mutual, routing, or responsive behaviour."**

SunarKhata is a highly specialized digital jeweller ledger mapping out Metal and Rupee positions for Individual and Mutual trade relationships.

This MASTER RULES document is the single source of truth for the entire application, summarizing the 10 permanent business rule pillars:

1. **[01-CORE-ACCOUNTING-RULES](./business-rules/01-CORE-ACCOUNTING-RULES.md)**
   Every account must permanently contain both METAL and RUPEE ledger sections. Opening balance does not dictate their existence.
2. **[02-INDIVIDUAL-ACCOUNT-RULES](./business-rules/02-INDIVIDUAL-ACCOUNT-RULES.md)**
   Individual accounts define the opposite party's role (Supplier or Trade Customer) and require an opening balance for both Metal and Rupee, even if ZERO.
3. **[03-METAL-LEDGER-RULES](./business-rules/03-METAL-LEDGER-RULES.md)**
   The Metal ledger tracks fine gold in GRAMS, permanently accessible. Balances are always positive with an accounting class (Receivable/Payable).
4. **[04-RUPEE-LEDGER-RULES](./business-rules/04-RUPEE-LEDGER-RULES.md)**
   The Rupee ledger tracks fiat currency. It utilizes the same accounting class engine as Metal and prevents negative displayed balances by crossing zero into the opposite state.
5. **[05-CONVERSION-RULES](./business-rules/05-CONVERSION-RULES.md)**
   Conversions (Metal to Rupee, Rupee to Metal) require the user to explicitly enter a gold rate ON THE SPOT, calculating per 10 grams.
6. **[06-RATE-BOOKING-RULES](./business-rules/06-RATE-BOOKING-RULES.md)**
   Rate Booking is isolated from the Rupee ledger and calculates only Metal. It is strictly limited to Trade Customer accounts in a Metal Payable state.
7. **[07-MUTUAL-ACCOUNT-RULES](./business-rules/07-MUTUAL-ACCOUNT-RULES.md)**
   Mutual accounts mirror accounting logic (Party A's Receivable is Party B's Payable). Joining is facilitated by secure, short-lived invite codes.
8. **[08-TRANSACTION-RULES](./business-rules/08-TRANSACTION-RULES.md)**
   All transactions strictly follow approval flows, retain audit trails, use correct terminologies, and can be cancelled within a 1-hour window.
9. **[09-RESPONSIVE-PWA-RULES](./business-rules/09-RESPONSIVE-PWA-RULES.md)**
   SunarKhata operates as a single Responsive PWA. Shared logic drives both Desktop (side-by-side ledgers) and Mobile (top-centered tab switcher) presentations.
10. **[10-ROUTING-AND-STATE-RULES](./business-rules/10-ROUTING-AND-STATE-RULES.md)**
    Routing actions strictly preserve current account context and ledger section, utilizing stable endpoints (e.g., `/accounts/:accountId`) and not generic redirects (e.g., `/dashboard`).

### Approved Terminology Constraint
- **Receivable (Jama)**: The other party has to give value to the user.
- **Payable (Naam)**: The user has to give value to the other party.
**Do NOT use "Asset", "Liability", "Owe", or "Owed".**
