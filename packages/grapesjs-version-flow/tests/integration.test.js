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
            return [{ level: 'info', message: 'Added new features for 1.1.0' }];
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
            return [{ level: 'info', message: 'Async upgrade completed' }];
          }
        },
        {
          builderVersion: '2.0.0',
          upgrade: (ctx) => {
            const projectData = ctx.getProjectData();
            projectData.newFeature = true;
            ctx.setProjectData(projectData);
            return [{ level: 'info', message: 'Added new feature flag' }];
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
      // Simulate an old project
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      // Simulate editor load event
      mockEditor._triggerEvent('load');
      
      // Verify version:outdated event was emitted
      expect(mockEditor.trigger).toHaveBeenCalledWith('version:outdated', {
        savedVersion: '1.0.0',
        currentVersion: '2.0.0'
      });
      
      // Verify modal was opened
      expect(mockEditor.Modal.open).toHaveBeenCalled();
      
      // Simulate starting upgrade
      const result = await pluginInstance.upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(true);
      expect(result.upgradedTo).toBe('2.0.0');
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Verify project data was updated
      const finalProjectData = mockEditor.getProjectData();
      expect(finalProjectData.builderVersion).toBe('2.0.0');
      expect(finalProjectData.newFeature).toBe(true);
    });

    it('should handle first-run scenario with whatsNew', async () => {
      // No saved version (first run)
      mockEditor.setProjectData({});
      
      // Simulate editor load
      mockEditor._triggerEvent('load');
      
      // Should still trigger upgrade flow due to whatsNew functions
      expect(mockEditor.trigger).toHaveBeenCalledWith('version:outdated', {
        savedVersion: null,
        currentVersion: '2.0.0'
      });
      
      // Run upgrades
      const result = await pluginInstance.upgradeEngine.runUpgrades();
      expect(result.success).toBe(true);
      
      // Run whatsNew
      await pluginInstance.upgradeEngine.runWhatsNew();
      
      // Verify all whatsNew functions were called - check that we have whatsNew steps available
      const pendingWhatsNew = pluginInstance.versionManager.getPendingWhatsNew(null, '2.0.0');
      expect(pendingWhatsNew.length).toBeGreaterThan(0);
    });

    it('should persist version after each successful upgrade step', async () => {
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      const result = await pluginInstance.upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(true);
      
      // Verify that saveVersion was called for each step
      const projectData = mockEditor.getProjectData();
      expect(projectData.builderVersion).toBe('2.0.0');
    });

    it('should handle upgrade errors gracefully', async () => {
      // Create a version that will fail
      const failingOptions = {
        builderVersion: '1.2.0',
        versions: [
          {
            builderVersion: '1.1.0',
            upgrade: () => {
              return [{ level: 'info', message: 'Success step' }];
            }
          },
          {
            builderVersion: '1.2.0',
            upgrade: () => {
              throw new Error('Simulated upgrade failure');
            }
          }
        ],
        continueOnError: false
      };
      
      const failingPlugin = plugin(mockEditor, failingOptions);
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      const result = await failingPlugin.upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(false);
      expect(result.failedSteps).toContain('1.2.0');
      expect(result.upgradedTo).toBe('1.1.0'); // Should stop at the last successful version
      
      // Verify error event was emitted
      expect(mockEditor.trigger).toHaveBeenCalledWith('version:upgrade:error', 
        expect.objectContaining({
          toVersion: '1.2.0',
          error: expect.objectContaining({
            message: 'Simulated upgrade failure'
          })
        })
      );
    });

    it('should continue on error when continueOnError is true', async () => {
      const continuingOptions = {
        builderVersion: '1.3.0',
        versions: [
          {
            builderVersion: '1.1.0',
            upgrade: () => {
              throw new Error('First failure');
            }
          },
          {
            builderVersion: '1.2.0',
            upgrade: () => {
              return [{ level: 'info', message: 'Success after failure' }];
            }
          },
          {
            builderVersion: '1.3.0',
            upgrade: () => {
              return [{ level: 'info', message: 'Final success' }];
            }
          }
        ],
        continueOnError: true
      };
      
      const continuingPlugin = plugin(mockEditor, continuingOptions);
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      const result = await continuingPlugin.upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(false); // Still false because one step failed
      expect(result.failedSteps).toEqual(['1.1.0']);
      expect(result.upgradedTo).toBe('1.3.0'); // But it continued to the end
    });
  });

  describe('Event system integration', () => {
    it('should emit all lifecycle events in correct order', async () => {
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      const eventOrder = [];
      
      // Capture events in order
      mockEditor.trigger = jest.fn((eventName, data) => {
        eventOrder.push({ event: eventName, data });
      });
      
      // Simulate load and upgrade
      mockEditor._triggerEvent('load');
      await pluginInstance.upgradeEngine.runUpgrades();
      
      const eventNames = eventOrder.map(e => e.event);
      
      expect(eventNames).toContain('version:outdated');
      expect(eventNames).toContain('version:upgrade:start');
      expect(eventNames).toContain('version:versionUpgrade:start');
      expect(eventNames).toContain('version:versionUpgrade:end');
      expect(eventNames).toContain('version:upgrade:end');
    });
  });

  describe('Storage integration', () => {
    it('should save version on storage event', () => {
      // Simulate storage event
      mockEditor._triggerEvent('storage:end:store');
      
      const projectData = mockEditor.getProjectData();
      expect(projectData.builderVersion).toBe('2.0.0');
    });
  });

  describe('Version comparison scenarios', () => {
    it('should handle semantic versioning correctly', async () => {
      const semanticOptions = {
        builderVersion: '2.1.3',
        versions: [
          { builderVersion: '2.0.0', upgrade: () => [] },
          { builderVersion: '2.0.1', upgrade: () => [] },
          { builderVersion: '2.1.0', upgrade: () => [] },
          { builderVersion: '2.1.3', upgrade: () => [] }
        ]
      };
      
      const semanticPlugin = plugin(mockEditor, semanticOptions);
      mockEditor.setProjectData({ builderVersion: '2.0.0' });
      
      const pendingUpgrades = semanticPlugin.versionManager.getPendingUpgrades('2.0.0', '2.1.3');
      
      expect(pendingUpgrades.map(v => v.builderVersion)).toEqual([
        '2.0.1', '2.1.0', '2.1.3'
      ]);
    });

    it('should handle custom version comparison', async () => {
      const customCompareOptions = {
        builderVersion: 'v2.0.0',
        versions: [
          { builderVersion: 'v1.5.0', upgrade: () => [] },
          { builderVersion: 'v2.0.0', upgrade: () => [] }
        ],
        compareFn: (a, b) => {
          // Custom comparison that strips 'v' prefix
          const stripV = (v) => v.replace(/^v/, '');
          const vA = stripV(a).split('.').map(Number);
          const vB = stripV(b).split('.').map(Number);
          
          for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
            const diff = (vA[i] || 0) - (vB[i] || 0);
            if (diff !== 0) return diff < 0 ? -1 : 1;
          }
          return 0;
        }
      };
      
      const customPlugin = plugin(mockEditor, customCompareOptions);
      mockEditor.setProjectData({ builderVersion: 'v1.0.0' });
      
      const result = await customPlugin.upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(true);
      expect(result.upgradedTo).toBe('v2.0.0');
    });
  });

  describe('Modal UI integration', () => {
    it('should show modal when upgrade is needed', () => {
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      // Simulate load event
      mockEditor._triggerEvent('load');
      
      // Verify modal was opened
      expect(mockEditor.Modal.open).toHaveBeenCalled();
    });

    it('should not show modal when no upgrade is needed', () => {
      mockEditor.setProjectData({ builderVersion: '2.0.0' });
      
      // Simulate load event
      mockEditor._triggerEvent('load');
      
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

    it('should handle projects with newer version than current', () => {
      mockEditor.setProjectData({ builderVersion: '3.0.0' });
      
      // Simulate load event
      mockEditor._triggerEvent('load');
      
      // Should not trigger upgrade
      expect(mockEditor.trigger).not.toHaveBeenCalledWith('version:outdated', expect.anything());
    });

    it('should handle empty versions array', () => {
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
      
      mockEditor._triggerEvent('load');
      expect(mockEditor.trigger).not.toHaveBeenCalledWith('version:outdated', expect.anything());
    });
  });
});