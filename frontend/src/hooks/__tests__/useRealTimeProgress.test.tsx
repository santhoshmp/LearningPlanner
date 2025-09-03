import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeProgress } from '../useRealTimeProgress';
import { realTimeProgressClient } from '../../services/realTimeProgressService';

// Mock the real-time progress client
jest.mock('../../services/realTimeProgressService', () => ({
  realTimeProgressClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    updateProgress: jest.fn(),
    getProgressState: jest.fn(),
    getAllProgressState: jest.fn(),
    getOfflineQueueSize: jest.fn(),
    requestSync: jest.fn(),
    createBackup: jest.fn(),
    restoreBackup: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isOnline: jest.fn()
  }
}));

const mockClient = realTimeProgressClient as jest.Mocked<typeof realTimeProgressClient>;

describe('useRealTimeProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.getAllProgressState.mockReturnValue([]);
    mockClient.getOfflineQueueSize.mockReturnValue(0);
    mockClient.isOnline.mockReturnValue(true);
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with default values when no childId provided', () => {
    const { result } = renderHook(() => useRealTimeProgress());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.offlineQueueSize).toBe(0);
    expect(result.current.progressState).toEqual([]);
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.lastSyncTime).toBeNull();
  });

  it('should attempt to connect when childId is provided', async () => {
    const childId = 'child123';
    mockClient.connect.mockResolvedValue();

    const { result } = renderHook(() => useRealTimeProgress(childId));

    expect(result.current.connectionStatus).toBe('connecting');
    expect(mockClient.connect).toHaveBeenCalledWith(childId);

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  it('should handle connection errors with retry', async () => {
    const childId = 'child123';
    mockClient.connect.mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('error');
    });

    expect(mockClient.connect).toHaveBeenCalledWith(childId);
  });

  it('should update progress and handle success', async () => {
    const childId = 'child123';
    mockClient.connect.mockResolvedValue();
    mockClient.updateProgress.mockResolvedValue();

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    await act(async () => {
      await result.current.updateProgress('activity123', 75, { test: true });
    });

    expect(mockClient.updateProgress).toHaveBeenCalledWith(
      'activity123',
      75,
      { test: true }
    );
  });

  it('should handle progress update errors', async () => {
    const childId = 'child123';
    mockClient.connect.mockResolvedValue();
    mockClient.updateProgress.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    await expect(
      act(async () => {
        await result.current.updateProgress('activity123', 75);
      })
    ).rejects.toThrow('Update failed');
  });

  it('should get progress for specific activity', async () => {
    const childId = 'child123';
    const mockProgressState = {
      activityId: 'activity123',
      progress: 75,
      lastAccessed: new Date(),
      sessionData: {},
      activity: {
        id: 'activity123',
        title: 'Test Activity',
        study_plan_id: 'plan123'
      }
    };

    mockClient.connect.mockResolvedValue();
    mockClient.getProgressState.mockReturnValue(mockProgressState);

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    const progress = result.current.getProgress('activity123');
    expect(progress).toEqual(mockProgressState);
    expect(mockClient.getProgressState).toHaveBeenCalledWith('activity123');
  });

  it('should request sync', async () => {
    const childId = 'child123';
    mockClient.connect.mockResolvedValue();
    mockClient.requestSync.mockResolvedValue();

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    await act(async () => {
      await result.current.requestSync();
    });

    expect(mockClient.requestSync).toHaveBeenCalled();
    expect(result.current.lastSyncTime).toBeInstanceOf(Date);
  });

  it('should create backup', async () => {
    const childId = 'child123';
    const backupId = 'backup123';
    
    mockClient.connect.mockResolvedValue();
    mockClient.createBackup.mockResolvedValue(backupId);

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    let returnedBackupId: string | null = null;
    await act(async () => {
      returnedBackupId = await result.current.createBackup();
    });

    expect(returnedBackupId).toBe(backupId);
    expect(mockClient.createBackup).toHaveBeenCalled();
  });

  it('should restore backup', async () => {
    const childId = 'child123';
    const backupId = 'backup123';
    
    mockClient.connect.mockResolvedValue();
    mockClient.restoreBackup.mockResolvedValue(true);

    const { result } = renderHook(() => useRealTimeProgress(childId));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    let success = false;
    await act(async () => {
      success = await result.current.restoreBackup(backupId);
    });

    expect(success).toBe(true);
    expect(mockClient.restoreBackup).toHaveBeenCalledWith(backupId);
    expect(result.current.lastSyncTime).toBeInstanceOf(Date);
  });

  it('should handle online/offline status changes', () => {
    const { result } = renderHook(() => useRealTimeProgress());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);

    // Simulate going back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should register and cleanup event listeners', () => {
    const childId = 'child123';
    mockClient.connect.mockResolvedValue();

    const { unmount } = renderHook(() => useRealTimeProgress(childId));

    // Verify event listeners were registered
    expect(mockClient.on).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('progress-updated', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('progress-resolved', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('progress-state-updated', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('progress-queued', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('offline-sync-complete', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));

    unmount();

    // Verify event listeners were cleaned up
    expect(mockClient.off).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('progress-updated', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('progress-resolved', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('progress-state-updated', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('progress-queued', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('offline-sync-complete', expect.any(Function));
    expect(mockClient.off).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should disconnect when component unmounts', () => {
    const childId = 'child123';
    mockClient.connect.mockResolvedValue();

    const { unmount } = renderHook(() => useRealTimeProgress(childId));

    unmount();

    expect(mockClient.disconnect).toHaveBeenCalled();
  });
});