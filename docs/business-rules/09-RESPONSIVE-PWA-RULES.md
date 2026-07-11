# 09. RESPONSIVE PWA RULES

## Unified Architecture
SunarKhata is ONE responsive Progressive Web Application (PWA).
- Do NOT build separate desktop and mobile products.
- Do NOT branch into separate `DesktopAccountLogic` and `MobileAccountLogic`. Both contexts must utilize identical central business/accounting logic.

## Desktop / PC Web View
- The workspace supports a two-part ledger layout.
- METAL and RUPEE sections must be clearly accessible and viewable as two parts of the same account.
- Users can move between or inspect both ledgers without leaving the Account Detail workspace.

## Mobile Web / PWA View
- Use a top-centred ledger switcher inside the Account Detail Workspace: `[ METAL | RUPEE ]`
- This switcher acts as a section toggle, NOT a route navigation to a completely different view.
- Switching between Metal and Rupee MUST NOT:
  - Destroy the account state.
  - Reload the entire application.
  - Redirect the user to the dashboard or account list.

## Responsive Constraints
The design must be thoroughly tested across all common viewports (320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px) to ensure no horizontal overflow, clipped forms, or broken transaction modals exist.
