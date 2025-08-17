import en from './locale/en';
import fr from './locale/fr';
import VersionManager from './version-manager';
import UpgradeEngine from './upgrade-engine';
import ModalUI from './modal-ui';
import EventSystem from './event-system';
import StyleManager from './style-manager';

export default (editor, opts = {}) => {
  
  const options = {
    builderVersion: '',
    versions: [],
    compareFn: null,
    continueOnError: true,
    onFirstRun: null,
    styles: {
      classPrefix: 'gjs-version-flow',
      injectCSS: null
    },
    i18n: {},
    ...opts
  };
  

  // Validate required options
  if (!options.builderVersion) {
    console.error('[grapesjs-version-flow] builderVersion is required');
    return;
  }

  if (!Array.isArray(options.versions)) {
    console.error('[grapesjs-version-flow] versions must be an array');
    return;
  }

  // Validate version steps
  for (const version of options.versions) {
    if (!version.builderVersion || typeof version.upgrade !== 'function') {
      console.error('[grapesjs-version-flow] Each version step must have builderVersion and upgrade function');
      return;
    }
  }

  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
    en,
    fr,
    ...options.i18n,
  });

  // Initialize components
  const versionManager = new VersionManager(editor, options);
  const eventSystem = new EventSystem(editor);
  const styleManager = new StyleManager(editor, options.styles);
  const upgradeEngine = new UpgradeEngine(editor, options, versionManager, eventSystem);
  const modalUI = new ModalUI(editor, options, upgradeEngine, eventSystem);

  // Initialize styles
  styleManager.init();

  // Check for upgrades after storage is loaded
  editor.on('storage:end:load', () => {
    // Give a small delay to ensure version is extracted from storage
    setTimeout(() => {
      const savedVersion = versionManager.getSavedVersion();
      const currentVersion = options.builderVersion;
      
      if (!savedVersion) {
        // First run - no version saved, call onFirstRun callback if provided
        if (options.onFirstRun && typeof options.onFirstRun === 'function') {
          options.onFirstRun();
        }
      } else if (versionManager.needsUpgrade(savedVersion, currentVersion)) {
        // Version mismatch - trigger upgrade flow
        eventSystem.emit('version:outdated', {
          savedVersion,
          currentVersion
        });
        modalUI.show();
      }
    }, 100);
  });

  // Version persistence is now handled automatically by VersionManager storage hooks

  // Expose public API
  return {
    versionManager,
    upgradeEngine,
    modalUI,
    eventSystem
  };
};