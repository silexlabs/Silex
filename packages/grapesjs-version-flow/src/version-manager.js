export default class VersionManager {
  constructor(editor, options) {
    this.editor = editor;
    this.options = options;
    this.versionKey = 'builderVersion';
    this.savedVersion = null;
    this.setupStorageHooks();
  }

  setupStorageHooks() {
    // Hook into storage events to automatically manage version persistence
    // Only set up hooks if editor has event system (not in all test mocks)
    console.log('[grapesjs-version-flow] Setting up proper storage event hooks');

    // Use the correct GrapesJS storage events to modify data being stored
    this.editor.on('storage:start:store', (data) => {
      console.log('[grapesjs-version-flow] storage:start:store - data to store:', data);

      data[this.versionKey] = this.options.builderVersion;
      console.log('[grapesjs-version-flow] Added version to store data:', this.options.builderVersion, {data});
    });

    // Use the correct GrapesJS storage events to extract version from loaded data
    this.editor.on('storage:load', (data, res) => {
      console.log('[grapesjs-version-flow] storage:load - loaded data:', data);
      console.log('[grapesjs-version-flow] storage:load - response:', res);

      // Extract version from loaded data
      if (data && data[this.versionKey]) {
        this.savedVersion = data[this.versionKey];
        console.log('[grapesjs-version-flow] Found saved version in loaded data:', this.savedVersion);
      } else {
        console.log('[grapesjs-version-flow] No version found in loaded data');
      }
    });
  }

  getSavedVersion() {
    return this.savedVersion;
  }

  updateVersion(version) {
    // Update the current version in options but don't save to storage
    this.options.builderVersion = version;
  }

  saveVersion(version) {
    try {
      // Update the current version in options
      this.options.builderVersion = version;

      // If editor has storage functionality, trigger store
      if (typeof this.editor.store === 'function') {
        this.editor.store();
      } else if (this.editor.setProjectData && this.editor.getProjectData) {
        // Fallback for test environments - directly update project data
        const projectData = this.editor.getProjectData();
        projectData[this.versionKey] = version;
        this.editor.setProjectData(projectData);
      }
    } catch (error) {
      console.warn('[grapesjs-version-flow] Failed to save version:', error);
    }
  }

  needsUpgrade(savedVersion, currentVersion) {
    if (!savedVersion) {
      return this.getPendingUpgrades(savedVersion, currentVersion).length > 0 || this.hasWhatsNewSteps();
    }
    return this.compareVersions(savedVersion, currentVersion) < 0;
  }

  hasWhatsNewSteps() {
    return this.options.versions.some(step => typeof step.whatsNew === 'function');
  }

  compareVersions(version1, version2) {
    if (this.options.compareFn) {
      return this.options.compareFn(version1, version2);
    }
    return this.defaultCompareVersions(version1, version2);
  }

  defaultCompareVersions(version1, version2) {
    if (version1 === version2) return 0;

    const v1Parts = this.parseVersion(version1);
    const v2Parts = this.parseVersion(version2);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  parseVersion(version) {
    return version.toString().split('.').map(part => {
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });
  }

  getPendingUpgrades(savedVersion, currentVersion) {
    if (!savedVersion) {
      return this.options.versions.filter(step =>
        this.compareVersions(step.builderVersion, currentVersion) <= 0
      ).sort((a, b) => this.compareVersions(a.builderVersion, b.builderVersion));
    }

    return this.options.versions.filter(step => {
      const stepVersion = step.builderVersion;
      return this.compareVersions(savedVersion, stepVersion) < 0 &&
             this.compareVersions(stepVersion, currentVersion) <= 0;
    }).sort((a, b) => this.compareVersions(a.builderVersion, b.builderVersion));
  }

  getPendingWhatsNew(savedVersion, currentVersion) {
    const pendingUpgrades = this.getPendingUpgrades(savedVersion, currentVersion);
    return pendingUpgrades.filter(step => typeof step.whatsNew === 'function');
  }
}
