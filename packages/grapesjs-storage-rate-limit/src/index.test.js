import {jest} from '@jest/globals'
import rateLimitedStorage from './index.js';

//jest.useFakeTimers();
async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('rateLimitedStorage', () => {
  let mockEditor;
  let mockStorageManager;
  let mockStorage;
  let mockStorageOption;

  function initMocks(
    _mockStorage = {
      store: jest.fn(),
      load: jest.fn(),
    },
    _mockStorageOption = {},
    _mockStorageManager = {
      getCurrentStorage: jest.fn().mockReturnValue(_mockStorage),
      getCurrentOptions: jest.fn().mockReturnValue(_mockStorageOption),
      setCurrent: jest.fn(),
    },
    _mockEditor = {
      StorageManager: _mockStorageManager,
      getDirtyCount: jest.fn(),
      trigger: jest.fn(),
      Storage: {
        add: jest.fn(),
      },
    },
  ) {
    mockStorage = _mockStorage;
    mockStorageManager = _mockStorageManager;
    mockEditor = _mockEditor;
    mockStorageOption = _mockStorageOption;
    global.window.addEventListener = jest.fn();
  }

  beforeEach(() => initMocks());

  it('should initialize with default options', () => {
    rateLimitedStorage(mockEditor);
    expect(mockStorageManager.setCurrent).toHaveBeenCalledWith('rate-limit');
  });

  it('should store data immediately if not in cooldown', async () => {
    rateLimitedStorage(mockEditor);
    const mockData = { key: 'value' };

    const storageObject = mockEditor.Storage.add.mock.calls[0][1];
    await storageObject.store(mockData);

    expect(mockStorage.store).toHaveBeenCalledWith(mockData, mockStorageOption);
  });

  it('should not store data during cooldown but store later', async () => {
    rateLimitedStorage(mockEditor);
    const mockData1 = { key: 'value1' };
    const mockData2 = { key: 'value2' };

    const storageObject = mockEditor.Storage.add.mock.calls[0][1];
    await storageObject.store(mockData1); // This should store immediately

    mockEditor.getDirtyCount.mockReturnValue(1);
    await storageObject.store(mockData2); // This should be pending due to cooldown

    expect(mockStorage.store).toHaveBeenCalledTimes(1);
    expect(mockStorage.store).toHaveBeenNthCalledWith(1, mockData1, {});

    //jest.runAllTimers();
    await wait(2000);

    expect(mockStorage.store).toHaveBeenCalledTimes(2);
    expect(mockStorage.store).toHaveBeenNthCalledWith(1, mockData1, {});
    expect(mockStorage.store).toHaveBeenNthCalledWith(2, mockData2, {});
  });

  it('should not call store multiple time when store takes time to execute', async () => {
    // Init with a an async store function
    initMocks({
      store: jest.fn().mockImplementation(() => wait(1000)),
      load: jest.fn(),
    });

    // Init the plugin
    rateLimitedStorage(mockEditor);

    // Get the storage object created by the plugin
    const storageObject = mockEditor.Storage.add.mock.calls[0][1];

    // This should store immediately
    const mockData1 = { key: 'value1' };
    storageObject.store(mockData1);

    // This should be pending due to cooldown
    const mockData2 = { key: 'value2' };
    storageObject.store({}); // Any data but mockData2
    storageObject.store({}); // Any data but mockData2
    storageObject.store(mockData2);

    // Wait just a bit, before the cooldown
    await wait(500);

    // Check save immediately the first data
    expect(mockStorage.store).toHaveBeenCalledTimes(1);
    expect(mockStorage.store).toHaveBeenNthCalledWith(1, mockData1, {});

    // Wait for the cooldown
    //jest.runAllTimers();
    await wait(2000);

    // Check after the cooldown
    expect(mockStorage.store).toHaveBeenCalledTimes(2);
    expect(mockStorage.store).toHaveBeenNthCalledWith(1, mockData1, {});
    expect(mockStorage.store).toHaveBeenNthCalledWith(2, mockData2, {});
  });
});
