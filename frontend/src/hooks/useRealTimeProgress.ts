import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeProgressClient } from '../services/realTimeProgressService';

interface ProgressState {
  activityId: string;
  progress: number;
  lastAccessed: Date;
  sessionData: any;
  activity: {
    id: string;
    title: string;
    study_plan_id: string;
  };
}

interface UseRealTimeProgressReturn {
  isConnected: boolean;
  isOnline: boolean;
  offlineQueueSize: number;
  progressState: ProgressState[];
  updateProgress: (activityId: string, progress: number, metadata?: Record<string, any>) => Promise<void>;
  getProgress: (activityId: string) => ProgressState | null;
  requestSync: () => Promise<void>;
  createBackup: () => Promise<string | null>;
  restoreBackup: (backupId: string) => Promise<boolean>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSyncTime: Date | null;
}

export const useRealTimeProgress = (childId?: string): UseRealTimeProgressReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);
  const [progressState, setProgressState] = useState<ProgressState[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const connectionAttempts = useRef(0);
  const maxRetries = 3;
  const retryDelay = 2000;

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Connect to real-time service when childId is provided
  useEffect(() => {
    if (!childId) {
      setConnectionStatus('disconnected');
      return;
    }

    const connectWithRetry = async () => {
      setConnectionStatus('connecting');
      
      try {
        await realTimeProgressClient.connect(childId);
        setIsConnected(true);
        setConnectionStatus('connected');
        connectionAttempts.current = 0;
        
        // Update initial state
        setProgressState(realTimeProgressClient.getAllProgressState());
        setOfflineQueueSize(realTimeProgressClient.getOfflineQueueSize());
        
      } catch (error) {
        console.error('Failed to connect to real-time service:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Retry connection with exponential backoff
        if (connectionAttempts.current < maxRetries) {
          connectionAttempts.current++;
          const delay = retryDelay * Math.pow(2, connectionAttempts.current - 1);
          
          setTimeout(() => {
            if (navigator.onLine) {
              connectWithRetry();
            }
          }, delay);
        }
      }
    };

    connectWithRetry();

    return () => {
      realTimeProgressClient.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [childId]);

  // Set up event listeners
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setOfflineQueueSize(realTimeProgressClient.getOfflineQueueSize());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleProgressUpdated = (data: any) => {
      setProgressState(realTimeProgressClient.getAllProgressState());
      setLastSyncTime(new Date());
    };

    const handleProgressResolved = (data: any) => {
      setProgressState(realTimeProgressClient.getAllProgressState());
      setLastSyncTime(new Date());
    };

    const handleProgressStateUpdated = (data: ProgressState[]) => {
      setProgressState(data);
      setLastSyncTime(new Date());
    };

    const handleProgressQueued = () => {
      setOfflineQueueSize(realTimeProgressClient.getOfflineQueueSize());
    };

    const handleOfflineSyncComplete = (data: any) => {
      setOfflineQueueSize(realTimeProgressClient.getOfflineQueueSize());
      setLastSyncTime(new Date());
      console.log(`Synced ${data.syncedUpdates} offline updates`);
    };

    const handleError = (error: any) => {
      console.error('Real-time progress error:', error);
      setConnectionStatus('error');
    };

    // Register event listeners
    realTimeProgressClient.on('connected', handleConnected);
    realTimeProgressClient.on('disconnected', handleDisconnected);
    realTimeProgressClient.on('progress-updated', handleProgressUpdated);
    realTimeProgressClient.on('progress-resolved', handleProgressResolved);
    realTimeProgressClient.on('progress-state-updated', handleProgressStateUpdated);
    realTimeProgressClient.on('progress-queued', handleProgressQueued);
    realTimeProgressClient.on('offline-sync-complete', handleOfflineSyncComplete);
    realTimeProgressClient.on('error', handleError);

    return () => {
      // Cleanup event listeners
      realTimeProgressClient.off('connected', handleConnected);
      realTimeProgressClient.off('disconnected', handleDisconnected);
      realTimeProgressClient.off('progress-updated', handleProgressUpdated);
      realTimeProgressClient.off('progress-resolved', handleProgressResolved);
      realTimeProgressClient.off('progress-state-updated', handleProgressStateUpdated);
      realTimeProgressClient.off('progress-queued', handleProgressQueued);
      realTimeProgressClient.off('offline-sync-complete', handleOfflineSyncComplete);
      realTimeProgressClient.off('error', handleError);
    };
  }, []);

  const updateProgress = useCallback(async (
    activityId: string, 
    progress: number, 
    metadata?: Record<string, any>
  ) => {
    try {
      await realTimeProgressClient.updateProgress(activityId, progress, metadata);
      
      // Update local state immediately for responsive UI
      setProgressState(realTimeProgressClient.getAllProgressState());
      setOfflineQueueSize(realTimeProgressClient.getOfflineQueueSize());
      
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, []);

  const getProgress = useCallback((activityId: string): ProgressState | null => {
    return realTimeProgressClient.getProgressState(activityId);
  }, []);

  const requestSync = useCallback(async () => {
    try {
      await realTimeProgressClient.requestSync();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error requesting sync:', error);
      throw error;
    }
  }, []);

  const createBackup = useCallback(async (): Promise<string | null> => {
    try {
      const backupId = await realTimeProgressClient.createBackup();
      if (backupId) {
        console.log('Progress backup created:', backupId);
      }
      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }, []);

  const restoreBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      const success = await realTimeProgressClient.restoreBackup(backupId);
      if (success) {
        setProgressState(realTimeProgressClient.getAllProgressState());
        setLastSyncTime(new Date());
        console.log('Progress backup restored successfully');
      }
      return success;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }, []);

  return {
    isConnected,
    isOnline,
    offlineQueueSize,
    progressState,
    updateProgress,
    getProgress,
    requestSync,
    createBackup,
    restoreBackup,
    connectionStatus,
    lastSyncTime
  };
};