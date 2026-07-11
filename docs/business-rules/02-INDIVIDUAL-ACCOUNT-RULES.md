# 02. INDIVIDUAL ACCOUNT RULES

## Overview
Individual accounts track the position between the logged-in user and a single other party.

## Roles
The user must select the other party's role:
- **Supplier**
- **Trade Customer**

The logged-in user automatically acts as the opposite side of the chosen trade relationship.

## Account Creation Fields
The creation workflow must collect:
- Account mode: Individual
- Other party role (Supplier / Trade Customer)
- Other party/account name
- Mobile number (optional)
- Opening Metal balance
- Opening Metal state (Receivable / Payable)
- Opening Rupee balance
- Opening Rupee state (Receivable / Payable)

## Zero Balances
- ZERO is a completely valid opening balance for both Metal and Rupee.
- Do not hide or omit a ledger simply because its starting balance is zero.

## Post-Creation Routing
- Following the successful creation of an Individual account, the application must directly open the newly created account's detail workspace.
- Do NOT redirect to the Dashboard, the account creation screen, or any other root view.
