import UpgradeEngine from '../src/upgrade-engine.js';
import VersionManager from '../src/version-manager.js';
import EventSystem from '../src/event-system.js';

// Mock dependencies
const createMockEditor = () => ({
  getProjectData: () => ({}),
  setProjectData: jest.fn(),
  getComponents: () => [],
  getStyleManager: () => ({ getAll: () => [] }),
  getPages: () => []
});

const createMockVersionManager = () => ({
  getSavedVersion: jest.fn().mockReturnValue('1.0.0'),
  saveVersion: jest.fn(),
  getPendingUpgrades: jest.fn().mockReturnValue([]),
  getPendingWhatsNew: jest.fn().mockReturnValue([])
});

const createMockEventSystem = () => ({
  emit: jest.fn()
});

const createMockOptions = (overrides = {}) => ({
  builderVersion: '2.0.0',
  versions: [],
  continueOnError: false,
  ...overrides
});

describe('UpgradeEngine', () => {
  let upgradeEngine;
  let mockEditor;
  let mockVersionManager;
  let mockEventSystem;
  let mockOptions;

  beforeEach(() => {
    mockEditor = createMockEditor();
    mockVersionManager = createMockVersionManager();
    mockEventSystem = createMockEventSystem();
    mockOptions = createMockOptions();
    
    upgradeEngine = new UpgradeEngine(
      mockEditor,
      mockOptions,
      mockVersionManager,
      mockEventSystem
    );
  });

  describe('runUpgrades', () => {
    it('should return success with no logs when no pending upgrades', async () => {
      mockVersionManager.getPendingUpgrades.mockReturnValue([]);
      
      const result = await upgradeEngine.runUpgrades();
      
      expect(result).toEqual({
        success: true,
        logs: [],
        upgradedTo: '2.0.0'
      });
    });

    it('should execute upgrades in sequence', async () => {
      const upgradeOrder = [];
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => { upgradeOrder.push('1.1.0'); return []; }
        },
        {
          builderVersion: '1.2.0',
          upgrade: () => { upgradeOrder.push('1.2.0'); return []; }
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      await upgradeEngine.runUpgrades();
      
      expect(upgradeOrder).toEqual(['1.1.0', '1.2.0']);
      expect(mockVersionManager.saveVersion).toHaveBeenCalledWith('1.1.0');
      expect(mockVersionManager.saveVersion).toHaveBeenCalledWith('1.2.0');
    });

    it('should emit events during upgrade process', async () => {
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => [{ level: 'info', message: 'Test log' }]
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      await upgradeEngine.runUpgrades();
      
      expect(mockEventSystem.emit).toHaveBeenCalledWith('version:upgrade:start', {
        pending: ['1.1.0']
      });
      expect(mockEventSystem.emit).toHaveBeenCalledWith('version:versionUpgrade:start', {
        toVersion: '1.1.0'
      });
      expect(mockEventSystem.emit).toHaveBeenCalledWith('version:versionUpgrade:end', {
        toVersion: '1.1.0',
        log: [{ level: 'info', message: 'Test log' }]
      });
      expect(mockEventSystem.emit).toHaveBeenCalledWith('version:upgrade:end', {
        upgradedTo: '1.1.0'
      });
    });

    it('should handle upgrade errors and stop by default', async () => {
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => { throw new Error('Upgrade failed'); }
        },
        {
          builderVersion: '1.2.0',
          upgrade: jest.fn()
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      const result = await upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(false);
      expect(result.failedSteps).toEqual(['1.1.0']);
      expect(mockSteps[1].upgrade).not.toHaveBeenCalled();
      expect(mockEventSystem.emit).toHaveBeenCalledWith('version:upgrade:error', {
        toVersion: '1.1.0',
        error: { message: 'Upgrade failed', step: '1.1.0' }
      });
    });

    it('should continue on error when continueOnError is true', async () => {
      mockOptions.continueOnError = true;
      upgradeEngine = new UpgradeEngine(
        mockEditor,
        mockOptions,
        mockVersionManager,
        mockEventSystem
      );

      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => { throw new Error('Upgrade failed'); }
        },
        {
          builderVersion: '1.2.0',
          upgrade: jest.fn().mockReturnValue([])
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      const result = await upgradeEngine.runUpgrades();
      
      expect(result.success).toBe(false);
      expect(result.failedSteps).toEqual(['1.1.0']);
      expect(mockSteps[1].upgrade).toHaveBeenCalled();
      expect(mockVersionManager.saveVersion).toHaveBeenCalledWith('1.2.0');
    });

    it('should prevent concurrent upgrades', async () => {
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => new Promise(resolve => setTimeout(resolve, 100))
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      const promise1 = upgradeEngine.runUpgrades();
      const promise2 = upgradeEngine.runUpgrades();
      
      await promise1;
      await promise2;
      
      expect(upgradeEngine.isRunning()).toBe(false);
    });
  });

  describe('runSingleUpgrade', () => {
    it('should create proper upgrade context', async () => {
      const upgradeFunction = jest.fn().mockReturnValue([]);
      const step = { builderVersion: '1.1.0', upgrade: upgradeFunction };
      
      await upgradeEngine.runSingleUpgrade(step);
      
      expect(upgradeFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          editor: mockEditor,
          getComponents: expect.any(Function),
          getStyles: expect.any(Function),
          getPages: expect.any(Function),
          getProjectData: expect.any(Function),
          setProjectData: expect.any(Function),
          addLog: expect.any(Function)
        })
      );
    });

    it('should handle async upgrade functions', async () => {
      const asyncUpgrade = jest.fn().mockResolvedValue([
        { level: 'info', message: 'Async upgrade completed' }
      ]);
      const step = { builderVersion: '1.1.0', upgrade: asyncUpgrade };
      
      const result = await upgradeEngine.runSingleUpgrade(step);
      
      expect(result).toEqual([
        { level: 'info', message: 'Async upgrade completed' }
      ]);
    });

    it('should handle upgrade functions that return undefined', async () => {
      const upgradeFunction = jest.fn().mockReturnValue(undefined);
      const step = { builderVersion: '1.1.0', upgrade: upgradeFunction };
      
      const result = await upgradeEngine.runSingleUpgrade(step);
      
      expect(result).toEqual([]);
    });
  });

  describe('runWhatsNew', () => {
    it('should execute whatsNew functions for pending steps', async () => {
      const whatsNew1 = jest.fn();
      const whatsNew2 = jest.fn();
      
      const mockSteps = [
        { builderVersion: '1.1.0', whatsNew: whatsNew1 },
        { builderVersion: '1.2.0', whatsNew: whatsNew2 }
      ];
      
      mockVersionManager.getPendingWhatsNew.mockReturnValue(mockSteps);
      
      await upgradeEngine.runWhatsNew();
      
      expect(whatsNew1).toHaveBeenCalled();
      expect(whatsNew2).toHaveBeenCalled();
    });

    it('should handle whatsNew function errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const whatsNewError = () => { throw new Error('WhatsNew error'); };
      const whatsNewSuccess = jest.fn();
      
      const mockSteps = [
        { builderVersion: '1.1.0', whatsNew: whatsNewError },
        { builderVersion: '1.2.0', whatsNew: whatsNewSuccess }
      ];
      
      mockVersionManager.getPendingWhatsNew.mockReturnValue(mockSteps);
      
      await upgradeEngine.runWhatsNew();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(whatsNewSuccess).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('createUpgradeContext', () => {
    it('should provide addLog function that accumulates logs', () => {
      const context = upgradeEngine.createUpgradeContext();
      
      const log1 = context.addLog('info', 'First log');
      const log2 = context.addLog('error', 'Second log');
      
      expect(log1).toEqual({ level: 'info', message: 'First log' });
      expect(log2).toEqual({ level: 'error', message: 'Second log' });
      expect(upgradeEngine.getAllLogs()).toEqual([log1, log2]);
    });

    it('should provide access to editor functions', () => {
      const context = upgradeEngine.createUpgradeContext();
      
      expect(context.editor).toBe(mockEditor);
      expect(typeof context.getComponents).toBe('function');
      expect(typeof context.getStyles).toBe('function');
      expect(typeof context.getPages).toBe('function');
      expect(typeof context.getProjectData).toBe('function');
      expect(typeof context.setProjectData).toBe('function');
    });
  });

  describe('state management', () => {
    it('should track current step during upgrades', async () => {
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => {
            expect(upgradeEngine.getCurrentStep().builderVersion).toBe('1.1.0');
            return [];
          }
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      await upgradeEngine.runUpgrades();
      
      expect(upgradeEngine.getCurrentStep()).toBeNull();
    });

    it('should track running state', async () => {
      expect(upgradeEngine.isRunning()).toBe(false);
      
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => {
            expect(upgradeEngine.isRunning()).toBe(true);
            return [];
          }
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      await upgradeEngine.runUpgrades();
      
      expect(upgradeEngine.isRunning()).toBe(false);
    });

    it('should track logs and failed steps', async () => {
      const mockSteps = [
        {
          builderVersion: '1.1.0',
          upgrade: () => { throw new Error('Test error'); }
        }
      ];
      
      mockVersionManager.getPendingUpgrades.mockReturnValue(mockSteps);
      
      await upgradeEngine.runUpgrades();
      
      expect(upgradeEngine.getFailedSteps()).toEqual(['1.1.0']);
      expect(upgradeEngine.getAllLogs()).toHaveLength(1);
      expect(upgradeEngine.getAllLogs()[0].level).toBe('error');
    });
  });
});