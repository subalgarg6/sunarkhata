export function showModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmClass = '', onConfirm, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6';
  
  // Determine if it's a sign-out vs delete based on title to use correct icon, but keep the destructive styling
  const isSignOut = title.toLowerCase().includes('sign out');
  const iconName = isSignOut ? 'logout' : 'delete_forever';
  
  // Strip emojis from confirmText since Stitch uses pure text
  const cleanConfirmText = confirmText.replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, '').trim();
  
  overlay.innerHTML = `
    <!-- Dark Semi-transparent Backdrop with Blur -->
    <div class="absolute inset-0 bg-charcoal-deep/60 backdrop-blur-md modal-backdrop"></div>
    
    <!-- Modal Container -->
    <div class="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl premium-shadow overflow-y-auto max-h-[90vh] transform transition-all duration-300 scale-95 opacity-0" id="modal-card">
        <div class="p-8">
            <!-- Destructive Icon Circle -->
            <div class="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-6">
                <span class="material-symbols-outlined text-error-crimson text-2xl" style="font-variation-settings: 'FILL' 1;">${iconName}</span>
            </div>
            
            <!-- Text Content -->
            <div class="space-y-3 mb-8">
                <h2 class="font-headline-md text-headline-md text-on-surface">${title}</h2>
                <p class="font-body-md text-on-surface-variant leading-relaxed">
                    ${message}
                </p>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
                <!-- Cancel Button -->
                <button class="modal-cancel flex-1 px-6 py-3 border border-outline-variant text-on-surface font-label-md rounded-lg hover:bg-surface-container transition-all active:scale-[0.98]">
                    ${cancelText}
                </button>
                <!-- Destructive Button -->
                <button class="modal-confirm flex-1 px-6 py-3 bg-error-crimson text-on-primary font-label-md rounded-lg shadow-md hover:opacity-90 transition-all active:scale-[0.98]">
                    ${cleanConfirmText}
                </button>
            </div>
        </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const card = overlay.querySelector('#modal-card');
  
  // Trigger animation
  requestAnimationFrame(() => {
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
  });

  const close = (cb) => { 
    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      overlay.remove(); 
      cb?.();
    }, 300);
  };

  overlay.querySelector('.modal-confirm').addEventListener('click', () => close(onConfirm));
  overlay.querySelector('.modal-cancel').addEventListener('click', () => close(onCancel));
  overlay.querySelector('.modal-backdrop').addEventListener('click', () => close(onCancel));
}
