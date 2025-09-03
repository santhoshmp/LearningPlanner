import { PrismaClient } from '@prisma/client';
import { parentalNotificationService } from './parentalNotificationService';
import { parentalMonitoringService } from './parentalMonitoringService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class ScheduledNotificationService {
  private weeklyReportInterval: NodeJS.Timeout | null = null;
  private securityCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Start all scheduled notification jobs
   */
  start(): void {
    this.startWeeklyReports();
    this.startSecurityChecks();
    logger.info('Scheduled notification service started');
  }

  /**
   * Stop all scheduled notification jobs
   */
  stop(): void {
    if (this.weeklyReportInterval) {
      clearInterval(this.weeklyReportInterval);
      this.weeklyReportInterval = null;
    }
    
    if (this.securityCheckInterval) {
      clearInterval(this.securityCheckInterval);
      this.securityCheckInterval = null;
    }
    
    logger.info('Scheduled notification service stopped');
  }

  /**
   * Start weekly progress report job
   * Runs every Sunday at 9 AM
   */
  private startWeeklyReports(): void {
    // Calculate time until next Sunday 9 AM
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(9, 0, 0, 0);

    // If it's already past 9 AM on Sunday, schedule for next week
    if (now.getDay() === 0 && now.getHours() >= 9) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }

    const timeUntilNextRun = nextSunday.getTime() - now.getTime();

    setTimeout(() => {
      this.sendWeeklyReports();
      
      // Set up recurring weekly reports
      this.weeklyReportInterval = setInterval(() => {
        this.sendWeeklyReports();
      }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
      
    }, timeUntilNextRun);

    logger.info(`Weekly reports scheduled for ${nextSunday.toISOString()}`);
  }

  /**
   * Start security check job
   * Runs every hour
   */
  private startSecurityChecks(): void {
    this.securityCheckInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 60 * 60 * 1000); // Every hour

    // Also run immediately
    this.performSecurityChecks();

    logger.info('Security checks scheduled to run every hour');
  }

  /**
   * Send weekly progress reports to all parents
   */
  private async sendWeeklyReports(): Promise<void> {
    try {
      logger.info('Starting weekly report generation');

      const parents = await prisma.user.findMany({
        where: {
          role: 'PARENT',
          children: {
            some: {} // Has at least one child
          }
        },
        include: {
          settings: true
        }
      });

      let successCount = 0;
      let errorCount = 0;

      for (const parent of parents) {
        try {
          // Check if parent wants weekly reports
          if (parent.settings && parent.settings.emailNotifications) {
            await parentalNotificationService.sendWeeklyProgressReport(parent.id);
            successCount++;
          }
        } catch (error) {
          logger.error(`Error sending weekly report to parent ${parent.id}:`, error);
          errorCount++;
        }
      }

      logger.info(`Weekly reports completed: ${successCount} sent, ${errorCount} errors`);
    } catch (error) {
      logger.error('Error in weekly report job:', error);
    }
  }

  /**
   * Perform security checks for all children
   */
  private async performSecurityChecks(): Promise<void> {
    try {
      logger.info('Starting security checks');

      const children = await prisma.childProfile.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      });

      let alertCount = 0;

      for (const child of children) {
        try {
          await parentalNotificationService.checkAndSendSecurityAlerts(child.id);
          
          // Check for excessive help requests
          await this.checkHelpRequestPatterns(child.id);
          
          alertCount++;
        } catch (error) {
          logger.error(`Error checking security for child ${child.id}:`, error);
        }
      }

      logger.info(`Security checks completed for ${alertCount} children`);
    } catch (error) {
      logger.error('Error in security check job:', error);
    }
  }

  /**
   * Check for patterns in help requests that might indicate learning difficulties
   */
  private async checkHelpRequestPatterns(childId: string): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Check daily help requests
      const dailyHelpRequests = await prisma.helpRequest.count({
        where: {
          childId,
          timestamp: { gte: oneDayAgo }
        }
      });

      // Check weekly help requests
      const weeklyHelpRequests = await prisma.helpRequest.count({
        where: {
          childId,
          timestamp: { gte: oneWeekAgo }
        }
      });

      // Alert thresholds
      const dailyThreshold = 10;
      const weeklyThreshold = 25;

      if (dailyHelpRequests >= dailyThreshold) {
        await parentalNotificationService.sendHelpRequestAlert(
          childId, 
          dailyHelpRequests, 
          'day'
        );
      } else if (weeklyHelpRequests >= weeklyThreshold) {
        await parentalNotificationService.sendHelpRequestAlert(
          childId, 
          weeklyHelpRequests, 
          'week'
        );
      }
    } catch (error) {
      logger.error(`Error checking help request patterns for child ${childId}:`, error);
    }
  }

  /**
   * Send a test weekly report for a specific parent
   */
  async sendTestWeeklyReport(parentId: string): Promise<void> {
    try {
      await parentalNotificationService.sendWeeklyProgressReport(parentId);
      logger.info(`Test weekly report sent to parent ${parentId}`);
    } catch (error) {
      logger.error(`Error sending test weekly report to parent ${parentId}:`, error);
      throw error;
    }
  }

  /**
   * Manually trigger security checks for a specific child
   */
  async triggerSecurityCheck(childId: string): Promise<void> {
    try {
      await parentalNotificationService.checkAndSendSecurityAlerts(childId);
      await this.checkHelpRequestPatterns(childId);
      logger.info(`Security check completed for child ${childId}`);
    } catch (error) {
      logger.error(`Error in security check for child ${childId}:`, error);
      throw error;
    }
  }
}

export const scheduledNotificationService = new ScheduledNotificationService();