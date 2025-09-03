import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService';
import { parentalMonitoringService } from './parentalMonitoringService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface NotificationPreferences {
  loginNotifications: boolean;
  achievementNotifications: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  helpRequestAlerts: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
}

class ParentalNotificationService {
  async sendLoginNotification(childId: string, deviceInfo: any, ipAddress: string): Promise<void> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          parent: true,
          settings: true
        }
      });

      if (!child || !child.parent) {
        logger.warn(`Child or parent not found for login notification: ${childId}`);
        return;
      }

      // Check if parent wants login notifications
      const parentSettings = await prisma.userSettings.findUnique({
        where: { userId: child.parentId }
      });

      if (parentSettings && !parentSettings.emailNotifications) {
        return; // Parent has disabled email notifications
      }

      const deviceDescription = this.formatDeviceInfo(deviceInfo);
      const loginTime = new Date().toLocaleString();

      await emailService.sendChildLoginNotification(
        child.parent.email,
        child.parent.firstName || 'Parent',
        child.name,
        deviceDescription,
        loginTime
      );

      // Log the notification
      await prisma.notification.create({
        data: {
          userId: child.parentId,
          type: 'child_login',
          message: `${child.name} logged in from ${deviceDescription}`,
          details: {
            childId: child.id,
            childName: child.name,
            deviceInfo,
            ipAddress,
            timestamp: new Date()
          }
        }
      });

    } catch (error) {
      logger.error('Error sending login notification:', error);
    }
  }

  async sendAchievementNotification(childId: string, achievementId: string): Promise<void> {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
        include: {
          child: {
            include: {
              parent: true
            }
          }
        }
      });

      if (!achievement || !achievement.child.parent) {
        logger.warn(`Achievement or parent not found for notification: ${achievementId}`);
        return;
      }

      // Check if parent wants achievement notifications
      const parentSettings = await prisma.userSettings.findUnique({
        where: { userId: achievement.child.parentId }
      });

      if (parentSettings && !parentSettings.emailNotifications) {
        return;
      }

      await emailService.sendChildAchievementNotification(
        achievement.child.parent.email,
        achievement.child.parent.firstName || 'Parent',
        achievement.child.name,
        {
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt
        }
      );

      // Mark achievement as parent notified
      await prisma.achievement.update({
        where: { id: achievementId },
        data: { parentNotified: true }
      });

      // Log the notification
      await prisma.notification.create({
        data: {
          userId: achievement.child.parentId,
          type: 'child_achievement',
          message: `${achievement.child.name} earned: ${achievement.title}`,
          details: {
            childId: achievement.child.id,
            childName: achievement.child.name,
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            achievementType: achievement.type
          }
        }
      });

    } catch (error) {
      logger.error('Error sending achievement notification:', error);
    }
  }

  async sendWeeklyProgressReport(parentId: string): Promise<void> {
    try {
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        include: {
          children: {
            include: {
              progressRecords: {
                where: {
                  updatedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                  }
                },
                include: {
                  activity: {
                    include: {
                      plan: true
                    }
                  }
                }
              },
              achievements: {
                where: {
                  earnedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              },
              learningStreaks: {
                where: { streakType: 'DAILY' }
              }
            }
          },
          settings: true
        }
      });

      if (!parent || !parent.settings?.emailNotifications) {
        return;
      }

      for (const child of parent.children) {
        const completedActivities = child.progressRecords.filter(p => p.status === 'COMPLETED');
        const totalTimeSpent = child.progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        const averageScore = completedActivities.length > 0
          ? Math.round(completedActivities.reduce((sum, p) => sum + (p.score || 0), 0) / completedActivities.length)
          : 0;

        // Calculate subject progress
        const subjectProgress = this.calculateSubjectProgress(child.progressRecords);
        const dailyStreak = child.learningStreaks.find(s => s.streakType === 'DAILY');

        const weeklyStats = {
          activitiesCompleted: completedActivities.length,
          totalTimeSpent,
          averageScore,
          streakDays: dailyStreak?.currentCount || 0,
          badgesEarned: child.achievements.length,
          subjectProgress
        };

        await emailService.sendWeeklyProgressSummary(
          parent.email,
          parent.firstName || 'Parent',
          child.name,
          weeklyStats
        );

        // Log the notification
        await prisma.notification.create({
          data: {
            userId: parent.id,
            type: 'weekly_report',
            message: `Weekly progress report for ${child.name}`,
            details: {
              childId: child.id,
              childName: child.name,
              weeklyStats
            }
          }
        });
      }

    } catch (error) {
      logger.error('Error sending weekly progress report:', error);
    }
  }

  async checkAndSendSecurityAlerts(childId: string): Promise<void> {
    try {
      const alerts = await parentalMonitoringService.checkForSuspiciousActivity(childId);
      
      if (alerts.length === 0) {
        return;
      }

      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          parent: true
        }
      });

      if (!child || !child.parent) {
        return;
      }

      // Check if parent wants security alerts
      const parentSettings = await prisma.userSettings.findUnique({
        where: { userId: child.parentId }
      });

      if (parentSettings && !parentSettings.emailNotifications) {
        return;
      }

      await emailService.sendSuspiciousActivityAlert(
        child.parent.email,
        child.parent.firstName || 'Parent',
        child.name,
        alerts.map(alert => ({
          alertType: alert.alertType,
          severity: alert.severity,
          description: alert.description,
          timestamp: alert.timestamp
        }))
      );

      // Log security alerts
      for (const alert of alerts) {
        await prisma.notification.create({
          data: {
            userId: child.parentId,
            type: 'security_alert',
            message: `Security alert for ${child.name}: ${alert.description}`,
            details: {
              childId: child.id,
              childName: child.name,
              alertType: alert.alertType,
              severity: alert.severity,
              description: alert.description,
              alertDetails: alert.details
            }
          }
        });
      }

    } catch (error) {
      logger.error('Error checking and sending security alerts:', error);
    }
  }

  async sendHelpRequestAlert(childId: string, helpRequestCount: number, timeframe: string): Promise<void> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          parent: true,
          helpRequests: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - (timeframe === 'day' ? 24 : 7 * 24) * 60 * 60 * 1000)
              }
            }
          }
        }
      });

      if (!child || !child.parent) {
        return;
      }

      // Check if parent wants help request alerts
      const parentSettings = await prisma.userSettings.findUnique({
        where: { userId: child.parentId }
      });

      if (parentSettings && !parentSettings.emailNotifications) {
        return;
      }

      // Analyze help request patterns
      const helpTopics = this.analyzeHelpTopics(child.helpRequests);
      const suggestions = this.generateHelpSuggestions(helpRequestCount, helpTopics);

      // Create parent notification record
      await prisma.parentNotification.create({
        data: {
          childId: child.id,
          type: 'frequent_help_requests',
          message: `${child.name} has requested help ${helpRequestCount} times this ${timeframe}`,
          helpRequestCount,
          timeframe,
          suggestions
        }
      });

      // Log the notification
      await prisma.notification.create({
        data: {
          userId: child.parentId,
          type: 'help_request_alert',
          message: `${child.name} needs extra support - ${helpRequestCount} help requests this ${timeframe}`,
          details: {
            childId: child.id,
            childName: child.name,
            helpRequestCount,
            timeframe,
            topTopics: helpTopics.slice(0, 3),
            suggestions
          }
        }
      });

    } catch (error) {
      logger.error('Error sending help request alert:', error);
    }
  }

  async getParentNotifications(parentId: string, limit: number = 20): Promise<any[]> {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: parentId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return notifications;
    } catch (error) {
      logger.error('Error getting parent notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  async updateNotificationPreferences(
    parentId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await prisma.userSettings.upsert({
        where: { userId: parentId },
        update: {
          emailNotifications: preferences.loginNotifications !== false // Default to true
        },
        create: {
          userId: parentId,
          emailNotifications: preferences.loginNotifications !== false
        }
      });

      // Store detailed preferences in user settings
      const existingSettings = await prisma.userSettings.findUnique({
        where: { userId: parentId }
      });

      // For now, we'll use the emailNotifications field as the main toggle
      // In the future, we could add more granular preference fields to the schema
      
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
    }
  }

  private formatDeviceInfo(deviceInfo: any): string {
    if (!deviceInfo) return 'Unknown device';
    
    const platform = deviceInfo.platform || 'Unknown platform';
    const isMobile = deviceInfo.isMobile ? 'Mobile' : 'Desktop';
    
    return `${isMobile} (${platform})`;
  }

  private calculateSubjectProgress(progressRecords: any[]): Array<{
    subject: string;
    activitiesCompleted: number;
    averageScore: number;
  }> {
    const subjectMap = new Map();

    progressRecords.forEach(record => {
      if (record.status === 'COMPLETED' && record.activity?.plan?.subject) {
        const subject = record.activity.plan.subject;
        
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, {
            subject,
            activitiesCompleted: 0,
            totalScore: 0,
            scoreCount: 0
          });
        }

        const subjectData = subjectMap.get(subject);
        subjectData.activitiesCompleted++;
        
        if (record.score !== null) {
          subjectData.totalScore += record.score;
          subjectData.scoreCount++;
        }
      }
    });

    return Array.from(subjectMap.values()).map(data => ({
      subject: data.subject,
      activitiesCompleted: data.activitiesCompleted,
      averageScore: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : 0
    }));
  }

  private analyzeHelpTopics(helpRequests: any[]): Array<{ topic: string; count: number }> {
    const topicCounts = new Map();

    helpRequests.forEach(request => {
      const context = request.context || {};
      const topic = context.subject || context.topic || 'General';
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

    return Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }

  private generateHelpSuggestions(helpRequestCount: number, helpTopics: Array<{ topic: string; count: number }>): string[] {
    const suggestions: string[] = [];

    if (helpRequestCount > 10) {
      suggestions.push('Consider reviewing the difficulty level of current activities');
      suggestions.push('Schedule a one-on-one session to identify learning gaps');
    }

    if (helpTopics.length > 0) {
      const topTopic = helpTopics[0];
      suggestions.push(`Focus on additional practice in ${topTopic.topic}`);
      suggestions.push(`Consider supplementary resources for ${topTopic.topic}`);
    }

    if (helpRequestCount > 5) {
      suggestions.push('Break down complex topics into smaller, manageable steps');
      suggestions.push('Encourage regular breaks to prevent frustration');
    }

    return suggestions;
  }
}

export const parentalNotificationService = new ParentalNotificationService();