export const LEGAL_PAGES = {

// ═══════════════════════════════════════════════
// TERMS OF SERVICE
// ═══════════════════════════════════════════════
terms: {
  title: 'Terms of Service',
  lastUpdated: '20 July 2026',
  content: `
<h2>1. Acceptance of Terms</h2>
<p>By accessing or using SunarKhata ("the App", "the Service"), operated by SunarKhata ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

<h2>2. Nature of the Service — IMPORTANT DISCLAIMER</h2>
<div class="legal-highlight">
<p><strong>SunarKhata is a digital bookkeeping platform built to help businesses organize, maintain, and synchronize their own records.</strong></p>
<p>By using SunarKhata, you explicitly acknowledge and agree that:</p>
<ul>
<li>SunarKhata does <strong>NOT</strong> create legally binding records.</li>
<li>SunarKhata does <strong>NOT</strong> certify records.</li>
<li>SunarKhata does <strong>NOT</strong> authenticate transactions.</li>
<li>SunarKhata does <strong>NOT</strong> verify deliveries.</li>
<li>SunarKhata does <strong>NOT</strong> verify payments.</li>
<li>SunarKhata does <strong>NOT</strong> verify ownership.</li>
<li>SunarKhata does <strong>NOT</strong> determine the accuracy of entries.</li>
<li>SunarKhata does <strong>NOT</strong> act as an accountant, auditor, or financial advisor.</li>
<li>SunarKhata does <strong>NOT</strong> act as a mediator or arbitrator, and does <strong>NOT</strong> resolve disputes between businesses.</li>
<li>SunarKhata is <strong>NOT</strong> legal tender.</li>
</ul>
<p>SunarKhata records alone should not be treated as official legal proof, government records, banking records, tax records, ownership certificates, or court-certified evidence without independent verification and supporting documentation.</p>
</div>

<h2>3. User Responsibility</h2>
<p>Users remain solely responsible for reviewing, verifying, and maintaining the accuracy of every record they create. You agree that any business, financial, or legal decisions you make based on data stored in SunarKhata are made at your own risk. You should independently verify your records against physical inventory, invoices, cash records, and other business documents.</p>

<h2>4. Acceptable Use</h2>
<p>You agree NOT to use SunarKhata to:</p>
<ul>
<li>Conduct or facilitate any illegal activity.</li>
<li>Create false, misleading, or fraudulent records.</li>
<li>Present SunarKhata records as independently certified, audited, or legally verified proof to any person, entity, court, or government body.</li>
<li>Store sensitive personal data of third parties without their explicit consent.</li>
<li>Attempt to reverse-engineer, hack, or compromise the Service.</li>
</ul>

<h2>5. Data Ownership & Responsibility</h2>
<p>5.1. <strong>You own your data.</strong> All entries, accounts, and records you create belong to you.</p>
<p>5.2. <strong>You are solely responsible</strong> for the accuracy, legality, and appropriateness of data you enter.</p>
<p>5.3. We do not verify, validate, audit, certify, or endorse any data entered by users.</p>
<p>5.4. We reserve the right to delete accounts that violate these Terms without prior notice.</p>

<h2>6. Mutual Accounts — Additional Disclaimer</h2>
<div class="legal-highlight">
<p>Mutual Accounts simply synchronize bookkeeping records between connected businesses.</p>
<ul>
<li>SunarKhata does <strong>NOT</strong> participate in the underlying transaction.</li>
<li>SunarKhata does <strong>NOT</strong> confirm that goods were delivered.</li>
<li>SunarKhata does <strong>NOT</strong> confirm that payment was received.</li>
<li>SunarKhata does <strong>NOT</strong> guarantee balances.</li>
<li>SunarKhata does <strong>NOT</strong> determine who is correct during disagreements.</li>
</ul>
<p>Business disputes remain solely between the connected parties. Mutual Accounts improve transparency and collaboration but do not replace contracts, invoices, or business agreements.</p>
</div>

<h2>7. No Warranty & Limitation of Liability</h2>
<p>The Service is provided <strong>"AS IS" and "AS AVAILABLE"</strong> without warranties of any kind, either express or implied.</p>
<p>To the maximum extent permitted by law, SunarKhata, its founders, employees, and affiliates shall NOT be liable for:</p>
<ul>
<li>Any business losses, financial losses, or damages arising from use of the Service.</li>
<li>Incorrect calculations, rounding errors, data loss, or service downtime.</li>
<li>Any disputes between users (including mutual account disputes).</li>
<li>Any legal, tax, or regulatory consequences arising from records created in the App.</li>
</ul>

<h2>8. Indemnification</h2>
<p>You agree to indemnify and hold harmless SunarKhata, its founders, employees, and affiliates from any claims, damages, losses, or expenses (including legal fees) arising from: (a) your use of the Service, (b) your violation of these Terms, (c) your presentation of app records as legal proof, or (d) any dispute with another user.</p>

<h2>9. Termination</h2>
<p>You may delete your account at any time from Profile → Delete Account. Upon termination, your data will be permanently deleted within 30 days. We may suspend or terminate accounts that violate these Terms.</p>

<h2>10. Governing Law & Jurisdiction</h2>
<p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.</p>

<h2>11. Contact</h2>
<p>For questions about these Terms, contact us at: <strong>support@sunarkhata.com</strong></p>
`
},

// ═══════════════════════════════════════════════
// PRIVACY POLICY
// ═══════════════════════════════════════════════
privacy: {
  title: 'Privacy Policy',
  lastUpdated: '20 July 2026',
  content: `
<h2>1. Introduction</h2>
<p>SunarKhata ("we", "us") respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights. We are committed to <strong>minimal data collection</strong> and <strong>privacy by design</strong>.</p>

<h2>2. Information We Collect</h2>

<h3>2.1 Information You Provide</h3>
<table class="legal-table">
<tr><th>Data</th><th>Purpose</th><th>Required?</th></tr>
<tr><td>Khata ID (username)</td><td>Account identification</td><td>Yes</td></tr>
<tr><td>Password</td><td>Authentication (stored hashed, we cannot read it)</td><td>Yes</td></tr>
<tr><td>Full Name</td><td>Display in your profile</td><td>Yes</td></tr>
<tr><td>Business Name</td><td>Display in your profile</td><td>No</td></tr>
</table>

<h3>2.2 Information We Do NOT Collect</h3>
<ul>
<li>❌ Real email address (we use your Khata ID internally)</li>
<li>❌ Phone number</li>
<li>❌ Aadhaar, PAN, GST, or any government ID</li>
<li>❌ Physical address or location data</li>
<li>❌ Contacts, photos, or device files</li>
<li>❌ Biometric data</li>
</ul>

<h3>2.3 Transaction Data</h3>
<div class="legal-highlight">
<p><strong>Your transaction entries (gold weights, cash amounts, rates, etc.) are YOUR data.</strong></p>
<p>We store this data solely to provide the Service to you. We do NOT:</p>
<ul>
<li>Analyze, mine, or profile your transaction patterns</li>
<li>Sell or share your transaction data with any third party</li>
<li>Use your data for advertising or marketing purposes</li>
<li>Aggregate your data for any commercial purpose</li>
</ul>
<p><strong>Disclaimer:</strong> Transaction data stored in SunarKhata is user-created and unverified. We do not validate, certify, or endorse any transaction data. This data does not constitute proof of any transaction, debt, or obligation.</p>
</div>

<h3>2.4 Automatically Collected Data</h3>
<p>We collect minimal technical data for service operation:</p>
<ul>
<li>Browser type and version (for compatibility)</li>
<li>Device type (for responsive display)</li>
<li>Error logs (for fixing bugs)</li>
</ul>
<p>We do NOT use analytics trackers, fingerprinting, or behavioral tracking.</p>

<h2>3. How We Use Your Information</h2>
<table class="legal-table">
<tr><th>Purpose</th><th>Legal Basis</th></tr>
<tr><td>Provide the Service (store your entries)</td><td>Contract performance</td></tr>
<tr><td>Authenticate your identity</td><td>Contract performance</td></tr>
<tr><td>Send critical service notifications</td><td>Legitimate interest</td></tr>
<tr><td>Fix bugs and improve the app</td><td>Legitimate interest</td></tr>
</table>

<h2>4. Data Sharing — Who Sees Your Data?</h2>
<div class="legal-highlight">
<p><strong>We do NOT sell, rent, license, or trade your personal data to anyone.</strong></p>
</div>
<p>We share data ONLY with:</p>
<table class="legal-table">
<tr><th>Who</th><th>What</th><th>Why</th></tr>
<tr><td>Cloud database provider</td><td>Encrypted account & entry data</td><td>To store and serve your data</td></tr>
<tr><td>Your Mutual Account partner</td><td>Shared ledger entries only</td><td>Because you chose to share via Mutual Mode</td></tr>
</table>
<p>We do NOT share data with advertisers, data brokers, social media platforms, or marketing companies.</p>

<h2>5. Government & Legal Requests</h2>
<div class="legal-highlight">
<p><strong>Our position on data requests:</strong></p>
<ul>
<li>We will resist all data requests to the maximum extent permitted by law.</li>
<li>We will only comply with valid court orders issued by a court of competent jurisdiction in India, and only after exhausting all legal remedies available to us.</li>
<li>We will notify affected users of any data request unless legally prohibited from doing so.</li>
<li>We collect minimal data specifically so that even if compelled, there is minimal data to produce.</li>
<li>As stated in our Terms: SunarKhata records are NOT legal documents and carry no evidentiary value. Any party seeking to use SunarKhata data as evidence does so without our endorsement.</li>
</ul>
</div>

<h2>6. Data Security</h2>
<ul>
<li>All data is transmitted securely over HTTPS (TLS 1.3 encryption).</li>
<li>Passwords are hashed securely (we cannot read your password).</li>
<li>Database access is strictly controlled — users can only access their own data.</li>
</ul>

<h2>7. Data Retention</h2>
<table class="legal-table">
<tr><th>Data</th><th>Retention</th></tr>
<tr><td>Active account data</td><td>As long as your account is active</td></tr>
<tr><td>Deleted account data</td><td>Permanently deleted within 30 days of account deletion</td></tr>
<tr><td>Error logs</td><td>90 days, then auto-deleted</td></tr>
</table>

<h2>8. Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li><strong>Access</strong> — View all your data from within the app</li>
<li><strong>Correct</strong> — Edit your profile and entries anytime</li>
<li><strong>Delete</strong> — Delete your entire account and all data (Profile → Delete Account)</li>
<li><strong>Object</strong> — Contact us to object to any data processing</li>
</ul>

<h2>9. Children's Privacy</h2>
<p>SunarKhata is not intended for use by anyone under 18 years of age. We do not knowingly collect data from minors.</p>

<h2>10. Changes to This Policy</h2>
<p>We will notify you of material changes via in-app notification. Continued use after changes constitutes acceptance.</p>

<h2>11. Contact</h2>
<p>Privacy concerns: <strong>support@sunarkhata.com</strong></p>
<p>Data deletion requests: <strong>support@sunarkhata.com</strong></p>
`
},

// ═══════════════════════════════════════════════
// COOKIE POLICY
// ═══════════════════════════════════════════════
cookies: {
  title: 'Cookie & Storage Policy',
  lastUpdated: '20 July 2026',
  content: `
<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files stored on your device by your browser. We use cookies and similar technologies (localStorage, sessionStorage) to operate the Service.</p>

<h2>2. What We Use</h2>
<table class="legal-table">
<tr><th>Technology</th><th>Purpose</th><th>Type</th><th>Duration</th></tr>
<tr><td>Authentication Token</td><td>Keep you signed in</td><td>Essential</td><td>Session / 7 days</td></tr>
<tr><td>localStorage</td><td>Store your preferences (unit, purity)</td><td>Essential</td><td>Until you clear it</td></tr>
<tr><td>Service Worker Cache</td><td>Offline access (PWA)</td><td>Essential</td><td>Until app update</td></tr>
</table>

<h2>3. What We Do NOT Use</h2>
<ul>
<li>❌ Google Analytics or any analytics tracker</li>
<li>❌ Facebook Pixel or any social media tracker</li>
<li>❌ Advertising cookies</li>
<li>❌ Third-party tracking cookies</li>
<li>❌ Fingerprinting or cross-site tracking</li>
<li>❌ Any cookie that tracks your behavior for marketing</li>
</ul>
<p><strong>We do not use tracking cookies.</strong></p>

<h2>4. Managing Cookies</h2>
<p>Since we only use essential cookies required for the app to function, there is no cookie consent banner needed. However, you can:</p>
<ul>
<li>Clear all app data: Browser Settings → Clear Site Data for sunarkhata.com</li>
<li>Uninstall the PWA: removes all cached data</li>
<li>Delete your account: removes all server-side data within 30 days</li>
</ul>

<h2>5. Contact</h2>
<p>Questions: <strong>support@sunarkhata.com</strong></p>
`
},

// ═══════════════════════════════════════════════
// LEGAL DISCLAIMER
// ═══════════════════════════════════════════════
disclaimer: {
  title: 'Legal Disclaimer',
  lastUpdated: '20 July 2026',
  content: `
<div class="legal-highlight">
<h2>⚠️ IMPORTANT — PLEASE READ CAREFULLY</h2>

<h3>Core Legal Position</h3>
<p>SunarKhata is a digital bookkeeping platform built to help businesses organize, maintain, and synchronize their own records. We are a software provider only.</p>
<p>By using SunarKhata, you explicitly acknowledge that:</p>
<ul>
<li>SunarKhata does <strong>NOT</strong> create legally binding records.</li>
<li>SunarKhata does <strong>NOT</strong> certify records.</li>
<li>SunarKhata does <strong>NOT</strong> authenticate transactions.</li>
<li>SunarKhata does <strong>NOT</strong> verify deliveries, payments, or ownership.</li>
<li>SunarKhata does <strong>NOT</strong> determine the accuracy of entries.</li>
<li>SunarKhata does <strong>NOT</strong> act as an accountant, auditor, or financial advisor.</li>
<li>SunarKhata does <strong>NOT</strong> act as a mediator or arbitrator, and does <strong>NOT</strong> resolve disputes between businesses.</li>
<li>SunarKhata is <strong>NOT</strong> legal tender.</li>
</ul>

<h3>No Liability for User Data</h3>
<p>SunarKhata records alone should not be treated as official legal proof, government records, banking records, tax records, ownership certificates, or court-certified evidence without independent verification and supporting documentation.</p>
<p>Users remain solely responsible for reviewing, verifying, and maintaining the accuracy of every record they create.</p>

<h3>Trust & Verification</h3>
<p>Balances, totals, and calculations shown in SunarKhata are generated from information entered by users. Users should review and verify their records against their physical inventory, invoices, cash records, and business documents before relying on them for financial, contractual, or legal decisions.</p>

<h3>Mutual Accounts</h3>
<p>Mutual Accounts simply synchronize bookkeeping records between connected businesses. SunarKhata does not participate in the underlying transaction, does not confirm that goods were delivered, does not confirm that payment was received, does not guarantee balances, and does not determine who is correct during disagreements. Business disputes remain solely between the connected parties. Mutual Accounts improve transparency and collaboration but do not replace contracts, invoices, or business agreements.</p>

<h3>Governing Law</h3>
<p>This disclaimer is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.</p>
</div>

<p style="margin-top:24px"><strong>By using SunarKhata, you acknowledge that you have read, understood, and agreed to this disclaimer.</strong></p>
`
},

// ═══════════════════════════════════════════════
// DELETE ACCOUNT / DATA DELETION
// ═══════════════════════════════════════════════
'delete-account': {
  title: 'Delete Account & Data Deletion',
  lastUpdated: '20 July 2026',
  content: `
<h2>How to Delete Your Account</h2>
<p>You can delete your SunarKhata account at any time from within the app:</p>
<ol>
<li>Log in to your account</li>
<li>Go to <strong>Profile → Delete Account</strong></li>
<li>Confirm the deletion</li>
</ol>

<h2>What Happens When You Delete Your Account</h2>
<div class="legal-highlight">
<p>When you request account deletion:</p>
<ul>
<li>Your profile information (name, business name, Khata ID) will be removed</li>
<li>All individual account records and entries you created will be deleted</li>
<li>Your access to mutual accounts will be revoked</li>
<li>All associated data will be scheduled for permanent deletion from our servers</li>
</ul>
<p><strong>Important:</strong> Account deletion is irreversible. Once your data is permanently deleted within 30 days, it cannot be recovered. Please export any records you wish to keep before deleting your account.</p>
</div>

<h2>Mutual Account Data</h2>
<p>If you have active mutual accounts, your access will be removed upon account deletion. Entries you created within a mutual account may remain visible to the other party as part of their account history. This is necessary to maintain the integrity of the other user's records.</p>

<h2>Manual Deletion Request</h2>
<p>If you are unable to access your account or prefer to request deletion manually, contact us at: <strong>support@sunarkhata.com</strong></p>
<p>Please include the Khata ID associated with your account. We will verify your identity before processing the request.</p>

<h2>Disclaimer</h2>
<p>SunarKhata is a digital bookkeeping platform. All entries are maintained by users for their own business reference. Deleting your account does not affect any real-world transactions, obligations, or agreements that may exist between you and your business counterparts.</p>
`
},

// ═══════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════
contact: {
  title: 'Contact Us',
  lastUpdated: '20 July 2026',
  content: `
<h2>Get in Touch</h2>
<p>We are here to help. If you have questions, feedback, or need assistance, reach out using the details below.</p>

<h2>Support</h2>
<p>For general questions, technical issues, account help, or feedback:</p>
<p><strong>support@sunarkhata.com</strong></p>

<h2>Response Time</h2>
<p>We aim to respond to all enquiries within 2–3 business days. Response times may vary during holidays or periods of high volume.</p>

<h2>What to Include</h2>
<p>To help us assist you faster, please include:</p>
<ul>
<li>Your Khata ID (if applicable)</li>
<li>A clear description of your question or issue</li>
<li>Screenshots if relevant</li>
</ul>

<h2>Legal & Privacy</h2>
<p>For legal, privacy, or data-related enquiries, please email <strong>support@sunarkhata.com</strong> with the subject line "Legal" or "Privacy".</p>

<h2>Disclaimer</h2>
<p>SunarKhata is a digital bookkeeping platform built to help businesses organize, maintain, and synchronize their own records. All records, entries, and calculations are generated from information entered by users and do not constitute certified legal, financial, or statutory documents. For official accounting, taxation, or legal matters, consult a qualified professional.</p>
`
},

};
