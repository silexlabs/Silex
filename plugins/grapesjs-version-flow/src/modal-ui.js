export default class ModalUI {
  constructor(editor, options, upgradeEngine, eventSystem) {
    this.editor = editor;
    this.options = options;
    this.upgradeEngine = upgradeEngine;
    this.eventSystem = eventSystem;
    this.modal = null;
    this.currentState = 'hidden';
    this.saveNowChecked = false;

    this.states = {
      OUTDATED: 'outdated',
      UPGRADING: 'upgrading',
      COMPLETED: 'completed',
      ERROR: 'error',
      FIRST_RUN: 'first_run'
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventSystem.on('version:outdated', (data) => {
      this.showOutdatedState(data.savedVersion, data.currentVersion);
    });

    this.eventSystem.on('version:upgrade:start', () => {
      this.showUpgradingState();
    });

    this.eventSystem.on('version:versionUpgrade:start', (data) => {
      this.updateCurrentUpgradeStep(data.toVersion);
    });

    this.eventSystem.on('version:versionUpgrade:end', (data) => {
      this.addLogs(data.log);
    });

    this.eventSystem.on('version:upgrade:end', (data) => {
      this.showCompletedState(data.upgradedTo);
    });

    this.eventSystem.on('version:upgrade:error', (data) => {
      this.showErrorState(data.toVersion, data.error);
    });
  }

  show() {
    if (this.modal) {
      return;
    }

    this.modal = this.editor.Modal.open({
      title: this.editor.I18n.t('modal.title'),
      content: this.renderContent(),
      attributes: {
        class: this.getClassName('modal')
      }
    });

    this.injectDefaultStyles();
    this.attachEventListeners();
  }

  hide() {
    if (this.modal) {
      this.editor.Modal.close();
      this.modal = null;
      this.currentState = 'hidden';

      if (this.saveNowChecked) {
        this.editor.store();
      }
    }
  }

  showOutdatedState(savedVersion, currentVersion) {
    this.currentState = this.states.OUTDATED;
    // Skip the initial dialog and go straight to upgrading
    this.startUpgrade();
  }

  showUpgradingState() {
    this.currentState = this.states.UPGRADING;
    this.updateModal({
      title: this.editor.I18n.t('modal.upgrading.title'),
      content: this.renderUpgradingContent()
    });
  }

  showCompletedState(finalVersion) {
    this.currentState = this.states.COMPLETED;
    this.updateModal({
      title: this.editor.I18n.t('modal.completed.title'),
      content: this.renderCompletedContent(finalVersion)
    });
  }

  showErrorState(failedVersion, error) {
    this.currentState = this.states.ERROR;
    this.updateModal({
      title: this.editor.I18n.t('modal.error.title'),
      content: this.renderErrorContent(failedVersion, error)
    });
  }

  showFirstRunState() {
    this.currentState = this.states.FIRST_RUN;
    this.updateModal({
      title: this.editor.I18n.t('modal.firstRun.title'),
      content: this.renderFirstRunContent()
    });
  }

  updateModal({ title, content }) {
    if (!this.modal) {
      this.show();
    }

    this.modal.setTitle(title);
    this.modal.setContent(content);
  }

  renderContent() {
    return this.renderOutdatedContent('', '');
  }

  renderOutdatedContent(savedVersion, currentVersion) {
    return `
      <div class="${this.getClassName('modal-content')}">
        <div class="${this.getClassName('modal-body')}">
          <p>${this.editor.I18n.t('modal.outdated.message', { savedVersion, currentVersion })}</p>
          <div class="${this.getClassName('version-info')}">
            ${savedVersion || 'Unknown'} → ${currentVersion}
          </div>
          <p><em>Upgrading your website to the latest version of Silex...</em></p>
        </div>
      </div>
    `;
  }

  renderUpgradingContent() {
    const currentStep = this.upgradeEngine.getCurrentStep();
    const currentVersion = currentStep ? currentStep.builderVersion : '';

    return `
      <div class="${this.getClassName('modal-content')}">
        <div class="${this.getClassName('modal-body')}">
          <div class="${this.getClassName('progress')}">
            <div class="${this.getClassName('progress-text')}">
              <span class="${this.getClassName('spinner')}"></span>
              ${this.editor.I18n.t('modal.upgrading.current', { version: currentVersion })}
            </div>
          </div>
          <div class="${this.getClassName('logs')}" id="${this.getClassName('logs-container')}">
            ${this.renderLogs()}
          </div>
        </div>
      </div>
    `;
  }

  renderCompletedContent(finalVersion) {
    const hasWhatsNew = this.upgradeEngine.versionManager.hasWhatsNewSteps();

    return `
      <div class="${this.getClassName('modal-content')}">
        <div class="${this.getClassName('modal-body')}">
          <p>${this.editor.I18n.t('modal.completed.message', { params: { version: finalVersion }})}</p>
          <div class="${this.getClassName('logs')}" id="${this.getClassName('logs-container')}">
            ${this.renderLogs()}
          </div>
        </div>
        <div class="${this.getClassName('modal-footer')}">
          <button class="gjs-btn-secondary" data-action="close">
            ${this.editor.I18n.t('modal.completed.continueWithoutSaving')}
          </button>
          <button class="gjs-btn-secondary" data-action="save-and-close">
            ${this.editor.I18n.t('modal.completed.saveAndClose')}
          </button>
          ${hasWhatsNew ? `
            <button class="gjs-btn-prim" data-action="save-and-whats-new">
              ${this.editor.I18n.t('modal.completed.saveAndShowWhatsNew')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderErrorContent(failedVersion, error) {
    const hasWhatsNew = this.upgradeEngine.versionManager.hasWhatsNewSteps();

    return `
      <div class="${this.getClassName('modal-content')}">
        <div class="${this.getClassName('modal-body')}">
          <p>${this.editor.I18n.t('modal.error.message', { version: failedVersion })}</p>
          <div class="${this.getClassName('version-info')}">
            Error: ${error.message}
          </div>
          <div class="${this.getClassName('logs')}" id="${this.getClassName('logs-container')}">
            ${this.renderLogs()}
          </div>
        </div>
        <div class="${this.getClassName('modal-footer')}">
          <button class="gjs-btn-secondary" data-action="close">
            ${this.editor.I18n.t('modal.completed.continueWithoutSaving')}
          </button>
          <button class="gjs-btn-secondary" data-action="save-and-close">
            ${this.editor.I18n.t('modal.completed.saveAndClose')}
          </button>
          ${hasWhatsNew ? `
            <button class="gjs-btn-prim" data-action="save-and-whats-new">
              ${this.editor.I18n.t('modal.completed.saveAndShowWhatsNew')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderFirstRunContent() {
    const hasWhatsNew = this.upgradeEngine.versionManager.hasWhatsNewSteps();

    return `
      <div class="${this.getClassName('modal-content')}">
        <div class="${this.getClassName('modal-body')}">
          <p>${this.editor.I18n.t('modal.firstRun.message')}</p>
        </div>
        <div class="${this.getClassName('modal-footer')}">
          <button class="gjs-btn-secondary" data-action="close">
            ${this.editor.I18n.t('modal.skip')}
          </button>
          ${hasWhatsNew ? `
            <button class="gjs-btn-prim"
                    data-action="whats-new">
              ${this.editor.I18n.t('modal.firstRun.whatsNew')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderLogs() {
    const logs = this.upgradeEngine.getAllLogs();
    if (logs.length === 0) {
      return '<p style="padding: 12px; margin: 0; color: #666;">No logs yet...</p>';
    }

    return logs.map(log => `
      <div class="${this.getClassName('log-entry')}">
        <span class="${this.getClassName('log-level')} ${this.getClassName('log-level-' + log.level)}">
          ${this.editor.I18n.t('log.level.' + log.level)}
        </span>
        <span>${log.message}</span>
      </div>
    `).join('');
  }

  updateCurrentUpgradeStep(version) {
    const progressText = document.querySelector(`.${this.getClassName('progress-text')}`);
    if (progressText) {
      progressText.innerHTML = `
        <span class="${this.getClassName('spinner')}"></span>
        ${this.editor.I18n.t('modal.upgrading.current', { version })}
      `;
    }
  }

  addLogs(logs) {
    if (!logs || logs.length === 0) return;

    const logsContainer = document.getElementById(this.getClassName('logs-container'));
    if (logsContainer) {
      logsContainer.innerHTML = this.renderLogs();
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  injectDefaultStyles() {
    const existingStyle = document.querySelector('[data-gjs-version-flow]');

    if (!existingStyle) {
      const prefix = this.options.styles?.classPrefix || 'gjs-version-flow';
      const defaultCSS = this.getDefaultCSS(prefix);

      const styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.innerHTML = defaultCSS;
      styleElement.setAttribute('data-gjs-version-flow', 'true');
      document.head.appendChild(styleElement);
    }

  }

  async startUpgrade() {
    try {
      this.showUpgradingState();
      const result = await this.upgradeEngine.runUpgrades();

      // Check if result is valid
      if (!result) {
        console.error('[grapesjs-version-flow] runUpgrades returned undefined result');
        this.showErrorState('unknown', { message: 'Upgrade process failed to return result' });
        return;
      }

      // Always show completed state since we continue on error
      this.showCompletedState(result.upgradedTo);
    } catch (error) {
      // If there's a catastrophic error that stops the whole process
      console.error('[grapesjs-version-flow] Catastrophic upgrade error:', error);
      this.showErrorState('unknown', { message: error.message });
    }
  }


  async showWhatsNew() {
    try {
      // Save the site and close modal before running whatsNew
      this.editor.store();
      this.hide();

      // Wait a moment for modal to close, then run whatsNew
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.upgradeEngine.runWhatsNew();
    } catch (error) {
      console.error('[grapesjs-version-flow] Error running whatsNew:', error);
    }
  }

  toggleLogs() {
    const collapsible = document.getElementById(this.getClassName('logs-collapsible'));
    if (collapsible) {
      collapsible.classList.toggle('open');
    }
  }

  setSaveNow(checked) {
    this.saveNowChecked = checked;
  }

  attachEventListeners() {
    // Use document delegation since modal content is dynamic
    document.addEventListener('click', async (e) => {
      // Only handle clicks if our modal is open
      if (!this.modal) return;

      const action = e.target.getAttribute('data-action');
      if (!action) return;

      switch (action) {
        case 'close':
          this.hide();
          break;
        case 'upgrade':
          this.startUpgrade();
          break;
        case 'whats-new':
          this.showWhatsNew();
          break;
        case 'save-and-close':
          this.editor.store();
          this.hide();
          break;
        case 'save-and-whats-new':
          this.editor.store();
          await this.showWhatsNew();
          break;
      }
    });

    document.addEventListener('change', (e) => {
      // Only handle changes if our modal is open
      if (!this.modal) return;

      if (e.target.matches(`#${this.getClassName('save-now')}`)) {
        this.setSaveNow(e.target.checked);
      }
    });
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

      .${classPrefix}-modal-footer {
        padding: 16px 24px 20px;
        border-top: 1px solid var(--gjs-light-border);
        display: flex;
        gap: var(--gjs-flex-item-gap);
        justify-content: flex-end;
        background-color: var(--gjs-secondary-dark-color);
      }

      .${classPrefix}-version-info {
        margin: 12px 0;
        padding: 12px;
        border-radius: 2px;
        font-family: monospace;
        font-size: var(--gjs-font-size);
        background-color: var(--gjs-main-dark-color);
        color: var(--gjs-font-color);
        border: 1px solid var(--gjs-light-border);
      }

      .${classPrefix}-progress {
        margin: 16px 0;
      }

      .${classPrefix}-progress-text {
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--gjs-font-color);
      }

      .${classPrefix}-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--gjs-main-dark-color);
        border-top: 2px solid var(--gjs-color-blue);
        border-radius: 50%;
        animation: ${classPrefix}-spin 1s linear infinite;
        margin-right: 8px;
      }

      @keyframes ${classPrefix}-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .${classPrefix}-logs {
        margin: 16px 0;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--gjs-light-border);
        border-radius: 2px;
        background: var(--gjs-main-dark-color);
        color: var(--gjs-font-color);
      }

      .${classPrefix}-log-entry {
        padding: 6px 12px;
        border-bottom: 1px solid var(--gjs-light-border);
        font-family: monospace;
        font-size: var(--gjs-font-size);
        display: flex;
        align-items: center;
      }

      .${classPrefix}-log-entry:last-child {
        border-bottom: none;
      }

      .${classPrefix}-log-level {
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 10px;
        font-weight: bold;
        margin-right: 8px;
        text-transform: uppercase;
      }

      .${classPrefix}-log-level-info {
        background: var(--gjs-color-blue);
        color: white;
      }

      .${classPrefix}-log-level-warn {
        background: var(--gjs-color-yellow);
        color: var(--gjs-main-color);
      }

      .${classPrefix}-log-level-error {
        background: var(--gjs-color-red);
        color: white;
      }

      .${classPrefix}-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0;
      }

      .${classPrefix}-checkbox input {
        margin: 0;
      }

      .${classPrefix}-collapsible {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin: 12px 0;
      }

      .${classPrefix}-collapsible-header {
        padding: 12px;
        background: #f8f9fa;
        color: #000;
        cursor: pointer;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .${classPrefix}-collapsible-content {
        padding: 12px;
        border-top: 1px solid #ddd;
        display: none;
      }

      .${classPrefix}-collapsible.open .${classPrefix}-collapsible-content {
        display: block;
      }

      .${classPrefix}-collapsible-arrow {
        transition: transform 0.2s;
      }

      .${classPrefix}-collapsible.open .${classPrefix}-collapsible-arrow {
        transform: rotate(90deg);
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
