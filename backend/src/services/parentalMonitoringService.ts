import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ChildActivitySummary {
  childId: string;
  childName: string;
  loginSessions: {
    total: number;
    today: number;
    thisWeek: number;
    averageSessionDuration: number;
    lastLogin: Date | null;
  };
  progress: {
    activitiesCompleted: number;
    totalActivities: number;
    completionRate: number;
    averageScore: number;
    timeSpent: number; // in minutes
  };
  achievements: {
    badgesEarned: number;
    recentBadges: Array<{
      title: string;
      earnedAt: Date;
      type: string;
    }>;
  };
  streaks: {
    currentDailyStreak: number;
    longestStreak: number;
    isActive: boolean;
  };
  helpRequests: {
    total: number;
    thisWeek: number;
    frequentTopics: Array<{
      topic: string;
      count: number;
    }>;
  };
  suspiciousActivity: {
    multipleFailedLogins: boolean;
    unusualLoginTimes: boolean;
    deviceChanges: boolean;
    lastSecurityEvent: Date | null;
  };
}

export interface DetailedActivityReport {
  childId: string;
  childName: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  sessions: Array<{
    id: string;
    loginTime: Date;
    logoutTime: Date | null;
    duration: number; // in seconds
    activitiesCompleted: number;
    badgesEarned: number;
    deviceInfo: any;
    ipAddress: string | null;
  }>;
  progressDetails: Array<{
    activityId: string;
    activityTitle: string;
    subject: string;
    status: string;
    score: number | null;
    timeSpent: number;
    attempts: number;
    completedAt: Date | null;
    helpRequestsCount: number;
  }>;
  achievements: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    earnedAt: Date;
    celebrationShown: boolean;
  }>;
  helpAnalytics: {
    totalRequests: number;
    averageRequestsPerSession: number;
    topicBreakdown: Array<{
      topic: string;
      count: number;
      percentage: number;
    }>;
    timePatterns: Array<{
      hour: number;
      count: number;
    }>;
  };
}

export interface SuspiciousActivityAlert {
  childId: string;
  childName: string;
  alertType: 'multiple_failed_logins' | 'unusual_login_time' | 'new_device' | 'rapid_progress' | 'excessive_help_requests';
  severity: 'low' | 'medium' | 'high';
  description: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}

