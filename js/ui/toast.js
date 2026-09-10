import { icons } from './icons.js';

class ToastManager {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    let iconSvg = icons.info;
    if (type === 'success') iconSvg = icons.check;
    else if (type === 'error') iconSvg = icons.alertTriangle;

    toastEl.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close btn-icon">${icons.x}</button>
    `;

    this.container.appendChild(toastEl);

    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.remove(toastEl);
    });

    if (duration > 0) {
      setTimeout(() => {
        this.remove(toastEl);
      }, duration);
    }
  }

  remove(toastEl) {
    toastEl.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      if (toastEl.parentNode === this.container) {
        this.container.removeChild(toastEl);
      }
    }, 300);
  }

  success(message) { this.show(message, 'success'); }
  error(message) { this.show(message, 'error'); }
  info(message) { this.show(message, 'info'); }
}

export const toast = new ToastManager();
