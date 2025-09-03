import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
jest.mock('@prisma/client');
jest.mock('../utils/logger');

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  child: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  childSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  settingsAuditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);

describe('SettingsService', () => {
  let settingsService: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset Prisma mocks
    Object.values(mockPrisma).forEach(model => {
      if (typeof model === 'object' && model !== null) {
        Object.values(model).forEach(method => {
          if (typeof method === 'function') {
            (method as jest.Mock).mockReset();
          }
        });
      }
    });

    // Import the service after mocking
    const { settingsService: service } = await import('../settingsService');
    settingsService = service;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserSettings', () => {
    const mockUserSettings = {
      id: 'settings-123',
      userId: 'user-123',
      theme: 'light',
      language: 'en',
      timezone: 'America/New_York',
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      dataSharing: false,
      privacyLevel: 'standard',
      twoFactorEnabled: false,
      sessionTimeout: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should get user settings successfully', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockUserSettings);

      const result = await settingsService.getUserSettings('user-123');

      expect(result).toEqual(mockUserSettings);
      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      });
    });

    it('should create default settings if none exist', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(null);
      mockPrisma.userSettings.create.mockResolvedValue({
        ...mockUserSettings,
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true
      });

      const result = await settingsService.getUserSettings('user-123');

      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          theme: 'system',
          language: 'en',
          emailNotifications: true,
          pushNotifications: true
        })
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.userSettings.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(settingsService.getUserSettings('user-123'))
        .rejects.toThrow('Failed to get user settings: Database error');
    });
  });

  describe('updateUserSettings', () => {
    const mockExistingSettings = {
      id: 'settings-123',
      userId: 'user-123',
      theme: 'light',
      language: 'en',
      emailNotifications: true
    };

    const updateData = {
      theme: 'dark',
      language: 'es',
      emailNotifications: false
    };

    it('should update user settings successfully', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockExistingSettings);
      mockPrisma.userSettings.update.mockResolvedValue({
        ...mockExistingSettings,
        ...updateData,
        updatedAt: new Date()
      });
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      const result = await settingsService.updateUserSettings('user-123', updateData);

      expect(result).toEqual(
        expect.objectContaining({
          theme: 'dark',
          language: 'es',
          emailNotifications: false
        })
      );

      expect(mockPrisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: expect.objectContaining(updateData)
      });
    });

    it('should validate settings before updating', async () => {
      const invalidData = {
        theme: 'invalid-theme',
        language: 'invalid-lang',
        sessionTimeout: -1
      };

      await expect(settingsService.updateUserSettings('user-123', invalidData))
        .rejects.toThrow('Invalid settings data');
    });

    it('should create audit log for settings changes', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockExistingSettings);
      mockPrisma.userSettings.update.mockResolvedValue({
        ...mockExistingSettings,
        ...updateData
      });
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      await settingsService.updateUserSettings('user-123', updateData);

      expect(mockPrisma.settingsAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          settingType: 'user',
          action: 'update',
          oldValues: expect.objectContaining({
            theme: 'light',
            language: 'en',
            emailNotifications: true
          }),
          newValues: expect.objectContaining(updateData),
          timestamp: expect.any(Date)
        })
      });
    });

    it('should handle non-existent user settings', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(null);

      await expect(settingsService.updateUserSettings('user-123', updateData))
        .rejects.toThrow('User settings not found');
    });
  });

  describe('getChildSettings', () => {
    const mockChildSettings = {
      id: 'child-settings-123',
      childId: 'child-123',
      parentId: 'parent-123',
      contentFiltering: 'strict',
      maxDailyScreenTime: 120,
      allowedContentTypes: ['educational', 'entertainment'],
      blockedWebsites: ['example.com'],
      safeSearchEnabled: true,
      parentalApprovalRequired: true,
      bedtimeRestrictions: {
        enabled: true,
        startTime: '20:00',
        endTime: '07:00'
      },
      allowedApps: ['educational-app'],
      timeRestrictions: {
        weekdays: { start: '16:00', end: '19:00' },
        weekends: { start: '09:00', end: '21:00' }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should get child settings successfully', async () => {
      mockPrisma.childSettings.findUnique.mockResolvedValue(mockChildSettings);

      const result = await settingsService.getChildSettings('child-123');

      expect(result).toEqual(mockChildSettings);
      expect(mockPrisma.childSettings.findUnique).toHaveBeenCalledWith({
        where: { childId: 'child-123' }
      });
    });

    it('should create default child settings if none exist', async () => {
      mockPrisma.childSettings.findUnique.mockResolvedValue(null);
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-123',
        parentId: 'parent-123',
        age: 8
      });
      mockPrisma.childSettings.create.mockResolvedValue({
        ...mockChildSettings,
        contentFiltering: 'moderate',
        maxDailyScreenTime: 60,
        parentalApprovalRequired: true
      });

      const result = await settingsService.getChildSettings('child-123');

      expect(mockPrisma.childSettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 'child-123',
          parentId: 'parent-123',
          contentFiltering: expect.any(String),
          maxDailyScreenTime: expect.any(Number)
        })
      });
    });

    it('should handle child not found', async () => {
      mockPrisma.childSettings.findUnique.mockResolvedValue(null);
      mockPrisma.child.findUnique.mockResolvedValue(null);

      await expect(settingsService.getChildSettings('non-existent-child'))
        .rejects.toThrow('Child not found');
    });
  });

  describe('updateChildSettings', () => {
    const mockExistingSettings = {
      id: 'child-settings-123',
      childId: 'child-123',
      parentId: 'parent-123',
      contentFiltering: 'moderate',
      maxDailyScreenTime: 60,
      parentalApprovalRequired: true
    };

    const updateData = {
      contentFiltering: 'strict',
      maxDailyScreenTime: 90,
      allowedContentTypes: ['educational'],
      bedtimeRestrictions: {
        enabled: true,
        startTime: '19:30',
        endTime: '07:30'
      }
    };

    it('should update child settings successfully', async () => {
      mockPrisma.childSettings.findUnique.mockResolvedValue(mockExistingSettings);
      mockPrisma.childSettings.update.mockResolvedValue({
        ...mockExistingSettings,
        ...updateData,
        updatedAt: new Date()
      });
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      const result = await settingsService.updateChildSettings('child-123', 'parent-123', updateData);

      expect(result).toEqual(
        expect.objectContaining({
          contentFiltering: 'strict',
          maxDailyScreenTime: 90
        })
      );

      expect(mockPrisma.childSettings.update).toHaveBeenCalledWith({
        where: { childId: 'child-123' },
        data: expect.objectContaining(updateData)
      });
    });

    it('should validate parent authorization', async () => {
      mockPrisma.childSettings.findUnique.mockResolvedValue({
        ...mockExistingSettings,
        parentId: 'different-parent-123'
      });

      await expect(
        settingsService.updateChildSettings('child-123', 'parent-123', updateData)
      ).rejects.toThrow('Unauthorized to modify child settings');
    });

    it('should validate child settings data', async () => {
      const invalidData = {
        contentFiltering: 'invalid-level',
        maxDailyScreenTime: -10,
        bedtimeRestrictions: {
          enabled: true,
          startTime: '25:00', // Invalid time
          endTime: '07:00'
        }
      };

      mockPrisma.childSettings.findUnique.mockResolvedValue(mockExistingSettings);

      await expect(
        settingsService.updateChildSettings('child-123', 'parent-123', invalidData)
      ).rejects.toThrow('Invalid child settings data');
    });

    it('should create audit log for child settings changes', async () => {
      mockPrisma.childSettings.findUnique.mockResolvedValue(mockExistingSettings);
      mockPrisma.childSettings.update.mockResolvedValue({
        ...mockExistingSettings,
        ...updateData
      });
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      await settingsService.updateChildSettings('child-123', 'parent-123', updateData);

      expect(mockPrisma.settingsAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'parent-123',
          childId: 'child-123',
          settingType: 'child',
          action: 'update',
          oldValues: expect.any(Object),
          newValues: expect.objectContaining(updateData),
          timestamp: expect.any(Date)
        })
      });
    });
  });

  describe('bulkUpdateSettings', () => {
    const bulkUpdateData = {
      userSettings: {
        theme: 'dark',
        language: 'fr'
      },
      childSettings: {
        'child-1': {
          maxDailyScreenTime: 90,
          contentFiltering: 'strict'
        },
        'child-2': {
          maxDailyScreenTime: 120,
          contentFiltering: 'moderate'
        }
      }
    };

    it('should perform bulk settings update successfully', async () => {
      // Mock user settings
      mockPrisma.userSettings.findUnique.mockResolvedValue({
        id: 'user-settings-123',
        userId: 'user-123'
      });
      mockPrisma.userSettings.update.mockResolvedValue({});

      // Mock child settings
      mockPrisma.childSettings.findUnique
        .mockResolvedValueOnce({
          id: 'child-settings-1',
          childId: 'child-1',
          parentId: 'user-123'
        })
        .mockResolvedValueOnce({
          id: 'child-settings-2',
          childId: 'child-2',
          parentId: 'user-123'
        });
      
      mockPrisma.childSettings.update
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      const result = await settingsService.bulkUpdateSettings('user-123', bulkUpdateData);

      expect(result).toEqual({
        success: true,
        updatedUserSettings: true,
        updatedChildSettings: ['child-1', 'child-2'],
        errors: []
      });

      expect(mockPrisma.userSettings.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.childSettings.update).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk update', async () => {
      // Mock user settings success
      mockPrisma.userSettings.findUnique.mockResolvedValue({
        id: 'user-settings-123',
        userId: 'user-123'
      });
      mockPrisma.userSettings.update.mockResolvedValue({});

      // Mock child settings - one success, one failure
      mockPrisma.childSettings.findUnique
        .mockResolvedValueOnce({
          id: 'child-settings-1',
          childId: 'child-1',
          parentId: 'user-123'
        })
        .mockResolvedValueOnce(null); // Child 2 not found

      mockPrisma.childSettings.update.mockResolvedValueOnce({});
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      const result = await settingsService.bulkUpdateSettings('user-123', bulkUpdateData);

      expect(result).toEqual({
        success: false,
        updatedUserSettings: true,
        updatedChildSettings: ['child-1'],
        errors: [
          expect.objectContaining({
            childId: 'child-2',
            error: expect.stringContaining('not found')
          })
        ]
      });
    });

    it('should validate all settings before applying changes', async () => {
      const invalidBulkData = {
        userSettings: {
          theme: 'invalid-theme'
        },
        childSettings: {
          'child-1': {
            maxDailyScreenTime: -10
          }
        }
      };

      await expect(
        settingsService.bulkUpdateSettings('user-123', invalidBulkData)
      ).rejects.toThrow('Invalid settings data in bulk update');
    });
  });

  describe('exportSettings', () => {
    const mockUserSettings = {
      theme: 'dark',
      language: 'en',
      emailNotifications: true,
      privacyLevel: 'high'
    };

    const mockChildSettings = [
      {
        childId: 'child-1',
        contentFiltering: 'strict',
        maxDailyScreenTime: 60,
        parentalApprovalRequired: true
      },
      {
        childId: 'child-2',
        contentFiltering: 'moderate',
        maxDailyScreenTime: 90,
        parentalApprovalRequired: false
      }
    ];

    it('should export settings in JSON format', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockUserSettings);
      mockPrisma.childSettings.findMany.mockResolvedValue(mockChildSettings);

      const result = await settingsService.exportSettings('user-123', 'json');

      expect(result).toEqual({
        format: 'json',
        data: JSON.stringify({
          userSettings: mockUserSettings,
          childSettings: mockChildSettings,
          exportedAt: expect.any(String)
        }, null, 2),
        filename: expect.stringMatching(/settings_user-123_\d{4}-\d{2}-\d{2}\.json/)
      });
    });

    it('should export settings in CSV format', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockUserSettings);
      mockPrisma.childSettings.findMany.mockResolvedValue(mockChildSettings);

      const result = await settingsService.exportSettings('user-123', 'csv');

      expect(result.format).toBe('csv');
      expect(result.data).toContain('setting_type,setting_key,setting_value');
      expect(result.data).toContain('user,theme,dark');
      expect(result.data).toContain('child-1,contentFiltering,strict');
      expect(result.filename).toMatch(/settings_user-123_\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should handle unsupported export formats', async () => {
      await expect(
        settingsService.exportSettings('user-123', 'xml')
      ).rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('importSettings', () => {
    const validImportData = {
      userSettings: {
        theme: 'light',
        language: 'es',
        emailNotifications: false
      },
      childSettings: [
        {
          childId: 'child-1',
          contentFiltering: 'moderate',
          maxDailyScreenTime: 75
        }
      ]
    };

    it('should import settings successfully', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue({
        id: 'user-settings-123',
        userId: 'user-123'
      });
      mockPrisma.userSettings.update.mockResolvedValue({});
      
      mockPrisma.childSettings.findUnique.mockResolvedValue({
        id: 'child-settings-1',
        childId: 'child-1',
        parentId: 'user-123'
      });
      mockPrisma.childSettings.update.mockResolvedValue({});
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      const result = await settingsService.importSettings('user-123', validImportData);

      expect(result).toEqual({
        success: true,
        importedUserSettings: true,
        importedChildSettings: ['child-1'],
        errors: [],
        warnings: []
      });

      expect(mockPrisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: expect.objectContaining(validImportData.userSettings)
      });
    });

    it('should validate import data format', async () => {
      const invalidImportData = {
        userSettings: {
          theme: 'invalid-theme'
        }
      };

      await expect(
        settingsService.importSettings('user-123', invalidImportData)
      ).rejects.toThrow('Invalid import data format');
    });

    it('should handle partial import failures', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue({
        id: 'user-settings-123',
        userId: 'user-123'
      });
      mockPrisma.userSettings.update.mockResolvedValue({});
      
      // Child settings not found
      mockPrisma.childSettings.findUnique.mockResolvedValue(null);
      mockPrisma.settingsAuditLog.create.mockResolvedValue({});

      const result = await settingsService.importSettings('user-123', validImportData);

      expect(result.success).toBe(false);
      expect(result.importedUserSettings).toBe(true);
      expect(result.importedChildSettings).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getSettingsAuditLog', () => {
    const mockAuditLogs = [
      {
        id: 'audit-1',
        userId: 'user-123',
        settingType: 'user',
        action: 'update',
        oldValues: { theme: 'light' },
        newValues: { theme: 'dark' },
        timestamp: new Date('2024-01-01'),
        ipAddress: '127.0.0.1'
      },
      {
        id: 'audit-2',
        userId: 'user-123',
        childId: 'child-123',
        settingType: 'child',
        action: 'update',
        oldValues: { maxDailyScreenTime: 60 },
        newValues: { maxDailyScreenTime: 90 },
        timestamp: new Date('2024-01-02'),
        ipAddress: '127.0.0.1'
      }
    ];

    it('should get settings audit log successfully', async () => {
      mockPrisma.settingsAuditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await settingsService.getSettingsAuditLog('user-123', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        settingType: 'user',
        limit: 50,
        offset: 0
      });

      expect(result).toEqual(mockAuditLogs);
      expect(mockPrisma.settingsAuditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-123',
          settingType: 'user',
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        }),
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0
      });
    });

    it('should filter audit log by child ID', async () => {
      const childAuditLogs = mockAuditLogs.filter(log => log.childId === 'child-123');
      mockPrisma.settingsAuditLog.findMany.mockResolvedValue(childAuditLogs);

      const result = await settingsService.getSettingsAuditLog('user-123', {
        childId: 'child-123'
      });

      expect(mockPrisma.settingsAuditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-123',
          childId: 'child-123'
        }),
        orderBy: { timestamp: 'desc' },
        take: 100,
        skip: 0
      });
    });
  });

  describe('Settings Validation', () => {
    it('should validate user settings correctly', () => {
      const validSettings = {
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
        emailNotifications: true,
        sessionTimeout: 30
      };

      const isValid = settingsService.validateUserSettings(validSettings);
      expect(isValid).toBe(true);
    });

    it('should reject invalid user settings', () => {
      const invalidSettings = {
        theme: 'invalid-theme',
        language: 'invalid-lang',
        sessionTimeout: -1,
        emailNotifications: 'not-boolean'
      };

      const isValid = settingsService.validateUserSettings(invalidSettings);
      expect(isValid).toBe(false);
    });

    it('should validate child settings correctly', () => {
      const validChildSettings = {
        contentFiltering: 'moderate',
        maxDailyScreenTime: 120,
        allowedContentTypes: ['educational', 'entertainment'],
        parentalApprovalRequired: true,
        bedtimeRestrictions: {
          enabled: true,
          startTime: '20:00',
          endTime: '07:00'
        }
      };

      const isValid = settingsService.validateChildSettings(validChildSettings);
      expect(isValid).toBe(true);
    });

    it('should reject invalid child settings', () => {
      const invalidChildSettings = {
        contentFiltering: 'invalid-level',
        maxDailyScreenTime: -10,
        allowedContentTypes: 'not-array',
        bedtimeRestrictions: {
          enabled: true,
          startTime: '25:00', // Invalid time
          endTime: '07:00'
        }
      };

      const isValid = settingsService.validateChildSettings(invalidChildSettings);
      expect(isValid).toBe(false);
    });
  });

  describe('Settings Synchronization', () => {
    it('should synchronize settings across devices', async () => {
      const deviceSettings = {
        deviceId: 'device-123',
        lastSyncAt: new Date('2024-01-01'),
        settings: {
          theme: 'dark',
          language: 'en'
        }
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue({
        theme: 'light',
        language: 'es',
        updatedAt: new Date('2024-01-02') // More recent
      });

      const result = await settingsService.synchronizeSettings('user-123', deviceSettings);

      expect(result).toEqual({
        syncRequired: true,
        conflictResolution: 'server_wins',
        updatedSettings: expect.objectContaining({
          theme: 'light',
          language: 'es'
        }),
        lastSyncAt: expect.any(Date)
      });
    });

    it('should handle sync conflicts', async () => {
      const deviceSettings = {
        deviceId: 'device-123',
        lastSyncAt: new Date('2024-01-02'),
        settings: {
          theme: 'dark',
          language: 'en'
        }
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue({
        theme: 'light',
        language: 'es',
        updatedAt: new Date('2024-01-01') // Older than device
      });

      const result = await settingsService.synchronizeSettings('user-123', deviceSettings);

      expect(result.conflictResolution).toBe('device_wins');
      expect(result.updatedSettings.theme).toBe('dark');
    });
  });
});