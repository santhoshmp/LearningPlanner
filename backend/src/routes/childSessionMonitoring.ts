import express from 'express';
import { PrismaClient } from '@prisma/client';
import { childSessionMonitoringService } from '../services/childSessionMonitoringService';
import { enhancedAuth, requireParentRole, requireChildRole } from '../middleware/enhancedAuth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const router = express.Router();

/**
 * Get active session information for a child (parent access)
 */
router.get('/child/:childId/session', enhancedAuth, requireParentRole, async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify parent owns this child
    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId: parentId
      }
    });

    if (!child) {
      return res.status(404).json({
        error: 'Child not found or access denied',
        code: 'CHILD_NOT_FOUND'
      });
    }

    const activeSession = childSessionMonitoringService.getActiveSession(childId);
    const sessionDuration = activeSession ? 
      childSessionMonitoringService.getSessionDuration(activeSession.sessionId) : 0;

    res.json({
      success: true,
      data: {
        hasActiveSession: !!activeSession,
        session: activeSession ? {
          sessionId: activeSession.sessionId,
          loginTime: activeSession.loginTime,
          lastActivity: activeSession.lastActivity,
          duration: sessionDuration,
          deviceInfo: activeSession.deviceInfo
        } : null
      }
    });
  } catch (error) {
    logger.error('Failed to get child session info:', error);
    res.status(500).json({
      error: 'Failed to get session information',
      code: 'SESSION_INFO_ERROR'
    });
  }
});

/**
 * Get session statistics (parent access)
 */
router.get('/sessions/stats', enhancedAuth, requireParentRole, async (req, res) => {
  try {
    const stats = childSessionMonitoringService.getSessionStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get session stats:', error);
    res.status(500).json({
      error: 'Failed to get session statistics',
      code: 'SESSION_STATS_ERROR'
    });
  }
});

/**
 * Terminate a child session (parent access)
 */
router.post('/child/:childId/session/terminate', enhancedAuth, requireParentRole, async (req, res) => {
  try {
    const { childId } = req.params;
    const { reason = 'PARENT_TERMINATED' } = req.body;
    const parentId = req.user.id;

    // Verify parent owns this child
    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId: parentId
      }
    });

    if (!child) {
      return res.status(404).json({
        error: 'Child not found or access denied',
        code: 'CHILD_NOT_FOUND'
      });
    }

    const activeSession = childSessionMonitoringService.getActiveSession(childId);
    if (!activeSession) {
      return res.status(404).json({
        error: 'No active session found',
        code: 'NO_ACTIVE_SESSION'
      });
    }

    await childSessionMonitoringService.terminateSession(activeSession.sessionId, reason);

    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    logger.error('Failed to terminate child session:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      code: 'SESSION_TERMINATE_ERROR'
    });
  }
});

/**
 * Get current session info (child access)
 */
router.get('/my-session', enhancedAuth, requireChildRole, async (req, res) => {
  try {
    const childId = req.user.id;
    const sessionId = req.sessionId;

    const activeSession = childSessionMonitoringService.getActiveSession(childId);
    const sessionDuration = activeSession ? 
      childSessionMonitoringService.getSessionDuration(activeSession.sessionId) : 0;

    res.json({
      success: true,
      data: {
        sessionId: sessionId,
        isActive: !!activeSession,
        duration: sessionDuration,
        loginTime: activeSession?.loginTime,
        lastActivity: activeSession?.lastActivity
      }
    });
  } catch (error) {
    logger.error('Failed to get current session info:', error);
    res.status(500).json({
      error: 'Failed to get session information',
      code: 'SESSION_INFO_ERROR'
    });
  }
});

/**
 * Update session activity (child access)
 */
router.post('/my-session/activity', enhancedAuth, requireChildRole, async (req, res) => {
  try {
    const sessionId = req.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID not found',
        code: 'SESSION_ID_MISSING'
      });
    }

    await childSessionMonitoringService.updateActivity(sessionId);

    res.json({
      success: true,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update session activity:', error);
    res.status(500).json({
      error: 'Failed to update activity',
      code: 'ACTIVITY_UPDATE_ERROR'
    });
  }
});

/**
 * Get security logs for a child (parent access)
 */
router.get('/child/:childId/security-logs', enhancedAuth, requireParentRole, async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const parentId = req.user.id;

    // Verify parent owns this child
    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId: parentId
      }
    });

    if (!child) {
      return res.status(404).json({
        error: 'Child not found or access denied',
        code: 'CHILD_NOT_FOUND'
      });
    }

    const securityLogs = await prisma.securityLog.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: {
        logs: securityLogs.map(log => ({
          id: log.id,
          event: log.event,
          severity: log.severity,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
          createdAt: log.createdAt
        })),
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: securityLogs.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get security logs:', error);
    res.status(500).json({
      error: 'Failed to get security logs',
      code: 'SECURITY_LOGS_ERROR'
    });
  }
});

/**
 * Cleanup expired sessions (admin/maintenance endpoint)
 */
router.post('/cleanup', async (req, res) => {
  try {
    // This should be protected by admin authentication in production
    const adminKey = req.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    await childSessionMonitoringService.cleanupExpiredSessions();

    res.json({
      success: true,
      message: 'Expired sessions cleaned up successfully'
    });
  } catch (error) {
    logger.error('Failed to cleanup expired sessions:', error);
    res.status(500).json({
      error: 'Failed to cleanup sessions',
      code: 'CLEANUP_ERROR'
    });
  }
});

export default router;