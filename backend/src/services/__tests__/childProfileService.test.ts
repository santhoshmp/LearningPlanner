import { childProfileService, ChildProfileData } from '../childProfileService';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    childProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    }
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    LearningStyle: {
      VISUAL: 'VISUAL',
      AUDITORY: 'AUDITORY',
      KINESTHETIC: 'KINESTHETIC',
      MIXED: 'MIXED'
    }
  };
});

// Get the mocked prisma instance
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();

describe('ChildProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChildProfile', () => {
    const validChildData: ChildProfileData = {
      name: 'Alice Smith',
      age: 8,
      gradeLevel: '3rd',
      learningStyle: 'VISUAL',
      username: 'alice123',
      pin: '1234',
      preferences: {
        theme: 'colorful',
        soundEnabled: true,
        animationsEnabled: true,
        difficultyPreference: 'adaptive'
      }
    };

    it('should successfully create a child profile', async () => {
      // Mock username doesn't exist
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);
      
      // Mock child profile creation
      const mockChildProfile = {
        id: 'child-123',
        parentId: 'parent-123',
        name: 'Alice Smith',
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'VISUAL',
        username: 'alice123',
        pinHash: 'hashed-pin',
        preferences: {
          theme: 'colorful',
          soundEnabled: true,
          animationsEnabled: true,
          difficultyPreference: 'adaptive'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrisma.childProfile.create.mockResolvedValue(mockChildProfile);

      const result = await childProfileService.createChildProfile('parent-123', validChildData);

      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { username: 'alice123' }
      });
      
      expect(mockPrisma.childProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentId: 'parent-123',
          name: 'Alice Smith',
          age: 8,
          gradeLevel: '3rd',
          learningStyle: 'VISUAL',
          username: 'alice123',
          pinHash: expect.any(String),
          preferences: validChildData.preferences,
          isActive: true
        })
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'child-123',
        name: 'Alice Smith',
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'VISUAL',
        username: 'alice123'
      }));
      expect(result).not.toHaveProperty('pinHash');
    });

    it('should throw error if username already exists', async () => {
      // Mock username exists
      mockPrisma.childProfile.findUnique.mockResolvedValue({
        id: 'existing-child',
        username: 'alice123'
      });

      await expect(childProfileService.createChildProfile('parent-123', validChildData))
        .rejects.toThrow('Username is already taken');

      expect(mockPrisma.childProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('getChildProfilesByParent', () => {
    it('should return all child profiles for a parent', async () => {
      const mockChildProfiles = [
        {
          id: 'child-1',
          parentId: 'parent-123',
          name: 'Alice',
          age: 8,
          gradeLevel: '3rd',
          learningStyle: 'VISUAL',
          username: 'alice123',
          pinHash: 'hashed-pin-1',
          preferences: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'child-2',
          parentId: 'parent-123',
          name: 'Bob',
          age: 10,
          gradeLevel: '5th',
          learningStyle: 'KINESTHETIC',
          username: 'bob456',
          pinHash: 'hashed-pin-2',
          preferences: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.childProfile.findMany.mockResolvedValue(mockChildProfiles);

      const result = await childProfileService.getChildProfilesByParent('parent-123');

      expect(mockPrisma.childProfile.findMany).toHaveBeenCalledWith({
        where: { parentId: 'parent-123' },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('pinHash');
      expect(result[1]).not.toHaveProperty('pinHash');
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'child-1',
        name: 'Alice',
        username: 'alice123'
      }));
    });
  });

  describe('getChildProfileById', () => {
    it('should return child profile if it belongs to the parent', async () => {
      const mockChildProfile = {
        id: 'child-123',
        parentId: 'parent-123',
        name: 'Alice',
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'VISUAL',
        username: 'alice123',
        pinHash: 'hashed-pin',
        preferences: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.childProfile.findFirst.mockResolvedValue(mockChildProfile);

      const result = await childProfileService.getChildProfileById('child-123', 'parent-123');

      expect(mockPrisma.childProfile.findFirst).toHaveBeenCalledWith({
        where: { 
          id: 'child-123',
          parentId: 'parent-123'
        }
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'child-123',
        name: 'Alice',
        username: 'alice123'
      }));
      expect(result).not.toHaveProperty('pinHash');
    });

    it('should return null if child profile not found or access denied', async () => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(null);

      const result = await childProfileService.getChildProfileById('child-123', 'wrong-parent');

      expect(result).toBeNull();
    });
  });

  describe('updateChildProfile', () => {
    it('should successfully update child profile', async () => {
      const existingChild = {
        id: 'child-123',
        parentId: 'parent-123',
        username: 'alice123'
      };

      const updatedChild = {
        id: 'child-123',
        parentId: 'parent-123',
        name: 'Alice Updated',
        age: 9,
        gradeLevel: '4th',
        learningStyle: 'MIXED',
        username: 'alice123',
        pinHash: 'hashed-pin',
        preferences: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.childProfile.findFirst.mockResolvedValue(existingChild);
      mockPrisma.childProfile.update.mockResolvedValue(updatedChild);

      const updateData = {
        name: 'Alice Updated',
        age: 9,
        gradeLevel: '4th',
        learningStyle: 'MIXED' as const
      };

      const result = await childProfileService.updateChildProfile('child-123', 'parent-123', updateData);

      expect(mockPrisma.childProfile.findFirst).toHaveBeenCalledWith({
        where: { 
          id: 'child-123',
          parentId: 'parent-123'
        }
      });

      expect(mockPrisma.childProfile.update).toHaveBeenCalledWith({
        where: { id: 'child-123' },
        data: updateData
      });

      expect(result).toEqual(expect.objectContaining({
        name: 'Alice Updated',
        age: 9,
        gradeLevel: '4th'
      }));
      expect(result).not.toHaveProperty('pinHash');
    });

    it('should throw error if child profile not found', async () => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(null);

      await expect(childProfileService.updateChildProfile('child-123', 'wrong-parent', { name: 'Updated' }))
        .rejects.toThrow('Child profile not found or access denied');

      expect(mockPrisma.childProfile.update).not.toHaveBeenCalled();
    });

    it('should throw error if new username is already taken', async () => {
      const existingChild = {
        id: 'child-123',
        parentId: 'parent-123',
        username: 'alice123'
      };

      mockPrisma.childProfile.findFirst.mockResolvedValue(existingChild);
      mockPrisma.childProfile.findUnique.mockResolvedValue({ username: 'newalice' }); // Username taken

      await expect(childProfileService.updateChildProfile('child-123', 'parent-123', { username: 'newalice' }))
        .rejects.toThrow('Username is already taken');

      expect(mockPrisma.childProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteChildProfile', () => {
    it('should successfully soft delete child profile', async () => {
      const existingChild = {
        id: 'child-123',
        parentId: 'parent-123'
      };

      mockPrisma.childProfile.findFirst.mockResolvedValue(existingChild);
      mockPrisma.childProfile.update.mockResolvedValue({});

      await childProfileService.deleteChildProfile('child-123', 'parent-123');

      expect(mockPrisma.childProfile.findFirst).toHaveBeenCalledWith({
        where: { 
          id: 'child-123',
          parentId: 'parent-123'
        }
      });

      expect(mockPrisma.childProfile.update).toHaveBeenCalledWith({
        where: { id: 'child-123' },
        data: { isActive: false }
      });
    });

    it('should throw error if child profile not found', async () => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(null);

      await expect(childProfileService.deleteChildProfile('child-123', 'wrong-parent'))
        .rejects.toThrow('Child profile not found or access denied');

      expect(mockPrisma.childProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('authenticateChild', () => {
    it('should return child profile for valid credentials', async () => {
      const mockChild = {
        id: 'child-123',
        parentId: 'parent-123',
        name: 'Alice',
        username: 'alice123',
        pinHash: await bcrypt.hash('1234', 12),
        isActive: true,
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'VISUAL',
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);

      const result = await childProfileService.authenticateChild('alice123', '1234');

      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { 
          username: 'alice123',
          isActive: true
        }
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'child-123',
        name: 'Alice',
        username: 'alice123'
      }));
      expect(result).not.toHaveProperty('pinHash');
    });

    it('should return null for invalid username', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      const result = await childProfileService.authenticateChild('nonexistent', '1234');

      expect(result).toBeNull();
    });

    it('should return null for invalid PIN', async () => {
      const mockChild = {
        username: 'alice123',
        pinHash: await bcrypt.hash('1234', 12),
        isActive: true
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);

      const result = await childProfileService.authenticateChild('alice123', 'wrong-pin');

      expect(result).toBeNull();
    });
  });

  describe('isUsernameAvailable', () => {
    it('should return true if username is available', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      const result = await childProfileService.isUsernameAvailable('newusername');

      expect(result).toBe(true);
      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { username: 'newusername' }
      });
    });

    it('should return false if username is taken', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue({ username: 'taken' });

      const result = await childProfileService.isUsernameAvailable('taken');

      expect(result).toBe(false);
    });
  });

  describe('getActiveChildrenCount', () => {
    it('should return count of active children for parent', async () => {
      mockPrisma.childProfile.count.mockResolvedValue(3);

      const result = await childProfileService.getActiveChildrenCount('parent-123');

      expect(result).toBe(3);
      expect(mockPrisma.childProfile.count).toHaveBeenCalledWith({
        where: { 
          parentId: 'parent-123',
          isActive: true
        }
      });
    });
  });

  describe('hashPin and comparePin', () => {
    it('should hash PIN correctly', async () => {
      const pin = '1234';
      const hash = await childProfileService.hashPin(pin);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(pin);
      expect(typeof hash).toBe('string');
    });

    it('should return true for matching PIN and hash', async () => {
      const pin = '1234';
      const hash = await bcrypt.hash(pin, 12);

      const result = await childProfileService.comparePin(pin, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching PIN and hash', async () => {
      const pin = '1234';
      const wrongPin = '5678';
      const hash = await bcrypt.hash(pin, 12);

      const result = await childProfileService.comparePin(wrongPin, hash);
      expect(result).toBe(false);
    });
  });
});