export function renderLandingPage(container) {
  container.innerHTML = `
    <style>
        .hero-gradient {
            background: radial-gradient(circle at top, rgba(197, 160, 40, 0.05) 0%, transparent 70%);
        }
    </style>
    <div class="bg-background text-on-background font-body-md antialiased overflow-x-hidden pt-20 w-full page-transition">

    <!-- TopNavBar -->
    <nav class="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-lg border-b border-outline-variant/30">
        <div class="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <a class="font-headline-md text-[22px] font-bold leading-[28px] text-primary tracking-tight" href="#">
                Sunarkhata
            </a>
            <div class="hidden md:flex items-center space-x-10">
                <a class="font-body-md text-body-md text-primary font-semibold border-b-2 border-gold-metallic pb-1" href="#product">Product</a>
                <a class="font-body-md text-body-md text-on-surface-variant hover:text-gold-metallic transition-colors" href="#solutions">Solutions</a>
                <a class="font-body-md text-body-md text-on-surface-variant hover:text-gold-metallic transition-colors" href="#benefits">Benefits</a>
                <a class="font-body-md text-body-md text-on-surface-variant hover:text-gold-metallic transition-colors" href="#how-it-works">How it Works</a>
            </div>
            <div class="flex items-center space-x-4">
                <a class="hidden md:inline-flex items-center justify-center font-label-md text-label-md text-primary hover:text-gold-metallic transition-colors px-5 py-2 border border-primary/20 rounded-lg" href="#/auth">
                    Login
                </a>
                <a class="inline-flex items-center justify-center font-label-md text-label-md bg-primary text-on-primary px-6 py-2.5 rounded-lg hover:bg-charcoal-deep transition-all shadow-sm active:scale-95" href="#/auth">Start 30-Day Free Trial</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-24 pb-32 hero-gradient" id="product">
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <div class="max-w-4xl mx-auto mb-16">
                <h1 class="font-display-lg text-4xl md:text-display-lg text-primary mb-6 leading-[1.1] tracking-tight">
                    The Gold Standard for <br class="hidden md:block"> Jewellery Ledgers.
                </h1>
                <p class="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
                    Sunarkhata is the modern digital ledger built specifically for the Indian jewellery industry to eliminate settlement errors and build absolute trust.
                </p>
                <div class="flex flex-col items-center">
                    <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
                        <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-label-md bg-gold-metallic text-white px-10 py-4 rounded-xl hover:bg-tertiary transition-all shadow-lg hover:shadow-gold-metallic/20 font-bold" href="#/auth">Start 30-Day Free Trial</a>
                        <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-label-md bg-white text-primary border border-outline-variant px-10 py-4 rounded-xl hover:bg-surface transition-all font-bold" href="#/auth">Login</a>
                    <p style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 400; line-height: 20px; color: #6B6B66; margin-top: 12px; text-align: center; background: transparent; border: none; border-radius: 0; box-shadow: none; text-decoration: none;">Paid plans range from ₹500–₹800/month after your free trial.</p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400; line-height: 16px; color: #8A8A85; margin-top: 4px; text-align: center; background: transparent; border: none; border-radius: 0; box-shadow: none; text-decoration: none;">(*Indicative pricing only. This is a rough estimate and does not constitute a final price, offer, or commitment. Final plans and pricing may vary.)</p>
                </div>
            </div>
            
            <div class="relative w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest border border-outline-variant/30 p-2 md:p-3">
                <div class="rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20">
                    <img alt="Sunarkhata Dashboard Interface" class="w-full h-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB77IOTcGVl4NpYfgYEVRX-7cNBDPmU965MzkV6DmZmsBiA38x8wRkfaxjyxDHR_ml4xL1RDJJJbnB7_Bl2UH-ADxn0jcE64F_YpyCUoM2osTMhJKC2UfkAgtty7oU3PSrAxrUNKqCwnznUVfH8hhHQSwLqp7PwTfOFNeJdjZ0KsTH_Kn6Ei_5e_5WroNrAWRz4KHhKjml4kUuLeywe3g1D7F1uKIobP1Hom0lvweO-LPNcP9-YB8eSRVmfHM4HeikkUOAXVQKYBCra">
                </div>
            </div>
        </div>
    </section>

    <!-- The Problem & Solution -->
    <section class="py-32 bg-surface-container-low" id="solutions">
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div class="grid lg:grid-cols-2 gap-20 items-center">
                <div class="max-w-xl pl-6 lg:pl-20">
                    <h2 class="font-headline-lg text-4xl md:text-headline-lg text-primary mb-8 leading-tight">Stop letting manual errors <br> ruin your Sundays.</h2>
                    <p class="font-body-md text-body-lg text-on-surface-variant mb-10 leading-relaxed">
                        Scattered WhatsApp messages, illegible paper entries, and settlement disputes drain your time and damage relationships. Even a small <span class="text-error font-bold underline decoration-error/30 underline-offset-4">3–4 gram variation</span> in manual tallies leads to major financial losses and <strong>hours of manual reconciliation that ruin your Sundays</strong> and personal time. Sunarkhata brings order with shared digital ledgers.
                    </p>
                    <ul class="space-y-8">
                        <li class="flex items-start group">
                            <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gold-soft flex items-center justify-center overflow-hidden mr-5 transition-colors group-hover:bg-gold-metallic">
                                <span class="material-symbols-outlined text-2xl text-gold-metallic group-hover:text-white transition-colors">receipt_long</span>
                            </div>
                            <div>
                                <h3 class="font-label-md text-body-md text-primary font-bold mb-1">Shared Digital Ledgers</h3>
                                <p class="font-body-md text-on-surface-variant leading-snug">Both parties see the exact same ledger in real-time, building absolute trust across every transaction.</p>
                            </div>
                        </li>
                        <li class="flex items-start group">
                            <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gold-soft flex items-center justify-center overflow-hidden mr-5 transition-colors group-hover:bg-gold-metallic">
                                <span class="material-symbols-outlined text-2xl text-gold-metallic group-hover:text-white transition-colors">sync</span>
                            </div>
                            <div>
                                <h3 class="font-label-md text-body-md text-primary font-bold mb-1">Instant Reconciliation</h3>
                                <p class="font-body-md text-on-surface-variant leading-snug">Settle complex balances with a single click, reclaiming your weekends from tedious manual cross-checking.</p>
                            </div>
                        </li>
                        <li class="flex items-start group">
                            <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gold-soft flex items-center justify-center overflow-hidden mr-5 transition-colors group-hover:bg-gold-metallic">
                                <span class="material-symbols-outlined text-2xl text-gold-metallic group-hover:text-white transition-colors">precision_manufacturing</span>
                            </div>
                            <div>
                                <h3 class="font-label-md text-body-md text-primary font-bold mb-1">Zero-Leakage Tracking</h3>
                                <p class="font-body-md text-on-surface-variant leading-snug">Stop losing money to hidden gram variations with high-precision tracking engineered for bullion standards.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="relative bg-surface-container-lowest rounded-2xl p-10 shadow-ambient border border-outline-variant/30 flex justify-center items-center overflow-hidden">
                    <div class="absolute inset-0 bg-gold-metallic/5 pointer-events-none"></div>
                    <img alt="Visualizing the transition from manual chaos to digital precision" class="relative z-10 w-full h-auto max-w-md mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcfxq8_upzfo9h5X4Kgw9XjxpOubSy7fRwGF5z1QMXivh_zf4YRveqAm_yGIl952nYnJK2FEFTfOZzMX_9Jcq5-o-4mW_zGn8bm-1nr07ix8rwowzCguRqHLm01bLMjLonjRvjGge4LlsHLkrHVJKVqcfU6ufPo73ZnF2STMP5_wA_czajB7HdzwDIazJqDeGCIKuNC3AfqLkN2351Jx_-mLX153uogef-buO2b00iG157pGw_Cv8wETbWM5_xcGjlUXTqjU4y4Vul">
                </div>
            </div>
        </div>
    </section>

    <!-- Benefits (Bento Grid) -->
    <section class="py-32" id="benefits">
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div class="text-center mb-20">
                <h2 class="font-headline-lg text-4xl md:text-headline-lg text-primary mb-4 tracking-tight">Engineered for Precision.</h2>
                <p class="font-body-md text-body-lg text-on-surface-variant max-w-2xl mx-auto">High-fidelity features designed for the unique workflow of jewelers and bullion traders.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div class="md:col-span-4 bg-surface-container-lowest rounded-2xl p-10 shadow-ambient border border-outline-variant/30 hover:border-gold-metallic/50 transition-all group">
                    <div class="w-14 h-14 bg-surface-container-low rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-3xl text-gold-metallic">calculate</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3">No More Math Errors</h3>
                    <p class="font-body-md text-on-surface-variant leading-relaxed">Automated calculations ensure your final balances are always perfectly accurate, down to the milligram.</p>
                </div>
                <div class="md:col-span-4 bg-surface-container-lowest rounded-2xl p-10 shadow-ambient border border-outline-variant/30 hover:border-gold-metallic/50 transition-all group">
                    <div class="w-14 h-14 bg-surface-container-low rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-3xl text-gold-metallic">compare_arrows</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3">Dual-Ledger Control</h3>
                    <p class="font-body-md text-on-surface-variant leading-relaxed">Maintain distinct ledgers for metal weight and currency in parallel with instant cross-conversion.</p>
                </div>
                <div class="md:col-span-4 bg-surface-container-lowest rounded-2xl p-10 shadow-ambient border border-outline-variant/30 hover:border-gold-metallic/50 transition-all group">
                    <div class="w-14 h-14 bg-surface-container-low rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-3xl text-gold-metallic">lock_clock</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3">Future Rate Booking</h3>
                    <p class="font-body-md text-on-surface-variant leading-relaxed">Secure metal rates ahead of time to protect your margins against market volatility and price fluctuations.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works -->
    <section class="py-32 bg-surface-container-low border-y border-outline-variant/20" id="how-it-works">
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <h2 class="font-headline-lg text-4xl md:text-headline-lg text-primary mb-20 tracking-tight">Simple Workflow. Powerful Results.</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
                <div class="relative">
                    <div class="w-20 h-20 rounded-2xl bg-gold-soft text-gold-metallic font-headline-md flex items-center justify-center mx-auto mb-8 shadow-sm">1</div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-4">Onboard Business</h3>
                    <p class="font-body-md text-on-surface-variant max-w-xs mx-auto">Set up your business profile and invite your trading partners in under two minutes.</p>
                    <div class="hidden md:block absolute top-10 left-1/2 w-full h-[1px] bg-gold-metallic/20 -z-10 translate-x-10"></div>
                </div>
                <div class="relative">
                    <div class="w-20 h-20 rounded-2xl bg-gold-soft text-gold-metallic font-headline-md flex items-center justify-center mx-auto mb-8 shadow-sm">2</div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-4">Log Movements</h3>
                    <p class="font-body-md text-on-surface-variant max-w-xs mx-auto">Record metal transfers and payments as they happen. Both sides get instant notifications.</p>
                    <div class="hidden md:block absolute top-10 left-1/2 w-full h-[1px] bg-gold-metallic/20 -z-10 translate-x-10"></div>
                </div>
                <div class="relative">
                    <div class="w-20 h-20 rounded-2xl bg-primary text-on-primary font-headline-md flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <span class="material-symbols-outlined text-3xl">verified</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-4">Settle Flawlessly</h3>
                    <p class="font-body-md text-on-surface-variant max-w-xs mx-auto">Reconcile balances with confidence and enjoy your Sundays without ledger anxiety.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-32">
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div class="bg-charcoal-deep rounded-[2rem] p-16 md:p-24 text-center shadow-2xl relative overflow-hidden">
                <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-metallic via-transparent to-transparent"></div>
                <div class="relative z-10">
                    <h2 class="font-headline-lg text-4xl md:text-5xl text-on-primary mb-6 tracking-tight">Ready to reclaim your time?</h2>
                    <p class="font-body-lg text-body-lg text-on-primary/70 mb-12 max-w-2xl mx-auto">
                        Join hundreds of wholesalers, bullion traders, and retail jewelers who trust Sunarkhata for their daily settlements.
                    </p>
                    <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-label-md bg-gold-metallic text-white px-12 py-5 rounded-xl hover:bg-tertiary transition-all shadow-xl hover:shadow-gold-metallic/30 font-bold text-lg" href="#/auth">Start 30-Day Free Trial</a>
                        <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-label-md text-on-primary border border-white/20 px-12 py-5 rounded-xl hover:bg-white/5 transition-all font-bold text-lg" href="#/auth">Login</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="w-full py-20 bg-charcoal-deep border-t border-white/5">
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-12">
                <!-- Brand -->
                <div class="md:col-span-6 md:pl-10 lg:pl-12">
                    <a class="font-headline-md text-2xl font-bold text-gold-metallic block mb-6" href="#">
                        Sunarkhata
                    </a>
                    <p class="font-body-md text-on-primary/50 text-sm max-w-xs mb-8 leading-relaxed">
                        Modernizing the traditional jewellery ledger for the digital era. Built with precision for India's finest craftsmen and traders.
                    </p>
                    <p class="font-body-md text-on-primary/30 text-xs">
                        © 2026 Sunarkhata. All rights reserved.
                    </p>
                </div>

                <!-- Support -->
                <div class="md:col-span-3">
                    <h4 class="text-on-primary font-bold mb-6">Support &amp; Legal</h4>
                    <ul class="space-y-4 text-sm text-on-primary/60">
                        <li class=""><a href="mailto:support@sunarkhata.com" class="hover:text-gold-metallic">support@sunarkhata.com</a></li>
                        <li class=""><a href="#/legal/privacy" class="hover:text-gold-metallic">Privacy Policy</a></li>
                        <li class=""><a href="#/legal/terms" class="hover:text-gold-metallic">Terms of Service</a></li>
                    </ul>
                </div>

                <!-- Social -->
                <div class="md:col-span-3 text-left md:text-right">
                    <h4 class="text-on-primary font-bold mb-6">Follow Us</h4>
                    <div class="flex md:justify-end space-x-4">
                        <a href="#" class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-gold-metallic hover:text-white transition-colors">
                            <span class="material-symbols-outlined">share</span>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-gold-metallic hover:text-white transition-colors">
                            <span class="material-symbols-outlined">chat</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    </div>
  `;
}
