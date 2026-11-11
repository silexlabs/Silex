export const defaultTexts = {
  title: 'Version {version}',
  whatsNewTitle: 'What\'s new in version {version}',
  updateMessage: 'This project was made with an older version. It needs to be updated:',
  update: 'Update and save my website',
  leave: 'Leave without updating',
  ok: 'OK',
  errorTitle: 'Update failed',
  errorMessage: 'This project could not be updated. Nothing is saved yet. If you edit it, your changes are saved as usual and the update is tried again next time. Please report the problem.',
  errorDetails: 'Technical details',
  report: 'Report the problem',
  continueAnyway: 'Continue anyway',
  reportTitle: 'Update failed in version {version}',
};

const MAX_REPORT_LENGTH = 6000;

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export default class ModalUI {
  constructor(editor, options, upgradeEngine, eventSystem) {
    this.editor = editor;
    this.options = options;
    this.upgradeEngine = upgradeEngine;
    this.eventSystem = eventSystem;
    this.isOpen = false;
    this.texts = null;
  }

  text(key, params = {}) {
    if (!this.texts) {
      const texts = typeof this.options.texts === 'function' ? this.options.texts(this.editor) : this.options.texts;
      this.texts = { ...defaultTexts, ...texts };
    }
    return this.texts[key].replace(/{(\w+)}/g, (match, name) => params[name] ?? '');
  }

  async start({ currentVersion, whatsNew }) {
    if (this.isOpen) return;
    const storage = this.editor.StorageManager;
    const stepsBeforeSave = storage.getStepsBeforeSave();
    // Nothing is written before the user chooses, the app may turn autosave on and off meanwhile
    storage.setStepsBeforeSave(Infinity);
    const restoreAutosave = () => storage.setStepsBeforeSave(stepsBeforeSave);

    let result;
    try {
      result = await this.upgradeEngine.runUpgrades();
    } catch (error) {
      result = { success: false, logs: [{ level: 'error', message: error.message }] };
    }

    if (!result.success) {
      this.open(this.renderError(currentVersion, result.logs), {
        report: () => this.report(currentVersion, result.logs),
        continue: () => this.close(restoreAutosave),
      }, 'continue', this.text('errorTitle'));
      return;
    }

    const changes = result.logs.map(log => log.message);
    if (changes.length) {
      this.open(this.renderUpdate(currentVersion, whatsNew, changes), {
        update: () => this.close(() => {
          restoreAutosave();
          this.editor.store();
        }),
        leave: () => this.close(() => this.leave(restoreAutosave)),
      }, 'leave');
    } else if (whatsNew) {
      this.open(this.renderWhatsNew(currentVersion, whatsNew), {
        ok: () => this.close(restoreAutosave),
      }, 'ok');
    } else {
      restoreAutosave();
    }
  }

  open(html, actions, onDismiss, title = this.text('title', { version: this.options.builderVersion })) {
    const content = document.createElement('div');
    content.innerHTML = html;
    content.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => actions[button.getAttribute('data-action')]());
    });

    const modalConfig = this.editor.Modal.getConfig();
    const backdrop = modalConfig.backdrop;
    modalConfig.backdrop = false;

    this.isOpen = true;
    this.editor.Modal.open({
      title,
      content,
      attributes: { class: this.getClassName('modal') },
    });
    this.injectDefaultStyles();

    // The cross and Escape close the modal without a button
    this.editor.Modal.onceClose(() => {
      modalConfig.backdrop = backdrop;
      if (!this.isOpen) return;
      this.isOpen = false;
      // Another modal replaced ours, the user has not chosen yet
      if (this.editor.Modal.getContent() !== content) {
        this.reopenWhenFree(html, actions, onDismiss, title);
        return;
      }
      actions[onDismiss]();
    });
  }

  reopenWhenFree(html, actions, onDismiss, title) {
    setTimeout(() => {
      if (this.editor.Modal.isOpen()) this.editor.Modal.onceClose(() => this.reopenWhenFree(html, actions, onDismiss, title));
      else this.open(html, actions, onDismiss, title);
    });
  }

  close(then) {
    this.isOpen = false;
    this.editor.Modal.close();
    then();
  }

  leave(restoreAutosave) {
    // GrapesJS asks before unloading a page with unsaved changes
    this.editor.clearDirtyCount();
    if (this.options.onLeave) this.options.onLeave();
    else restoreAutosave();
  }

  report(currentVersion, logs) {
    const details = this.renderDetailsText(currentVersion, logs).slice(0, MAX_REPORT_LENGTH);
    const url = new URL(this.options.reportUrl);
    url.searchParams.set('title', this.text('reportTitle', { version: currentVersion }));
    url.searchParams.set('body', '```\n' + details + '\n```\n');
    window.open(url.toString(), '_blank', 'noopener');
  }

  renderDetailsText(currentVersion, logs) {
    return [this.text('title', { version: currentVersion }), ...logs.map(log => `${log.level}: ${log.message}`)].join('\n');
  }

  renderWhatsNewSection(currentVersion, whatsNew) {
    return `
      <section class="${this.getClassName('whats-new')}">
        <h3>${this.text('whatsNewTitle', { version: currentVersion })}</h3>
        ${whatsNew}
      </section>
    `;
  }

  renderUpdate(currentVersion, whatsNew, changes) {
    return `
      <div class="${this.getClassName('modal-body')}">
        ${whatsNew ? this.renderWhatsNewSection(currentVersion, whatsNew) : ''}
        <section>
          <p>${this.text('updateMessage')}</p>
          <ul>${changes.map(change => `<li>${escapeHtml(change)}</li>`).join('')}</ul>
        </section>
      </div>
      <div class="${this.getClassName('modal-footer')}">
        <button class="gjs-btn-secondary" data-action="leave">${this.text('leave')}</button>
        <button class="gjs-btn-prim" data-action="update">${this.text('update')}</button>
      </div>
    `;
  }

  renderWhatsNew(currentVersion, whatsNew) {
    return `
      <div class="${this.getClassName('modal-body')}">
        ${this.renderWhatsNewSection(currentVersion, whatsNew)}
      </div>
      <div class="${this.getClassName('modal-footer')}">
        <button class="gjs-btn-prim" data-action="ok">${this.text('ok')}</button>
      </div>
    `;
  }

  renderError(currentVersion, logs) {
    return `
      <div class="${this.getClassName('modal-body')}">
        <p>${this.text('errorMessage')}</p>
        <details>
          <summary>${this.text('errorDetails')}</summary>
          <pre class="${this.getClassName('details')}">${escapeHtml(this.renderDetailsText(currentVersion, logs))}</pre>
        </details>
      </div>
      <div class="${this.getClassName('modal-footer')}">
        <button class="gjs-btn-secondary" data-action="continue">${this.text('continueAnyway')}</button>
        ${this.options.reportUrl ? `<button class="gjs-btn-prim" data-action="report">${this.text('report')}</button>` : ''}
      </div>
    `;
  }

  injectDefaultStyles() {
    if (document.querySelector('[data-gjs-version-flow]')) return;
    const styleElement = document.createElement('style');
    styleElement.innerHTML = this.getDefaultCSS(this.options.styles?.classPrefix || 'gjs-version-flow');
    styleElement.setAttribute('data-gjs-version-flow', 'true');
    document.head.appendChild(styleElement);
  }

  getClassName(className) {
    const prefix = this.options.styles?.classPrefix || 'gjs-version-flow';
    return `${prefix}-${className}`;
  }

  getDefaultCSS(classPrefix) {
    return `
      .${classPrefix}-modal-body {
        padding: 20px 24px;
        color: var(--gjs-font-color);
        font-family: var(--gjs-main-font);
        font-size: var(--gjs-font-size);
      }

      .${classPrefix}-modal-body ul {
        margin: 8px 0;
        padding-left: 20px;
      }

      .${classPrefix}-whats-new {
        margin-bottom: 16px;
      }

      .${classPrefix}-details {
        margin: 8px 0 0;
        padding: 12px;
        max-height: 200px;
        overflow: auto;
        white-space: pre-wrap;
        background-color: var(--gjs-main-dark-color);
        border: 1px solid var(--gjs-light-border);
      }

      .${classPrefix}-modal-footer {
        padding: 16px 24px 20px;
        border-top: 1px solid var(--gjs-light-border);
        display: flex;
        gap: var(--gjs-flex-item-gap);
        justify-content: flex-end;
        background-color: var(--gjs-secondary-dark-color);
      }

      .gjs-btn-secondary {
        background: none;
        border: none;
        color: var(--gjs-secondary-color);
        text-decoration: underline;
        font-weight: normal;
        padding: var(--gjs-input-padding);
        cursor: pointer;
        border-radius: 2px;
        font-family: var(--gjs-main-font);
        font-size: var(--gjs-font-size);
      }

      .gjs-btn-secondary:hover {
        color: var(--gjs-color-blue);
      }

      .gjs-btn-secondary:focus {
        color: var(--gjs-color-blue);
        outline: 1px dotted var(--gjs-color-blue);
        outline-offset: 2px;
      }
    `;
  }
}
