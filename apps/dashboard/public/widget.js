/**
 * AgentID Verification Widget
 * Embeddable widget for displaying agent verification status
 *
 * Usage:
 *   <div data-agentid-widget data-credential-id="uuid" data-theme="dark"></div>
 *   <script src="https://agentid.dev/widget.js"></script>
 *
 * Or programmatically:
 *   AgentID.widget({
 *     container: '#verification-badge',
 *     credentialId: 'uuid',
 *     theme: 'light',
 *     onVerified: (result) => console.log(result)
 *   });
 */

(function() {
  'use strict';

  const API_BASE = 'https://agentid-woad.vercel.app';
  const WIDGET_VERSION = '1.0.0';

  // Styles
  const styles = `
    .agentid-widget {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid;
    }

    .agentid-widget:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Light theme */
    .agentid-widget--light {
      background: #ffffff;
      border-color: #e5e7eb;
      color: #374151;
    }

    .agentid-widget--light:hover {
      border-color: #d1d5db;
    }

    .agentid-widget--light .agentid-widget__status--valid {
      color: #059669;
    }

    .agentid-widget--light .agentid-widget__status--invalid {
      color: #dc2626;
    }

    .agentid-widget--light .agentid-widget__score {
      background: #f3f4f6;
      color: #374151;
    }

    /* Dark theme */
    .agentid-widget--dark {
      background: #1f2937;
      border-color: #374151;
      color: #f9fafb;
    }

    .agentid-widget--dark:hover {
      border-color: #4b5563;
    }

    .agentid-widget--dark .agentid-widget__status--valid {
      color: #34d399;
    }

    .agentid-widget--dark .agentid-widget__status--invalid {
      color: #f87171;
    }

    .agentid-widget--dark .agentid-widget__score {
      background: #374151;
      color: #f9fafb;
    }

    /* Widget elements */
    .agentid-widget__icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .agentid-widget__content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .agentid-widget__status {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .agentid-widget__name {
      font-size: 11px;
      opacity: 0.7;
    }

    .agentid-widget__score {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .agentid-widget__loading {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .agentid-widget__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: agentid-spin 0.8s linear infinite;
    }

    @keyframes agentid-spin {
      to { transform: rotate(360deg); }
    }

    /* Compact variant */
    .agentid-widget--compact {
      padding: 6px 10px;
      font-size: 12px;
    }

    .agentid-widget--compact .agentid-widget__icon {
      width: 16px;
      height: 16px;
    }

    .agentid-widget--compact .agentid-widget__name {
      display: none;
    }

    /* Modal styles */
    .agentid-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
    }

    .agentid-modal-overlay--visible {
      opacity: 1;
      visibility: visible;
    }

    .agentid-modal {
      background: #ffffff;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.2s ease;
    }

    .agentid-modal-overlay--visible .agentid-modal {
      transform: scale(1);
    }

    .agentid-modal--dark {
      background: #1f2937;
      color: #f9fafb;
    }

    .agentid-modal__header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .agentid-modal--dark .agentid-modal__header {
      border-color: #374151;
    }

    .agentid-modal__title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .agentid-modal__close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: inherit;
      opacity: 0.5;
    }

    .agentid-modal__close:hover {
      opacity: 1;
    }

    .agentid-modal__body {
      padding: 20px;
    }

    .agentid-modal__field {
      margin-bottom: 16px;
    }

    .agentid-modal__label {
      font-size: 12px;
      font-weight: 500;
      opacity: 0.6;
      margin-bottom: 4px;
    }

    .agentid-modal__value {
      font-size: 14px;
    }

    .agentid-modal__footer {
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .agentid-modal--dark .agentid-modal__footer {
      border-color: #374151;
    }

    .agentid-modal__link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 13px;
    }

    .agentid-modal__link:hover {
      text-decoration: underline;
    }
  `;

  // Icons (inline SVGs)
  const icons = {
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  // Inject styles
  function injectStyles() {
    if (document.getElementById('agentid-widget-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'agentid-widget-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  // Verify credential
  async function verifyCredential(credentialId) {
    try {
      const response = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: credentialId }),
      });

      return await response.json();
    } catch (error) {
      return { valid: false, error: 'Network error' };
    }
  }

  // Create widget element
  function createWidget(container, options) {
    const {
      credentialId,
      theme = 'light',
      compact = false,
      showScore = true,
      onVerified,
      onError,
    } = options;

    // Create widget container
    const widget = document.createElement('div');
    widget.className = `agentid-widget agentid-widget--${theme}${compact ? ' agentid-widget--compact' : ''}`;
    widget.innerHTML = `
      <div class="agentid-widget__loading">
        <div class="agentid-widget__spinner"></div>
        <span>Verifying...</span>
      </div>
    `;

    container.appendChild(widget);

    // Verify and update
    verifyCredential(credentialId).then(result => {
      if (result.valid && result.credential) {
        const cred = result.credential;
        widget.innerHTML = `
          <span class="agentid-widget__icon">${icons.check}</span>
          <div class="agentid-widget__content">
            <span class="agentid-widget__status agentid-widget__status--valid">
              Verified Agent
            </span>
            <span class="agentid-widget__name">${escapeHtml(cred.agent_name)}</span>
          </div>
          ${showScore && result.trust_score !== undefined ? `
            <span class="agentid-widget__score">${result.trust_score}</span>
          ` : ''}
        `;

        // Add click handler to show modal
        widget.addEventListener('click', () => showModal(result, theme));

        if (onVerified) onVerified(result);
      } else {
        widget.innerHTML = `
          <span class="agentid-widget__icon">${icons.x}</span>
          <div class="agentid-widget__content">
            <span class="agentid-widget__status agentid-widget__status--invalid">
              Not Verified
            </span>
            <span class="agentid-widget__name">${escapeHtml(result.error || 'Invalid credential')}</span>
          </div>
        `;

        if (onError) onError(result);
      }
    }).catch(error => {
      widget.innerHTML = `
        <span class="agentid-widget__icon">${icons.x}</span>
        <div class="agentid-widget__content">
          <span class="agentid-widget__status agentid-widget__status--invalid">
            Error
          </span>
          <span class="agentid-widget__name">Failed to verify</span>
        </div>
      `;

      if (onError) onError({ valid: false, error: error.message });
    });

    return widget;
  }

  // Show modal with credential details
  function showModal(result, theme) {
    const cred = result.credential;
    if (!cred) return;

    // Remove existing modal
    const existing = document.querySelector('.agentid-modal-overlay');
    if (existing) existing.remove();

    // Create modal
    const overlay = document.createElement('div');
    overlay.className = 'agentid-modal-overlay';
    overlay.innerHTML = `
      <div class="agentid-modal agentid-modal--${theme}">
        <div class="agentid-modal__header">
          <h2 class="agentid-modal__title">Agent Credential</h2>
          <button class="agentid-modal__close">${icons.close}</button>
        </div>
        <div class="agentid-modal__body">
          <div class="agentid-modal__field">
            <div class="agentid-modal__label">Agent Name</div>
            <div class="agentid-modal__value">${escapeHtml(cred.agent_name)}</div>
          </div>
          <div class="agentid-modal__field">
            <div class="agentid-modal__label">Agent ID</div>
            <div class="agentid-modal__value" style="font-family: monospace;">${escapeHtml(cred.agent_id)}</div>
          </div>
          <div class="agentid-modal__field">
            <div class="agentid-modal__label">Issuer</div>
            <div class="agentid-modal__value">
              ${escapeHtml(cred.issuer?.name || 'Unknown')}
              ${cred.issuer?.issuer_verified ? ' ✓' : ''}
            </div>
          </div>
          <div class="agentid-modal__field">
            <div class="agentid-modal__label">Trust Score</div>
            <div class="agentid-modal__value">${result.trust_score ?? 'N/A'}</div>
          </div>
          <div class="agentid-modal__field">
            <div class="agentid-modal__label">Valid Until</div>
            <div class="agentid-modal__value">${formatDate(cred.valid_until)}</div>
          </div>
          <div class="agentid-modal__field">
            <div class="agentid-modal__label">Agent Type</div>
            <div class="agentid-modal__value">${escapeHtml(cred.agent_type)}</div>
          </div>
        </div>
        <div class="agentid-modal__footer">
          <a href="${API_BASE}/agents/${cred.credential_id || ''}" target="_blank" rel="noopener" class="agentid-modal__link">
            View on AgentID →
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Show with animation
    requestAnimationFrame(() => {
      overlay.classList.add('agentid-modal-overlay--visible');
    });

    // Close handlers
    const close = () => {
      overlay.classList.remove('agentid-modal-overlay--visible');
      setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('.agentid-modal__close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  // Helper functions
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Initialize widgets from data attributes
  function initDataAttributeWidgets() {
    document.querySelectorAll('[data-agentid-widget]').forEach(el => {
      if (el.dataset.agentidInitialized) return;
      el.dataset.agentidInitialized = 'true';

      const credentialId = el.dataset.credentialId;
      if (!credentialId) {
        console.warn('AgentID widget: missing data-credential-id');
        return;
      }

      createWidget(el, {
        credentialId,
        theme: el.dataset.theme || 'light',
        compact: el.dataset.compact !== undefined,
        showScore: el.dataset.hideScore === undefined,
      });
    });
  }

  // Public API
  window.AgentID = {
    version: WIDGET_VERSION,

    widget: function(options) {
      injectStyles();

      let container = options.container;
      if (typeof container === 'string') {
        container = document.querySelector(container);
      }

      if (!container) {
        console.error('AgentID widget: container not found');
        return null;
      }

      return createWidget(container, options);
    },

    verify: verifyCredential,

    init: function() {
      injectStyles();
      initDataAttributeWidgets();
    },
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      initDataAttributeWidgets();
    });
  } else {
    injectStyles();
    initDataAttributeWidgets();
  }
})();
