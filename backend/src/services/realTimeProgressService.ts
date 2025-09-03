import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { redisService } from './redisService';

interface ProgressUpdate {
  childId: string;
  activityId: string;
  progress: number;
  timestamp: Date;
  deviceId: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface ProgressConflict {
  childId: string;
  activityId: string;
  conflicts: ProgressUpdate[];
  resolvedProgress: number;
  resolutionStrategy: 'latest' | 'highest' | 'merge';
}

class RealTimeProgressService {
  private io: SocketIOServer | null = null;
  private connectedClients = new Map<string, Set<string>>(); // childId -> Set of socketIds
  private deviceSessions = new Map<string, string>(); // socketId -> deviceId
  private offlineQueue = new Map<string, ProgressUpdate[]>(); // deviceId -> queued updates

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    logger.info('Real-time progress service initialized');
  }

  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join-child-room', async (data: { childId: string; deviceId: string; sessionId: string }) => {
        try {
          const { childId, deviceId, sessionId } = data;
          
          // Validate child access
          const child = await prisma.childProfile.findUnique({
            where: { id: childId }
          });

          if (!child) {
            socket.emit('error', { message: 'Child not found' });
            return;
          }

          // Join room for this child
          socket.join(`child-${childId}`);
          
          // Track connection
          if (!this.connectedClients.has(childId)) {
            this.connectedClients.set(childId, new Set());
          }
          this.connectedClients.get(childId)!.add(socket.id);
          this.deviceSessions.set(socket.id, deviceId);

          // Send any pending offline updates
          await this.syncOfflineUpdates(childId, deviceId, socket);

          socket.emit('joined', { childId, deviceId });
          logger.info(`Client ${socket.id} joined room for child ${childId}`);

        } catch (error) {
          logger.error('Error joining child room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('progress-update', async (data: ProgressUpdate) => {
        try {
          await this.handleProgressUpdate(data, socket);
        } catch (error) {
          logger.error('Error handling progress update:', error);
          socket.emit('progress-error', { error: 'Failed to update progress' });
        }
      });

