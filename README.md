# SunarKhata (सुनारखाता)
### Open-Source Dual-Position Gold Ledger & AI Vision Intake Framework

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-gold.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Status: Production Ready](https://img.shields.io/badge/Status-Active_Development-brightgreen.svg)]()
[![Security: AES-256](https://img.shields.io/badge/Security-256--bit_TLS_&_RLS-blue.svg)]()
[![Platform: PWA](https://img.shields.io/badge/Platform-Progressive_Web_App-orange.svg)]()

SunarKhata is an open-source, specialized financial ledger and computer vision intake platform designed specifically for the unorganized Indian jewelry ecosystem (Sarafa Bazaar).


---

## 1. PHASE 1: THE TRADE LEDGER (WHOLESALER ↔ RETAILER) — COMPLETE SPECIFICATION

Phase 1 is not a prototype; it is a fully functional, production-ready Progressive Web App (PWA) with over 300 version-controlled modules solving the friction between wholesale gold dealers and retail jewelry showrooms.

### 1.1 The Ground-Level Industry Crisis Solved
* **The "5-Gram Monthly Void":** In high-velocity unorganized trading, manual scribbles, scrap gold returns, and rounding errors cause a recurring **5g discrepancy of pure gold every month** (~₹40,000–₹50,000 lost) for which no one is accountable. *A 2-gram error means ₹15,000+ lost.* SunarKhata enforces 0.001g precision.
* **The Dual-Currency Trap:** Gold trade cannot be measured in fiat alone. Jewelers trade raw metal obligations while settling making charges (*mazdoori*) in cash. Standard accounting tools (Tally, Vyapar) break because they force gold into Rupees.
* **The Broken *Zuban* (Commitment):** Deals worth crores move on WhatsApp and phone calls. Discrepancies destroy multi-decade partnerships. SunarKhata replaces memory with cryptographic verification.
* **Sunday Reconciliation:** Eliminates 4–6 hours spent every Sunday cross-checking rough slips with munims and accountants.

---

### 1.2 Dual-Track Parallel Position Engine
Every counterparty account maintains **two completely independent balances**:
1. **Metal Balance:** Always stored and displayed as **100% Fine Gold (24K Pure)** in grams to 3 decimal places (e.g., `45.200g`).
2. **Rupee Balance:** Displayed in whole Indian Rupees (₹) formatted according to Indian numbering standards (e.g., `₹8,42,500`).
* **The Rule of Separation:** Metal transactions NEVER touch the Rupee ledger, and Rupee transactions NEVER touch the Metal ledger unless an explicit spot conversion is initiated.

---

### 1.3 Account Topologies
* **Individual Accounts (Solo Khata):** Private, single-user ledgers for recording transactions with walk-in customers, one-off suppliers, or artisans. Entries update immediately without network approvals.
* **Mutual Accounts (Shared Consensus Khata):** Connected ledgers between two registered SunarKhata businesses:
  * **Cryptographic Handshake:** Initialized using a single-use, 20-character invite code valid for 2 hours.
  * **Perspective Mirroring Engine:** Automatically maps opposite accounting views in real-time. What Party A enters as **Receivable (Jama)** renders on Party B’s screen as **Payable (Naam)**.
  * **Bilateral Consensus:** Any entry proposed enters a `pending` state with an *Action Required* amber badge. It requires explicit **Approve** or **Reject** from the partner before balances update.

---

### 1.4 Signed Arithmetic & Dynamic Class Flipping (Zero-Crossing)
SunarKhata’s Central Position Engine (`position-engine.js`) tracks balances using signed internal math (`+` Receivable, `-` Payable, `0` Neutral):
* If a customer has a **5.000g Receivable** balance and returns a **12.000g** ornament:
  1. The system wipes out the 5.000g Receivable.
  2. Dynamically crosses zero into the opposite state.
  3. Instantly flips the account status to **7.000g Payable**.
* Balances cross zero dynamically without throwing errors or corrupting historical audit logs.

---

### 1.5 The 8 Core Transaction Workflows
SunarKhata supports 8 atomic transaction operations:
1. `Add Receivable Gold` (Metal ↑)
2. `Deduct Receivable Gold` (Metal ↓)
3. `Add Payable Gold` (Metal ↑)
4. `Deduct Payable Gold` (Metal ↓)
5. `Add Receivable ₹` (Rupee ↑)
6. `Deduct Receivable ₹` (Rupee ↓)
7. `Add Payable ₹` (Rupee ↑)
8. `Deduct Payable ₹` (Rupee ↓)

---

### 1.6 Purity & Fine Gold Calculation Engine
Users do not have to mentally calculate fine gold. The dynamic transaction modal computes:
$$\text{Fine Gold (g)} = \text{Gross Weight (g)} \times \left(\frac{\text{Purity \%}}{100}\right)$$
* **One-Tap Presets:**
  * **24K (99.9% Pure)**
  * **22K (91.6% Hallmark)**
  * **18K (75.0% Diamond Jewelry)**
* Supports manual purity percentages (e.g., 84.5% unrefined scrap), labour charges (₹ or %), and transaction memos.

---

### 1.7 Spot Conversion & Rate Booking Modules
* **Adjust in Gold:** Converts fiat Rupee debt into physical fine gold at live market bullion rates:
  $$\text{Fine Gold (g)} = \frac{\text{Rupee Amount}}{(\text{Gold Rate per 10g} / 10)}$$
* **Cash Settlement:** Converts physical fine gold balances back into Rupee obligations.
* **Book Gold Rate:** Allows customers with a payable metal balance to lock in today’s spot price for a future physical delivery, complete with an active countdown expiry timer. *(Strictly hidden from Vendor accounts).*

---

### 1.8 Fraud Prevention & The 60-Minute Immutable Audit Lock
* **The Latest-Only Rule:** Only the single most recent transaction on an account can be edited or cancelled. Once a new transaction is recorded on top, older entries become **permanently locked**.
* **The 1-Hour Time Limit:** Edit and cancel controls self-destruct exactly **60 minutes** after creation.
* **Non-Destructive State Machine:** Transactions are never deleted. They transition through strict states: `active`, `pending`, `approved`, `rejected`, `cancelled`, and `edited`.

---

### 1.9 Responsive PWA Layout (Desktop vs. Mobile)
* **Desktop Counter View:** Dual-column workspace featuring a 260px dark sidebar with active account roster (`Rajesh Jewellers`, `Sunil Kumar & Sons`, `Priya Gold Palace`), live search, and side-by-side Metal and Rupee cards with JetBrains Mono numeric typography.
* **Mobile Counter View:** Bottom navigation (🏠 Home, 🧮 Calc, 👤 Profile) with top-centered tab switcher (`METAL` / `RUPEE`) and thumb-friendly transaction buttons designed for one-handed operation behind the jewelry counter.
* **Regulatory Reference Shield:** Displays explicit legal notices: *"Approximate business records only · Not a legal or statutory document"* to protect jewelers from statutory audits.

---

## 2. PHASE 2: THE AI INTAKE WORKSTATION (WHOLESALER ↔ MANUFACTURER)

### The Problem:
A wholesale bullion/jewelry firm receives **1,000+ pieces daily** from dozens of workshop manufacturers (*karigars*). At the receiving counter, 5–6 industrial weighing machines are backed up as staff manually inspect pieces, read small tags for stone deductions, write vouchers, and key data into legacy software.

### The Solution We Are Building:
* **Precision Load-Cell Interfacing:** Direct serial communication (RS-232 / USB) between industrial weighing machines and Raspberry Pi edge nodes.
* **Weight-Triggered Overhead Camera:** Stabilized weight telemetry automatically triggers a high-resolution camera.
* **Computer Vision Craft Categorizer (PyTorch EfficientNet-B0):** Auto-identifies item types (Ring, Bangle, Necklace, Mangalsutra) and classifies intricate craft styles (Kundan, Antique, Meenakari, Plain Yellow).
* **Tag OCR:** Extracts handwritten or printed supplier codes, gross weight, and stone deductions.
* **Zero-Touch Inward:** Automatically populates the supplier khata, logs net fine gold, and uploads catalog photos without manual keying.

---

## 3. SECURITY & ENCRYPTION ARCHITECTURE

* **256-Bit Transport Security:** Enforced via TLS 1.3 / HTTPS.
* **Zero-Knowledge Multi-Tenancy:** Governed by Supabase PostgreSQL Row-Level Security (RLS) using a custom JWT extraction function (`public.requesting_user_id()`). Shop A can never view or infer Shop B’s balances.
* **Physical Safety Shield:** Protects merchants from extortion and robbery risks by eliminating local paper records and keeping cloud data cryptographically isolated.

---

## 4. TECH STACK

* **Phase 1 (Production PWA):** Vanilla JavaScript (ES6 Modules), Vite 6, Tailwind CSS, Firebase Auth (JWT), Supabase PostgreSQL with custom PL/pgSQL RLS.
* **Phase 2 (AI Vision & Edge IoT):** Python 3.11, PyTorch, Torchvision (EfficientNet-B0), OpenCV, Raspberry Pi serial interfaces (RS-232).

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
