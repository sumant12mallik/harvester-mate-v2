// ============================================
// 🪟 Modal Dialogs
// ============================================

import bus, { EVENTS } from '../core/events.js';
import { createElement, setHTML } from '../utils/dom-utils.js';

class Modal {
  constructor() {
    this.activeModal = null;
  }

  open(options = {}) {
    const {
      title = '',
      content = '',
      html = null,
      buttons = [],
      size = 'auto',
      closable = true,
      onClose = null,
      center = false
    } = options;

    if (this.activeModal) this.close();

    const overlay = createElement('div', {
      className: `modal-overlay ${center ? 'modal-center' : ''}`
    });

    const modal = createElement('div', {
      className: `modal-content modal-${size}`
    });

    // Handle
    const handle = createElement('div', { className: 'modal-handle' });
    modal.appendChild(handle);

    // Header
    if (title) {
      const header = createElement('div', { className: 'modal-header' });
      const titleEl = createElement('h3', {
        className: 'modal-title',
        text: title
      });
      header.appendChild(titleEl);

      if (closable) {
        const closeBtn = createElement('button', {
          className: 'modal-close',
          text: '✕'
        });
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
      }

      modal.appendChild(header);
    }

    // Body
    const body = createElement('div', { className: 'modal-body' });
    if (html) setHTML(body, html);
    else if (content) body.textContent = content;
    modal.appendChild(body);

    // Footer
    if (buttons && buttons.length) {
      const footer = createElement('div', { className: 'modal-footer' });
      buttons.forEach((btnConfig) => {
        const {
          label,
          onClick,
          variant = 'primary',
          closeOnClick = true,
          type = 'button'
        } = btnConfig;

        const btn = createElement('button', {
          className: `btn btn-${variant}`,
          text: label,
          attrs: { type }
        });

        btn.addEventListener('click', async () => {
          try {
            if (typeof onClick === 'function') {
              const result = await onClick();
              if (result === false) return;
            }
            if (closeOnClick) this.close();
          } catch (e) {
            console.error('Modal button error:', e);
          }
        });
        footer.appendChild(btn);
      });
      modal.appendChild(footer);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.activeModal = { overlay, modal, onClose, body };

    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('active'));

    if (closable) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    this._escapeHandler = (e) => {
      if (e.key === 'Escape' && closable) this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);

    bus.emit(EVENTS.MODAL_OPEN, { title });
    return this.activeModal;
  }

  close() {
    if (!this.activeModal) return;
    const { overlay, onClose } = this.activeModal;

    overlay.classList.remove('active');

    setTimeout(() => {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      document.body.style.overflow = '';
    }, 300);

    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
    }

    if (typeof onClose === 'function') onClose();
    this.activeModal = null;
    bus.emit(EVENTS.MODAL_CLOSE);
  }

  confirm(options = {}) {
    const {
      title = 'Confirm',
      message = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'primary'
    } = options;

    return new Promise((resolve) => {
      this.open({
        title,
        content: message,
        center: true,
        size: 'small',
        onClose: () => resolve(false),
        buttons: [
          { label: cancelText, variant: 'ghost', onClick: () => resolve(false) },
          { label: confirmText, variant: confirmVariant, onClick: () => resolve(true) }
        ]
      });
    });
  }

  alert(options = {}) {
    const { title = 'Alert', message = '', buttonText = 'OK' } = options;
    return new Promise((resolve) => {
      this.open({
        title,
        content: message,
        center: true,
        size: 'small',
        onClose: () => resolve(true),
        buttons: [
          { label: buttonText, variant: 'primary', onClick: () => resolve(true) }
        ]
      });
    });
  }

  prompt(options = {}) {
    const {
      title = 'Input',
      placeholder = '',
      defaultValue = '',
      confirmText = 'OK',
      cancelText = 'Cancel',
      inputType = 'text',
      message = ''
    } = options;

    return new Promise((resolve) => {
      const inputId = 'modal_prompt_input';
      const html = `
        ${message ? `<p style="color:#7A8BA8; font-size:13px; margin-bottom:12px;">${message}</p>` : ''}
        <input
          type="${inputType}"
          id="${inputId}"
          class="input-field"
          placeholder="${placeholder}"
          value="${defaultValue}"
          style="width:100%;"
        >
      `;

      this.open({
        title,
        html,
        center: true,
        size: 'small',
        onClose: () => resolve(null),
        buttons: [
          { label: cancelText, variant: 'ghost', onClick: () => resolve(null) },
          {
            label: confirmText,
            variant: 'primary',
            onClick: () => {
              const input = document.getElementById(inputId);
              resolve(input?.value || '');
            }
          }
        ]
      });

      setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) input.focus();
      }, 400);
    });
  }
}

const modal = new Modal();
export default modal;