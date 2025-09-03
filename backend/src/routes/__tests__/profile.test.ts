import request from 'supertest';
import express from 'express';
import profileRoutes from '../profile';
import { profileService } from '../../services/profileService';
import { authenticateToken, requireParent } from '../../middleware/auth';

// Mock the profile service
jest.mock('../../services/profileService');
const mockProfileService = profileService as jest.Mocked<typeof profileService>;

// Mock middleware
jest.mock('../../middleware/auth');
const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockRequireParent = requireParent as jest.MockedFunction<typeof requireParent>;

// Mock multer
jest.mock('multer', () => {
  const mockMulter = jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.file = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      next();
    })
  }));
  
  return {
    __esModule: true,
    default: mockMulter,
    memoryStorage: jest.fn(),
  };
});

describe('Profile Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = { userId: 'user-1', role: 'PARENT' };
      next();
      return undefined;
    });
    
    mockRequireParent.mockImplementation((req: any, res: any, next: any) => {
      next();
      return undefined;
    });
    
    app.use('/api/profile', profileRoutes);
    
    jest.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('should return user profile successfully', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PARENT' as const,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          id: 'settings-1',
          userId: 'user-1',
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        socialProviders: [],
        childrenCount: 2
      };

      mockProfileService.getUserProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProfile);
      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith('user-1');
    });

    it('should return 404 if profile not found', async () => {
      mockProfileService.getUserProfile.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/profile')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Profile not found');
    });

    it('should handle service errors', async () => {
      mockProfileService.getUserProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profile')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_FETCH_FAILED');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        settings: {
          theme: 'dark' as const
        }
      };

      const updatedProfile = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'PARENT' as const,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          id: 'settings-1',
          userId: 'user-1',
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        socialProviders: [],
        childrenCount: 2
      };

      mockProfileService.validateProfileData.mockReturnValue({
        isValid: true,
        errors: []
      });
      mockProfileService.sanitizeProfileData.mockReturnValue(updateData);
      mockProfileService.updateUserProfile.mockResolvedValue(updatedProfile);

      const response = await request(app)
        .put('/api/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedProfile);
      expect(mockProfileService.updateUserProfile).toHaveBeenCalledWith('user-1', updateData);
    });

    it('should return validation errors', async () => {
      const updateData = {
        firstName: '',
        email: 'invalid-email'
      };

      mockProfileService.validateProfileData.mockReturnValue({
        isValid: false,
        errors: ['First name must be between 1 and 50 characters', 'Invalid email format']
      });

      const response = await request(app)
        .put('/api/profile')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid profile data');
      expect(response.body.errors).toHaveLength(2);
    });

    it('should handle email already in use error', async () => {
      const updateData = {
        email: 'taken@example.com'
      };

      mockProfileService.validateProfileData.mockReturnValue({
        isValid: true,
        errors: []
      });
      mockProfileService.sanitizeProfileData.mockReturnValue(updateData);
      mockProfileService.updateUserProfile.mockRejectedValue(new Error('Email is already in use'));

      const response = await request(app)
        .put('/api/profile')
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email is already in use');
    });
  });

  describe('POST /api/profile/avatar', () => {
    it('should upload avatar successfully', async () => {
      const uploadResult = {
        filename: 'user-1_123456_abc123.jpg',
        url: '/uploads/avatars/user-1_123456_abc123.jpg',
        size: 12345
      };

      mockProfileService.uploadAvatar.mockResolvedValue(uploadResult);

      const response = await request(app)
        .post('/api/profile/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(uploadResult);
      expect(mockProfileService.uploadAvatar).toHaveBeenCalledWith(
        'user-1',
        expect.any(Buffer),
        'test.jpg',
        'image/jpeg'
      );
    });

    it('should handle invalid file type error', async () => {
      mockProfileService.uploadAvatar.mockRejectedValue(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));

      const response = await request(app)
        .post('/api/profile/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid file type');
    });

    it('should handle file size too large error', async () => {
      mockProfileService.uploadAvatar.mockRejectedValue(new Error('File size too large. Maximum size is 5MB.'));

      const response = await request(app)
        .post('/api/profile/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('File size too large');
    });
  });

  describe('DELETE /api/profile/avatar/:filename', () => {
    it('should delete avatar successfully', async () => {
      mockProfileService.deleteAvatar.mockResolvedValue();

      const response = await request(app)
        .delete('/api/profile/avatar/user-1_123456_abc123.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Avatar deleted successfully');
      expect(mockProfileService.deleteAvatar).toHaveBeenCalledWith('user-1', 'user-1_123456_abc123.jpg');
    });

    it('should reject invalid filename', async () => {
      const response = await request(app)
        .delete('/api/profile/avatar/../../../etc/passwd')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid filename');
    });

    it('should handle service errors', async () => {
      mockProfileService.deleteAvatar.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .delete('/api/profile/avatar/user-1_123456_abc123.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AVATAR_DELETE_FAILED');
    });
  });

  describe('GET /api/profile/settings', () => {
    it('should return user settings successfully', async () => {
      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: false,
        privacyLevel: 'standard',
        dataSharingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockProfileService.getUserSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/profile/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSettings);
      expect(mockProfileService.getUserSettings).toHaveBeenCalledWith('user-1');
    });
  });

  describe('PUT /api/profile/settings', () => {
    it('should update settings successfully', async () => {
      const settingsUpdate = {
        theme: 'dark',
        emailNotifications: false
      };

      const updatedSettings = {
        id: 'settings-1',
        userId: 'user-1',
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: false,
        pushNotifications: true,
        privacyLevel: 'standard',
        dataSharingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockProfileService.updateUserSettings.mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/profile/settings')
        .send(settingsUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedSettings);
      expect(mockProfileService.updateUserSettings).toHaveBeenCalledWith('user-1', settingsUpdate);
    });
  });

  describe('GET /api/profile/export', () => {
    it('should export user data successfully', async () => {
      const mockExportData = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        settings: {},
        children: [],
        exportedAt: '2023-01-01T00:00:00.000Z',
        exportVersion: '1.0'
      };

      mockProfileService.exportUserData.mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/profile/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExportData);
      expect(mockProfileService.exportUserData).toHaveBeenCalledWith('user-1');
    });

    it('should handle user not found error', async () => {
      mockProfileService.exportUserData.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .get('/api/profile/export')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Profile not found');
    });
  });

  describe('GET /api/profile/download', () => {
    it('should download user data successfully', async () => {
      const mockExportData = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        exportedAt: '2023-01-01T00:00:00.000Z',
        exportVersion: '1.0'
      };

      mockProfileService.exportUserData.mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/profile/download')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="profile-data-user-1-\d+\.json"/);
      
      const responseData = JSON.parse(response.text);
      expect(responseData).toEqual(mockExportData);
    });
  });
});