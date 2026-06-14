import VersionManager from '../src/version-manager.js';

// Mock editor with essential StorageManager functionality
const createMockEditor = () => {
  const mockStorage = {};
  const events = {};
  
  return {
    StorageManager: {
      getConfig: (key) => {
        if (key === 'type') return 'local';
        if (key === 'id') return 'gjsProject';
        return null;
      }
    },
    store: jest.fn(() => Promise.resolve()),
    on: jest.fn((event, callback) => {
      if (!events[event]) events[event] = [];
      events[event].push(callback);
    }),
    emit: jest.fn((event, data) => {
      if (events[event]) {
        events[event].forEach(callback => callback(data));
      }
    }),
    _events: events,
    _mockStorage: mockStorage
  };
};

// Mock localStorage
const createMockLocalStorage = () => ({
  storage: {},
  getItem: function(key) {
    return this.storage[key] || null;
  },
  setItem: function(key, value) {
    this.storage[key] = value;
  },
  removeItem: function(key) {
    delete this.storage[key];
  },
  clear: function() {
    this.storage = {};
  }
});

let mockLocalStorage;

describe('Version Storage Integration', () => {
  let mockEditor;
  let versionManager;
  let options;

  beforeEach(() => {
    // Create fresh localStorage for each test
    mockLocalStorage = createMockLocalStorage();
    global.localStorage = mockLocalStorage;
    
    mockEditor = createMockEditor();
    options = {
      builderVersion: '2.0.0',
      versions: []
    };
    versionManager = new VersionManager(mockEditor, options);
    // Reset savedVersion to ensure clean state
    versionManager.savedVersion = null;
  });

  describe('Storage Event Hooks', () => {
    it('should register storage event listeners', () => {
      expect(mockEditor.on).toHaveBeenCalledWith('storage:load', expect.any(Function));
      expect(mockEditor.on).toHaveBeenCalledWith('storage:start:store', expect.any(Function));
    });

    it('should extract version from stored data on load', () => {
      // Simulate loaded data with version
      const loadedData = {
        'gjs-html': '<div>Test</div>',
        'gjs-css': '.test { color: red; }',
        builderVersion: '1.5.0'
      };

      // Trigger the storage:load event
      const loadCallback = mockEditor.on.mock.calls.find(call => call[0] === 'storage:load')[1];
      loadCallback(loadedData);

      expect(versionManager.getSavedVersion()).toBe('1.5.0');
    });

    it('should add version to data being stored', () => {
      const objectToStore = {
        'gjs-html': '<div>New content</div>',
        'gjs-css': '.new { color: blue; }'
      };

      // Trigger the storage:start:store event
      const storeCallback = mockEditor.on.mock.calls.find(call => call[0] === 'storage:start:store')[1];
      storeCallback(objectToStore);

      expect(objectToStore.builderVersion).toBe('2.0.0');
    });

    it('should handle missing stored data gracefully', () => {
      // Trigger load with null data
      const loadCallback = mockEditor.on.mock.calls.find(call => call[0] === 'storage:load')[1];
      loadCallback(null);

      expect(versionManager.getSavedVersion()).toBeNull();
    });

    it('should handle corrupted stored data gracefully', () => {
      // Trigger load with invalid data
      const loadCallback = mockEditor.on.mock.calls.find(call => call[0] === 'storage:load')[1];
      
      // Should not throw an error
      expect(() => loadCallback({})).not.toThrow();
      expect(versionManager.getSavedVersion()).toBeNull();
    });
  });

  describe('Version Persistence', () => {
    it('should update version and trigger store', () => {
      versionManager.saveVersion('2.1.0');

      expect(options.builderVersion).toBe('2.1.0');
      expect(mockEditor.store).toHaveBeenCalled();
    });

    it('should maintain version through store cycle', () => {
      const initialData = {
        'gjs-html': '<div>Content</div>',
        'gjs-css': '.style { margin: 0; }'
      };

      // Simulate storing data with version injection
      const storeCallback = mockEditor.on.mock.calls.find(call => call[0] === 'storage:start:store')[1];
      storeCallback(initialData);

      expect(initialData.builderVersion).toBe('2.0.0');
      expect(initialData['gjs-html']).toBe('<div>Content</div>');
      expect(initialData['gjs-css']).toBe('.style { margin: 0; }');
    });

    it('should preserve existing project data when adding version', () => {
      const existingProject = {
        'gjs-html': '<div class="container"><h1>Title</h1></div>',
        'gjs-css': '.container { width: 100%; } h1 { font-size: 2em; }',
        'gjs-components': JSON.stringify([
          { type: 'text', content: 'Hello' },
          { type: 'image', src: 'test.jpg' }
        ]),
        'gjs-styles': JSON.stringify([
          { selectors: ['.container'], style: { width: '100%' } }
        ]),
        'gjs-assets': JSON.stringify([{ src: 'image.png' }])
      };

      // Trigger version injection
      const storeCallback = mockEditor.on.mock.calls.find(call => call[0] === 'storage:start:store')[1];
      storeCallback(existingProject);

      // Verify version was added
      expect(existingProject.builderVersion).toBe('2.0.0');
      
      // Verify all existing data was preserved
      expect(existingProject['gjs-html']).toContain('<h1>Title</h1>');
      expect(existingProject['gjs-css']).toContain('.container');
      expect(JSON.parse(existingProject['gjs-components'])).toHaveLength(2);
      expect(JSON.parse(existingProject['gjs-styles'])).toHaveLength(1);
      expect(JSON.parse(existingProject['gjs-assets'])).toHaveLength(1);
    });
  });

  describe('Version Detection', () => {
    it('should detect when upgrade is needed', () => {
      // Set up a saved version that's older than current
      versionManager.savedVersion = '1.0.0';
      options.builderVersion = '2.0.0';
      options.versions = [
        { builderVersion: '1.5.0' },
        { builderVersion: '2.0.0' }
      ];

      const needsUpgrade = versionManager.needsUpgrade('1.0.0', '2.0.0');
      expect(needsUpgrade).toBe(true);
    });

    it('should not require upgrade for same version', () => {
      const needsUpgrade = versionManager.needsUpgrade('2.0.0', '2.0.0');
      expect(needsUpgrade).toBe(false);
    });

    it('should handle missing saved version for first-time users', () => {
      options.versions = [
        { builderVersion: '1.0.0', whatsNew: () => {} }
      ];

      const needsUpgrade = versionManager.needsUpgrade(null, '2.0.0');
      expect(needsUpgrade).toBe(true); // Should show what's new
    });
  });
});