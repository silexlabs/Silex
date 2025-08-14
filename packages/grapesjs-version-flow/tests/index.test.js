import plugin from '../src/index.js';

// Mock all the dependencies
jest.mock('../src/version-manager.js');
jest.mock('../src/upgrade-engine.js');
jest.mock('../src/modal-ui.js');
jest.mock('../src/event-system.js');
jest.mock('../src/style-manager.js');

const createMockEditor = () => ({
  I18n: {
    addMessages: jest.fn()
  },
  on: jest.fn(),
  store: jest.fn(),
  Modal: {
    open: jest.fn(),
    close: jest.fn()
  }
});

describe('GrapesJS Version Flow Plugin', () => {
  let mockEditor;
  let consoleErrorSpy;

  beforeEach(() => {
    mockEditor = createMockEditor();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('plugin initialization', () => {
    it('should require builderVersion option', () => {
      const result = plugin(mockEditor, {});
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[grapesjs-version-flow] builderVersion is required'
      );
      expect(result).toBeUndefined();
    });

    it('should require versions to be an array', () => {
      const result = plugin(mockEditor, {
        builderVersion: '1.0.0',
        versions: 'not an array'
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[grapesjs-version-flow] versions must be an array'
      );
      expect(result).toBeUndefined();
    });

    it('should validate version step structure', () => {
      const result = plugin(mockEditor, {
        builderVersion: '1.0.0',
        versions: [
          { builderVersion: '1.0.0' } // missing upgrade function
        ]
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[grapesjs-version-flow] Each version step must have builderVersion and upgrade function'
      );
      expect(result).toBeUndefined();
    });

    it('should initialize successfully with valid options', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [
          {
            builderVersion: '1.0.0',
            upgrade: () => {}
          }
        ]
      };
      
      const result = plugin(mockEditor, options);
      
      expect(result).toBeDefined();
      expect(result.versionManager).toBeDefined();
      expect(result.upgradeEngine).toBeDefined();
      expect(result.modalUI).toBeDefined();
      expect(result.eventSystem).toBeDefined();
    });

    it('should merge default options with provided options', () => {
      const customOptions = {
        builderVersion: '2.0.0',
        versions: [{ builderVersion: '2.0.0', upgrade: () => {} }],
        continueOnError: true,
        styles: {
          classPrefix: 'custom-prefix'
        }
      };
      
      const result = plugin(mockEditor, customOptions);
      
      expect(result).toBeDefined();
    });

    it('should load i18n messages if I18n is available', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [{ builderVersion: '1.0.0', upgrade: () => {} }],
        i18n: {
          'es': { 'grapesjs-version-flow': { 'test': 'prueba' } }
        }
      };
      
      plugin(mockEditor, options);
      
      expect(mockEditor.I18n.addMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          en: expect.any(Object),
          fr: expect.any(Object),
          es: options.i18n.es
        })
      );
    });

    it('should handle missing I18n gracefully', () => {
      mockEditor.I18n = null;
      
      const options = {
        builderVersion: '1.0.0',
        versions: [{ builderVersion: '1.0.0', upgrade: () => {} }]
      };
      
      expect(() => plugin(mockEditor, options)).not.toThrow();
    });
  });

  describe('event listeners', () => {
    it('should set up editor load event listener', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [{ builderVersion: '1.0.0', upgrade: () => {} }]
      };
      
      plugin(mockEditor, options);
      
      expect(mockEditor.on).toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('should set up storage event listener', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [{ builderVersion: '1.0.0', upgrade: () => {} }]
      };
      
      plugin(mockEditor, options);
      
      expect(mockEditor.on).toHaveBeenCalledWith('storage:end:store', expect.any(Function));
    });
  });

  describe('default options', () => {
    it('should provide correct default values', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [{ builderVersion: '1.0.0', upgrade: () => {} }]
      };
      
      const result = plugin(mockEditor, options);
      
      // The plugin should work with defaults
      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty versions array', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: []
      };
      
      const result = plugin(mockEditor, options);
      
      expect(result).toBeDefined();
    });

    it('should validate version steps with whatsNew function', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [
          {
            builderVersion: '1.0.0',
            upgrade: () => {},
            whatsNew: () => {}
          }
        ]
      };
      
      const result = plugin(mockEditor, options);
      
      expect(result).toBeDefined();
    });

    it('should handle async upgrade functions', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [
          {
            builderVersion: '1.0.0',
            upgrade: async () => {}
          }
        ]
      };
      
      const result = plugin(mockEditor, options);
      
      expect(result).toBeDefined();
    });
  });

  describe('return value', () => {
    it('should return API object with all components', () => {
      const options = {
        builderVersion: '1.0.0',
        versions: [{ builderVersion: '1.0.0', upgrade: () => {} }]
      };
      
      const result = plugin(mockEditor, options);
      
      expect(result).toEqual({
        versionManager: expect.any(Object),
        upgradeEngine: expect.any(Object),
        modalUI: expect.any(Object),
        eventSystem: expect.any(Object)
      });
    });
  });
});