      socket.on('request-sync', async (data: { childId: string; deviceId: string }) => {
        try {
          await this.handleSyncRequest(data.childId, data.deviceId, socket);
        } catch (error) {
          logger.error('Error handling sync request:', error);
          socket.emit('sync-error', { error: 'Failed to sync progress' });
        }
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleProgressUpdate(update: ProgressUpdate, socket: any): Promise<void> {
    const { childId, activityId, progress, timestamp, deviceId, sessionId, metadata } = update;

    // Check for conflicts with other devices
    const conflicts = await this.detectProgressConflicts(childId, activityId, update);
    
    if (conflicts.length > 0) {
      const resolution = await this.resolveProgressConflicts(childId, activityId, [...conflicts, update]);
      
      // Broadcast resolved progress to all devices
      this.io?.to(`child-${childId}`).emit('progress-resolved', {
        childId,
        activityId,
        resolvedProgress: resolution.resolvedProgress,
        resolutionStrategy: resolution.resolutionStrategy,
        timestamp: new Date()
      });

      // Update database with resolved progress
      await this.persistProgressUpdate({
        ...update,
        progress: resolution.resolvedProgress
      });
    } else {
      // No conflicts, proceed with normal update
      await this.persistProgressUpdate(update);
      
      // Broadcast to other devices in the same child room (excluding sender)
      socket.to(`child-${childId}`).emit('progress-updated', {
        childId,
        activityId,
        progress,
        timestamp,
        deviceId,
        metadata
      });
    }

    // Cache latest progress in Redis for quick access
    await this.cacheProgressUpdate(update);
  }

  private async detectProgressConflicts(
    childId: string, 
    activityId: string, 
    newUpdate: ProgressUpdate
  ): Promise<ProgressUpdate[]> {
    const cacheKey = `progress:${childId}:${activityId}`;
    const cachedUpdates = await redisService.get(cacheKey);
    
    if (!cachedUpdates) return [];

    const recentUpdates: ProgressUpdate[] = JSON.parse(cachedUpdates);
    const conflictThreshold = 5000; // 5 seconds

    return recentUpdates.filter(update => {
      const timeDiff = Math.abs(new Date(newUpdate.timestamp).getTime() - new Date(update.timestamp).getTime());
      return timeDiff < conflictThreshold && update.deviceId !== newUpdate.deviceId;
    });
  }

  private async resolveProgressConflicts(
    childId: string,
    activityId: string,
    conflictingUpdates: ProgressUpdate[]
  ): Promise<ProgressConflict> {
    // Sort by timestamp
    const sortedUpdates = conflictingUpdates.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Resolution strategies
    const latestUpdate = sortedUpdates[0];
    const highestProgress = Math.max(...sortedUpdates.map(u => u.progress));
    
    // Use highest progress as default resolution strategy
    const resolvedProgress = highestProgress;
    const resolutionStrategy: 'latest' | 'highest' | 'merge' = 'highest';

    // Log conflict resolution
    logger.info(`Progress conflict resolved for child ${childId}, activity ${activityId}`, {
      conflictingUpdates: sortedUpdates.length,
      resolvedProgress,
      resolutionStrategy
    });

    return {
      childId,
      activityId,
      conflicts: sortedUpdates,
      resolvedProgress,
      resolutionStrategy
    };
  }

  private async persistProgressUpdate(update: ProgressUpdate): Promise<void> {
    try {
      await prisma.progressRecord.upsert({
        where: {
          childId_activityId: {
            childId: update.childId,
            activityId: update.activityId
          }
        },
        update: {
          score: update.progress,
          updatedAt: update.timestamp,
          sessionData: {
            ...update.metadata,
            deviceId: update.deviceId,
            sessionId: update.sessionId,
            lastUpdate: update.timestamp
          }
        },
        create: {
          childId: update.childId,
          activityId: update.activityId,
          score: update.progress,
          updatedAt: update.timestamp,
          sessionData: {
            ...update.metadata,
            deviceId: update.deviceId,
            sessionId: update.sessionId,
            lastUpdate: update.timestamp
          }
        }
      });
    } catch (error) {
      logger.error('Error persisting progress update:', error);
      throw error;
    }
  }

  private async cacheProgressUpdate(update: ProgressUpdate): Promise<void> {
    const cacheKey = `progress:${update.childId}:${update.activityId}`;
    const ttl = 300; // 5 minutes

    try {
      // Get existing cached updates
      const existing = await redisService.get(cacheKey);
      const updates: ProgressUpdate[] = existing ? JSON.parse(existing) : [];
      
      // Add new update and keep only recent ones (last 10)
      updates.unshift(update);
      const recentUpdates = updates.slice(0, 10);
      
      await redisService.set(cacheKey, JSON.stringify(recentUpdates), ttl);
    } catch (error) {
      logger.error('Error caching progress update:', error);
    }
  }

  private async syncOfflineUpdates(childId: string, deviceId: string, socket: any): Promise<void> {
    try {
      // Get queued offline updates for this device
      const queuedUpdates = this.offlineQueue.get(deviceId) || [];
      
      if (queuedUpdates.length > 0) {
        logger.info(`Syncing ${queuedUpdates.length} offline updates for device ${deviceId}`);
        
        // Process each queued update
        for (const update of queuedUpdates) {
          await this.handleProgressUpdate(update, socket);
        }
        
        // Clear the queue
        this.offlineQueue.delete(deviceId);
        
        socket.emit('offline-sync-complete', {
          syncedUpdates: queuedUpdates.length,
          timestamp: new Date()
        });
      }

      // Send current progress state
      const currentProgress = await this.getCurrentProgressState(childId);
      socket.emit('progress-state', currentProgress);

    } catch (error) {
      logger.error('Error syncing offline updates:', error);
      socket.emit('sync-error', { error: 'Failed to sync offline updates' });
    }
  }

  private async getCurrentProgressState(childId: string): Promise<any> {
    try {
      const progressRecords = await prisma.progressRecord.findMany({
        where: { childId: childId },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              planId: true
            }
          }
        }
      });

      return progressRecords.map(record => ({
        activityId: record.activityId,
        progress: record.score || 0,
        lastAccessed: record.updatedAt,
        sessionData: record.sessionData,
        activity: record.activity
      }));
    } catch (error) {
      logger.error('Error getting current progress state:', error);
      return [];
    }
  }

  private async handleSyncRequest(childId: string, deviceId: string, socket: any): Promise<void> {
    try {
      const currentState = await this.getCurrentProgressState(childId);
      socket.emit('sync-response', {
        childId,
        deviceId,
        progressState: currentState,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error handling sync request:', error);
      socket.emit('sync-error', { error: 'Failed to get progress state' });
    }
  }

  private handleDisconnect(socket: any): void {
    logger.info(`Client disconnected: ${socket.id}`);
    
    // Remove from tracking
    const deviceId = this.deviceSessions.get(socket.id);
    this.deviceSessions.delete(socket.id);
    
    // Remove from child rooms
    for (const [childId, socketIds] of this.connectedClients.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          this.connectedClients.delete(childId);
        }
        break;
      }
    }
  }

  // Public methods for external use
  async queueOfflineUpdate(deviceId: string, update: ProgressUpdate): Promise<void> {
    if (!this.offlineQueue.has(deviceId)) {
      this.offlineQueue.set(deviceId, []);
    }
    this.offlineQueue.get(deviceId)!.push(update);
    
    // Persist to Redis for durability
    const queueKey = `offline_queue:${deviceId}`;
    await redisService.set(queueKey, JSON.stringify(this.offlineQueue.get(deviceId)), 86400); // 24 hours
  }

  async broadcastProgressUpdate(childId: string, update: Partial<ProgressUpdate>): Promise<void> {
    if (this.io) {
      this.io.to(`child-${childId}`).emit('progress-broadcast', {
        ...update,
        timestamp: new Date()
      });
    }
  }

  async createProgressBackup(childId: string): Promise<string> {
    try {
      const progressData = await this.getCurrentProgressState(childId);
      const backupId = `backup_${childId}_${Date.now()}`;
      const backupKey = `progress_backup:${backupId}`;
      
      await redisService.set(backupKey, JSON.stringify(progressData), 604800); // 7 days
      
      logger.info(`Progress backup created for child ${childId}: ${backupId}`);
      return backupId;
    } catch (error) {
      logger.error('Error creating progress backup:', error);
      throw error;
    }
  }

  async restoreProgressBackup(childId: string, backupId: string): Promise<boolean> {
    try {
      const backupKey = `progress_backup:${backupId}`;
      const backupData = await redisService.get(backupKey);
      
      if (!backupData) {
        logger.warn(`Backup not found: ${backupId}`);
        return false;
      }

      const progressData = JSON.parse(backupData);
      
      // Restore progress records
      for (const record of progressData) {
        await prisma.progressRecord.upsert({
          where: {
            childId_activityId: {
              childId: childId,
              activityId: record.activityId
            }
          },
          update: {
            score: record.progress,
            updatedAt: new Date(record.lastAccessed),
            sessionData: record.sessionData
          },
          create: {
            childId: childId,
            activityId: record.activityId,
            score: record.progress,
            updatedAt: new Date(record.lastAccessed),
            sessionData: record.sessionData
          }
        });
      }

      logger.info(`Progress backup restored for child ${childId}: ${backupId}`);
      return true;
    } catch (error) {
      logger.error('Error restoring progress backup:', error);
      return false;
    }
  }

  getConnectedDevices(childId: string): number {
    return this.connectedClients.get(childId)?.size || 0;
  }
}

export const realTimeProgressService = new RealTimeProgressService();