class ParentalMonitoringService {
  async getChildActivitySummary(parentId: string): Promise<ChildActivitySummary[]> {
    try {
      const children = await prisma.childProfile.findMany({
        where: { parentId },
        include: {
          loginSessions: {
            orderBy: { loginTime: 'desc' },
            take: 50
          },
          progressRecords: {
            include: {
              activity: {
                include: {
                  plan: true
                }
              }
            }
          },
          achievements: {
            orderBy: { earnedAt: 'desc' },
            take: 10
          },
          learningStreaks: {
            where: { streakType: 'DAILY' }
          },
          helpRequests: {
            orderBy: { timestamp: 'desc' }
          },
          securityLogs: {
            orderBy: { timestamp: 'desc' },
            take: 20
          }
        }
      });

      const summaries: ChildActivitySummary[] = [];

      for (const child of children) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Calculate login session metrics
        const todaySessions = child.loginSessions.filter(s => s.loginTime >= today);
        const weekSessions = child.loginSessions.filter(s => s.loginTime >= weekAgo);
        const completedSessions = child.loginSessions.filter(s => s.logoutTime);
        const avgDuration = completedSessions.length > 0 
          ? completedSessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / completedSessions.length
          : 0;

        // Calculate progress metrics
        const completedActivities = child.progressRecords.filter(p => p.status === 'COMPLETED');
        const totalTimeSpent = child.progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
        const avgScore = completedActivities.length > 0
          ? completedActivities.reduce((sum, p) => sum + (p.score || 0), 0) / completedActivities.length
          : 0;

        // Calculate help request metrics
        const weekHelpRequests = child.helpRequests.filter(h => h.timestamp >= weekAgo);
        const helpTopics = this.analyzeHelpTopics(child.helpRequests);

        // Check for suspicious activity
        const suspiciousActivity = await this.analyzeSuspiciousActivity(child.id);

        // Get current streak
        const dailyStreak = child.learningStreaks.find(s => s.streakType === 'DAILY');

        summaries.push({
          childId: child.id,
          childName: child.name,
          loginSessions: {
            total: child.loginSessions.length,
            today: todaySessions.length,
            thisWeek: weekSessions.length,
            averageSessionDuration: Math.round(avgDuration),
            lastLogin: child.loginSessions[0]?.loginTime || null
          },
          progress: {
            activitiesCompleted: completedActivities.length,
            totalActivities: child.progressRecords.length,
            completionRate: child.progressRecords.length > 0 
              ? Math.round((completedActivities.length / child.progressRecords.length) * 100)
              : 0,
            averageScore: Math.round(avgScore),
            timeSpent: totalTimeSpent
          },
          achievements: {
            badgesEarned: child.achievements.length,
            recentBadges: child.achievements.slice(0, 5).map(a => ({
              title: a.title,
              earnedAt: a.earnedAt,
              type: a.type
            }))
          },
          streaks: {
            currentDailyStreak: dailyStreak?.currentCount || 0,
            longestStreak: dailyStreak?.longestCount || 0,
            isActive: dailyStreak?.isActive || false
          },
          helpRequests: {
            total: child.helpRequests.length,
            thisWeek: weekHelpRequests.length,
            frequentTopics: helpTopics.slice(0, 3)
          },
          suspiciousActivity
        });
      }

      return summaries;
    } catch (error) {
      logger.error('Error getting child activity summary:', error);
      throw new Error('Failed to get child activity summary');
    }
  }

  async getDetailedActivityReport(
    childId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<DetailedActivityReport> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          loginSessions: {
            where: {
              loginTime: {
                gte: startDate,
                lte: endDate
              }
            },
            orderBy: { loginTime: 'desc' }
          },
          progressRecords: {
            where: {
              updatedAt: {
                gte: startDate,
                lte: endDate
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
                gte: startDate,
                lte: endDate
              }
            }
          },
          helpRequests: {
            where: {
              timestamp: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      });

      if (!child) {
        throw new Error('Child not found');
      }

      // Analyze help request patterns
      const helpAnalytics = this.analyzeHelpPatterns(child.helpRequests);

      return {
        childId: child.id,
        childName: child.name,
        reportPeriod: {
          start: startDate,
          end: endDate
        },
        sessions: child.loginSessions.map(session => ({
          id: session.id,
          loginTime: session.loginTime,
          logoutTime: session.logoutTime,
          duration: session.sessionDuration || 0,
          activitiesCompleted: session.activitiesCompleted,
          badgesEarned: session.badgesEarned,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress
        })),
        progressDetails: child.progressRecords.map(progress => ({
          activityId: progress.activityId,
          activityTitle: progress.activity.title,
          subject: progress.activity.plan.subject,
          status: progress.status,
          score: progress.score,
          timeSpent: progress.timeSpent,
          attempts: progress.attempts,
          completedAt: progress.completedAt,
          helpRequestsCount: progress.helpRequestsCount
        })),
        achievements: child.achievements.map(achievement => ({
          id: achievement.id,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          earnedAt: achievement.earnedAt,
          celebrationShown: achievement.celebrationShown
        })),
        helpAnalytics
      };
    } catch (error) {
      logger.error('Error getting detailed activity report:', error);
      throw new Error('Failed to get detailed activity report');
    }
  }

  async checkForSuspiciousActivity(childId: string): Promise<SuspiciousActivityAlert[]> {
    try {
      const alerts: SuspiciousActivityAlert[] = [];
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          loginSessions: {
            orderBy: { loginTime: 'desc' },
            take: 20
          },
          securityLogs: {
            orderBy: { timestamp: 'desc' },
            take: 50
          },
          helpRequests: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          },
          progressRecords: {
            where: {
              updatedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      });

      if (!child) {
        return alerts;
      }

      // Check for multiple failed logins
      const failedLogins = child.securityLogs.filter(
        log => log.eventType === 'AUTHENTICATION' && 
               log.details && 
               (log.details as any).success === false
      );
      
      if (failedLogins.length >= 3) {
        alerts.push({
          childId: child.id,
          childName: child.name,
          alertType: 'multiple_failed_logins',
          severity: 'high',
          description: `${failedLogins.length} failed login attempts detected`,
          details: { failedAttempts: failedLogins.length },
          timestamp: new Date(),
          resolved: false
        });
      }

      // Check for unusual login times (outside 6 AM - 10 PM)
      const unusualLogins = child.loginSessions.filter(session => {
        const hour = session.loginTime.getHours();
        return hour < 6 || hour > 22;
      });

      if (unusualLogins.length > 0) {
        alerts.push({
          childId: child.id,
          childName: child.name,
          alertType: 'unusual_login_time',
          severity: 'medium',
          description: `Login detected outside normal hours`,
          details: { unusualLogins: unusualLogins.length },
          timestamp: new Date(),
          resolved: false
        });
      }

      // Check for new devices
      const deviceFingerprints = child.loginSessions.map(s => 
        JSON.stringify(s.deviceInfo)
      );
      const uniqueDevices = [...new Set(deviceFingerprints)];
      
      if (uniqueDevices.length > 2) {
        alerts.push({
          childId: child.id,
          childName: child.name,
          alertType: 'new_device',
          severity: 'medium',
          description: `Multiple devices detected (${uniqueDevices.length} devices)`,
          details: { deviceCount: uniqueDevices.length },
          timestamp: new Date(),
          resolved: false
        });
      }

      // Check for excessive help requests
      if (child.helpRequests.length > 10) {
        alerts.push({
          childId: child.id,
          childName: child.name,
          alertType: 'excessive_help_requests',
          severity: 'low',
          description: `High number of help requests (${child.helpRequests.length} in 24h)`,
          details: { helpRequestCount: child.helpRequests.length },
          timestamp: new Date(),
          resolved: false
        });
      }

      // Check for rapid progress (potential cheating)
      const rapidProgress = child.progressRecords.filter(p => 
        p.timeSpent < 2 && p.score && p.score > 90
      );

      if (rapidProgress.length > 3) {
        alerts.push({
          childId: child.id,
          childName: child.name,
          alertType: 'rapid_progress',
          severity: 'medium',
          description: `Unusually fast completion with high scores detected`,
          details: { rapidCompletions: rapidProgress.length },
          timestamp: new Date(),
          resolved: false
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Error checking suspicious activity:', error);
      return [];
    }
  }

  private async analyzeSuspiciousActivity(childId: string) {
    const alerts = await this.checkForSuspiciousActivity(childId);
    
    return {
      multipleFailedLogins: alerts.some(a => a.alertType === 'multiple_failed_logins'),
      unusualLoginTimes: alerts.some(a => a.alertType === 'unusual_login_time'),
      deviceChanges: alerts.some(a => a.alertType === 'new_device'),
      lastSecurityEvent: alerts.length > 0 ? alerts[0].timestamp : null
    };
  }

  private analyzeHelpTopics(helpRequests: any[]) {
    const topicCounts: { [key: string]: number } = {};
    
    helpRequests.forEach(request => {
      // Extract topic from context or question
      const context = request.context || {};
      const topic = context.subject || context.topic || 'General';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    return Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }

  private analyzeHelpPatterns(helpRequests: any[]) {
    const totalRequests = helpRequests.length;
    const topicBreakdown = this.analyzeHelpTopics(helpRequests);
    
    // Analyze time patterns
    const hourCounts: { [hour: number]: number } = {};
    helpRequests.forEach(request => {
      const hour = request.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const timePatterns = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);

    return {
      totalRequests,
      averageRequestsPerSession: totalRequests > 0 ? totalRequests / Math.max(1, helpRequests.length) : 0,
      topicBreakdown: topicBreakdown.map(item => ({
        ...item,
        percentage: totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0
      })),
      timePatterns
    };
  }
}

export const parentalMonitoringService = new ParentalMonitoringService();