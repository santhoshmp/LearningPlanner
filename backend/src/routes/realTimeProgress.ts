import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { realTimeProgressService } from '../services/realTimeProgressService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get connected devices for a child
router.get('/child/:childId/devices', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify child belongs to authenticated user
    const child = await req.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parent_id: req.user.id
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const connectedDevices = realTimeProgressService.getConnectedDevices(childId);
    
    res.json({
      childId,
      connectedDevices,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error getting connected devices:', error);
    res.status(500).json({ error: 'Failed to get connected devices' });
  }
});

// Create progress backup
router.post('/child/:childId/backup', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify child belongs to authenticated user
    const child = await req.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parent_id: req.user.id
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const backupId = await realTimeProgressService.createProgressBackup(childId);
    
    res.json({
      backupId,
      childId,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error creating progress backup:', error);
    res.status(500).json({ error: 'Failed to create progress backup' });
  }
});

// Restore progress backup
router.post('/child/:childId/restore/:backupId', authenticateToken, async (req, res) => {
  try {
    const { childId, backupId } = req.params;
    
    // Verify child belongs to authenticated user
    const child = await req.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parent_id: req.user.id
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const success = await realTimeProgressService.restoreProgressBackup(childId, backupId);
    
    if (success) {
      // Broadcast update to connected devices
      await realTimeProgressService.broadcastProgressUpdate(childId, {
        action: 'backup_restored',
        backupId,
        timestamp: new Date()
      });
    }

    res.json({
      success,
      backupId,
      childId,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error restoring progress backup:', error);
    res.status(500).json({ error: 'Failed to restore progress backup' });
  }
});

// Queue offline progress update (for when real-time connection fails)
router.post('/child/:childId/queue-update', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { deviceId, activityId, progress, metadata } = req.body;
    
    // Verify child belongs to authenticated user
    const child = await req.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parent_id: req.user.id
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const update = {
      childId,
      activityId,
      progress,
      timestamp: new Date(),
      deviceId,
      sessionId: req.body.sessionId || `session_${Date.now()}`,
      metadata
    };

    await realTimeProgressService.queueOfflineUpdate(deviceId, update);
    
    res.json({
      success: true,
      queued: true,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error queuing offline update:', error);
    res.status(500).json({ error: 'Failed to queue offline update' });
  }
});

// Get progress sync status
router.get('/child/:childId/sync-status', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify child belongs to authenticated user
    const child = await req.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parent_id: req.user.id
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const connectedDevices = realTimeProgressService.getConnectedDevices(childId);
    
    // Get recent progress records to check sync status
    const recentProgress = await req.prisma.progressRecord.findMany({
      where: {
        child_id: childId,
        last_accessed: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        study_activity: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        last_accessed: 'desc'
      },
      take: 10
    });

    res.json({
      childId,
      connectedDevices,
      recentProgress: recentProgress.map(record => ({
        activityId: record.activity_id,
        activityTitle: record.study_activity?.title,
        progress: record.progress_percentage,
        lastAccessed: record.last_accessed,
        sessionData: record.session_data
      })),
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Broadcast progress update to all connected devices
router.post('/child/:childId/broadcast', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { message, data } = req.body;
    
    // Verify child belongs to authenticated user
    const child = await req.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parent_id: req.user.id
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    await realTimeProgressService.broadcastProgressUpdate(childId, {
      message,
      data,
      timestamp: new Date(),
      source: 'parent_dashboard'
    });
    
    res.json({
      success: true,
      broadcast: true,
      connectedDevices: realTimeProgressService.getConnectedDevices(childId),
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error broadcasting update:', error);
    res.status(500).json({ error: 'Failed to broadcast update' });
  }
});

export default router;