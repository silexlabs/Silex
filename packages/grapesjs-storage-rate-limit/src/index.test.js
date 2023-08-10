import {jest} from '@jest/globals'
import rateLimitedStorage from './index.js';

jest.useFakeTimers();

describe('rateLimitedStorage', () => {
  let mockEditor;
  let mockStorageManager;
  let mockStorage;
  let mockStorageOption = {};

  beforeEach(() => {
    mockStorage = {
      store: jest.fn(),
      load: jest.fn(),
    };

    mockStorageManager = {
      getCurrentStorage: jest.fn().mockReturnValue(mockStorage),
      getCurrentOptions: jest.fn().mockReturnValue(mockStorageOption),
      setCurrent: jest.fn(),
    };

    mockEditor = {
      StorageManager: mockStorageManager,
      getDirtyCount: jest.fn(),
      Storage: {
        add: jest.fn(),
      },
    };

    global.window.addEventListener = jest.fn();
  });

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

    jest.runAllTimers();

    expect(mockStorage.store).toHaveBeenCalledTimes(2);
    expect(mockStorage.store).toHaveBeenNthCalledWith(1, mockData1, {});
    expect(mockStorage.store).toHaveBeenNthCalledWith(2, mockData2, {});
  });
});
