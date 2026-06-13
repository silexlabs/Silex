import VersionManager from '../src/version-manager.js';

// Mock GrapesJS editor
const createMockEditor = (projectData = {}) => ({
  getProjectData: () => ({ ...projectData }),
  setProjectData: (data) => { Object.assign(projectData, data); },
  on: jest.fn(),
  store: jest.fn()
});

// Mock options
const createMockOptions = (overrides = {}) => ({
  builderVersion: '2.0.0',
  versions: [
    { builderVersion: '1.1.0', upgrade: () => {} },
    { builderVersion: '1.2.0', upgrade: () => {} },
    { builderVersion: '2.0.0', upgrade: () => {} }
  ],
  ...overrides
});

describe('VersionManager', () => {
  let versionManager;
  let mockEditor;
  let mockOptions;

  beforeEach(() => {
    mockEditor = createMockEditor();
    mockOptions = createMockOptions();
    versionManager = new VersionManager(mockEditor, mockOptions);
  });

  describe('compareVersions', () => {
    it('should return 0 for identical versions', () => {
      const result = versionManager.compareVersions('1.2.3', '1.2.3');
      expect(result).toBe(0);
    });

    it('should return -1 when first version is lower', () => {
      const result = versionManager.compareVersions('1.2.3', '1.2.4');
      expect(result).toBe(-1);
    });

    it('should return 1 when first version is higher', () => {
      const result = versionManager.compareVersions('1.3.0', '1.2.9');
      expect(result).toBe(1);
    });

    it('should handle different version lengths', () => {
      expect(versionManager.compareVersions('1.2', '1.2.0')).toBe(0);
      expect(versionManager.compareVersions('1.2', '1.2.1')).toBe(-1);
      expect(versionManager.compareVersions('1.3', '1.2.9')).toBe(1);
    });

    it('should use custom compare function when provided', () => {
      const customCompareFn = jest.fn().mockReturnValue(-1);
      mockOptions.compareFn = customCompareFn;
      versionManager = new VersionManager(mockEditor, mockOptions);

      const result = versionManager.compareVersions('1.0.0', '2.0.0');

      expect(customCompareFn).toHaveBeenCalledWith('1.0.0', '2.0.0');
      expect(result).toBe(-1);
    });
  });

  describe('needsUpgrade', () => {
    it('should return false when saved version matches current', () => {
      const result = versionManager.needsUpgrade('2.0.0', '2.0.0');
      expect(result).toBe(false);
    });

    it('should return true when saved version is older', () => {
      const result = versionManager.needsUpgrade('1.5.0', '2.0.0');
      expect(result).toBe(true);
    });

    it('should return false when saved version is newer', () => {
      const result = versionManager.needsUpgrade('2.1.0', '2.0.0');
      expect(result).toBe(false);
    });

    it('should check for whatsNew steps when no saved version', () => {
      mockOptions.versions = [
        { builderVersion: '1.0.0', upgrade: () => {}, whatsNew: () => {} }
      ];
      versionManager = new VersionManager(mockEditor, mockOptions);

      const result = versionManager.needsUpgrade(null, '1.0.0');
      expect(result).toBe(true);
    });

    it('should return false when no saved version and no whatsNew steps', () => {
      // Override with empty versions array to ensure no pending upgrades
      mockOptions.versions = [];
      versionManager = new VersionManager(mockEditor, mockOptions);

      const result = versionManager.needsUpgrade(null, '2.0.0');
      expect(result).toBe(false);
    });
  });

  describe('getPendingUpgrades', () => {
    it('should return all versions when no saved version', () => {
      const result = versionManager.getPendingUpgrades(null, '2.0.0');
      expect(result).toHaveLength(3);
      expect(result.map(v => v.builderVersion)).toEqual(['1.1.0', '1.2.0', '2.0.0']);
    });

    it('should return versions between saved and current', () => {
      const result = versionManager.getPendingUpgrades('1.1.0', '2.0.0');
      expect(result).toHaveLength(2);
      expect(result.map(v => v.builderVersion)).toEqual(['1.2.0', '2.0.0']);
    });

    it('should return empty array when no upgrades needed', () => {
      const result = versionManager.getPendingUpgrades('2.0.0', '2.0.0');
      expect(result).toHaveLength(0);
    });

    it('should exclude versions higher than current', () => {
      mockOptions.versions.push({ builderVersion: '2.1.0', upgrade: () => {} });
      versionManager = new VersionManager(mockEditor, mockOptions);

      const result = versionManager.getPendingUpgrades('1.0.0', '2.0.0');
      expect(result.map(v => v.builderVersion)).toEqual(['1.1.0', '1.2.0', '2.0.0']);
    });
  });

  describe('getPendingWhatsNew', () => {
    beforeEach(() => {
      mockOptions.versions = [
        { builderVersion: '1.1.0', upgrade: () => {}, whatsNew: () => {} },
        { builderVersion: '1.2.0', upgrade: () => {} },
        { builderVersion: '2.0.0', upgrade: () => {}, whatsNew: () => {} }
      ];
      versionManager = new VersionManager(mockEditor, mockOptions);
    });

    it('should return only versions with whatsNew function', () => {
      const result = versionManager.getPendingWhatsNew('1.0.0', '2.0.0');
      expect(result).toHaveLength(2);
      expect(result.map(v => v.builderVersion)).toEqual(['1.1.0', '2.0.0']);
    });

    it('should respect version boundaries', () => {
      const result = versionManager.getPendingWhatsNew('1.1.0', '1.2.0');
      expect(result).toHaveLength(0);
    });
  });

  describe('parseVersion', () => {
    it('should parse semantic versions correctly', () => {
      const result = versionManager.parseVersion('1.2.3');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle non-numeric parts as 0', () => {
      const result = versionManager.parseVersion('1.2.beta');
      expect(result).toEqual([1, 2, 0]);
    });

    it('should handle single number versions', () => {
      const result = versionManager.parseVersion('5');
      expect(result).toEqual([5]);
    });
  });
});
