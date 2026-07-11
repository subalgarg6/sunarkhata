# 06. RATE BOOKING RULES

## Purpose
Rate Booking represents the fixing of a gold rate against a Rupee value to calculate a resulting Metal quantity without physically moving Rupee balances.

## Eligibility constraints
- **Account Type**: Available ONLY for **Trade Customer** roles.
- **Account State**: Available ONLY when the Metal state is **PAYABLE (NAAM)**.
- Do NOT show Book Rate for Supplier accounts (unless explicitly overridden by future business rules).
- Do NOT show Book Rate when the Trade Customer Metal state is Receivable.

## Mechanism
- The user enters the Rupee value to be booked and a Gold Rate (per 10 grams).
- **Formula**:
  `Metal grams = (Rupee Amount ÷ Rate) × 10`
- The system must display a helper text: *"Rate booking calculates metal only. It does not affect the Rupee ledger."*

## Strict Isolation from Rupee Ledger
- **CRITICAL**: Rate Booking operates **ONLY** on the Metal ledger.
- It MUST NOT increase or decrease Rupee Receivable/Payable.
- It MUST NOT create a transaction in the Rupee ledger history.
- Rate Booking and Rupee-to-Metal Conversion are distinct, separate workflows and should not be conflated.
