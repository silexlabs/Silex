export default class UpgradeEngine {
  constructor(editor, options, versionManager, eventSystem) {
    this.editor = editor;
    this.options = options;
    this.versionManager = versionManager;
    this.eventSystem = eventSystem;
    this.isUpgrading = false;
    this.currentStep = null;
    this.allLogs = [];
    this.failedSteps = [];
  }

  async runUpgrades() {
    if (this.isUpgrading) {
      console.warn('[grapesjs-version-flow] Upgrade already in progress');
      return { success: false, logs: [], upgradedTo: this.options.builderVersion, error: 'Upgrade already in progress' };
    }

    const savedVersion = this.versionManager.getSavedVersion();
    const currentVersion = this.options.builderVersion;
    const pendingSteps = this.versionManager.getPendingUpgrades(savedVersion, currentVersion);

    if (pendingSteps.length === 0) {
      return { success: true, logs: [], upgradedTo: currentVersion };
    }

    this.isUpgrading = true;
    this.allLogs = [];
    this.failedSteps = [];
    let lastSuccessfulVersion = savedVersion;

    try {
      this.eventSystem.emit('version:upgrade:start', {
        pending: pendingSteps.map(step => step.builderVersion)
      });

      for (const step of pendingSteps) {
        this.currentStep = step;
        
        try {
          this.eventSystem.emit('version:versionUpgrade:start', {
            toVersion: step.builderVersion
          });

          let stepLogs;
          try {
            stepLogs = await this.runSingleUpgrade(step);
          } catch (upgradeError) {
            // Ensure any error from runSingleUpgrade is caught and handled
            console.error(`[grapesjs-version-flow] Upgrade error caught:`, upgradeError);
            throw upgradeError;
          }
          
          // Update version but don't save to storage yet
          this.versionManager.updateVersion(step.builderVersion);
          lastSuccessfulVersion = step.builderVersion;

          this.eventSystem.emit('version:versionUpgrade:end', {
            toVersion: step.builderVersion,
            log: stepLogs || []
          });

        } catch (error) {
          // Get log message from error or use default
          const logMessage = error.message || 'Unknown error occurred';
          
          const errorLog = {
            level: 'error',
            message: `Failed to upgrade to ${step.builderVersion}: ${logMessage}`
          };
          
          this.allLogs.push(errorLog);
          this.failedSteps.push(step.builderVersion);

          this.eventSystem.emit('version:upgrade:error', {
            toVersion: step.builderVersion,
            error: {
              message: logMessage,
              step: step.builderVersion
            }
          });

          // Emit the error log so UI can display it
          this.eventSystem.emit('version:versionUpgrade:end', {
            toVersion: step.builderVersion,
            log: [errorLog]
          });

          if (!this.options.continueOnError) {
            break;
          }
        }
      }

      const hasFailures = this.failedSteps.length > 0;
      
      // Always emit completion since we continue on error
      this.eventSystem.emit('version:upgrade:end', {
        upgradedTo: lastSuccessfulVersion,
        hasFailures: hasFailures
      });

      return {
        success: true, // Always true since we continue on error
        logs: this.allLogs,
        upgradedTo: lastSuccessfulVersion,
        failedSteps: this.failedSteps
      };

    } catch (catastrophicError) {
      // Handle any catastrophic errors that weren't caught by individual step handling
      console.error('[grapesjs-version-flow] Catastrophic error during upgrade process:', catastrophicError);
      
      const errorLog = {
        level: 'error',
        message: `Catastrophic upgrade error: ${catastrophicError.message || 'Unknown error'}`
      };
      
      this.allLogs.push(errorLog);
      
      return {
        success: false,
        logs: this.allLogs,
        upgradedTo: lastSuccessfulVersion,
        failedSteps: this.failedSteps,
        error: catastrophicError.message || 'Catastrophic upgrade error'
      };
    } finally {
      this.isUpgrading = false;
      this.currentStep = null;
    }
  }

  async runSingleUpgrade(step) {
    const context = this.createUpgradeContext();
    
    // Run the upgrade function first and catch any errors
    let logMessage;
    try {
      logMessage = await step.upgrade(context);
    } catch (error) {
      // If upgrade function throws an error, handle it properly
      throw error;
    }
    
    // If upgrade was successful, use UndoManager.skip to prevent change tracking
    // This should not fail since upgrade already succeeded
    await this.editor.UndoManager.skip(async () => {
      // No actual work here, just marking this execution as non-trackable
      return Promise.resolve();
    });
    
    // Upgrade function should return a string log message
    const log = {
      level: 'info',
      message: logMessage || `Upgraded to ${step.builderVersion}`
    };
    
    this.allLogs.push(log);
    return [log];
  }

  async runWhatsNew() {
    const savedVersion = this.versionManager.getSavedVersion();
    const currentVersion = this.options.builderVersion;
    const whatsNewSteps = this.versionManager.getPendingWhatsNew(savedVersion, currentVersion);

    const context = this.createUpgradeContext();

    for (const step of whatsNewSteps) {
      try {
        if (typeof step.whatsNew === 'function') {
          await step.whatsNew(context);
        }
      } catch (error) {
        console.warn(`[grapesjs-version-flow] Error in whatsNew for ${step.builderVersion}:`, error);
      }
    }
  }

  createUpgradeContext() {
    return {
      editor: this.editor,
      getComponents: () => this.editor.getComponents(),
      getStyles: () => this.editor.getStyleManager().getAll(),
      getPages: () => this.editor.getPages ? this.editor.getPages().getAll() : [],
      getProjectData: () => this.editor.getProjectData(),
      setProjectData: (data) => this.editor.setProjectData(data),
      addLog: (level, message) => {
        const log = { level, message };
        this.allLogs.push(log);
        return log;
      }
    };
  }

  retryFromFailedStep() {
    if (!this.failedSteps.length) {
      return this.runUpgrades();
    }

    const lastFailedStep = this.failedSteps[this.failedSteps.length - 1];
    const savedVersion = this.versionManager.getSavedVersion();
    const currentVersion = this.options.builderVersion;
    const allSteps = this.versionManager.getPendingUpgrades(savedVersion, currentVersion);
    
    const failedStepIndex = allSteps.findIndex(step => step.builderVersion === lastFailedStep);
    if (failedStepIndex === -1) {
      return this.runUpgrades();
    }

    const remainingSteps = allSteps.slice(failedStepIndex);
    const originalSteps = this.options.versions;
    
    this.options.versions = remainingSteps;
    const result = this.runUpgrades();
    this.options.versions = originalSteps;
    
    return result;
  }

  getCurrentStep() {
    return this.currentStep;
  }

  isRunning() {
    return this.isUpgrading;
  }

  getAllLogs() {
    return [...this.allLogs];
  }

  getFailedSteps() {
    return [...this.failedSteps];
  }
}