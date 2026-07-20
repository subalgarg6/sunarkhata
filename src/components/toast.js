let toastContainer = null;

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-24 right-8 z-50 flex flex-col gap-4 w-80 pointer-events-none';
    document.body.appendChild(toastContainer);

    // Ensure toast animation CSS is loaded
    if (!document.getElementById('stitch-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'stitch-toast-styles';
      style.textContent = `
        .toast-entrance {
            animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
            from { transform: translateX(100%) scale(0.95); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export function showToast(message, type = 'info', duration = 4000) {
  ensureContainer();
  
  const typeConfig = {
    success: {
      border: 'border-gold-metallic',
      bgIcon: 'bg-[rgba(197,160,40,0.1)]',
      textIcon: 'text-gold-metallic',
      icon: 'check_circle',
      title: 'Success'
    },
    error: {
      border: 'border-error-crimson',
      bgIcon: 'bg-[rgba(176,0,32,0.1)]',
      textIcon: 'text-error-crimson',
      icon: 'error',
      title: 'Error'
    },
    info: {
      border: 'border-gold-metallic',
      bgIcon: 'bg-[rgba(197,160,40,0.1)]',
      textIcon: 'text-gold-metallic',
      icon: 'info',
      title: 'Notification'
    },
    warning: {
      border: 'border-gold-metallic',
      bgIcon: 'bg-[rgba(197,160,40,0.1)]',
      textIcon: 'text-gold-metallic',
      icon: 'warning',
      title: 'Warning'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  // Attempt to extract title and subtitle if message is formatted or just use message as title
  let title = config.title;
  let subtitle = message;

  // Some common existing messages map perfectly to Stitch titles
  if (message.toLowerCase().includes('transaction saved') || message.toLowerCase().includes('transaction added')) {
    title = 'Transaction Saved';
    subtitle = 'Ledger entry updated successfully.';
    config.icon = 'check_circle';
  } else if (message.toLowerCase().includes('account created')) {
    title = 'Account Created';
    subtitle = 'New counterparty profile is active.';
    config.icon = 'person_add';
  } else if (message.toLowerCase().includes('invalid password') || message.toLowerCase().includes("passwords don't match")) {
    title = 'Invalid Password';
    subtitle = 'Authentication failed. Please retry.';
    config.icon = 'lock_reset';
  } else if (message.toLowerCase().includes('changes saved') || message.toLowerCase().includes('updated')) {
    title = 'Changes Saved';
    subtitle = message;
    config.icon = 'save';
  } else {
    // Just use the message as the subtitle
    title = config.title;
  }

  const toast = document.createElement('div');
  toast.className = `toast-entrance pointer-events-auto p-4 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-l-4 ${config.border} flex gap-4 items-center transition-all duration-300`;
  
  toast.innerHTML = `
    <div class="w-8 h-8 flex items-center justify-center rounded-full ${config.bgIcon} ${config.textIcon} shrink-0">
      <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">${config.icon}</span>
    </div>
    <div class="flex-grow">
      <h4 class="font-label-md text-primary leading-tight">${title}</h4>
      <p class="font-body-md text-[13px] text-on-surface-variant">${subtitle}</p>
    </div>
    <button class="text-outline-variant hover:text-on-surface transition-colors toast-close-btn">
      <span class="material-symbols-outlined text-[18px]">close</span>
    </button>
  `;

  // Shimmer effect
  toast.addEventListener('mouseenter', () => {
    toast.style.boxShadow = '0 20px 50px rgba(197, 160, 40, 0.15)';
  });
  toast.addEventListener('mouseleave', () => {
    toast.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
  });

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => removeToast(toast));

  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(20px)';
  setTimeout(() => toast.remove(), 300);
}
