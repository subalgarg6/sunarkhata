# SunarKhata (सुनारखाता)
### Open-Source Dual-Position Gold Ledger & AI Vision Intake Framework

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-gold.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Status: Production Ready](https://img.shields.io/badge/Status-Active_Development-brightgreen.svg)]()
[![Security: AES-256](https://img.shields.io/badge/Security-256--bit_TLS_&_RLS-blue.svg)]()
[![Platform: PWA](https://img.shields.io/badge/Platform-Progressive_Web_App-orange.svg)]()

SunarKhata is a specialized, open-source technology platform engineered for India's unorganized precious metals and jewelry trade. It addresses the supply chain across two distinct operational phases:

- **PHASE 1: Wholesaler ↔ Retailer (Digital Trade Ledger)**
- **PHASE 2: Wholesaler ↔ Manufacturer (AI Vision Intake Station)**

---

## 1. PHASE 1: WHOLESALER ↔ RETAILER (THE TRADE LEDGER)

### The Problem:
Wholesalers and retail jewelers transact crores of rupees daily on word-of-honor (*Zuban*) and rough WhatsApp screenshots. 
* **The 5-Gram Void:** Small scribble errors, unrecorded scrap gold returns, and rounding flaws cause an average **5g discrepancy of pure gold every month** (~₹40,000–₹50,000 loss) for which no one takes responsibility. *A 2g error means ₹15,000+ lost.*
* **The Dual-Currency Trap:** Trades involve both physical fine gold and fiat cash (making charges / *mazdoori*). Traditional accounting tools force everything into Rupees, breaking the gold balance.
* **Sunday Reconciliation:** Shop owners waste 4–6 hours every Sunday arguing over mismatched registers.

### The Solution Built in SunarKhata:
1. **Parallel Ledgers:** Independent tracking of **Fine Gold (24K Pure to 0.001g)** and **Rupees (INR)** without forced conversions.
2. **Mutual Consensus Protocol:** Entries proposed by the wholesaler must be explicitly approved by the retailer on their own device before balances commit.
3. **Dynamic Zero-Crossing Engine:** If a party has a 5g Receivable balance and returns a 10g item, the engine flips the position across zero to 5g **Payable** automatically.
4. **Instant Spot Settlements:** Convert Rupee debt into physical metal at live spot rates (*Adjust in Gold*), settle metal into cash (*Cash Settlement*), or reserve market prices (*Book Gold Rate*).
5. **60-Minute Immutable Audit Lock:** Transactions lock permanently 1 hour after entry to prevent post-settlement tampering.

---

## 2. PHASE 2: WHOLESALER ↔ MANUFACTURER (THE AI INTAKE WORKSTATION)

### The Problem:
A typical gold wholesaler receives **1,000+ jewelry pieces every single day** from multiple artisan manufacturers and workshops (*karigars*). 
* At the intake counter, 5–6 industrial weighing machines operate simultaneously.
* 4 to 5 staff members manually weigh each piece, inspect craft styles, read small paper tags for stone deductions, write down entries, and feed them into billing software.
* This creates a massive intake bottleneck, high labor overhead, and frequent transcription errors.

### The Solution We Are Building:
An integrated edge IoT hardware and computer vision intake station:
1. **Precision Scale Interfacing:** Connects commercial load-cell scales to Raspberry Pi / edge compute nodes via RS-232 / USB.
2. **Trigger-on-Weight Shutter:** When a piece is placed on the scale and weight stabilizes, an overhead high-resolution camera automatically triggers.
3. **Computer Vision Classification (PyTorch EfficientNet-B0):** Automatically identifies the item type (Ring, Bangle, Necklace, Mangalsutra) and categorizes the craft style (Kundan, Antique, Meenakari, Plain Yellow).
4. **Automated Tag OCR:** Extracts handwritten or printed supplier codes, gross weight, and stone deductions directly from the tag.
5. **Zero-Touch Intake:** Pushes verified weight, pure gold equivalent, design style, and photos straight into the wholesaler's inventory and supplier ledger.

---

## 3. SECURITY, ENCRYPTION & LEGAL POSITIONING

* **256-Bit Transport Encryption:** All cloud communication is enforced via TLS 1.3 / HTTPS.
* **Row-Level Security (RLS) Isolation:** Multi-tenancy is enforced directly inside PostgreSQL using custom JWT extraction (`public.requesting_user_id()`). Shopkeepers cannot query or infer another merchant's holdings.
* **The Operational Reference Shield:** The platform explicitly states: *"Approximate business records only · Not a legal or statutory document."* It serves as an encrypted digital rough notebook (*kaccha bahi-khata*), protecting merchants from regulatory overreach.

---

## 4. TECH STACK

* **Phase 1 (Ledger):** Vanilla JavaScript (ES6 Modules), Vite 6, Tailwind CSS, Firebase Auth, Supabase PostgreSQL with custom PL/pgSQL RLS.
* **Phase 2 (AI Vision & Edge):** Python 3.11, PyTorch, Torchvision (EfficientNet-B0), OpenCV, Raspberry Pi serial interfaces (RS-232).

---

## 5. LOCAL RUN INSTRUCTIONS

```bash
# Clone the repository
git clone https://github.com/subalgarg6/sunarkhata.git
cd sunarkhata

# Install dependencies
npm install

# Start local server
npm run dev -- --port 4000
```
Open `http://localhost:4000` in your browser.

---

## 6. LICENSE

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.
