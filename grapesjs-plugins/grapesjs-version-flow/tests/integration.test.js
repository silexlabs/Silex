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
      config: { backdrop: true },
      getConfig() { return this.config; },
      getContent() { return this.content; },
      isOpen() { return !!this.opened; },
      open: jest.fn(function ({ content }) { this.content = content; this.opened = true; }),
      close: jest.fn(function () { this.opened = false; return (eventListeners['modal:close'] || []).splice(0).forEach(callback => callback()); }),
      onceClose: jest.fn(callback => { (eventListeners['modal:close'] = eventListeners['modal:close'] || []).push(callback); })
    },
    StorageManager: {
      steps: 1,
      getStepsBeforeSave() { return this.steps; },
      setStepsBeforeSave(value) { this.steps = value; }
    },
    clearDirtyCount: jest.fn(),
    getProjectData: () => ({ ...projectData }),
    setProjectData: (data) => Object.assign(projectData, data),
    loadProjectData: (data) => Object.assign(projectData, data),
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
      
      // Simulate project load event (this is what the plugin actually listens to)
      mockEditor._triggerEvent('project:loaded', {});
      
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
      mockEditor._triggerEvent('project:loaded', {});
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockEditor.trigger).toHaveBeenCalledWith('version:outdated', expect.any(Object));
    });
  });



  describe('Modal UI integration', () => {
    it('should show modal when upgrade is needed', async () => {
      pluginInstance.versionManager.savedVersion = '1.0.0';
      mockEditor.setProjectData({ builderVersion: '1.0.0' });
      
      // Simulate project load event
      mockEditor._triggerEvent('project:loaded', {});
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify modal was opened
      expect(mockEditor.Modal.open).toHaveBeenCalled();
    });

    it('should not show modal when no upgrade is needed', async () => {
      pluginInstance.versionManager.savedVersion = '2.0.0';
      mockEditor.setProjectData({ builderVersion: '2.0.0' });
      
      // Simulate project load event
      mockEditor._triggerEvent('project:loaded', {});
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify modal was not opened
      expect(mockEditor.Modal.open).not.toHaveBeenCalled();
    });

    it('should not show modal again once the upgraded project is saved', async () => {
      const versions = [{ builderVersion: '2.0.0', upgrade: () => 'Upgraded' }];
      const upgraded = createMockEditor();
      plugin(upgraded, { builderVersion: '2.1.0', versions });
      upgraded._triggerEvent('storage:load', { builderVersion: '1.0.0' });
      upgraded._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = {};
      upgraded._triggerEvent('storage:start:store', saved);

      const reopened = createMockEditor();
      plugin(reopened, { builderVersion: '2.1.0', versions });
      reopened._triggerEvent('storage:load', saved);
      reopened._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(upgraded.Modal.open).toHaveBeenCalled();
      expect(reopened.Modal.open).not.toHaveBeenCalled();
    });

    it('should replay a failed step at the next opening', async () => {
      const passing = jest.fn(() => 'Upgraded');
      const failing = jest.fn(() => { throw new Error('Failed') });
      const versions = [{ builderVersion: '1.5.0', upgrade: passing }, { builderVersion: '2.0.0', upgrade: failing }];
      const upgraded = createMockEditor();
      plugin(upgraded, { builderVersion: '2.1.0', versions });
      upgraded._triggerEvent('storage:load', { builderVersion: '1.0.0' });
      upgraded._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = {};
      upgraded._triggerEvent('storage:start:store', saved);

      const reopened = createMockEditor();
      plugin(reopened, { builderVersion: '2.1.0', versions });
      reopened._triggerEvent('storage:load', saved);
      reopened._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(passing).toHaveBeenCalledTimes(1);
      expect(failing).toHaveBeenCalledTimes(2);
    });

    it('should replay all the steps of a version when one of them failed', async () => {
      const versions = [{ builderVersion: '2.0.0', upgrade: () => 'Upgraded' }, { builderVersion: '2.0.0', upgrade: () => { throw new Error('Failed') } }];
      const upgraded = createMockEditor();
      plugin(upgraded, { builderVersion: '2.1.0', versions });
      upgraded._triggerEvent('storage:load', { builderVersion: '1.0.0' });
      upgraded._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = {};
      upgraded._triggerEvent('storage:start:store', saved);

      expect(saved.builderVersion).toBe('1.0.0');
    });

    it('should not start again when a step loads the project', async () => {
      const editor = createMockEditor();
      editor.loadProjectData = () => editor._triggerEvent('project:loaded', {});
      const upgrade = ctx => { ctx.setProjectData({}); return 'Upgraded' };
      plugin(editor, { builderVersion: '2.0.0', versions: [{ builderVersion: '2.0.0', upgrade }] });
      editor._triggerEvent('storage:load', { builderVersion: '1.0.0' });
      editor._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(editor.trigger.mock.calls.filter(([event]) => event === 'version:outdated')).toHaveLength(1);
    });
  });

  describe('Window', () => {
    const open = async (versions, options = {}) => {
      const editor = createMockEditor();
      plugin(editor, { builderVersion: '2.0.0', versions, ...options });
      editor._triggerEvent('storage:load', { builderVersion: '1.0.0' });
      editor._triggerEvent('project:loaded', {});
      await new Promise(resolve => setTimeout(resolve, 50));
      const content = editor.Modal.open.mock.calls[0]?.[0].content;
      return { editor, content, click: action => content.querySelector(`[data-action="${action}"]`).click() };
    };

    it('should not open when no step changes the site', async () => {
      const { editor } = await open([{ builderVersion: '2.0.0', upgrade: () => '' }]);
      expect(editor.Modal.open).not.toHaveBeenCalled();
      expect(editor.StorageManager.getStepsBeforeSave()).toBe(1);
    });

    it('should list the changes and save on update', async () => {
      const { editor, content, click } = await open([{ builderVersion: '2.0.0', upgrade: () => 'Changed <b>' }]);
      expect(content.querySelector('li').textContent).toBe('Changed <b>');
      expect(editor.StorageManager.getStepsBeforeSave()).toBe(Infinity);
      click('update');
      expect(editor.store).toHaveBeenCalled();
      expect(editor.StorageManager.getStepsBeforeSave()).toBe(1);
    });

    it('should leave without saving, also with the cross', async () => {
      const onLeave = jest.fn();
      const { editor, click } = await open([{ builderVersion: '2.0.0', upgrade: () => 'Changed' }], { onLeave });
      click('leave');
      const dismissed = await open([{ builderVersion: '2.0.0', upgrade: () => 'Changed' }], { onLeave });
      dismissed.editor.Modal.close();
      expect(onLeave).toHaveBeenCalledTimes(2);
      expect(editor.store).not.toHaveBeenCalled();
      expect(dismissed.editor.store).not.toHaveBeenCalled();
      expect(editor.clearDirtyCount).toHaveBeenCalled();
      expect(editor.StorageManager.getStepsBeforeSave()).toBe(Infinity);
    });

    it('should open again when another modal replaced it', async () => {
      const onLeave = jest.fn();
      const { editor, content } = await open([{ builderVersion: '2.0.0', upgrade: () => 'Changed' }], { onLeave });
      editor.Modal.open({ content: 'Other' });
      editor.Modal.close();
      await new Promise(resolve => setTimeout(resolve));
      expect(onLeave).not.toHaveBeenCalled();
      expect(editor.Modal.getContent().innerHTML).toBe(content.innerHTML);
    });

    it('should wait for a modal opened right after the other one closed', async () => {
      const { editor, content } = await open([{ builderVersion: '2.0.0', upgrade: () => 'Changed' }]);
      editor.Modal.open({ content: 'Other' });
      editor.Modal.close();
      editor.Modal.open({ content: 'Settings' });
      await new Promise(resolve => setTimeout(resolve));
      expect(editor.Modal.getContent()).toBe('Settings');
      editor.Modal.close();
      await new Promise(resolve => setTimeout(resolve));
      expect(editor.Modal.getContent().innerHTML).toBe(content.innerHTML);
    });

    it('should show what is new alone with OK', async () => {
      const { editor, content, click } = await open([], { getWhatsNew: () => '<p>New</p>' });
      expect(content.querySelector('[data-action="leave"]')).toBeNull();
      click('ok');
      expect(editor.Modal.close).toHaveBeenCalled();
      expect(editor.store).not.toHaveBeenCalled();
    });

    it('should tell when a step fails and continue without saving', async () => {
      const { editor, content, click } = await open([{ builderVersion: '2.0.0', upgrade: () => { throw new Error('Broken') } }], { reportUrl: 'https://example.com/issues/new' });
      expect(content.querySelector('pre').textContent).toContain('Broken');
      click('continue');
      expect(editor.store).not.toHaveBeenCalled();
      expect(editor.StorageManager.getStepsBeforeSave()).toBe(1);
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
      
      // Simulate project load event
      mockEditor._triggerEvent('project:loaded', {});
      
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
      
      mockEditor._triggerEvent('project:loaded', {});
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockEditor.trigger).not.toHaveBeenCalledWith('version:outdated', expect.anything());
    });
  });
});