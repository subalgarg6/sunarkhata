# 05. CONVERSION RULES

## Rupee to Metal
Initiated from the Rupee ledger.
- **Rate Entry**: The user must enter the gold rate on the spot. No automatic/permanent/assumed rate is allowed.
- **Unit Scale**: The gold rate entered is **ALWAYS PER 10 GRAMS**. The UI must explicitly state "Rate per 10 grams" beneath the input field.
- **Formula**:
  `Metal grams = (Rupee Amount ÷ Rate) × 10`
- **Ledger Impact**: The transaction creates a linked effect in both ledgers based on the direction. (e.g., settling Rupee Payable to create a Metal Payable, etc.).

## Metal to Rupee
Initiated from the Metal ledger.
- **Rate Entry**: The user must enter the gold rate on the spot.
- **Unit Scale**: The gold rate entered is **ALWAYS PER 10 GRAMS**. The UI must explicitly state "Rate per 10 grams".
- **Formula**:
  `Rupee Amount = (Metal Weight ÷ 10) × Rate`
- **Ledger Impact**: The transaction applies corresponding accounting effects to both the Metal and Rupee ledgers based on the direction of the transaction.
