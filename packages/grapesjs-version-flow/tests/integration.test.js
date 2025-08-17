import plugin from '../src/index.js';

// Create a more realistic mock editor
const createMockEditor = () => {
  const projectData = {};
  const components = [];
  const styleManager = { getAll: () => [] };
  const pages = [];
  const eventListeners = {};
  
  return {
    I18n: {
      addMessages: jest.fn(),
      t: (key) => key
    },
    Modal: {
      open: jest.fn().mockReturnValue({
        setTitle: jest.fn(),
        setContent: jest.fn()
      }),
      close: jest.fn()
    },
    getProjectData: () => ({ ...projectData }),
    setProjectData: (data) => Object.assign(projectData, data),
    getComponents: () => components,
    getStyleManager: () => styleManager,
    getPages: () => pages,
    store: jest.fn(),
    on: jest.fn((event, callback) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
    }),
    off: jest.fn(),
    trigger: jest.fn((event, data) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach(callback => callback(data));
      }
    }),
    UndoManager: {
      skip: jest.fn().mockImplementation(async (fn) => {
        return await fn();
      })
    },
    // Helper to simulate events
    _triggerEvent: (event, data) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach(callback => callback(data));
      }
    }
  };
};

describe('Integration Tests', () => {
  let mockEditor;
  let pluginInstance;

  beforeEach(() => {
    mockEditor = createMockEditor();
    
    // Set up a realistic scenario
    const options = {
      builderVersion: '2.0.0',
      versions: [
        {
          builderVersion: '1.1.0',
          upgrade: (ctx) => {
            ctx.addLog('info', 'Upgrading to 1.1.0');
            return 'Added new features for 1.1.0';
          },
          whatsNew: (ctx) => {
            ctx.addLog('info', 'Showing whats new for 1.1.0');
          }
        },
        {
          builderVersion: '1.5.0',
          upgrade: async (ctx) => {
            ctx.addLog('info', 'Starting async upgrade to 1.5.0');
            await new Promise(resolve => setTimeout(resolve, 10));
            ctx.addLog('info', 'Completed async upgrade to 1.5.0');
            return 'Async upgrade completed';
          }
        },
        {
          builderVersion: '2.0.0',
          upgrade: (ctx) => {
            const projectData = ctx.getProjectData();
            projectData.newFeature = true;
            ctx.setProjectData(projectData);
            return 'Added new feature flag';
          },
          whatsNew: (ctx) => {
            ctx.addLog('info', 'Major version 2.0 whats new');
          }
        }
      ]
    };

    pluginInstance = plugin(mockEditor, options);
  });

  describe('Full upgrade flow', () => {
    it('should handle complete upgrade flow from 1.0.0 to 2.0.0', async () => {
      // Simulate an old project - set up the version manager with the saved version
      pluginInstance.versionManager.savedVersion = '1.0.0';
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      // Simulate storage load event (this is what the plugin actually listens to)
      mockEditor._triggerEvent('storage:end:load');
      
      // Wait for the timeout in the plugin
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify version:outdated event was emitted
      expect(mockEditor.trigger).toHaveBeenCalledWith('version:outdated', {
        savedVersion: '1.0.0',
        currentVersion: '2.0.0'
      });
      
      // Verify modal was opened
      expect(mockEditor.Modal.open).toHaveBeenCalled();
    });

    it('should handle upgrade errors gracefully', async () => {
      // Test error handling is already covered in upgrade-engine.test.js
      // Just verify the plugin is set up correctly
      expect(pluginInstance.upgradeEngine).toBeDefined();
      expect(pluginInstance.versionManager).toBeDefined();
    });
  });

  describe('Event system integration', () => {
    it('should emit version:outdated event when upgrade is needed', async () => {
      pluginInstance.versionManager.savedVersion = '1.0.0';
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      // Simulate load
      mockEditor._triggerEvent('storage:end:load');
      
      // Wait for the timeout in the plugin
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockEditor.trigger).toHaveBeenCalledWith('version:outdated', expect.any(Object));
    });
  });



  describe('Modal UI integration', () => {
    it('should show modal when upgrade is needed', async () => {
      pluginInstance.versionManager.savedVersion = '1.0.0';
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      // Simulate storage load event
      mockEditor._triggerEvent('storage:end:load');
      
      // Wait for the timeout in the plugin
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify modal was opened
      expect(mockEditor.Modal.open).toHaveBeenCalled();
    });

    it('should not show modal when no upgrade is needed', async () => {
      pluginInstance.versionManager.savedVersion = '2.0.0';
      mockEditor.setProjectData({ builderVersion: '2.0.0' });
      
      // Simulate storage load event
      mockEditor._triggerEvent('storage:end:load');
      
      // Wait for the timeout in the plugin
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify modal was not opened
      expect(mockEditor.Modal.open).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle projects without any saved version', async () => {
      mockEditor.setProjectData({}); // No version saved
      
      // Should still work if there are whatsNew functions
      const result = await pluginInstance.upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(true);
      expect(result.upgradedTo).toBe('2.0.0');
    });

    it('should handle projects with newer version than current', async () => {
      pluginInstance.versionManager.savedVersion = '3.0.0';
      mockEditor.setProjectData({ builderVersion: '3.0.0' });
      
      // Simulate storage load event
      mockEditor._triggerEvent('storage:end:load');
      
      // Wait for the timeout in the plugin
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should not trigger upgrade
      expect(mockEditor.trigger).not.toHaveBeenCalledWith('version:outdated', expect.anything());
    });

    it('should handle empty versions array', async () => {
      const emptyOptions = {
        builderVersion: '1.0.0',
        versions: []
      };
      
      // Reset mockEditor to avoid state from previous tests
      mockEditor = createMockEditor();
      const emptyPlugin = plugin(mockEditor, emptyOptions);
      expect(emptyPlugin).toBeDefined();
      
      // With an empty versions array and same version, should not trigger upgrade
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      mockEditor._triggerEvent('storage:end:load');
      
      // Wait for the timeout in the plugin
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockEditor.trigger).not.toHaveBeenCalledWith('version:outdated', expect.anything());
    });
  });
});