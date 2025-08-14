export default class StyleManager {
  constructor(editor, styles) {
    this.editor = editor;
    this.styles = styles;
    this.classPrefix = styles.classPrefix || 'gjs-version-flow';
    this.injected = false;
  }

  init() {
    if (this.styles.injectCSS && !this.injected) {
      this.injectCSS(this.styles.injectCSS);
      this.injected = true;
    }
  }

  injectCSS(css) {
    const scopedCSS = this.scopeCSS(css);
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = scopedCSS;
    styleElement.setAttribute('data-gjs-version-flow', 'true');
    document.head.appendChild(styleElement);
  }

  scopeCSS(css) {
    return css.replace(/\.([\w-]+)/g, `.${this.classPrefix}-$1`);
  }

  getDefaultCSS() {
    return `
      .${this.classPrefix}-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .${this.classPrefix}-modal-content {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: auto;
      }

      .${this.classPrefix}-modal-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e5e5e5;
      }

      .${this.classPrefix}-modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .${this.classPrefix}-modal-body {
        padding: 20px 24px;
      }

      .${this.classPrefix}-modal-footer {
        padding: 16px 24px 20px;
        border-top: 1px solid #e5e5e5;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .${this.classPrefix}-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
        color: #333;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .${this.classPrefix}-btn:hover {
        background: #f5f5f5;
      }

      .${this.classPrefix}-btn-primary {
        background: #007cba;
        border-color: #007cba;
        color: #fff;
      }

      .${this.classPrefix}-btn-primary:hover {
        background: #005a87;
        border-color: #005a87;
      }

      .${this.classPrefix}-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .${this.classPrefix}-version-info {
        margin: 12px 0;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;
        font-family: monospace;
        font-size: 14px;
      }

      .${this.classPrefix}-progress {
        margin: 16px 0;
      }

      .${this.classPrefix}-progress-text {
        margin-bottom: 8px;
        font-weight: 500;
        color: #555;
      }

      .${this.classPrefix}-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #007cba;
        border-radius: 50%;
        animation: ${this.classPrefix}-spin 1s linear infinite;
        margin-right: 8px;
      }

      @keyframes ${this.classPrefix}-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .${this.classPrefix}-logs {
        margin: 16px 0;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f8f9fa;
      }

      .${this.classPrefix}-log-entry {
        padding: 6px 12px;
        border-bottom: 1px solid #eee;
        font-family: monospace;
        font-size: 12px;
        display: flex;
        align-items: center;
      }

      .${this.classPrefix}-log-entry:last-child {
        border-bottom: none;
      }

      .${this.classPrefix}-log-level {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        margin-right: 8px;
        text-transform: uppercase;
      }

      .${this.classPrefix}-log-level-info {
        background: #d1ecf1;
        color: #0c5460;
      }

      .${this.classPrefix}-log-level-warn {
        background: #fff3cd;
        color: #856404;
      }

      .${this.classPrefix}-log-level-error {
        background: #f8d7da;
        color: #721c24;
      }

      .${this.classPrefix}-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0;
      }

      .${this.classPrefix}-checkbox input {
        margin: 0;
      }

      .${this.classPrefix}-collapsible {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin: 12px 0;
      }

      .${this.classPrefix}-collapsible-header {
        padding: 12px;
        background: #f8f9fa;
        cursor: pointer;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .${this.classPrefix}-collapsible-content {
        padding: 12px;
        border-top: 1px solid #ddd;
        display: none;
      }

      .${this.classPrefix}-collapsible.open .${this.classPrefix}-collapsible-content {
        display: block;
      }

      .${this.classPrefix}-collapsible-arrow {
        transition: transform 0.2s;
      }

      .${this.classPrefix}-collapsible.open .${this.classPrefix}-collapsible-arrow {
        transform: rotate(90deg);
      }
    `;
  }

  getClassName(className) {
    return `${this.classPrefix}-${className}`;
  }
}