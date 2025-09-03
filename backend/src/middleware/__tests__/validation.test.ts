import { Request, Response } from 'express';
import { validateRequest, schemas, sanitizeInput } from '../validation';
import Joi from 'joi';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logSecurityEvent: jest.fn(),
  __esModule: true,
  default: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      id: 'test-request-id',
      ip: '127.0.0.1',
      originalUrl: '/test',
      method: 'POST',
      headers: {
        'user-agent': 'test-agent'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    nextFunction = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should call next if validation passes', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      
      mockRequest.body = {
        name: 'Test User',
        age: 30
      };
      
      const middleware = validateRequest(schema);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      
      mockRequest.body = {
        name: 'Test User'
        // Missing required age field
      };
      
      const middleware = validateRequest(schema);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR'
          })
        })
      );
    });

    it('should validate query parameters when specified', () => {
      const schema = Joi.object({
        page: Joi.number().required(),
        limit: Joi.number().required()
      });
      
      mockRequest.query = {
        page: '1',
        limit: '10'
      };
      
      const middleware = validateRequest(schema, 'query');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10
      });
    });

    it('should validate route parameters when specified', () => {
      const schema = Joi.object({
        id: Joi.string().required()
      });
      
      mockRequest.params = {
        id: '123'
      };
      
      const middleware = validateRequest(schema, 'params');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      
      mockRequest.body = {
        name: 'Test User',
        age: 30,
        extraField: 'should be removed'
      };
      
      const middleware = validateRequest(schema);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({
        name: 'Test User',
        age: 30
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize XSS in request body', () => {
      mockRequest.body = {
        name: '<script>alert("XSS")</script>',
        description: 'Normal text with <img src="x" onerror="alert(1)">'
      };
      
      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.body.name).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(mockRequest.body.description).toContain('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize XSS in query parameters', () => {
      mockRequest.query = {
        search: '<script>alert("XSS")</script>'
      };
      
      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.query.search).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize XSS in route parameters', () => {
      mockRequest.params = {
        id: '<script>alert("XSS")</script>'
      };
      
      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.params.id).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      mockRequest.body = {
        user: {
          name: '<script>alert("XSS")</script>',
          profile: {
            bio: 'Text with <img src="x" onerror="alert(1)">'
          }
        }
      };
      
      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.body.user.name).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(mockRequest.body.user.profile.bio).toContain('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('validation schemas', () => {
    it('should validate parent registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const { error } = schemas.parentRegistration.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate child profile creation data', () => {
      const validData = {
        name: 'Child Name',
        age: 10,
        gradeLevel: '5th Grade',
        learningStyle: 'VISUAL',
        username: 'childuser',
        pin: '123456',
        preferences: { theme: 'dark' }
      };
      
      const { error } = schemas.childProfileCreate.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid child PIN format', () => {
      const invalidData = {
        name: 'Child Name',
        age: 10,
        gradeLevel: '5th Grade',
        learningStyle: 'VISUAL',
        username: 'childuser',
        pin: 'abc', // Invalid PIN format
        preferences: { theme: 'dark' }
      };
      
      const { error } = schemas.childProfileCreate.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should validate study plan creation data', () => {
      const validData = {
        childId: 'child123',
        subject: 'Math',
        difficulty: 'Medium',
        objectives: [{ name: 'Learn addition' }]
      };
      
      const { error } = schemas.studyPlanCreate.validate(validData);
      expect(error).toBeUndefined();
    });
  });
});