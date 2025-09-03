import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { parentalNotificationService } from './parentalNotificationService';

const prisma = new PrismaClient();

interface ChildSessionData {
  childId: string;
  sessionId: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
}

interface SuspiciousActivity {
  type: 'MULTIPLE_LOGINS' | 'UNUSUAL_LOCATION' | 'RAPID_REQUESTS' | 'INVALID_ACCESS_ATTEMPTS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  metadata: Record<string, any>;
}

class ChildSessionMonitoringService {
  private activeSessions = new Map<string, ChildSessionData>();
  private sessionTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly MAX_SESSION_DURATION = 20 * 60 * 1000; // 20 minutes
  private readonly ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity
  private readonly MAX_CONCURRENT_SESSIONS = 1;

  /**
   * Start monitoring a child session
   */
  async startSession(sessionData: ChildSessionData): Promise<void> {
    try {
      // Check for existing sessions
      const existingSessions = Array.from(this.activeSessions.values())
        .filter(session => session.childId === sessionData.childId);

      if (existingSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
        await this.handleSuspiciousActivity(sessionData.childId, {
          type: 'MULTIPLE_LOGINS',
          severity: 'MEDIUM',
          description: 'Multiple concurrent login attempts detected',
          metadata: { existingSessions: existingSessions.length }
        });
        
        // Terminate existing sessions
        for (const session of existingSessions) {
          await this.terminateSession(session.sessionId, 'SECURITY_VIOLATION');
        }
      }

      // Store session data
      this.activeSessions.set(sessionData.sessionId, sessionData);

      // Set session timeout
      const timeout = setTimeout(() => {
        this.terminateSession(sessionData.sessionId, 'TIMEOUT');
      }, this.MAX_SESSION_DURATION);
      
      this.sessionTimeouts.set(sessionData.sessionId, timeout);

      // Log session start
      await this.logSessionEvent(sessionData.childId, 'SESSION_START', {
        sessionId: sessionData.sessionId,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent
      });

      // Notify parent
      await this.notifyParentOfLogin(sessionData.childId, sessionData);

      logger.info(`Child session started: ${sessionData.sessionId} for child: ${sessionData.childId}`);
    } catch (error) {
      logger.error('Failed to start child session monitoring:', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.lastActivity = new Date();
    
    // Reset activity timeout
    const existingTimeout = this.sessionTimeouts.get(sessionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.terminateSession(sessionId, 'INACTIVITY');
    }, this.ACTIVITY_TIMEOUT);
    
    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Validate session and check for suspicious activity
   */
  async validateSession(sessionId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check for IP address changes
    if (session.ipAddress !== ipAddress) {
      await this.handleSuspiciousActivity(session.childId, {
        type: 'UNUSUAL_LOCATION',
        severity: 'HIGH',
        description: 'IP address changed during session',
        metadata: { 
          originalIp: session.ipAddress, 
          newIp: ipAddress,
          sessionId 
        }
      });
      return false;
    }

    // Check for user agent changes
    if (session.userAgent !== userAgent) {
      await this.handleSuspiciousActivity(session.childId, {
        type: 'UNUSUAL_LOCATION',
        severity: 'MEDIUM',
        description: 'User agent changed during session',
        metadata: { 
          originalUserAgent: session.userAgent, 
          newUserAgent: userAgent,
          sessionId 
        }
      });
    }

    await this.updateActivity(sessionId);
    return true;
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      // Clear timeouts
      const timeout = this.sessionTimeouts.get(sessionId);
      if (timeout) {
        clearTimeout(timeout);
        this.sessionTimeouts.delete(sessionId);
      }

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Log session end
      await this.logSessionEvent(session.childId, 'SESSION_END', {
        sessionId,
        reason,
        duration: Date.now() - session.loginTime.getTime()
      });

      // Notify parent if terminated due to security
      if (reason === 'SECURITY_VIOLATION') {
        await this.notifyParentOfSecurityEvent(session.childId, reason);
      } else {
        await this.notifyParentOfLogout(session.childId, reason);
      }

      logger.info(`Child session terminated: ${sessionId} for child: ${session.childId}, reason: ${reason}`);
    } catch (error) {
      logger.error('Failed to terminate child session:', error);
    }
  }

  /**
   * Get active session for child
   */
  getActiveSession(childId: string): ChildSessionData | null {
    for (const session of this.activeSessions.values()) {
      if (session.childId === childId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Get session duration
   */
  getSessionDuration(sessionId: string): number {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return 0;
    }
    return Date.now() - session.loginTime.getTime();
  }

  /**
   * Handle suspicious activity
   */
  private async handleSuspiciousActivity(childId: string, activity: SuspiciousActivity): Promise<void> {
    try {
      // Log suspicious activity
      await this.logSecurityEvent(childId, activity);

      // Notify parent immediately for high severity
      if (activity.severity === 'HIGH') {
        await this.notifyParentOfSecurityEvent(childId, activity.description);
        
        // Terminate all sessions for high severity
        const sessions = Array.from(this.activeSessions.values())
          .filter(session => session.childId === childId);
        
        for (const session of sessions) {
          await this.terminateSession(session.sessionId, 'SECURITY_VIOLATION');
        }
      }

      logger.warn(`Suspicious activity detected for child ${childId}:`, activity);
    } catch (error) {
      logger.error('Failed to handle suspicious activity:', error);
    }
  }

  /**
   * Log session events
   */
  private async logSessionEvent(childId: string, event: string, metadata: Record<string, any>): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId: null,
          childId,
          event,
          ipAddress: metadata.ipAddress || 'unknown',
          userAgent: metadata.userAgent || 'unknown',
          metadata: JSON.stringify(metadata),
          severity: 'INFO',
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log session event:', error);
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(childId: string, activity: SuspiciousActivity): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId: null,
          childId,
          event: activity.type,
          ipAddress: 'unknown',
          userAgent: 'unknown',
          metadata: JSON.stringify(activity.metadata),
          severity: activity.severity,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Notify parent of child login
   */
  private async notifyParentOfLogin(childId: string, sessionData: ChildSessionData): Promise<void> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: { parent: true }
      });

      if (child?.parent) {
        await parentalNotificationService.sendNotification(child.parent.id, {
          type: 'CHILD_LOGIN',
          title: 'Child Logged In',
          message: `${child.name} has logged into their learning account`,
          metadata: {
            childId,
            childName: child.name,
            loginTime: sessionData.loginTime.toISOString(),
            ipAddress: sessionData.ipAddress
          }
        });
      }
    } catch (error) {
      logger.error('Failed to notify parent of login:', error);
    }
  }

  /**
   * Notify parent of child logout
   */
  private async notifyParentOfLogout(childId: string, reason: string): Promise<void> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: { parent: true }
      });

      if (child?.parent) {
        await parentalNotificationService.sendNotification(child.parent.id, {
          type: 'CHILD_LOGOUT',
          title: 'Child Logged Out',
          message: `${child.name} has logged out of their learning account (${reason})`,
          metadata: {
            childId,
            childName: child.name,
            logoutTime: new Date().toISOString(),
            reason
          }
        });
      }
    } catch (error) {
      logger.error('Failed to notify parent of logout:', error);
    }
  }

  /**
   * Notify parent of security event
   */
  private async notifyParentOfSecurityEvent(childId: string, description: string): Promise<void> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: { parent: true }
      });

      if (child?.parent) {
        await parentalNotificationService.sendNotification(child.parent.id, {
          type: 'SECURITY_ALERT',
          title: 'Security Alert',
          message: `Security event detected for ${child.name}: ${description}`,
          metadata: {
            childId,
            childName: child.name,
            eventTime: new Date().toISOString(),
            description
          },
          priority: 'HIGH'
        });
      }
    } catch (error) {
      logger.error('Failed to notify parent of security event:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const sessionAge = now - session.loginTime.getTime();
      const inactivityTime = now - session.lastActivity.getTime();

      if (sessionAge > this.MAX_SESSION_DURATION || inactivityTime > this.ACTIVITY_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.terminateSession(sessionId, 'EXPIRED');
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
  } {
    const activeSessions = this.activeSessions.size;
    let totalDuration = 0;

    for (const session of this.activeSessions.values()) {
      totalDuration += Date.now() - session.loginTime.getTime();
    }

    return {
      activeSessions,
      totalSessions: activeSessions,
      averageSessionDuration: activeSessions > 0 ? totalDuration / activeSessions : 0
    };
  }
}

export const childSessionMonitoringService = new ChildSessionMonitoringService();