import { LEGAL_PAGES } from './legal.js';

export function renderLegalPage(container, pageKey = 'terms') {
  const page = LEGAL_PAGES[pageKey] || LEGAL_PAGES.terms;

  container.innerHTML = `
    <div class="legal-page">
      <div class="legal-header">
        <button class="legal-header-back" id="legalBack">←</button>
        <h1>${page.title}</h1>
      </div>
      <div class="legal-body">
        <div class="legal-updated">Last updated: ${page.lastUpdated}</div>
        ${page.content}

        <div class="legal-links" style="margin-top:48px;padding-top:24px;border-top:1px solid var(--border-light)">
          <a href="#/legal/terms" ${pageKey === 'terms' ? 'style="color:var(--gold-primary);font-weight:600"' : ''}>Terms of Service</a>
          <a href="#/legal/privacy" ${pageKey === 'privacy' ? 'style="color:var(--gold-primary);font-weight:600"' : ''}>Privacy Policy</a>
          <a href="#/legal/cookies" ${pageKey === 'cookies' ? 'style="color:var(--gold-primary);font-weight:600"' : ''}>Cookie Policy</a>
          <a href="#/legal/disclaimer" ${pageKey === 'disclaimer' ? 'style="color:var(--gold-primary);font-weight:600"' : ''}>Disclaimer</a>
          <a href="#/legal/refund" ${pageKey === 'refund' ? 'style="color:var(--gold-primary);font-weight:600"' : ''}>Refund Policy</a>
        </div>

        <div style="margin-top:24px;padding:12px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;font-size:11px;color:var(--text-secondary);line-height:1.6">
          ⚠️ <strong>Reminder:</strong> SunarKhata is a personal record-keeping tool. Records created here are not legal documents and carry no evidentiary value. We do not mediate or resolve disputes between users.
        </div>
      </div>
    </div>
  `;

  document.getElementById('legalBack')?.addEventListener('click', () => {
    window.history.back();
  });
}
