import { PrismaClient } from '@prisma/client';
import { parentalMonitoringService } from '../parentalMonitoringService';
import { parentalNotificationService } from '../parentalNotificationService';

// Mock Prisma
const mockPrisma = {
  childProfile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  parentNotification: {
    create: jest.fn(),
  },
  achievement: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock email service
jest.mock('../emailService', () => ({
  emailService: {
    sendChildLoginNotification: jest.fn(),
    sendChildAchievementNotification: jest.fn(),
    sendWeeklyProgressSummary: jest.fn(),
    sendSuspiciousActivityAlert: jest.fn(),
  },
}));

describe('ParentalMonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChildActivitySummary', () => {
    it('should return activity summary for parent children', async () => {
      const mockChildren = [
        {
          id: 'child1',
          name: 'Test Child',
          parentId: 'parent1',
          loginSessions: [
            {
              id: 'session1',
              loginTime: new Date(),
              logoutTime: new Date(),
              sessionDuration: 1800,
            },
          ],
          progressRecords: [
            {
              id: 'progress1',
              status: 'COMPLETED',
              score: 85,
              timeSpent: 30,
              activity: {
                plan: { subject: 'Mathematics' },
              },
            },
          ],
          achievements: [
            {
              id: 'achievement1',
              title: 'First Badge',
              earnedAt: new Date(),
              type: 'BADGE',
            },
          ],
          learningStreaks: [
            {
              streakType: 'DAILY',
              currentCount: 5,
              longestCount: 10,
              isActive: true,
            },
          ],
          helpRequests: [],
          securityLogs: [],
        },
      ];

      mockPrisma.childProfile.findMany.mockResolvedValue(mockChildren);

      const result = await parentalMonitoringService.getChildActivitySummary('parent1');

      expect(result).toHaveLength(1);
      expect(result[0].childName).toBe('Test Child');
      expect(result[0].progress.completionRate).toBe(100);
      expect(result[0].streaks.currentDailyStreak).toBe(5);
    });

    it('should handle children with no activity', async () => {
      const mockChildren = [
        {
          id: 'child1',
          name: 'Test Child',
          parentId: 'parent1',
          loginSessions: [],
          progressRecords: [],
          achievements: [],
          learningStreaks: [],
          helpRequests: [],
          securityLogs: [],
        },
      ];

      mockPrisma.childProfile.findMany.mockResolvedValue(mockChildren);

      const result = await parentalMonitoringService.getChildActivitySummary('parent1');

      expect(result).toHaveLength(1);
      expect(result[0].progress.completionRate).toBe(0);
      expect(result[0].loginSessions.total).toBe(0);
    });
  });

  describe('checkForSuspiciousActivity', () => {
    it('should detect multiple failed logins', async () => {
      const mockChild = {
        id: 'child1',
        name: 'Test Child',
        loginSessions: [],
        securityLogs: [
          {
            eventType: 'AUTHENTICATION',
            details: { success: false },
            timestamp: new Date(),
          },
          {
            eventType: 'AUTHENTICATION',
            details: { success: false },
            timestamp: new Date(),
          },
          {
            eventType: 'AUTHENTICATION',
            details: { success: false },
            timestamp: new Date(),
          },
        ],
        helpRequests: [],
        progressRecords: [],
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);

      const alerts = await parentalMonitoringService.checkForSuspiciousActivity('child1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('multiple_failed_logins');
      expect(alerts[0].severity).toBe('high');
    });

    it('should detect unusual login times', async () => {
      const lateNightLogin = new Date();
      lateNightLogin.setHours(23, 30, 0, 0);

      const mockChild = {
        id: 'child1',
        name: 'Test Child',
        loginSessions: [
          {
            loginTime: lateNightLogin,
            deviceInfo: {},
          },
        ],
        securityLogs: [],
        helpRequests: [],
        progressRecords: [],
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);

      const alerts = await parentalMonitoringService.checkForSuspiciousActivity('child1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('unusual_login_time');
      expect(alerts[0].severity).toBe('medium');
    });

    it('should detect excessive help requests', async () => {
      const mockChild = {
        id: 'child1',
        name: 'Test Child',
        loginSessions: [],
        securityLogs: [],
        helpRequests: new Array(15).fill({
          id: 'help1',
          timestamp: new Date(),
        }),
        progressRecords: [],
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);

      const alerts = await parentalMonitoringService.checkForSuspiciousActivity('child1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('excessive_help_requests');
      expect(alerts[0].severity).toBe('low');
    });
  });
});

describe('ParentalNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendLoginNotification', () => {
    it('should send login notification when enabled', async () => {
      const mockChild = {
        id: 'child1',
        name: 'Test Child',
        parentId: 'parent1',
        parent: {
          email: 'parent@example.com',
          firstName: 'Parent',
        },
        settings: null,
      };

      const mockParentSettings = {
        emailNotifications: true,
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockParentSettings);
      mockPrisma.notification.create.mockResolvedValue({});

      await parentalNotificationService.sendLoginNotification(
        'child1',
        { platform: 'Windows', isMobile: false },
        '192.168.1.1'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should not send notification when disabled', async () => {
      const mockChild = {
        id: 'child1',
        name: 'Test Child',
        parentId: 'parent1',
        parent: {
          email: 'parent@example.com',
          firstName: 'Parent',
        },
        settings: null,
      };

      const mockParentSettings = {
        emailNotifications: false,
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockParentSettings);

      await parentalNotificationService.sendLoginNotification(
        'child1',
        { platform: 'Windows', isMobile: false },
        '192.168.1.1'
      );

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('sendAchievementNotification', () => {
    it('should send achievement notification and mark as notified', async () => {
      const mockAchievement = {
        id: 'achievement1',
        title: 'First Badge',
        description: 'Earned your first badge!',
        type: 'BADGE',
        earnedAt: new Date(),
        child: {
          id: 'child1',
          name: 'Test Child',
          parentId: 'parent1',
          parent: {
            email: 'parent@example.com',
            firstName: 'Parent',
          },
        },
      };

      const mockParentSettings = {
        emailNotifications: true,
      };

      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockParentSettings);
      mockPrisma.achievement.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await parentalNotificationService.sendAchievementNotification('child1', 'achievement1');

      expect(mockPrisma.achievement.update).toHaveBeenCalledWith({
        where: { id: 'achievement1' },
        data: { parentNotified: true },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });

  describe('getParentNotifications', () => {
    it('should return parent notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          type: 'child_login',
          message: 'Test Child logged in',
          read: false,
          createdAt: new Date(),
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await parentalNotificationService.getParentNotifications('parent1');

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'parent1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });
  });
});