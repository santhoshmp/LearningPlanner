import { realTimeProgressClient } from '../realTimeProgressService';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock socket instance
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  once: jest.fn(),
  disconnect: jest.fn(),
  connected: false
};

const mockIo = io as jest.MockedFunction<typeof io>;

describe('RealTimeProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIo.mockReturnValue(mockSocket as any);
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Reset the client state
    realTimeProgressClient.disconnect();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Environment Variable Handling', () => {
    it('should use VITE_API_URL from import.meta.env and remove /api suffix', async () => {
      // Mock import.meta.env with API URL that has /api suffix
      const originalImportMeta = global.import?.meta;
      (global as any).import = {
        meta: {
          env: {
            VITE_API_URL: 'http://localhost:3001/api'
          }
        }
      };

      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);

      // Verify io was called with the correct URL (without /api)
      expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Restore original import.meta
      if (originalImportMeta) {
        (global as any).import.meta = originalImportMeta;
      }
    });

    it('should use VITE_API_URL without modification if no /api suffix', async () => {
      // Mock import.meta.env with API URL without /api suffix
      const originalImportMeta = global.import?.meta;
      (global as any).import = {
        meta: {
          env: {
            VITE_API_URL: 'http://localhost:3001'
          }
        }
      };

      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);

      // Verify io was called with the correct URL (unchanged)
      expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Restore original import.meta
      if (originalImportMeta) {
        (global as any).import.meta = originalImportMeta;
      }
    });

    it('should fallback to localhost:3001 when VITE_API_URL is undefined', async () => {
      // Mock import.meta.env without VITE_API_URL
      const originalImportMeta = global.import?.meta;
      (global as any).import = {
        meta: {
          env: {}
        }
      };

      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);

      // Verify io was called with the fallback URL
      expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Restore original import.meta
      if (originalImportMeta) {
        (global as any).import.meta = originalImportMeta;
      }
    });

    it('should handle complex API URLs with /api in the middle', async () => {
      // Mock import.meta.env with complex API URL
      const originalImportMeta = global.import?.meta;
      (global as any).import = {
        meta: {
          env: {
            VITE_API_URL: 'https://myapp.com/api/v1'
          }
        }
      };

      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);

      // Verify io was called with the URL with /api removed
      expect(mockIo).toHaveBeenCalledWith('https://myapp.com/v1', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Restore original import.meta
      if (originalImportMeta) {
        (global as any).import.meta = originalImportMeta;
      }
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully with valid childId', async () => {
      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);

      expect(mockIo).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('join-child-room', {
        childId: 'child123',
        deviceId: expect.any(String),
        sessionId: expect.any(String)
      });
    });

    it('should handle connection timeout', async () => {
      const childId = 'child123';
      
      // Don't trigger connect event to simulate timeout
      mockSocket.on.mockImplementation(() => {});

      await expect(realTimeProgressClient.connect(childId)).rejects.toThrow('Connection timeout');
    });

    it('should handle connection errors', async () => {
      const childId = 'child123';
      const connectionError = new Error('Connection failed');
      
      // Mock connection error
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(connectionError), 0);
        }
      });

      await expect(realTimeProgressClient.connect(childId)).rejects.toThrow('Connection failed');
    });

    it('should disconnect existing socket before connecting new one', async () => {
      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      // Connect first time
      await realTimeProgressClient.connect(childId);
      
      // Connect second time
      await realTimeProgressClient.connect(childId);

      // Should have called disconnect on the previous socket
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Progress Updates', () => {
    beforeEach(async () => {
      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);
    });

    it('should send progress update when connected', async () => {
      const activityId = 'activity123';
      const progress = 75;
      const metadata = { test: true };

      await realTimeProgressClient.updateProgress(activityId, progress, metadata);

      expect(mockSocket.emit).toHaveBeenCalledWith('progress-update', {
        childId: 'child123',
        activityId,
        progress,
        timestamp: expect.any(Date),
        deviceId: expect.any(String),
        sessionId: expect.any(String),
        metadata
      });
    });

    it('should queue progress update when offline', async () => {
      // Simulate offline state
      realTimeProgressClient.disconnect();

      const activityId = 'activity123';
      const progress = 75;

      await realTimeProgressClient.updateProgress(activityId, progress);

      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'offlineProgressQueue',
        expect.stringContaining(activityId)
      );
    });

    it('should throw error when no childId is set', async () => {
      realTimeProgressClient.disconnect();

      await expect(
        realTimeProgressClient.updateProgress('activity123', 75)
      ).rejects.toThrow('Not connected to any child session');
    });
  });

  describe('Offline Queue Management', () => {
    it('should load offline queue from localStorage on initialization', () => {
      const mockQueue = JSON.stringify([
        {
          id: 'offline_123',
          childId: 'child123',
          activityId: 'activity123',
          progress: 50,
          synced: false
        }
      ]);

      mockLocalStorage.getItem.mockReturnValue(mockQueue);

      // Create new instance to test initialization
      const newClient = new (realTimeProgressClient.constructor as any)();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('offlineProgressQueue');
      expect(newClient.getOfflineQueueSize()).toBe(1);
    });

    it('should handle corrupted offline queue data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Should not throw error and initialize with empty queue
      const newClient = new (realTimeProgressClient.constructor as any)();
      expect(newClient.getOfflineQueueSize()).toBe(0);
    });

    it('should save offline queue to localStorage', async () => {
      realTimeProgressClient.disconnect();

      await realTimeProgressClient.updateProgress('activity123', 75);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'offlineProgressQueue',
        expect.any(String)
      );
    });
  });

  describe('Event System', () => {
    it('should register and emit events correctly', () => {
      const callback = jest.fn();
      
      realTimeProgressClient.on('test-event', callback);
      
      // Simulate emitting event (through private method access)
      (realTimeProgressClient as any).emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners correctly', () => {
      const callback = jest.fn();
      
      realTimeProgressClient.on('test-event', callback);
      realTimeProgressClient.off('test-event', callback);
      
      // Simulate emitting event
      (realTimeProgressClient as any).emit('test-event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in event listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      realTimeProgressClient.on('test-event', errorCallback);
      
      // Should not throw error when callback fails
      expect(() => {
        (realTimeProgressClient as any).emit('test-event', { data: 'test' });
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Progress State Management', () => {
    it('should get progress state for specific activity', () => {
      const activityId = 'activity123';
      const progressState = {
        activityId,
        progress: 75,
        lastAccessed: new Date(),
        sessionData: {},
        activity: {
          id: activityId,
          title: 'Test Activity',
          study_plan_id: 'plan123'
        }
      };

      // Set progress state directly
      (realTimeProgressClient as any).progressState.set(activityId, progressState);

      const result = realTimeProgressClient.getProgressState(activityId);
      expect(result).toEqual(progressState);
    });

    it('should return null for non-existent activity', () => {
      const result = realTimeProgressClient.getProgressState('non-existent');
      expect(result).toBeNull();
    });

    it('should get all progress state', () => {
      const progressState1 = {
        activityId: 'activity1',
        progress: 75,
        lastAccessed: new Date(),
        sessionData: {},
        activity: { id: 'activity1', title: 'Test 1', study_plan_id: 'plan1' }
      };

      const progressState2 = {
        activityId: 'activity2',
        progress: 50,
        lastAccessed: new Date(),
        sessionData: {},
        activity: { id: 'activity2', title: 'Test 2', study_plan_id: 'plan2' }
      };

      // Set progress states directly
      (realTimeProgressClient as any).progressState.set('activity1', progressState1);
      (realTimeProgressClient as any).progressState.set('activity2', progressState2);

      const result = realTimeProgressClient.getAllProgressState();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(progressState1);
      expect(result).toContainEqual(progressState2);
    });
  });

  describe('Online/Offline Detection', () => {
    it('should detect online status correctly', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      expect(realTimeProgressClient.isOnline()).toBe(false); // Not connected yet
    });

    it('should handle online/offline events', () => {
      const connectSpy = jest.spyOn(realTimeProgressClient, 'connect').mockResolvedValue();
      
      // Simulate going online
      window.dispatchEvent(new Event('online'));
      
      // Should not attempt to reconnect without childId
      expect(connectSpy).not.toHaveBeenCalled();

      connectSpy.mockRestore();
    });
  });

  describe('Backup and Recovery', () => {
    beforeEach(async () => {
      const childId = 'child123';
      
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      });

      await realTimeProgressClient.connect(childId);
    });

    it('should create backup successfully', async () => {
      const backupId = 'backup123';
      
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'backup-created') {
          setTimeout(() => callback({ backupId }), 0);
        }
      });

      const result = await realTimeProgressClient.createBackup();

      expect(result).toBe(backupId);
      expect(mockSocket.emit).toHaveBeenCalledWith('create-backup', { childId: 'child123' });
    });

    it('should handle backup creation timeout', async () => {
      // Don't trigger backup-created event to simulate timeout
      mockSocket.once.mockImplementation(() => {});

      await expect(realTimeProgressClient.createBackup()).rejects.toThrow('Backup creation timeout');
    });

    it('should restore backup successfully', async () => {
      const backupId = 'backup123';
      
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'backup-restored') {
          setTimeout(() => callback({ success: true }), 0);
        }
      });

      const result = await realTimeProgressClient.restoreBackup(backupId);

      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('restore-backup', { 
        childId: 'child123', 
        backupId 
      });
    });

    it('should return null/false when not connected for backup operations', async () => {
      realTimeProgressClient.disconnect();

      const createResult = await realTimeProgressClient.createBackup();
      const restoreResult = await realTimeProgressClient.restoreBackup('backup123');

      expect(createResult).toBeNull();
      expect(restoreResult).toBe(false);
    });
  });

  describe('Device and Session ID Generation', () => {
    it('should generate and persist device ID', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Create new instance to test device ID generation
      new (realTimeProgressClient.constructor as any)();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'deviceId',
        expect.stringMatching(/^device_\d+_[a-z0-9]+$/)
      );
    });

    it('should reuse existing device ID from localStorage', () => {
      const existingDeviceId = 'device_123_abc';
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      
      // Create new instance
      const client = new (realTimeProgressClient.constructor as any)();

      // Should not set new device ID
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('deviceId', expect.any(String));
    });

    it('should generate unique session ID for each instance', () => {
      const client1 = new (realTimeProgressClient.constructor as any)();
      const client2 = new (realTimeProgressClient.constructor as any)();

      // Session IDs should be different
      expect((client1 as any).sessionId).not.toBe((client2 as any).sessionId);
      expect((client1 as any).sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect((client2 as any).sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });
});