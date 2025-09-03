import request from 'supertest';
import app from '../../index';
import { authService } from '../../services/authService';
import { emailService } from '../../services/emailService';
import { redisService } from '../../services/redisService';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../services/emailService');
jest.mock('../../services/redisService');

describe('Auth Routes', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockEmailService = emailService as jest.Mocked<typeof emailService>;
  const mockRedisService = redisService as jest.Mocked<typeof redisService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
  });
  
  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    it('should register a new parent successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: validRegistrationData.email,
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
        isEmailVerified: false
      };
      
      mockAuthService.registerParent.mockResolvedValue({
        user: mockUser,
        verificationToken: 'verification-token'
      });
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: expect.stringContaining('Registration successful'),
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          isEmailVerified: mockUser.isEmailVerified
        }
      });
      
      expect(mockAuthService.registerParent).toHaveBeenCalledWith(validRegistrationData);
    });
    
    it('should return 409 when email already exists', async () => {
      // Arrange
      mockAuthService.registerParent.mockRejectedValue(
        new Error('User with this email already exists')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);
      
      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'USER_EXISTS',
          message: expect.stringContaining('already exists')
        })
      });
    });
    
    it('should return 400 for invalid registration data', async () => {
      // Arrange
      const invalidData = {
        email: 'not-an-email',
        password: '123', // Too short
        firstName: '',
        lastName: 'Doe'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.stringContaining('email'),
            expect.stringContaining('password'),
            expect.stringContaining('firstName')
          ])
        })
      });
      
      expect(mockAuthService.registerParent).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true
      };
      
      mockAuthService.verifyEmail.mockResolvedValue(mockUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue();
      
      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: expect.stringContaining('Email verified successfully'),
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          isEmailVerified: mockUser.isEmailVerified
        }
      });
      
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.firstName
      );
    });
    
    it('should return 400 for invalid token', async () => {
      // Arrange
      mockAuthService.verifyEmail.mockRejectedValue(
        new Error('Invalid verification token')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
          message: expect.stringContaining('Invalid or expired verification token')
        })
      });
      
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
    
    it('should return 400 if email already verified', async () => {
      // Arrange
      mockAuthService.verifyEmail.mockRejectedValue(
        new Error('Email already verified')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'token-for-verified-email' });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'ALREADY_VERIFIED',
          message: expect.stringContaining('Email is already verified')
        })
      });
    });
  });
  
  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'TestPass123!'
    };
    
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PARENT'
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900
      };
      
      mockAuthService.authenticateParent.mockResolvedValue(mockAuthResult);
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        ...mockAuthResult
      });
      
      expect(mockAuthService.authenticateParent).toHaveBeenCalledWith(validLoginData);
    });
    
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockAuthService.authenticateParent.mockRejectedValue(
        new Error('Invalid credentials')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'INVALID_CREDENTIALS',
          message: expect.stringContaining('Invalid email or password')
        })
      });
    });
    
    it('should return 403 for unverified email', async () => {
      // Arrange
      mockAuthService.authenticateParent.mockRejectedValue(
        new Error('Please verify your email before logging in')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'EMAIL_NOT_VERIFIED',
          message: expect.stringContaining('Please verify your email')
        })
      });
    });
  });
  
  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PARENT'
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900
      };
      
      mockAuthService.refreshToken.mockResolvedValue(mockAuthResult);
      
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Token refreshed successfully',
        ...mockAuthResult
      });
      
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
    
    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Invalid refresh token')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'INVALID_REFRESH_TOKEN',
          message: expect.stringContaining('Invalid or expired refresh token')
        })
      });
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      mockAuthService.resetPassword.mockResolvedValue();
      
      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: expect.stringContaining('If an account with this email exists')
      });
      
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
    });
    
    it('should return success even for non-existent email (security)', async () => {
      // Arrange
      mockAuthService.resetPassword.mockRejectedValue(
        new Error('User not found')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: expect.stringContaining('If an account with this email exists')
      });
    });
  });
  
  describe('POST /api/auth/child/login', () => {
    const validChildLoginData = {
      username: 'alice123',
      pin: '1234'
    };
    
    it('should login child successfully with valid credentials', async () => {
      // Arrange
      const mockAuthResult = {
        child: {
          id: 'child-123',
          name: 'Alice',
          username: 'alice123',
          age: 8
        },
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        expiresIn: 900
      };
      
      mockAuthService.authenticateChild.mockResolvedValue(mockAuthResult);
      
      // Act
      const response = await request(app)
        .post('/api/auth/child/login')
        .send(validChildLoginData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Child login successful',
        ...mockAuthResult
      });
      
      expect(mockAuthService.authenticateChild).toHaveBeenCalledWith(validChildLoginData);
    });
    
    it('should return 401 for invalid child credentials', async () => {
      // Arrange
      mockAuthService.authenticateChild.mockRejectedValue(
        new Error('Invalid credentials')
      );
      
      // Act
      const response = await request(app)
        .post('/api/auth/child/login')
        .send(validChildLoginData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'INVALID_CREDENTIALS',
          message: expect.stringContaining('Invalid username or PIN')
        })
      });
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        role: 'PARENT'
      });
      mockAuthService.logout.mockResolvedValue();
      
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Logged out successfully'
      });
      
      expect(mockAuthService.logout).toHaveBeenCalledWith('user-123');
    });
    
    it('should return 401 when no token is provided', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout');
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'NO_TOKEN',
          message: expect.stringContaining('Access token is required')
        })
      });
      
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
    
    it('should return 403 for invalid token', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
          message: expect.stringContaining('Invalid or expired access token')
        })
      });
      
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });
});