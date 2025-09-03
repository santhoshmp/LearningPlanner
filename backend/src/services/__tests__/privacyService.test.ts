import { PrismaClient } from '@prisma/client';
import { privacyService } from '../privacyService';
import { authService } from '../authService';
import { mockDeep, mockReset } from 'jest-mock-extended';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../authService');
jest.mock('fs');
jest.mock('path');
jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn)
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    childProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn()
    },
    studyPlan: {
      findMany: jest.fn()
    },
    progressRecord: {
      findMany: jest.fn()
    },
    achievement: {
      findMany: jest.fn()
    },
    helpRequest: {
      findMany: jest.fn()
    },
    securityLog: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

// Mock logger
jest.mock('../../utils/logger', () => ({
  logAuditEvent: jest.fn()
}));

describe('PrivacyService', () => {
  const mockPrisma = new PrismaClient() as unknown as jest.Mocked<PrismaClient>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getChildActivityData', () => {
    it('should return child activity data when parent is authorized', async () => {
      // Arrange
      const childId = 'child-123';
      const parentId = 'parent-456';
      const mockChildProfile = { id: childId, name: 'Test Child' };
      const mockStudyPlans = [{ id: 'plan-1', title: 'Math Plan' }];
      const mockProgressRecords = [{ id: 'progress-1', score: 90 }];
      const mockAchievements = [{ id: 'achievement-1', title: 'Math Master' }];
      const mockHelpRequests = [{ id: 'help-1', question: 'How do I solve this?' }];
      const mockSecurityLogs = [{ id: 'log-1', eventType: 'LOGIN' }];
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(true);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
      mockPrisma.studyPlan.findMany.mockResolvedValue(mockStudyPlans as any);
      mockPrisma.progressRecord.findMany.mockResolvedValue(mockProgressRecords as any);
      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements as any);
      mockPrisma.helpRequest.findMany.mockResolvedValue(mockHelpRequests as any);
      mockPrisma.securityLog.findMany.mockResolvedValue(mockSecurityLogs as any);
      
      // Act
      const result = await privacyService.getChildActivityData(childId, parentId);
      
      // Assert
      expect(mockAuthService.verifyParentOfChild).toHaveBeenCalledWith(parentId, childId);
      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { id: childId },
        select: expect.any(Object)
      });
      expect(result).toEqual({
        profile: mockChildProfile,
        studyPlans: mockStudyPlans,
        progressRecords: mockProgressRecords,
        achievements: mockAchievements,
        helpRequests: mockHelpRequests,
        securityLogs: mockSecurityLogs
      });
    });
    
    it('should throw an error when parent is not authorized', async () => {
      // Arrange
      const childId = 'child-123';
      const parentId = 'parent-456';
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(false);
      
      // Act & Assert
      await expect(privacyService.getChildActivityData(childId, parentId))
        .rejects.toThrow('Access denied');
    });
  });
  
  describe('updateChildSettings', () => {
    it('should update child settings when parent is authorized', async () => {
      // Arrange
      const childId = 'child-123';
      const parentId = 'parent-456';
      const settings = {
        name: 'Updated Name',
        preferences: {
          theme: 'dark'
        }
      };
      const mockChildProfile = {
        id: childId,
        name: 'Test Child',
        preferences: { soundEnabled: true }
      };
      const mockUpdatedProfile = {
        ...mockChildProfile,
        name: settings.name,
        preferences: {
          ...mockChildProfile.preferences,
          ...settings.preferences
        },
        pinHash: 'hash123'
      };
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(true);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
      mockPrisma.childProfile.update.mockResolvedValue(mockUpdatedProfile as any);
      
      // Act
      const result = await privacyService.updateChildSettings(childId, parentId, settings);
      
      // Assert
      expect(mockAuthService.verifyParentOfChild).toHaveBeenCalledWith(parentId, childId);
      expect(mockPrisma.childProfile.update).toHaveBeenCalledWith({
        where: { id: childId },
        data: {
          name: settings.name,
          preferences: {
            soundEnabled: true,
            theme: 'dark'
          }
        }
      });
      expect(result).toEqual({
        id: childId,
        name: 'Updated Name',
        preferences: {
          soundEnabled: true,
          theme: 'dark'
        }
      });
    });
  });
  
  describe('deleteChildAccount', () => {
    it('should soft delete child account when hardDelete is false', async () => {
      // Arrange
      const childId = 'child-123';
      const parentId = 'parent-456';
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(true);
      
      // Act
      await privacyService.deleteChildAccount(childId, parentId, false);
      
      // Assert
      expect(mockAuthService.verifyParentOfChild).toHaveBeenCalledWith(parentId, childId);
      expect(mockPrisma.childProfile.update).toHaveBeenCalledWith({
        where: { id: childId },
        data: { isActive: false }
      });
      expect(mockPrisma.childProfile.delete).not.toHaveBeenCalled();
    });
    
    it('should hard delete child account when hardDelete is true', async () => {
      // Arrange
      const childId = 'child-123';
      const parentId = 'parent-456';
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(true);
      
      // Act
      await privacyService.deleteChildAccount(childId, parentId, true);
      
      // Assert
      expect(mockAuthService.verifyParentOfChild).toHaveBeenCalledWith(parentId, childId);
      expect(mockPrisma.childProfile.delete).toHaveBeenCalledWith({
        where: { id: childId }
      });
    });
  });
  
  describe('deleteParentAccount', () => {
    it('should anonymize parent account and deactivate children when hardDelete is false', async () => {
      // Arrange
      const userId = 'parent-123';
      
      // Act
      await privacyService.deleteParentAccount(userId, false);
      
      // Assert
      expect(mockPrisma.childProfile.updateMany).toHaveBeenCalledWith({
        where: { parentId: userId },
        data: { isActive: false }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          email: expect.stringContaining('deleted-'),
          firstName: 'Deleted',
          lastName: 'User',
          isEmailVerified: false
        })
      });
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
    
    it('should hard delete parent account when hardDelete is true', async () => {
      // Arrange
      const userId = 'parent-123';
      
      // Act
      await privacyService.deleteParentAccount(userId, true);
      
      // Assert
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });
  });
  
  describe('exportParentData', () => {
    it('should export parent data to a file', async () => {
      // Arrange
      const userId = 'parent-123';
      const mockUser = { id: userId, email: 'test@example.com' };
      const mockChildren = [{ id: 'child-1', name: 'Child 1' }];
      const mockStudyPlans = [{ id: 'plan-1', title: 'Math Plan' }];
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.childProfile.findMany.mockResolvedValue(mockChildren as any);
      mockPrisma.studyPlan.findMany.mockResolvedValue(mockStudyPlans as any);
      mockPrisma.progressRecord.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      mockPrisma.helpRequest.findMany.mockResolvedValue([]);
      
      (path.join as jest.Mock).mockReturnValue('/mock/path/file.json');
      (fs.writeFile as jest.Mock).mockImplementation((path, data, callback) => callback(null));
      (fs.mkdir as jest.Mock).mockImplementation((path, options, callback) => callback(null));
      
      // Act
      const result = await privacyService.exportParentData(userId);
      
      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object)
      });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toBe('/mock/path/file.json');
    });
  });
});