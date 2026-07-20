export function renderLandingPage(container) {
  container.innerHTML = `
    <style>
        /* ── Cinematic Presentation Frames ── */
        .laptop-frame { background: #2e3132; border-radius: 12px 12px 0 0; padding: 8px 8px 0; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.18), 0 8px 24px -4px rgba(0,0,0,0.06); }
        .laptop-base { background: linear-gradient(to bottom, #3a3d3f, #2e3132); height: 12px; border-radius: 0 0 6px 6px; margin: 0 60px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .laptop-screen { border-radius: 4px; overflow: hidden; }
        .phone-frame { width: 290px; border-radius: 36px; border: 5px solid #2e3132; background: #1a1c1e; padding: 6px; box-shadow: 0 32px 64px -16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); }
        .phone-screen { border-radius: 28px; overflow: hidden; }
        .phone-notch { width: 90px; height: 22px; background: #1a1c1e; border-radius: 0 0 16px 16px; margin: 0 auto; position: relative; z-index: 2; }
        .scene-glow { position: absolute; border-radius: 50%; background: rgba(197,160,40,0.05); filter: blur(80px); pointer-events: none; }

        /* ── Exact App Styles (reproduced from production) ── */
        .mock-sidebar { width: 260px; min-width: 260px; background: #FAFAF5; border-right: 1px solid rgba(200,200,190,0.3); display: flex; flex-direction: column; overflow: hidden; }
        .mock-sidebar-header { padding: 12px; border-bottom: 1px solid rgba(200,200,190,0.2); }
        .mock-account-item { padding: 9px 10px; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 2px; border: 1px solid transparent; cursor: default; }
        .mock-account-item:hover { background: rgba(197,160,40,0.06); }
        .mock-account-item.active { background: rgba(197,160,40,0.12); border: 1px solid rgba(197,160,40,0.3); }
        .mock-new-btn { width: 100%; padding: 8px; border-radius: 8px; border: 1px dashed rgba(197,160,40,0.4); background: rgba(197,160,40,0.04); display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; font-size: 11px; color: #000101; }
        .mock-search { width: 100%; padding: 6px 10px 6px 28px; border-radius: 6px; background: rgba(0,0,0,0.03); border: 1px solid rgba(200,200,190,0.3); font-size: 11px; color: #44474a; outline: none; }
        .mock-footer-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px; border-radius: 6px; font-size: 11px; color: #5C5C56; }

        /* ── Ledger View (from individual.css) ── */
        .mock-balance-card { background: #f3f4f5; border: 1px solid #e1e3e4; border-radius: 12px; padding: 14px 16px; border-left: 2px solid #C5A028; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .mock-tab { flex: 1; padding: 6px 0; text-align: center; font-size: 11px; font-weight: 600; border-radius: 6px; }
        .mock-tab.active { background: #C5A028; color: #000101; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .mock-tab:not(.active) { background: transparent; color: #44474a; }
        .mock-class-recv { background: rgba(14,98,69,0.08); color: #0E6245; border: 1px solid rgba(34,197,94,0.2); padding: 2px 10px; border-radius: 999px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .mock-class-pay { background: rgba(245,158,11,0.1); color: #F59E0B; border: 1px solid rgba(245,158,11,0.2); padding: 2px 10px; border-radius: 999px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .mock-txn-row { background: #fff; border-bottom: 1px solid #e1e3e4; padding: 8px 10px; display: flex; justify-content: space-between; align-items: flex-start; }
        .mock-action-btn { height: 34px; border-radius: 6px; font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; }

        @media (max-width: 767px) {
            .mock-sidebar { display: none; }
            .hero-laptop-inner { flex-direction: column; }
        }
    </style>
    <div class="bg-background text-on-background font-body-md antialiased overflow-x-hidden w-full">

    <!-- ═══════════════════════════════════════════ -->
    <!-- NAV -->
    <!-- ═══════════════════════════════════════════ -->
    <nav class="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div class="flex justify-between items-center h-16 md:h-[72px] px-5 md:px-10 lg:px-16 max-w-[1280px] mx-auto">
            <a class="flex items-center gap-2.5" href="#">
                <img src="/logo.png" class="rounded-full overflow-hidden shadow-sm w-12 h-12 object-contain" alt="SunarKhata Logo" />
                <span class="font-headline-md text-[18px] font-bold text-primary tracking-tight">Sunarkhata</span>
            </a>
            <div class="hidden md:flex items-center gap-8">
                <a class="font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
                <a class="font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
                <a class="font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors" href="#security">Security</a>
            </div>
            <div class="flex items-center gap-3">
                <a class="hidden md:inline-flex font-label-md text-[14px] text-primary hover:text-gold-metallic transition-colors px-4 py-2" href="#/auth">Log in</a>
                <a class="inline-flex items-center font-label-md text-[13px] md:text-[14px] font-semibold bg-primary text-on-primary px-5 py-2.5 rounded-lg hover:bg-charcoal-deep transition-all active:scale-[0.97]" href="#/auth">Get Started</a>
            </div>
        </div>
    </nav>


    <!-- ═══════════════════════════════════════════ -->
    <!-- HERO -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="pt-32 md:pt-40 pb-20 md:pb-28">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="flex justify-center mb-6">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-soft border border-gold-metallic/15">
                    <span class="w-1.5 h-1.5 rounded-full bg-gold-metallic"></span>
                    <span class="font-label-md text-[12px] font-semibold text-secondary tracking-wide">Built for India's Jewellery Trade</span>
                </div>
            </div>
            <h1 class="font-headline-lg text-[36px] md:text-[56px] lg:text-[64px] text-primary text-center leading-[1.1] tracking-tight mb-6 max-w-[800px] mx-auto">
                Your complete <br class="hidden md:block">digital khata.
            </h1>
            <p class="font-body-md text-[16px] md:text-[18px] text-on-surface-variant text-center leading-relaxed mb-10 max-w-[560px] mx-auto">
                Track gold and cash balances with your customers and suppliers. Both sides see the same ledger. Fewer disputes. Fewer errors.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-[15px] font-bold bg-gold-metallic text-white px-8 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(197,160,40,0.25)]" href="#/auth">Get Started</a>
                <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-[15px] font-semibold text-primary bg-surface-container-lowest border border-outline-variant/40 px-8 py-3.5 rounded-xl hover:border-outline-variant transition-all" href="#/auth">Log in</a>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2">
                <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-outline text-[14px]">lock</span><span class="font-body-md text-[12px] text-outline">Your data stays private</span></div>
                <span class="text-outline-variant/30 text-[10px] hidden sm:inline">&bull;</span>
                <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-outline text-[14px]">upcoming</span><span class="font-body-md text-[12px] text-outline">Pricing Revealing Soon</span></div>
                <span class="text-outline-variant/30 text-[10px] hidden sm:inline">&bull;</span>
                <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-outline text-[14px]">cancel</span><span class="font-body-md text-[12px] text-outline">Cancel anytime</span></div>
            </div>
            

            <!-- ════════ HERO: REAL APP — Sidebar + Ledger in Laptop ════════ -->
            <div class="mt-16 md:mt-20 max-w-[1000px] mx-auto relative">
                <div class="scene-glow -top-24 -left-24 w-[360px] h-[360px]"></div>
                <div class="scene-glow -bottom-20 -right-20 w-[300px] h-[300px]"></div>
                <div class="laptop-frame relative">
                    <div class="laptop-screen">
                        <div style="display:flex; height:420px; background:#FAFAF5; font-family:'Inter',sans-serif;" class="hero-laptop-inner">

                            <!-- ── Real Sidebar ── -->
                            <div class="mock-sidebar hidden md:flex flex-col">
                                <!-- Sidebar header -->
                                <div class="mock-sidebar-header">
                                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                                        <div style="width:28px;height:28px;border-radius:6px;background:#F4EBD0;display:flex;align-items:center;justify-content:center;">
                                            <span class="material-symbols-outlined" style="font-size:16px;color:#C5A028;font-variation-settings:'FILL' 1;">balance</span>
                                        </div>
                                        <div>
                                            <div style="font-size:12px;font-weight:700;color:#000101;line-height:1.2;">SunarKhata</div>
                                            <div style="font-size:8px;color:#5C5C56;">Digital Jeweller Ledger</div>
                                        </div>
                                    </div>
                                    <div class="mock-new-btn"><span class="material-symbols-outlined" style="font-size:14px;">add</span> New Account</div>
                                    <div style="position:relative;margin-top:8px;">
                                        <span class="material-symbols-outlined" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:13px;color:#44474a;">search</span>
                                        <input class="mock-search" placeholder="Search accounts..." readonly />
                                    </div>
                                </div>

                                <!-- Account list -->
                                <div style="flex:1;overflow-y:auto;padding:6px;">
                                    <!-- Active account -->
                                    <div class="mock-account-item active">
                                        <div style="width:28px;height:28px;border-radius:6px;background:rgba(197,160,40,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <span class="material-symbols-outlined" style="font-size:14px;color:#C5A028;">handshake</span>
                                        </div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-size:11px;font-weight:600;color:#000101;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Rajesh Jewellers</div>
                                            <div style="display:flex;gap:4px;margin-top:3px;">
                                                <span style="font-size:8px;color:#44474a;background:#e1e3e4;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Wholesaler</span>
                                                <span style="font-size:8px;color:#44474a;background:#d9dadb;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Mutual</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mock-account-item">
                                        <div style="width:28px;height:28px;border-radius:6px;background:#edeeef;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <span class="material-symbols-outlined" style="font-size:14px;color:#44474a;">person</span>
                                        </div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-size:11px;font-weight:600;color:#000101;">Sunil Kumar & Sons</div>
                                            <div style="display:flex;gap:4px;margin-top:3px;">
                                                <span style="font-size:8px;color:#44474a;background:#e1e3e4;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Supplier</span>
                                                <span style="font-size:8px;color:#44474a;background:#d9dadb;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Individual</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mock-account-item">
                                        <div style="width:28px;height:28px;border-radius:6px;background:rgba(197,160,40,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <span class="material-symbols-outlined" style="font-size:14px;color:#C5A028;">handshake</span>
                                        </div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-size:11px;font-weight:600;color:#000101;">Priya Gold Palace</div>
                                            <div style="display:flex;gap:4px;margin-top:3px;">
                                                <span style="font-size:8px;color:#44474a;background:#e1e3e4;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Trade Customer</span>
                                                <span style="font-size:8px;color:#44474a;background:#d9dadb;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Mutual</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mock-account-item">
                                        <div style="width:28px;height:28px;border-radius:6px;background:#edeeef;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <span class="material-symbols-outlined" style="font-size:14px;color:#44474a;">person</span>
                                        </div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-size:11px;font-weight:600;color:#000101;">Vinod Nath</div>
                                            <div style="display:flex;gap:4px;margin-top:3px;">
                                                <span style="font-size:8px;color:#44474a;background:#e1e3e4;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Karigar</span>
                                                <span style="font-size:8px;color:#44474a;background:#d9dadb;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Individual</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mock-account-item">
                                        <div style="width:28px;height:28px;border-radius:6px;background:#edeeef;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <span class="material-symbols-outlined" style="font-size:14px;color:#44474a;">person</span>
                                        </div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-size:11px;font-weight:600;color:#000101;">Anand Gold Refinery</div>
                                            <div style="display:flex;gap:4px;margin-top:3px;">
                                                <span style="font-size:8px;color:#44474a;background:#e1e3e4;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Supplier</span>
                                                <span style="font-size:8px;color:#44474a;background:#d9dadb;padding:1px 5px;border-radius:3px;font-weight:700;text-transform:uppercase;">Individual</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div style="padding:8px;border-top:1px solid rgba(200,200,190,0.2);">
                                    <div class="mock-footer-btn"><span class="material-symbols-outlined" style="font-size:16px;">settings</span> Profile & Settings</div>
                                    <div style="border-top:1px solid rgba(200,200,190,0.15);margin-top:6px;padding-top:6px;display:flex;align-items:center;gap:8px;padding:6px 8px;">
                                        <div style="width:24px;height:24px;border-radius:50%;background:#F4EBD0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#121416;">M</div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-size:10px;font-weight:600;color:#000101;">Mohan Soni</div>
                                            <div style="font-size:8px;color:#44474a;">@mohangoldworks</div>
                                        </div>
                                        <span class="material-symbols-outlined" style="font-size:14px;color:#44474a;">logout</span>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Real Ledger Workspace (Individual Account view) ── -->
                            <div style="flex:1;overflow-y:auto;background:#f8f9fa;">
                                <!-- Account header -->
                                <div style="padding:14px 20px;background:#f8f9fa;position:sticky;top:0;z-index:10;">
                                    <div style="font-size:14px;font-weight:600;color:#000101;">Rajesh Jewellers</div>
                                    <div style="font-size:10px;color:#75777a;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">Wholesaler &middot; Mutual &middot; +91 98765 43210</div>
                                </div>

                                <!-- Tab bar -->
                                <div style="padding:10px 16px 0;">
                                    <div style="display:flex;gap:3px;max-width:180px;margin:0 auto;background:#edeeef;border-radius:8px;padding:3px;">
                                        <div class="mock-tab active">METAL</div>
                                        <div class="mock-tab">RUPEE</div>
                                    </div>
                                </div>

                                <div style="padding:14px 16px;">
                                    <!-- Balance Card -->
                                    <div class="mock-balance-card">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                                            <div>
                                                <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#44474a;margin-bottom:1px;">Metal Balance</div>
                                                <div style="font-size:9px;color:#75777a;">Fine Gold (24K Pure)</div>
                                            </div>
                                            <span class="mock-class-pay">PAYABLE</span>
                                        </div>
                                        <div style="font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;color:#000101;margin-bottom:4px;">
                                            45.200<span style="font-size:13px;opacity:0.5;margin-left:3px;">g</span>
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                                        <div class="mock-action-btn" style="background:#000101;color:#fff;">
                                            <span class="material-symbols-outlined" style="font-size:13px;">add_circle</span>
                                            INCREASE PAYABLE
                                        </div>
                                        <div class="mock-action-btn" style="background:#f3f4f5;color:#000101;border:1px solid #e1e3e4;">
                                            <span class="material-symbols-outlined" style="font-size:13px;">remove_circle</span>
                                            DECREASE PAYABLE
                                        </div>
                                        <div class="mock-action-btn" style="background:#f3f4f5;color:#000101;border:1px solid #C5A028;">
                                            <span style="color:#C5A028;font-size:12px;">⇄</span>
                                            METAL → RUPEE
                                        </div>
                                        <div class="mock-action-btn" style="background:#C5A028;color:#fff;border:1px solid #C5A028;">
                                            <span class="material-symbols-outlined" style="font-size:13px;">trending_up</span>
                                            BOOK RATE
                                        </div>
                                    </div>

                                    <!-- Transaction History -->
                                    <div style="margin-top:10px;">
                                        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#000101;padding-bottom:6px;border-bottom:1px solid #e1e3e4;margin-bottom:4px;">Metal Transactions</div>

                                        <div class="mock-txn-row">
                                            <div style="flex:1;min-width:0;">
                                                <div style="font-size:11px;font-weight:500;color:#000101;">Increase Payable</div>
                                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:9px;color:#44474a;opacity:0.7;">
                                                    <span class="material-symbols-outlined" style="font-size:11px;">calendar_today</span>
                                                    12 Jul 2026, 2:45 PM &middot; Gold bar received
                                                </div>
                                            </div>
                                            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#0E6245;">+22.500 g</div>
                                        </div>

                                        <div class="mock-txn-row">
                                            <div style="flex:1;min-width:0;">
                                                <div style="font-size:11px;font-weight:500;color:#000101;">Decrease Payable</div>
                                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:9px;color:#44474a;opacity:0.7;">
                                                    <span class="material-symbols-outlined" style="font-size:11px;">calendar_today</span>
                                                    10 Jul 2026, 11:20 AM &middot; Ornament return
                                                </div>
                                            </div>
                                            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#B00020;">-8.300 g</div>
                                        </div>

                                        <div class="mock-txn-row">
                                            <div style="flex:1;min-width:0;">
                                                <div style="font-size:11px;font-weight:500;color:#000101;">Increase Payable</div>
                                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:9px;color:#44474a;opacity:0.7;">
                                                    <span class="material-symbols-outlined" style="font-size:11px;">calendar_today</span>
                                                    05 Jul 2026, 4:10 PM &middot; Wedding set
                                                </div>
                                            </div>
                                            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#0E6245;">+31.000 g</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="laptop-base"></div>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- TRUST STRIP -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-8 border-y border-outline-variant/15 bg-surface-container-low/30 overflow-hidden">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <p class="text-center font-label-md text-[11px] font-bold text-outline-variant uppercase tracking-widest mb-6">Trusted by businesses across India</p>
            <div class="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-16 gap-y-6 opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-primary text-[24px]">encrypted</span><span class="font-headline-md text-[15px] font-bold text-primary tracking-tight">Encrypted & Secure</span></div>
                <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-primary text-[24px]">cloud_sync</span><span class="font-headline-md text-[15px] font-bold text-primary tracking-tight">Real-Time Sync</span></div>
                <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-primary text-[24px]">visibility_off</span><span class="font-headline-md text-[15px] font-bold text-primary tracking-tight">Privacy First</span></div>
                <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-primary text-[24px]">diamond</span><span class="font-headline-md text-[15px] font-bold text-primary tracking-tight">Jeweller First</span></div>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- PROBLEM → SOLUTION -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-24 md:py-32">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="text-center mb-20">
                <h2 class="font-headline-lg text-[28px] md:text-[40px] text-primary leading-tight tracking-tight mb-4">Paper ledgers don't scale. <br class="hidden md:block"> Mistakes cost real money.</h2>
                <p class="font-body-md text-[16px] text-on-surface-variant max-w-[520px] mx-auto leading-relaxed">A small difference in weight or a missed entry can mean thousands of rupees lost every month. You need a system both parties trust.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[960px] mx-auto">
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20"><div class="w-11 h-11 rounded-xl bg-error-container/60 flex items-center justify-center mb-5"><span class="material-symbols-outlined text-[22px] text-on-error-container">edit_note</span></div><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Handwritten Errors</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Illegible entries, missed transactions and wrong totals. A 2-gram error in gold means \u20B915,000+ lost.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20"><div class="w-11 h-11 rounded-xl bg-error-container/60 flex items-center justify-center mb-5"><span class="material-symbols-outlined text-[22px] text-on-error-container">forum</span></div><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">WhatsApp Confusion</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Balances shared over chat. No single source of truth. Arguments happen when memories don't match.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20"><div class="w-11 h-11 rounded-xl bg-error-container/60 flex items-center justify-center mb-5"><span class="material-symbols-outlined text-[22px] text-on-error-container">event_busy</span></div><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Sunday Reconciliation</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Hours spent every week cross-checking entries with your counterpart. Time you should spend with family.</p></div>
            </div>
            <div class="flex justify-center my-12"><div class="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center"><span class="material-symbols-outlined text-gold-metallic text-[20px]">arrow_downward</span></div></div>
            <div class="text-center max-w-[640px] mx-auto">
                <h3 class="font-headline-lg text-[24px] md:text-[32px] text-primary leading-tight tracking-tight mb-4">One digital khata. <br> Both parties see the same truth.</h3>
                <p class="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Sunarkhata gives you and your counterpart a shared ledger. Every transaction is recorded once and visible to both. Metal weight, purity, rupee — everything stays in sync.</p>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- HOW IT WORKS -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-24 md:py-32 bg-surface-container-low" id="how-it-works">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="text-center mb-16 md:mb-20">
                <h2 class="font-headline-lg text-[28px] md:text-[40px] text-primary leading-tight tracking-tight mb-4">Start in minutes. Not days.</h2>
                <p class="font-body-md text-[16px] text-on-surface-variant max-w-[480px] mx-auto leading-relaxed">No training needed. If you can use WhatsApp, you can use Sunarkhata.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-[960px] mx-auto">
                <div class="text-center"><div class="w-14 h-14 rounded-2xl bg-gold-metallic/10 text-gold-metallic font-headline-md text-[20px] font-bold flex items-center justify-center mx-auto mb-6">1</div><h3 class="font-headline-md text-[17px] font-bold text-primary mb-3">Create Your Account</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed max-w-[260px] mx-auto">Sign up with your business name. Takes less than 2 minutes.</p></div>
                <div class="text-center"><div class="w-14 h-14 rounded-2xl bg-gold-metallic/10 text-gold-metallic font-headline-md text-[20px] font-bold flex items-center justify-center mx-auto mb-6">2</div><h3 class="font-headline-md text-[17px] font-bold text-primary mb-3">Add Your Parties</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed max-w-[260px] mx-auto">Add customers, suppliers, or karigar accounts. Enter opening balances.</p></div>
                <div class="text-center"><div class="w-14 h-14 rounded-2xl bg-primary text-on-primary font-headline-md text-[20px] font-bold flex items-center justify-center mx-auto mb-6 shadow-md"><span class="material-symbols-outlined text-[24px]">check</span></div><h3 class="font-headline-md text-[17px] font-bold text-primary mb-3">Start Recording</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed max-w-[260px] mx-auto">Log every transaction as it happens. Metal and rupee are tracked separately.</p></div>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- FEATURES -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-24 md:py-32" id="features">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="text-center mb-16 md:mb-20">
                <h2 class="font-headline-lg text-[28px] md:text-[40px] text-primary leading-tight tracking-tight mb-4">Everything a jeweller needs.</h2>
                <p class="font-body-md text-[16px] text-on-surface-variant max-w-[480px] mx-auto leading-relaxed">Built by understanding how jewellers actually work — not how software companies think they should.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1040px] mx-auto">
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20 hover:border-gold-metallic/30 transition-colors"><span class="material-symbols-outlined text-[28px] text-gold-metallic mb-5 block">scale</span><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Dual Ledger</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Metal weight and rupee tracked separately. See both balances at a glance.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20 hover:border-gold-metallic/30 transition-colors"><span class="material-symbols-outlined text-[28px] text-gold-metallic mb-5 block">group</span><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Shared Accounts</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Invite your party. Both of you see the same ledger in real-time. No more arguments.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20 hover:border-gold-metallic/30 transition-colors"><span class="material-symbols-outlined text-[28px] text-gold-metallic mb-5 block">calculate</span><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Auto Calculations</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Fine gold, net payable, and running balances calculated automatically. Reduced manual errors.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20 hover:border-gold-metallic/30 transition-colors"><span class="material-symbols-outlined text-[28px] text-gold-metallic mb-5 block">deployed_code</span><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Purity Tracking</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Record 22K, 24K, 91.6% or any purity. Fine gold is computed for every entry.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20 hover:border-gold-metallic/30 transition-colors"><span class="material-symbols-outlined text-[28px] text-gold-metallic mb-5 block">history</span><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Full History</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Every transaction is timestamped and permanent. Go back to any date and verify.</p></div>
                <div class="bg-surface-container-lowest rounded-2xl p-7 border border-outline-variant/20 hover:border-gold-metallic/30 transition-colors"><span class="material-symbols-outlined text-[28px] text-gold-metallic mb-5 block">phone_iphone</span><h3 class="font-headline-md text-[16px] font-bold text-primary mb-2">Works on Any Device</h3><p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed">Phone, tablet, laptop — your khata is always with you. Nothing to install.</p></div>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- PRODUCT SHOWCASE: Ledger + Rupee Tab -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-24 md:py-32 bg-surface-container-low">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                <!-- Left: Real Rupee Ledger inside frame -->
                <div class="order-2 lg:order-1">
                    <div class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden relative" style="box-shadow:0 24px 64px -12px rgba(0,0,0,0.1);">
                        <!-- Real app ledger — Rupee tab active -->
                        <div style="font-family:'Inter',sans-serif;background:#f8f9fa;">
                            <div style="padding:14px 20px;"><div style="font-size:14px;font-weight:600;color:#000101;">Sunil Kumar & Sons</div><div style="font-size:10px;color:#75777a;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">Supplier &middot; Individual &middot; +91 99887 76655</div></div>
                            <div style="padding:10px 16px 0;"><div style="display:flex;gap:3px;max-width:180px;margin:0 auto;background:#edeeef;border-radius:8px;padding:3px;"><div class="mock-tab">METAL</div><div class="mock-tab active">RUPEE</div></div></div>
                            <div style="padding:14px 16px;">
                                <div class="mock-balance-card">
                                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                                        <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#44474a;margin-bottom:1px;">Rupee Balance</div><div style="font-size:9px;color:#75777a;">Indian Rupee (INR)</div></div>
                                        <span class="mock-class-recv">RECEIVABLE</span>
                                    </div>
                                    <div style="font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;color:#000101;">₹8,42,500</div>
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                                    <div class="mock-action-btn" style="background:#000101;color:#fff;"><span class="material-symbols-outlined" style="font-size:13px;">add_circle</span> INCREASE RECV.</div>
                                    <div class="mock-action-btn" style="background:#f3f4f5;color:#000101;border:1px solid #e1e3e4;"><span class="material-symbols-outlined" style="font-size:13px;">remove_circle</span> DECREASE RECV.</div>
                                    <div class="mock-action-btn" style="grid-column:span 2;background:#f3f4f5;color:#000101;border:1px solid #C5A028;"><span style="color:#C5A028;font-size:12px;">⇄</span> RUPEE → METAL</div>
                                </div>
                                <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#000101;padding-bottom:6px;border-bottom:1px solid #e1e3e4;margin-bottom:4px;">Rupee Transactions</div>
                                    <div class="mock-txn-row"><div style="flex:1;"><div style="font-size:11px;font-weight:500;color:#000101;">Increase Receivable</div><div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:9px;color:#44474a;opacity:0.7;"><span class="material-symbols-outlined" style="font-size:11px;">calendar_today</span>14 Jul 2026, 10:15 AM &middot; Advance payment</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#0E6245;">+₹3,50,000</div></div>
                                    <div class="mock-txn-row"><div style="flex:1;"><div style="font-size:11px;font-weight:500;color:#000101;">Decrease Receivable</div><div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:9px;color:#44474a;opacity:0.7;"><span class="material-symbols-outlined" style="font-size:11px;">calendar_today</span>11 Jul 2026, 3:40 PM &middot; Gold purchase</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#B00020;">-₹1,85,000</div></div>
                                    <div class="mock-txn-row" style="border-bottom:none;"><div style="flex:1;"><div style="font-size:11px;font-weight:500;color:#000101;">Increase Receivable</div><div style="display:flex;align-items:center;gap:4px;margin-top:2px;font-size:9px;color:#44474a;opacity:0.7;"><span class="material-symbols-outlined" style="font-size:11px;">calendar_today</span>08 Jul 2026, 9:00 AM &middot; Cash received</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#0E6245;">+₹6,77,500</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: copy -->
                <div class="order-1 lg:order-2 max-w-[480px]">
                    <h2 class="font-headline-lg text-[28px] md:text-[36px] text-primary leading-tight tracking-tight mb-5">See it exactly how your party sees it.</h2>
                    <p class="font-body-md text-[16px] text-on-surface-variant leading-relaxed mb-8">When you add a transaction, your counterpart's ledger updates immediately. Both sides stay aligned. Settlement takes seconds, not hours.</p>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start gap-3"><span class="material-symbols-outlined text-gold-metallic text-[20px] mt-0.5">check_circle</span><span class="font-body-md text-[15px] text-on-surface leading-snug">Same numbers on both screens</span></li>
                        <li class="flex items-start gap-3"><span class="material-symbols-outlined text-gold-metallic text-[20px] mt-0.5">check_circle</span><span class="font-body-md text-[15px] text-on-surface leading-snug">Metal weight, purity and rupee — all in one view</span></li>
                        <li class="flex items-start gap-3"><span class="material-symbols-outlined text-gold-metallic text-[20px] mt-0.5">check_circle</span><span class="font-body-md text-[15px] text-on-surface leading-snug">Payable and receivable status clearly visible</span></li>
                    </ul>
                    <div class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                        <span class="material-symbols-outlined text-gold-metallic text-[18px]">shield</span>
                        <span class="font-body-md text-[13px] text-on-surface-variant">Only you and your party can see this ledger. No one else.</span>
                    </div>
                    
                </div>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- CINEMATIC: Mobile + Transaction Form -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-24 md:py-36 overflow-hidden bg-surface-offwhite">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="text-center mb-16 md:mb-20">
                <h2 class="font-headline-lg text-[28px] md:text-[44px] text-primary leading-tight tracking-tight mb-4">Your khata. Always with you.</h2>
                <p class="font-body-md text-[16px] md:text-[18px] text-on-surface-variant max-w-[500px] mx-auto leading-relaxed">Open your ledger from anywhere — phone, tablet, or laptop. Your records stay perfectly in sync.</p>
            </div>

            <!-- Cinematic Flex Container -->
            <style>
                .cinematic-layout {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: center;
                    column-gap: 64px;
                    row-gap: 64px;
                }
                @media (min-width: 992px) {
                    .cinematic-layout { column-gap: 96px; }
                }
                @media (min-width: 1200px) {
                    .cinematic-layout { column-gap: 120px; }
                }
                @media (min-width: 1440px) {
                    .cinematic-layout { column-gap: 140px; }
                }
            </style>
            <div class="cinematic-layout relative w-full mx-auto">
                <div class="scene-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]" style="position:absolute;"></div>

                <!-- Phone: Real mobile account list -->
                <div class="phone-frame relative z-10 flex-shrink-0 shadow-2xl drop-shadow-2xl md:-rotate-2 transition-transform duration-500 hover:rotate-0">
                    <div class="phone-notch"></div>
                    <div class="phone-screen">
                        <div style="font-family:'Inter',sans-serif;background:#FAFAF5;min-height:480px;display:flex;flex-direction:column;">
                            <!-- Mobile top bar (real) -->
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(200,200,190,0.3);background:#FAFAF5;">
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <span class="material-symbols-outlined" style="font-size:18px;color:#000101;">menu</span>
                                    <span style="font-size:12px;font-weight:700;color:#000101;">SunarKhata</span>
                                </div>
                                <div style="width:28px;height:28px;border-radius:50%;background:#F4EBD0;display:flex;align-items:center;justify-content:center;">
                                    <span class="material-symbols-outlined" style="font-size:16px;color:#C5A028;">add</span>
                                </div>
                            </div>

                            <!-- Real ledger view on mobile -->
                            <div style="flex:1;overflow:hidden;background:#f8f9fa;">
                                <div style="padding:12px 14px;"><div style="font-size:13px;font-weight:600;color:#000101;">Priya Gold Palace</div><div style="font-size:9px;color:#75777a;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">Trade Customer &middot; Mutual</div></div>
                                <div style="padding:6px 14px 0;"><div style="display:flex;gap:3px;max-width:160px;margin:0 auto;background:#edeeef;border-radius:7px;padding:2px;"><div class="mock-tab active" style="font-size:10px;padding:5px 0;">METAL</div><div class="mock-tab" style="font-size:10px;padding:5px 0;">RUPEE</div></div></div>
                                <div style="padding:10px 14px;">
                                    <div class="mock-balance-card" style="padding:10px 12px;">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                                            <div><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#44474a;">Metal Balance</div><div style="font-size:8px;color:#75777a;">Fine Gold (24K Pure)</div></div>
                                            <span class="mock-class-recv" style="font-size:8px;padding:2px 8px;">RECEIVABLE</span>
                                        </div>
                                        <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:#000101;">12.450<span style="font-size:11px;opacity:0.5;margin-left:2px;">g</span></div>
                                    </div>
                                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;">
                                        <div class="mock-action-btn" style="background:#000101;color:#fff;height:30px;font-size:9px;"><span class="material-symbols-outlined" style="font-size:12px;">add_circle</span>INCREASE RECV.</div>
                                        <div class="mock-action-btn" style="background:#f3f4f5;color:#000101;border:1px solid #e1e3e4;height:30px;font-size:9px;"><span class="material-symbols-outlined" style="font-size:12px;">remove_circle</span>DECREASE RECV.</div>
                                        <div class="mock-action-btn" style="grid-column:span 2;background:#f3f4f5;color:#000101;border:1px solid #C5A028;height:30px;font-size:9px;"><span style="color:#C5A028;font-size:10px;">⇄</span>METAL → RUPEE</div>
                                    </div>
                                    <div><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#000101;padding-bottom:4px;border-bottom:1px solid #e1e3e4;margin-bottom:2px;">Metal Transactions</div>
                                        <div class="mock-txn-row" style="padding:6px 0;"><div style="flex:1;"><div style="font-size:10px;font-weight:500;color:#000101;">Decrease Receivable</div><div style="font-size:8px;color:#44474a;opacity:0.7;margin-top:1px;">13 Jul, 5:20 PM &middot; Return</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#B00020;">-4.200 g</div></div>
                                        <div class="mock-txn-row" style="padding:6px 0;"><div style="flex:1;"><div style="font-size:10px;font-weight:500;color:#000101;">Increase Receivable</div><div style="font-size:8px;color:#44474a;opacity:0.7;margin-top:1px;">10 Jul, 11:00 AM &middot; Necklace</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#0E6245;">+16.650 g</div></div>
                                        <div class="mock-txn-row" style="padding:6px 0;border-bottom:none;"><div style="flex:1;"><div style="font-size:10px;font-weight:500;color:#000101;">Metal → Rupee</div><div style="font-size:8px;color:#44474a;opacity:0.7;margin-top:1px;">07 Jul, 2:00 PM</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#B00020;">-5.000 g</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Real transaction form card (Metal entry) -->
                <div class="relative z-10 max-w-[400px] w-full flex-shrink-0 shadow-2xl drop-shadow-xl md:rotate-1 transition-transform duration-500 hover:rotate-0">
                    <div class="rounded-2xl overflow-hidden border border-outline-variant/25 bg-surface-container-lowest" style="box-shadow:0 24px 64px -12px rgba(0,0,0,0.12);font-family:'Inter',sans-serif;">
                        <!-- Transaction form header -->
                        <div style="padding:16px 20px;border-bottom:1px solid #e1e3e4;background:#fff;display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div style="font-size:9px;font-weight:700;color:#735c00;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Metal Transaction</div>
                                <div style="font-size:16px;font-weight:700;color:#000101;">Increase Payable</div>
                            </div>
                            <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:#44474a;">
                                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
                            </div>
                        </div>
                        <!-- Form body -->
                        <div style="padding:16px 20px;background:#fff;">
                            <div style="background:#fff;border:1px solid #e1e3e4;border-radius:10px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.03);position:relative;overflow:hidden;">
                                <div style="position:absolute;top:0;left:0;width:100%;height:3px;background:#0E6245;opacity:0.9;"></div>
                                <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;margin-top:4px;">
                                    <div style="width:24px;height:24px;border-radius:50%;background:rgba(14,98,69,0.1);color:#0E6245;display:flex;align-items:center;justify-content:center;">
                                        <span class="material-symbols-outlined" style="font-size:14px;">arrow_upward</span>
                                    </div>
                                    <span style="font-size:9px;font-weight:700;color:#44474a;text-transform:uppercase;letter-spacing:1px;">Original Weight (g)</span>
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                                    <div style="grid-column:span 2;">
                                        <div style="background:#f8f9fa;border:1px solid #e1e3e4;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:4px;">
                                            <span style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:#000101;">22.500</span>
                                            <span style="font-size:12px;color:#44474a;opacity:0.5;">g</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style="font-size:9px;color:#44474a;margin-bottom:4px;">Purity (%)</div>
                                        <div style="background:#f8f9fa;border:1px solid #e1e3e4;border-radius:8px;padding:8px 10px;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:#000101;">99.50</div>
                                    </div>
                                    <div>
                                        <div style="font-size:9px;color:#44474a;margin-bottom:4px;">Labour (%)</div>
                                        <div style="background:#f8f9fa;border:1px solid #e1e3e4;border-radius:8px;padding:8px 10px;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:#000101;">0.00</div>
                                    </div>
                                    <div style="grid-column:span 2;margin-top:6px;">
                                        <div style="background:#f3f4f5;border:1px solid #e1e3e4;border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
                                            <span style="font-size:10px;font-weight:700;color:#44474a;">Fine Gold:</span>
                                            <span style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#000101;">22.388 g</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Total fine gold summary -->
                            <div style="background:#fff;border:1px solid #e1e3e4;border-left:3px solid #C5A028;border-radius:10px;padding:12px 14px;margin-top:12px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                                <div style="font-size:9px;font-weight:700;color:#44474a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Fine Gold (24K)</div>
                                <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#000101;line-height:1;">22.388<span style="font-size:14px;color:#44474a;font-weight:400;margin-left:4px;">g</span></div>
                            </div>
                        </div>
                        <!-- Footer -->
                        <div style="padding:12px 20px;border-top:1px solid #e1e3e4;background:#fff;display:flex;gap:8px;">
                            <div style="flex:1;height:36px;border:1px solid #e1e3e4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#44474a;">Cancel</div>
                            <div style="flex:2;height:36px;background:#000101;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;gap:4px;">
                                <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span> Confirm Transaction
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- TRUST CENTER -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-28 md:py-36 bg-surface-container-low" id="security">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">

            <!-- Section Header -->
            <div class="text-center mb-20">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-soft border border-gold-metallic/15 mb-6">
                    <span class="material-symbols-outlined text-gold-metallic text-[14px]">verified_user</span>
                    <span class="font-label-md text-[11px] font-bold text-secondary tracking-widest uppercase">Trust Center</span>
                </div>
                <h2 class="font-headline-lg text-[28px] md:text-[44px] text-primary leading-tight tracking-tight mb-5 max-w-[700px] mx-auto">Your business records <br class="hidden md:block"> are in safe hands.</h2>
                <p class="font-body-md text-[16px] md:text-[17px] text-on-surface-variant max-w-[560px] mx-auto leading-relaxed">Jewellers trust us with customer ledgers, supplier balances, and daily settlements. Here is exactly how we protect that trust.</p>
            </div>


            <!-- ──── Four Trust Cards ──── -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[960px] mx-auto">

                <!-- Card 1: Privacy -->
                <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden hover:border-gold-metallic/20 transition-colors">
                    <div class="px-8 pt-8 pb-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gold-metallic/8 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-[22px] text-gold-metallic">visibility_off</span>
                        </div>
                        <h3 class="font-headline-md text-[18px] font-bold text-primary">Privacy</h3>
                    </div>
                    <div class="px-8 pb-8 pt-4">
                        <p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-6">Your customer ledgers, supplier accounts, gold balances, and transaction history are designed to stay private. We do not access, sell, or share your business data for advertising or marketing.</p>
                        <div class="space-y-3">
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Your data is not sold, rented, or used for advertising</span>
                            </div>
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Only you and your chosen party can see a shared ledger</span>
                            </div>
                        </div>
                    </div>
                </div>


                <!-- Card 2: Security -->
                <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden hover:border-gold-metallic/20 transition-colors">
                    <div class="px-8 pt-8 pb-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gold-metallic/8 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-[22px] text-gold-metallic">encrypted</span>
                        </div>
                        <h3 class="font-headline-md text-[18px] font-bold text-primary">Security</h3>
                    </div>
                    <div class="px-8 pb-8 pt-4">
                        <p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-6">Your records are protected using industry-standard security practices. Access is controlled, communication is encrypted, and automated backups help safeguard your data.</p>
                        <div class="space-y-3">
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Protected login with strong password requirements</span>
                            </div>
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Invite codes and approval workflows control sharing</span>
                            </div>
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Regular automated backups help protect against data loss</span>
                            </div>
                        </div>
                    </div>
                </div>


                <!-- Card 3: Our Commitments -->
                <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden hover:border-gold-metallic/20 transition-colors flex flex-col h-full">
                    <div class="px-8 pt-8 pb-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gold-metallic/8 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-[22px] text-gold-metallic">verified</span>
                        </div>
                        <h3 class="font-headline-md text-[18px] font-bold text-primary">Our Commitments</h3>
                    </div>
                    <div class="px-8 pb-8 pt-4 flex flex-col flex-grow">
                        <p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-4">We are committed to building a platform that respects your privacy and follows responsible data practices.</p>
                        <div class="space-y-3">
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Designed with Indian data protection principles in mind</span>
                            </div>
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Authenticated access with protected credentials</span>
                            </div>
                            <div class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined text-success-emerald text-[16px] mt-0.5">check_circle</span>
                                <span class="font-body-md text-[14px] text-on-surface leading-snug">Data stored on trusted cloud infrastructure with automated backups</span>
                            </div>
                        </div>
                          <div class="flex-grow flex flex-col justify-center py-10 w-full relative">
                            <div class="flex flex-col w-full space-y-5 lg:space-y-8">
                                <!-- TRUST (Right aligned) -->
                                <div class="flex items-center gap-6 w-full opacity-90">
                                    <div class="h-[1px] flex-grow bg-outline-variant/60"></div>
                                    <span class="text-[32px] md:text-[44px] lg:text-[56px] text-primary uppercase leading-[0.85]" style="font-family: 'Avenir Next', 'Futura', 'Century Gothic', sans-serif; font-weight: 300; letter-spacing: 0.28em; margin-right: -0.28em;">TRUST</span>
                                </div>
                                <!-- TRACK (Left aligned) -->
                                <div class="flex items-center gap-6 w-full opacity-90">
                                    <span class="text-[32px] md:text-[44px] lg:text-[56px] text-primary uppercase leading-[0.85]" style="font-family: 'Avenir Next', 'Futura', 'Century Gothic', sans-serif; font-weight: 300; letter-spacing: 0.28em; margin-right: -0.28em;">TRACK</span>
                                    <div class="h-[1px] flex-grow bg-outline-variant/60"></div>
                                </div>
                                <!-- GROW (Right aligned with Gold) -->
                                <div class="flex items-center gap-6 w-full">
                                    <div class="h-[1px] flex-grow bg-gold-metallic/50"></div>
                                    <span class="text-[32px] md:text-[44px] lg:text-[56px] text-gold-metallic uppercase leading-[0.85]" style="font-family: 'Avenir Next', 'Futura', 'Century Gothic', sans-serif; font-weight: 300; letter-spacing: 0.28em; margin-right: -0.28em;">GROW</span>
                                </div>
                            </div>
                        </div>
                          <p class="font-body-md text-[11px] text-outline/60 mt-5 leading-relaxed">SunarKhata is a digital bookkeeping platform. Records are maintained by users and do not constitute legal, financial, or statutory documents.</p>
                    </div>
                </div>


                <!-- Card 4: Legal Information -->
                <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden hover:border-gold-metallic/20 transition-colors flex flex-col h-full">
                    <div class="px-8 pt-8 pb-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gold-metallic/8 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-[22px] text-gold-metallic">description</span>
                        </div>
                        <h3 class="font-headline-md text-[18px] font-bold text-primary">Legal Information</h3>
                    </div>
                    <div class="px-8 pb-8 pt-4 flex flex-col flex-grow">
                        <p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-4">SunarKhata is a digital bookkeeping platform for the jewellery industry. The balances, totals and records displayed in the application are <strong>rough business estimates</strong> generated from information entered by users. Users are responsible for verifying their records against their own inventory, invoices and business documents.</p>
                        <p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-4">Records maintained in SunarKhata are intended for business bookkeeping and operational reference only. They are <strong>not legal tender, not official legal records, not government records, not banking records, not tax records, and not proof of ownership by themselves.</strong></p>
                        <p class="font-body-md text-[14px] text-on-surface-variant leading-relaxed mb-4">SunarKhata does not verify transactions, certify records, or resolve disputes between businesses.</p>

                        <!-- Legal notice -->
                        <div class="bg-surface-container-low/60 rounded-xl p-5 border border-outline-variant/10 mb-4">
                            <p class="font-body-md text-[13px] text-on-surface-variant leading-relaxed"><span class="font-semibold text-on-surface">Important:</span> Do not use SunarKhata records as official proof of debt, ownership, or transaction validity without independent verification.</p>
                            <a href="#/legal/disclaimer" class="inline-flex items-center gap-1.5 mt-3 font-label-md text-[13px] font-semibold text-gold-metallic hover:text-secondary transition-colors">
                                Learn more
                                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </a>
                        </div>

                        <div class="flex-grow"></div>
                        <!-- Legal document links -->
                        <div class="flex flex-col gap-2.5">
                            <a href="#/legal/privacy" class="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-outline-variant/15 hover:border-gold-metallic/25 hover:bg-surface-container-low/40 transition-all group">
                                <span class="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:text-gold-metallic transition-colors">shield</span>
                                <span class="font-label-md text-[13px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Privacy Policy</span>
                            </a>
                            <a href="#/legal/terms" class="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-outline-variant/15 hover:border-gold-metallic/25 hover:bg-surface-container-low/40 transition-all group">
                                <span class="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:text-gold-metallic transition-colors">handshake</span>
                                <span class="font-label-md text-[13px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Terms of Service</span>
                            </a>
                            <a href="#/legal/disclaimer" class="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-outline-variant/15 hover:border-gold-metallic/25 hover:bg-surface-container-low/40 transition-all group">
                                <span class="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:text-gold-metallic transition-colors">info</span>
                                <span class="font-label-md text-[13px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Disclaimer</span>
                            </a>
                            
                            <a href="#/legal/delete-account" class="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-outline-variant/15 hover:border-gold-metallic/25 hover:bg-surface-container-low/40 transition-all group">
                                <span class="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:text-gold-metallic transition-colors">delete</span>
                                <span class="font-label-md text-[13px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Delete Account</span>
                            </a>
                            <a href="#/legal/contact" class="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-outline-variant/15 hover:border-gold-metallic/25 hover:bg-surface-container-low/40 transition-all group">
                                <span class="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:text-gold-metallic transition-colors">mail</span>
                                <span class="font-label-md text-[13px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Contact</span>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
            <!-- /Trust Cards -->


            <!-- Confidence Statement -->
            <div class="max-w-[720px] mx-auto mt-16">
                <div class="bg-charcoal-deep rounded-2xl px-8 py-8 md:px-12 md:py-10 text-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-metallic via-transparent to-transparent pointer-events-none"></div>
                    <div class="relative z-10">
                        <span class="material-symbols-outlined text-gold-metallic text-[32px] mb-4 block">lock</span>
                        <p class="font-headline-md text-[17px] md:text-[20px] text-on-primary leading-snug tracking-tight">Designed to keep your jewellery business records private and secure.</p>
                        <p class="font-body-md text-[14px] text-on-primary/45 mt-3 max-w-[420px] mx-auto leading-relaxed">We continuously work to earn and maintain your trust — through responsible technology, transparency, and design.</p>
                    </div>
                </div>
            </div>

        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- CTA -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="py-24 md:py-32">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="bg-charcoal-deep rounded-3xl px-8 py-16 md:px-16 md:py-20 text-center relative overflow-hidden">
                <div class="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-metallic via-transparent to-transparent pointer-events-none"></div>
                <div class="relative z-10">
                    <h2 class="font-headline-lg text-[28px] md:text-[40px] text-on-primary leading-tight tracking-tight mb-4">Experience premium bookkeeping.</h2>
                    <p class="font-body-md text-[16px] text-on-primary/60 mb-8 max-w-[440px] mx-auto leading-relaxed">Set up your first khata in minutes. Pricing Revealing Soon. Pricing may vary from ₹299 to ₹599 per month.</p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                        <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-[15px] font-bold bg-gold-metallic text-white px-10 py-4 rounded-xl hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(197,160,40,0.35)]" href="#/auth">Get Started</a>
                        <a class="w-full sm:w-auto inline-flex items-center justify-center font-label-md text-[15px] font-semibold text-on-primary/80 border border-white/15 px-10 py-4 rounded-xl hover:bg-white/5 transition-all" href="#/auth">Log in</a>
                    </div>
                    <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-gold-metallic/70 text-[14px]">lock</span><span class="font-body-md text-[12px] text-on-primary/40">Private & secure</span></div>
                        <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-gold-metallic/70 text-[14px]">upcoming</span><span class="font-body-md text-[12px] text-on-primary/40">Pricing Revealing Soon</span></div>
                        <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-gold-metallic/70 text-[14px]">shield</span><span class="font-body-md text-[12px] text-on-primary/40">Your data stays yours</span></div>
                    </div>
                    <p class="font-body-md text-[11px] text-on-primary/25 mt-6 leading-relaxed max-w-[400px] mx-auto">This is a personal bookkeeping tool. Records do not constitute official accounting, taxation, or statutory documents.</p>
                </div>
            </div>
        </div>
    </section>


    <!-- ═══════════════════════════════════════════ -->
    <!-- FOOTER -->
    <!-- ═══════════════════════════════════════════ -->
    <footer class="py-16 bg-charcoal-deep border-t border-white/5">
        <div class="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div class="md:col-span-5">
                    <div class="flex items-center gap-2.5 mb-5"><img src="/logo.png" class="rounded-full overflow-hidden shadow-sm w-10 h-10 object-contain" alt="SunarKhata Logo" /><span class="font-headline-md text-[17px] font-bold text-gold-metallic">Sunarkhata</span></div>
                    <p class="font-body-md text-[14px] text-on-primary/40 max-w-[320px] leading-relaxed mb-4">The digital khata for India's jewellery trade. Simple. Secure. Trusted.</p>
                    <div class="flex items-center gap-2 mb-6"><span class="material-symbols-outlined text-gold-metallic/50 text-[14px]">lock</span><span class="font-body-md text-[12px] text-on-primary/30">You own your data.</span></div>
                    <p class="font-body-md text-[12px] text-on-primary/25">&copy; 2026 Sunarkhata. All rights reserved.</p>
                </div>
                <div class="md:col-span-2"><h4 class="font-label-md text-[13px] font-bold text-on-primary/70 mb-5 uppercase tracking-wider">Product</h4><ul class="space-y-3"><li><a href="#features" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Features</a></li><li><a href="#security" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Security</a></li><li><a href="#how-it-works" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">How It Works</a></li></ul></div>
                <div class="md:col-span-2"><h4 class="font-label-md text-[13px] font-bold text-on-primary/70 mb-5 uppercase tracking-wider">Legal</h4><ul class="space-y-3"><li><a href="#/legal/privacy" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Privacy Policy</a></li><li><a href="#/legal/terms" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Terms of Service</a></li><li><a href="#/legal/disclaimer" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Disclaimer</a></li><li><a href="#/legal/delete-account" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Delete Account</a></li><li><a href="#/legal/contact" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">Contact</a></li></ul></div>
                <div class="md:col-span-3"><h4 class="font-label-md text-[13px] font-bold text-on-primary/70 mb-5 uppercase tracking-wider">Support</h4><ul class="space-y-3"><li><a href="mailto:support@sunarkhata.com" class="font-body-md text-[14px] text-on-primary/50 hover:text-gold-metallic transition-colors">support@sunarkhata.com</a></li></ul>
    
    <h4 class="font-label-md text-[13px] font-bold text-on-primary/70 mt-8 mb-5 uppercase tracking-wider">Follow Us</h4>
    <ul class="space-y-3">
        <li>
            <a href="https://youtube.com/@sunarkhata" target="_blank" rel="noopener noreferrer" class="flex items-start gap-3 group">
                <div class="mt-0.5 text-on-primary/50 group-hover:text-gold-metallic transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div class="flex flex-col">
                    <span class="font-label-md text-[14px] font-bold text-on-primary/70 group-hover:text-gold-metallic transition-colors">YouTube</span>
                    <span class="font-body-md text-[13px] text-on-primary/50 group-hover:text-gold-metallic/80 transition-colors">@sunarkhata</span>
                </div>
            </a>
        </li>
        <li>
            <a href="https://instagram.com/sunarkhata" target="_blank" rel="noopener noreferrer" class="flex items-start gap-3 group">
                <div class="mt-0.5 text-on-primary/50 group-hover:text-gold-metallic transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </div>
                <div class="flex flex-col">
                    <span class="font-label-md text-[14px] font-bold text-on-primary/70 group-hover:text-gold-metallic transition-colors">Instagram</span>
                    <span class="font-body-md text-[13px] text-on-primary/50 group-hover:text-gold-metallic/80 transition-colors">@sunarkhata</span>
                </div>
            </a>
        </li>
    </ul><div class="mt-6 pt-5 border-t border-white/5"><p class="font-body-md text-[12px] text-on-primary/30 leading-relaxed">SunarKhata is a digital bookkeeping platform built to help businesses organize, maintain and synchronize their own records. SunarKhata does not create legally binding records, certify records, or act as an accountant. By using this service you agree to our Terms of Service and Privacy Policy.</p></div></div>
            </div>
        </div>
    </footer>

    </div>
  `;
}
