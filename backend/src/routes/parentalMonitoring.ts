import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { parentalMonitoringService } from '../services/parentalMonitoringService';
import { parentalNotificationService } from '../services/parentalNotificationService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get child activity summary for parent dashboard
router.get('/activity-summary', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await parentalMonitoringService.getChildActivitySummary(parentId);
    res.json(summary);
  } catch (error) {
    logger.error('Error getting activity summary:', error);
    res.status(500).json({ error: 'Failed to get activity summary' });
  }
});

// Get detailed activity report for a specific child
router.get('/detailed-report/:childId', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify child belongs to parent
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const report = await parentalMonitoringService.getDetailedActivityReport(childId, start, end);
    res.json(report);
  } catch (error) {
    logger.error('Error getting detailed report:', error);
    res.status(500).json({ error: 'Failed to get detailed report' });
  }
});

// Check for suspicious activity alerts
router.get('/security-alerts/:childId', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;
    const { childId } = req.params;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify child belongs to parent
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const alerts = await parentalMonitoringService.checkForSuspiciousActivity(childId);
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting security alerts:', error);
    res.status(500).json({ error: 'Failed to get security alerts' });
  }
});

// Get parent notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;
    const { limit } = req.query;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await parentalNotificationService.getParentNotifications(
      parentId, 
      limit ? parseInt(limit as string) : 20
    );
    res.json(notifications);
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;
    const { notificationId } = req.params;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify notification belongs to parent
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: parentId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await parentalNotificationService.markNotificationAsRead(notificationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Update notification preferences
router.put('/notification-preferences', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;
    const preferences = req.body;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await parentalNotificationService.updateNotificationPreferences(parentId, preferences);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Send weekly progress report manually
router.post('/send-weekly-report', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.id;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await parentalNotificationService.sendWeeklyProgressReport(parentId);
    res.json({ success: true, message: 'Weekly report sent successfully' });
  } catch (error) {
    logger.error('Error sending weekly report:', error);
    res.status(500).json({ error: 'Failed to send weekly report' });
  }
});

export default router;