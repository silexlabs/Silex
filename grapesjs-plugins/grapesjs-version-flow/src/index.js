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
    styles: {
      classPrefix: 'gjs-version-flow',
      injectCSS: null
    },
    texts: {},
    getWhatsNew: null,
    onLeave: null,
    reportUrl: '',
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

  // Initialize components
  const versionManager = new VersionManager(editor, options);
  const eventSystem = new EventSystem(editor);
  const styleManager = new StyleManager(editor, options.styles);
  const upgradeEngine = new UpgradeEngine(editor, options, versionManager, eventSystem);
  const modalUI = new ModalUI(editor, options, upgradeEngine, eventSystem);

  // Initialize styles
  styleManager.init();

  // storage:end:load is also emitted when the load failed, project:loaded only when a project was loaded
  editor.on('project:loaded', () => {
    // A step calling setProjectData loads the project again
    if (upgradeEngine.isRunning()) return;
    const savedVersion = versionManager.getSavedVersion();
    const currentVersion = options.builderVersion;
    const isOlder = !savedVersion || versionManager.compareVersions(savedVersion, currentVersion) < 0;
    const whatsNew = isOlder && options.getWhatsNew ? options.getWhatsNew({ savedVersion, currentVersion }) : '';
    if (versionManager.needsUpgrade(savedVersion, currentVersion) || whatsNew) {
      eventSystem.emit('version:outdated', {
        savedVersion,
        currentVersion
      });
      modalUI.start({ currentVersion, whatsNew });
    }
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
