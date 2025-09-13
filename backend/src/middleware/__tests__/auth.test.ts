import { Request, Response } from 'express';
import { authenticateToken, requireRole, requireParentOfChild, requireSelfChildAccess, requireChild } from '../auth';
import { authService } from '../../services/authService';
import { redisService } from '../../services/redisService';
import { Role } from '@prisma/client';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../services/redisService');
jest.mock('../../utils/logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
  __esModule: true,
  default: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      originalUrl: '/test',
      method: 'GET',
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    nextFunction = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token is provided', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'NO_TOKEN'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };
      
      (authService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TOKEN'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is blacklisted', async () => {
      mockRequest.headers = {
        authorization: 'Bearer blacklisted_token'
      };
      
      (authService.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user123',
        role: Role.PARENT
      });
      
      (redisService.isTokenBlacklisted as jest.Mock).mockResolvedValue(true);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(redisService.isTokenBlacklisted).toHaveBeenCalledWith('blacklisted_token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'REVOKED_TOKEN'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if token is valid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };
      
      const decodedToken = {
        userId: 'user123',
        role: Role.PARENT
      };
      
      (authService.verifyAccessToken as jest.Mock).mockReturnValue(decodedToken);
      (redisService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid_token');
      expect(redisService.isTokenBlacklisted).toHaveBeenCalledWith('valid_token');
      expect(mockRequest.user).toEqual(decodedToken);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 401 if user is not authenticated', async () => {
      const middleware = requireRole([Role.PARENT]);
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTHENTICATION_REQUIRED'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user has insufficient permissions', async () => {
      mockRequest.user = {
        userId: 'user123',
        role: Role.CHILD
      };
      
      const middleware = requireRole([Role.PARENT]);
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INSUFFICIENT_PERMISSIONS'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if user has required role', async () => {
      mockRequest.user = {
        userId: 'user123',
        role: Role.PARENT
      };
      
      const middleware = requireRole([Role.PARENT]);
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next if user has one of multiple allowed roles', async () => {
      mockRequest.user = {
        userId: 'user123',
        role: Role.CHILD
      };
      
      const middleware = requireRole([Role.PARENT, Role.CHILD]);
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireParentOfChild', () => {
    it('should return 401 if user is not authenticated', async () => {
      const middleware = requireParentOfChild();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a parent', async () => {
      mockRequest.user = {
        userId: 'user123',
        role: Role.CHILD
      };
      
      const middleware = requireParentOfChild();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 if childId is missing', async () => {
      mockRequest.user = {
        userId: 'parent123',
        role: Role.PARENT
      };
      
      const middleware = requireParentOfChild();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if parent does not own child profile', async () => {
      mockRequest.user = {
        userId: 'parent123',
        role: Role.PARENT
      };
      mockRequest.params = { childId: 'child123' };
      
      (authService.verifyParentOfChild as jest.Mock).mockResolvedValue(false);
      
      const middleware = requireParentOfChild();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.verifyParentOfChild).toHaveBeenCalledWith('parent123', 'child123');
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if parent owns child profile', async () => {
      mockRequest.user = {
        userId: 'parent123',
        role: Role.PARENT
      };
      mockRequest.params = { childId: 'child123' };
      
      (authService.verifyParentOfChild as jest.Mock).mockResolvedValue(true);
      
      const middleware = requireParentOfChild();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.verifyParentOfChild).toHaveBeenCalledWith('parent123', 'child123');
      expect(mockRequest.user.childId).toBe('child123');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireSelfChildAccess', () => {
    it('should return 401 if user is not authenticated', async () => {
      const middleware = requireSelfChildAccess();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a child', async () => {
      mockRequest.user = {
        userId: 'parent123',
        role: Role.PARENT
      };
      
      const middleware = requireSelfChildAccess();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if child tries to access another child\'s data', async () => {
      mockRequest.user = {
        userId: 'child123',
        role: Role.CHILD
      };
      mockRequest.params = { childId: 'child456' };
      
      const middleware = requireSelfChildAccess();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if child accesses their own data', async () => {
      mockRequest.user = {
        userId: 'child123',
        role: Role.CHILD
      };
      mockRequest.params = { childId: 'child123' };
      
      const middleware = requireSelfChildAccess();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next if no childId is specified', async () => {
      mockRequest.user = {
        userId: 'child123',
        role: Role.CHILD
      };
      
      const middleware = requireSelfChildAccess();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireChild', () => {
    it('should return 401 if user is not authenticated', async () => {
      await requireChild(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTHENTICATION_REQUIRED'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a child', async () => {
      mockRequest.user = {
        userId: 'parent123',
        role: Role.PARENT
      };
      
      await requireChild(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INSUFFICIENT_PERMISSIONS'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if user is a child', async () => {
      mockRequest.user = {
        userId: 'child123',
        role: Role.CHILD
      };
      
      await requireChild(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});