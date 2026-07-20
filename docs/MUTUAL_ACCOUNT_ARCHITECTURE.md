# SunarKhata Mutual Account Architecture Specification

This document serves as the official, canonical technical specification for the Mutual Account system in SunarKhata. All future development, maintenance, and bug fixes must strictly adhere to the principles, workflows, and constraints outlined below.

---

## 1. Overall Architecture

The Mutual Account system transforms a standard single-user ledger into a secure, realtime, two-party shared ledger. It is composed of five foundational pillars:

1. **Canonical Ledger**: There is only ONE source of truth in the database. The database stores balances and transaction actions exclusively from the **Creator's Perspective**. 
2. **Perspective Engine**: A pure, stateless functional layer that intercepts the canonical database state and dynamically translates titles, roles, positions, and transactions into the exact mirror perspective for the viewing user.
3. **Accounting Engine**: The exact same battle-tested engine used for Individual Accounts. The Mutual Account system does not invent new math; it simply wraps the Individual Account engine.
4. **Approval Workflow**: A state machine that ensures mutual transactions (unlike individual transactions) require explicit consent from the opposing party before the canonical ledger is modified.
5. **Realtime Synchronization**: Powered by Supabase, ensuring that both users see transactions, approvals, and balance updates instantly across all their active devices.

---

## 2. Database Schema

The database strictly enforces the Canonical Ledger principle.

### `mutual_accounts`
- **Primary Source of Truth**: Stores `metal_balance`, `metal_class`, `rupee_balance`, and `rupee_class` solely from the Creator's perspective.
- **Creator Alias**: The `creator_alias` column stores the name the Partner assigns to the Creator upon joining, ensuring the Partner always sees their own chosen alias.
- **Other Party Name**: The `other_party_name` column stores the name the Creator assigns to the Partner.

### `mutual_transactions`
- Stores all historical and pending ledger movements.
- The `action` column (e.g., `increase_receivable`) is ALWAYS recorded from the Creator's perspective, regardless of whether the Creator or the Partner initiated the transaction.

### RLS Assumptions
- Row Level Security (RLS) ensures that only the `creator_id` or `partner_id` can read or update an active mutual account.
- Unauthenticated users and external parties cannot access the ledger.

---

## 3. Perspective Engine

Located at `src/utils/mutual-perspective.js`. This is a pure, side-effect-free engine. It never queries the database, mutates state, or triggers network requests.

### Helpers & Definitions

1. `isCreator(account, userId) -> Boolean`
   - Inputs: The raw mutual account object and the authenticated user's ID.
   - Outputs: `true` if the viewer is the creator, `false` otherwise.

2. `getPerspectiveRole(account, userId) -> String`
   - Inputs: Raw account, user ID.
   - Outputs: The viewer's role (`supplier` or `trade_customer`).
   - Example: If canonical role is `supplier`, the Creator gets `supplier`, the Partner gets `trade_customer`.

3. `getPerspectiveTitle(account, userId) -> String`
   - Inputs: Raw account, user ID.
   - Outputs: The customized alias the viewer assigned to the other party.
   - Example: Creator sees `account.other_party_name`. Partner sees `account.creator_alias`.

4. `getPerspectiveMetalClass(account, userId) -> String` (Also RupeeClass)
   - Inputs: Raw account, user ID.
   - Outputs: The viewer's accounting position (`receivable`, `payable`, `neutral`).
   - Example: If canonical is `receivable`, Creator gets `receivable`, Partner gets `payable`.

5. `getPerspectiveActionLabel(canonicalAction, isUserCreator) -> String`
   - Inputs: The raw DB action string and whether the viewer is the creator.
   - Outputs: The human-readable transaction label inverted for the viewer.
   - Example: DB action `increase_receivable`. Creator sees "Increase Receivable". Partner sees "Increase Payable".

6. `translateActionToCanonical(viewerAction, isUserCreator) -> String`
   - Inputs: The action the viewer requested from the UI and whether they are the creator.
   - Outputs: The canonical action to save in the database.

---

## 4. Accounting Engine Integration

There is exactly **ONE** accounting engine in SunarKhata (`src/utils/position-engine.js`). 

**How Individual Accounts are reused:**
The Mutual Account UI requests the pure perspective state, then blindly passes that state into the `position-engine.js` exactly as if it were an Individual Account. 

**Why there is only one accounting engine:**
To guarantee mathematical perfection. If calculation logic (purity, metal conversions, rate booking, normalization) were duplicated for Mutual Accounts, it would introduce silent discrepancies over time. The Mutual Account layer is strictly a wrapper for *Approval* and *Perspective*—it is never permitted to perform its own math.

---

## 5. Transaction Lifecycle

Every mutual transaction flows through this strict state machine:

