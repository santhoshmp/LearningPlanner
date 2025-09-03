import request from 'supertest';
import app from '../../index';
import { childProfileService } from '../../services/childProfileService';
import { authService } from '../../services/authService';
import { redisService } from '../../services/redisService';

// Mock dependencies
jest.mock('../../services/childProfileService');
jest.mock('../../services/authService');
jest.mock('../../services/redisService');

describe('Child Profile Routes', () => {
  const mockChildProfileService = childProfileService as jest.Mocked<typeof childProfileService>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockRedisService = redisService as jest.Mocked<typeof redisService>;
  
  const parentUserId = 'parent-123';
  const childId = 'child-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
    mockAuthService.verifyAccessToken.mockReturnValue({
      userId: parentUserId,
      role: 'PARENT'
    });
    mockAuthService.verifyParentOfChild.mockResolvedValue(true);
  });
  
  describe('POST /api/child-profiles', () => {
    const validChildProfileData = {
      name: 'Alice',
      age: 8,
      gradeLevel: '3rd',
      learningStyle: 'VISUAL',
      username: 'alice123',
      pin: '1234',
      preferences: {
        theme: 'colorful',
        soundEnabled: true
      }
    };
    
    const mockChildProfile = {
      id: childId,
      parentId: parentUserId,
      name: validChildProfileData.name,
      age: validChildProfileData.age,
      gradeLevel: validChildProfileData.gradeLevel,
      learningStyle: validChildProfileData.learningStyle,
      username: validChildProfileData.username,
      preferences: validChildProfileData.preferences,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    it('should create child profile successfully', async () => {
      // Arrange
      mockChildProfileService.createChildProfile.mockResolvedValue(mockChildProfile);
      
      // Act
      const response = await request(app)
        .post('/api/child-profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(validChildProfileData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Child profile created successfully',
        childProfile: expect.objectContaining({
          id: childId,
          name: validChildProfileData.name,
          username: validChildProfileData.username
        })
      });
      
      expect(mockChildProfileService.createChildProfile).toHaveBeenCalledWith(
        parentUserId,
        validChildProfileData
      );
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/child-profiles')
        .send(validChildProfileData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockChildProfileService.createChildProfile).not.toHaveBeenCalled();
    });
    
    it('should return 403 when authenticated as child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: 'child-456',
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .post('/api/child-profiles')
        .set('Authorization', 'Bearer child-token')
        .send(validChildProfileData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockChildProfileService.createChildProfile).not.toHaveBeenCalled();
    });
    
    it('should return 409 when username is already taken', async () => {
      // Arrange
      mockChildProfileService.createChildProfile.mockRejectedValue(
        new Error('Username is already taken')
      );
      
      // Act
      const response = await request(app)
        .post('/api/child-profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(validChildProfileData);
      
      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'USERNAME_EXISTS',
          message: expect.stringContaining('username is already taken')
        })
      });
    });
    
    it('should return 400 for invalid child profile data', async () => {
      // Arrange
      const invalidData = {
        name: '',
        age: 25, // Too old
        gradeLevel: '',
        learningStyle: 'INVALID_STYLE',
        username: 'a', // Too short
        pin: '12' // Too short
      };
      
      // Act
      const response = await request(app)
        .post('/api/child-profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.stringContaining('name'),
            expect.stringContaining('age'),
            expect.stringContaining('username'),
            expect.stringContaining('pin')
          ])
        })
      });
      
      expect(mockChildProfileService.createChildProfile).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/child-profiles', () => {
    const mockChildProfiles = [
      {
        id: 'child-123',
        name: 'Alice',
        age: 8,
        username: 'alice123'
      },
      {
        id: 'child-456',
        name: 'Bob',
        age: 10,
        username: 'bob456'
      }
    ];
    
    it('should get all child profiles for parent', async () => {
      // Arrange
      mockChildProfileService.getChildProfilesByParent.mockResolvedValue(mockChildProfiles);
      
      // Act
      const response = await request(app)
        .get('/api/child-profiles')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Child profiles retrieved successfully',
        childProfiles: mockChildProfiles,
        count: mockChildProfiles.length
      });
      
      expect(mockChildProfileService.getChildProfilesByParent).toHaveBeenCalledWith(parentUserId);
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/child-profiles');
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockChildProfileService.getChildProfilesByParent).not.toHaveBeenCalled();
    });
    
    it('should return 403 when authenticated as child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: 'child-456',
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .get('/api/child-profiles')
        .set('Authorization', 'Bearer child-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockChildProfileService.getChildProfilesByParent).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/child-profiles/:childId', () => {
    const mockChildProfile = {
      id: childId,
      parentId: parentUserId,
      name: 'Alice',
      age: 8,
      gradeLevel: '3rd',
      learningStyle: 'VISUAL',
      username: 'alice123',
      preferences: {
        theme: 'colorful',
        soundEnabled: true
      },
      isActive: true
    };
    
    it('should get specific child profile by ID', async () => {
      // Arrange
      mockChildProfileService.getChildProfileById.mockResolvedValue(mockChildProfile);
      
      // Act
      const response = await request(app)
        .get(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Child profile retrieved successfully',
        childProfile: mockChildProfile
      });
      
      expect(mockChildProfileService.getChildProfileById).toHaveBeenCalledWith(childId, parentUserId);
    });
    
    it('should return 404 when child profile not found', async () => {
      // Arrange
      mockChildProfileService.getChildProfileById.mockResolvedValue(null);
      
      // Act
      const response = await request(app)
        .get(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'PROFILE_NOT_FOUND',
          message: expect.stringContaining('Child profile not found')
        })
      });
    });
    
    it('should return 403 when parent does not own child profile', async () => {
      // Arrange
      mockAuthService.verifyParentOfChild.mockResolvedValue(false);
      
      // Act
      const response = await request(app)
        .get(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'PARENT_CHILD_MISMATCH',
          message: expect.stringContaining('do not have permission')
        })
      });
    });
  });
  
  describe('PUT /api/child-profiles/:childId', () => {
    const updateData = {
      name: 'Alice Updated',
      age: 9,
      learningStyle: 'AUDITORY',
      preferences: {
        theme: 'dark'
      }
    };
    
    const mockUpdatedProfile = {
      id: childId,
      parentId: parentUserId,
      name: updateData.name,
      age: updateData.age,
      gradeLevel: '3rd',
      learningStyle: updateData.learningStyle,
      username: 'alice123',
      preferences: updateData.preferences,
      isActive: true
    };
    
    it('should update child profile successfully', async () => {
      // Arrange
      mockChildProfileService.updateChildProfile.mockResolvedValue(mockUpdatedProfile);
      
      // Act
      const response = await request(app)
        .put(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Child profile updated successfully',
        childProfile: mockUpdatedProfile
      });
      
      expect(mockChildProfileService.updateChildProfile).toHaveBeenCalledWith(
        childId,
        parentUserId,
        updateData
      );
    });
    
    it('should return 404 when child profile not found', async () => {
      // Arrange
      mockChildProfileService.updateChildProfile.mockRejectedValue(
        new Error('Child profile not found or access denied')
      );
      
      // Act
      const response = await request(app)
        .put(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'PROFILE_NOT_FOUND',
          message: expect.stringContaining('Child profile not found or access denied')
        })
      });
    });
  });
  
  describe('DELETE /api/child-profiles/:childId', () => {
    it('should delete child profile successfully', async () => {
      // Arrange
      mockChildProfileService.deleteChildProfile.mockResolvedValue();
      
      // Act
      const response = await request(app)
        .delete(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Child profile deleted successfully'
      });
      
      expect(mockChildProfileService.deleteChildProfile).toHaveBeenCalledWith(childId, parentUserId);
    });
    
    it('should return 404 when child profile not found', async () => {
      // Arrange
      mockChildProfileService.deleteChildProfile.mockRejectedValue(
        new Error('Child profile not found or access denied')
      );
      
      // Act
      const response = await request(app)
        .delete(`/api/child-profiles/${childId}`)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'PROFILE_NOT_FOUND',
          message: expect.stringContaining('Child profile not found or access denied')
        })
      });
    });
  });
  
  describe('GET /api/child-profiles/check-username/:username', () => {
    it('should return available when username is available', async () => {
      // Arrange
      mockChildProfileService.isUsernameAvailable.mockResolvedValue(true);
      
      // Act
      const response = await request(app)
        .get('/api/child-profiles/check-username/newusername')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        username: 'newusername',
        available: true,
        message: 'Username is available'
      });
      
      expect(mockChildProfileService.isUsernameAvailable).toHaveBeenCalledWith('newusername');
    });
    
    it('should return not available when username is taken', async () => {
      // Arrange
      mockChildProfileService.isUsernameAvailable.mockResolvedValue(false);
      
      // Act
      const response = await request(app)
        .get('/api/child-profiles/check-username/takenusername')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        username: 'takenusername',
        available: false,
        message: 'Username is already taken'
      });
    });
  });
});