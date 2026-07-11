# SUNARKHATA ARCHITECTURE AUDIT

## 1. Transaction Redirect Bug (The "Context Loss" Bug)
**Observation:**
Currently, when a user clicks a transaction action button (e.g., Increase Receivable) inside an account, the application fires:
`window.location.hash = '#/transaction/...';`

**Why it breaks:**
SunarKhata uses a simple hash-based router (`src/router.js`) that mounts the matched route into the root `#app` container. Because `/transaction` is treated as a top-level route, the router unmounts the `IndividualAccount` or `MutualAccount` component entirely and replaces it with the `Transaction` component. When the user cancels or completes the transaction, it navigates back, forcing a full re-render of the account detail view and losing the user's scroll position, active tab state, and contextual awareness.

**Required Fix:**
The `Transaction` UI must be decoupled from the top-level router. Instead of triggering a hash change, clicking a transaction button should dynamically mount the `renderTransaction` form into an overlay/modal container *above* the currently active account view, ensuring the background account context is preserved perfectly. 

## 2. Ledger Zero-Crossing Engine & Accounting Rules
**Observation:**
The central accounting logic in `src/utils/position-engine.js` correctly handles zero-crossing and absolute values. However, some conversions and rate bookings in `individual.service.js` and `mutual.service.js` might need strict alignment with the new rules (e.g., ensuring Rate Booking never touches the Rupee ledger history).

**Required Fix:**
Ensure all mathematical models strictly follow `absolute(value)` for UI and `receivable/payable` sign flips.

## 3. Account Creation & Balance Initialization
**Observation:**
In `account-creation.js`, users can enter Metal and Rupee balances. Zero or empty fields are treated as `0`. 

**Required Fix:**
Ensure that zero balances explicitly save the default state (e.g., Payable) and do not conditionally hide or disable any functionality. The UI for both Desktop (side-by-side) and Mobile (tab switcher) must permanently render both sections.

## 4. "Current Screen Bug" (Rupee Section Accessibility)
**Observation:**
The user reported that the Rupee section is not permanently accessible. While the CSS logic (`lg:block` vs `hidden`) supports tab switching on mobile and side-by-side on desktop, if the underlying data lacks a Rupee object or if the UI relies on previous assumptions, it might fail. 

**Required Fix:**
The account templates in `individual-account.js` and `mutual-account.js` must be refactored to guarantee the Rupee section's presence and correctly initialize the dual-ledger layout under all circumstances, strictly adhering to `09-RESPONSIVE-PWA-RULES.md`.