1. **Proposal**: A user submits a transaction via the UI. The UI passes the viewer-perspective action to the service. The service immediately translates it into the Canonical Action and saves it.
2. **Pending**: The transaction awaits review. It does not affect the ledger balances.
3. **Approved**: The opposing party consents. The accounting engine executes the canonical action, permanently altering the mutual account balances.
4. **Rejected**: The opposing party declines. The transaction is marked rejected; balances remain unchanged.
5. **Cancelled**: Either party requests to undo an approved transaction. It goes into `pending_cancellation`. If approved, the transaction is marked `cancelled` and the accounting engine mathematically rolls back the balance.

---

## 6. Perspective Mapping Examples

Regardless of who initiates a transaction or views the ledger, the database stores the Canonical State (Creator's Perspective). The UI inverses it mathematically.

| Object / Action | Canonical DB State (Creator Perspective) | Partner's UI Perspective |
|---|---|---|
| Metal Position | `120g Receivable` | `120g Payable` |
| Rupee Position | `₹50,000 Payable` | `₹50,000 Receivable` |
| Role | `supplier` | `trade_customer` |
| Title | Creator named them "Gold Corp" | Partner named creator "Rajesh" |
| **Transaction 1** | `increase_receivable` | `Increase Payable` |
| **Transaction 2** | `decrease_payable` | `Decrease Receivable` |
| **Transaction 3** | `increase_payable` | `Increase Receivable` |
| **Transaction 4** | `convert_metal_to_rupee` | `Convert Metal to Rupee` |

---

## 7. Developer Rules

> [!CAUTION]
> Violating these rules will instantly destabilize the Mutual Account ledger and corrupt the user experience.

1. **Never duplicate accounting logic.** Always use `position-engine.js`.
2. **Never duplicate perspective logic.** Always use `mutual-perspective.js`.
3. **Never add UI accounting calculations.** The React/Vanilla JS views are dumb presentation layers only.
4. **Never query Supabase from the perspective engine.** The engine must remain 100% pure and synchronous.
5. **Never bypass the accounting engine.** Do not manually write `acc.metal_balance += 5` inside a service or UI file.

---

## 8. Testing Strategy

Any structural modifications to the Mutual Account system require executing the complete testing suite below.

### 8.1 Automated Unit Testing
- Execute `npx vitest run src/utils/mutual-perspective.test.js`.
- Execute `npx vitest run src/utils/position-engine.test.js`.

### 8.2 Manual End-to-End Verification Checklist
Requires two live authenticated accounts and two separate browser sessions.

* Creator creates Mutual Account
* Partner joins using invite
* Creator alias displays correctly
* Partner alias displays correctly
* Role inversion works
* Receivable/Payable inversion works
* Dashboard renders inverted aliases and roles
* Mutual Account header renders cleanly
* Sidebar rendering updates dynamically
* Opening balance renders correctly for both users
* Increase Receivable (Propose -> Pending -> Approve)
* Decrease Receivable
* Increase Payable
* Decrease Payable
* Metal ↔ Rupee conversion
* Rate Booking
* Pending approval states correctly display inverted actions
* Approve updates balances symmetrically
* Reject leaves balances unchanged
* Cancel rolls back balances
* Transaction history renders canonical actions in inverted text for partner
* Notifications invert language correctly
* Invite refresh issues new code
* Close Mutual Account workflow succeeds
* Realtime synchronization updates UI instantly
* Multi-device synchronization triggers without page reload
* RLS verification (third party cannot view ledger)
* Browser console errors remain at 0
* Network errors remain at 0
* Mobile responsive behavior holds
* Desktop behavior holds

### 8.3 Regression Checklist
Verify that Individual Accounts have not been corrupted by shared dependencies.

* Individual Accounts still behave exactly as before.
* No Individual Account accounting behavior changed.
* Shared accounting engine is producing identical results for Individual Accounts.
* Existing features outside Mutual Accounts remain completely unaffected.

---

## 9. Future Development Guidelines

When introducing a new transaction type (e.g., `convert_rupee_to_digital_gold`):

1. **Position Engine First**: Add the exact mathematical implementation for how the transaction alters balances to `src/utils/position-engine.js`. Ensure Individual Accounts can use it.
2. **Perspective Mapping**: Add the translation mappings to `src/utils/mutual-perspective.js` for both UI labels (`getPerspectiveActionLabel`) and database storage (`translateActionToCanonical`).
3. **Approval Wiring**: Ensure `mutual.service.js` is aware of the transaction type to pass it through the state machine.
4. **UI Button**: Add the UI button to `mutual-account.js`, ensuring its text and data-action attributes are pulled dynamically from the pure perspective engine.
5. **No Special Cases**: Never write `if (contextType === 'mutual')` inside the raw mathematical calculation blocks. The math is identical.
