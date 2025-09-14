import { io, Socket } from 'socket.io-client';

interface ProgressUpdate {
  childId: string;
  activityId: string;
  progress: number;
  timestamp: Date;
  deviceId: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface OfflineProgressUpdate extends ProgressUpdate {
  id: string;
  synced: boolean;
}

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

class RealTimeProgressClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private childId: string | null = null;
  private deviceId: string;
  private sessionId: string;
  private offlineQueue: OfflineProgressUpdate[] = [];
  private progressState: Map<string, ProgressState> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.sessionId = this.generateSessionId();
    this.loadOfflineQueue();
    this.setupOnlineOfflineHandlers();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('offlineProgressQueue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('offlineProgressQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored, attempting to reconnect...');
      if (this.childId) {
        this.connect(this.childId);
      }
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, switching to offline mode');
      this.isConnected = false;
    });
  }

  async connect(childId: string): Promise<void> {
    try {
      this.childId = childId;
      
      if (this.socket) {
        this.socket.disconnect();
      }

      const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.setupSocketHandlers();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          console.log('Connected to real-time progress service');
          this.isConnected = true;
          
          // Join child room
          this.socket!.emit('join-child-room', {
            childId: this.childId,
            deviceId: this.deviceId,
            sessionId: this.sessionId
          });
          
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('Connection error:', error);
          this.isConnected = false;
          reject(error);
        });
      });

    } catch (error) {
      console.error('Failed to connect to real-time service:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('joined', (data) => {
      console.log('Successfully joined child room:', data);
      this.emit('connected', data);
    });

    this.socket.on('progress-updated', (data) => {
      console.log('Progress updated from another device:', data);
      this.updateLocalProgressState(data);
      this.emit('progress-updated', data);
    });

    this.socket.on('progress-resolved', (data) => {
      console.log('Progress conflict resolved:', data);
      this.updateLocalProgressState(data);
      this.emit('progress-resolved', data);
    });

    this.socket.on('progress-broadcast', (data) => {
      console.log('Progress broadcast received:', data);
      this.updateLocalProgressState(data);
      this.emit('progress-broadcast', data);
    });

    this.socket.on('progress-state', (progressData: ProgressState[]) => {
      console.log('Received current progress state:', progressData);
      this.progressState.clear();
      progressData.forEach(state => {
        this.progressState.set(state.activityId, state);
      });
      this.emit('progress-state-updated', progressData);
    });

    this.socket.on('offline-sync-complete', (data) => {
      console.log('Offline sync completed:', data);
      this.clearSyncedOfflineUpdates();
      this.emit('offline-sync-complete', data);
    });

    this.socket.on('sync-response', (data) => {
      console.log('Sync response received:', data);
      this.emit('sync-response', data);
    });

    this.socket.on('progress-error', (error) => {
      console.error('Progress error:', error);
      this.emit('progress-error', error);
    });

    this.socket.on('sync-error', (error) => {
      console.error('Sync error:', error);
      this.emit('sync-error', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time service');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  async updateProgress(activityId: string, progress: number, metadata?: Record<string, any>): Promise<void> {
    if (!this.childId) {
      throw new Error('Not connected to any child session');
    }

    const update: ProgressUpdate = {
      childId: this.childId,
      activityId,
      progress,
      timestamp: new Date(),
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      metadata
    };

    if (this.isConnected && this.socket) {
      try {
        // Send real-time update
        this.socket.emit('progress-update', update);
        
        // Update local state immediately for responsive UI
        this.updateLocalProgressState(update);
        
      } catch (error) {
        console.error('Error sending progress update:', error);
        // Fall back to offline mode
        this.queueOfflineUpdate(update);
      }
    } else {
      // Queue for offline sync
      this.queueOfflineUpdate(update);
    }
  }

  private queueOfflineUpdate(update: ProgressUpdate): void {
    const offlineUpdate: OfflineProgressUpdate = {
      ...update,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false
    };

    this.offlineQueue.push(offlineUpdate);
    this.saveOfflineQueue();
    
    console.log('Progress update queued for offline sync:', offlineUpdate);
    this.emit('progress-queued', offlineUpdate);
  }

  private updateLocalProgressState(update: Partial<ProgressUpdate>): void {
    if (update.activityId && update.progress !== undefined) {
      const existing = this.progressState.get(update.activityId);
      if (existing) {
        existing.progress = update.progress;
        existing.lastAccessed = update.timestamp || new Date();
        if (update.metadata) {
          existing.sessionData = { ...existing.sessionData, ...update.metadata };
        }
      }
    }
  }

  private clearSyncedOfflineUpdates(): void {
    this.offlineQueue = this.offlineQueue.filter(update => !update.synced);
    this.saveOfflineQueue();
  }

  async requestSync(): Promise<void> {
    if (this.isConnected && this.socket && this.childId) {
      this.socket.emit('request-sync', {
        childId: this.childId,
        deviceId: this.deviceId
      });
    }
  }

  getProgressState(activityId: string): ProgressState | null {
    return this.progressState.get(activityId) || null;
  }

  getAllProgressState(): ProgressState[] {
    return Array.from(this.progressState.values());
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.filter(update => !update.synced).length;
  }

  isOnline(): boolean {
    return this.isConnected && navigator.onLine;
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.childId = null;
    this.progressState.clear();
    this.eventListeners.clear();
  }

  // Progress backup and recovery
  async createBackup(): Promise<string | null> {
    if (!this.isConnected || !this.socket || !this.childId) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Backup creation timeout'));
      }, 10000);

      this.socket!.emit('create-backup', { childId: this.childId });
      
      this.socket!.once('backup-created', (data: { backupId: string }) => {
        clearTimeout(timeout);
        resolve(data.backupId);
      });

      this.socket!.once('backup-error', (error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    if (!this.isConnected || !this.socket || !this.childId) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Backup restoration timeout'));
      }, 15000);

      this.socket!.emit('restore-backup', { 
        childId: this.childId, 
        backupId 
      });
      
      this.socket!.once('backup-restored', (data: { success: boolean }) => {
        clearTimeout(timeout);
        if (data.success) {
          this.requestSync(); // Refresh local state
        }
        resolve(data.success);
      });

      this.socket!.once('backup-error', (error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}

// Export singleton instance
export const realTimeProgressClient = new RealTimeProgressClient();