import express from 'express';
import { authService } from '../services/authService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { emailService } from '../services/emailService';
import {
  validate,
  parentRegistrationSchema,
  parentLoginSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordUpdateSchema,
  refreshTokenSchema,
  childLoginSchema,
  enhancedChildLoginSchema
} from '../utils/validation';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Parent registration endpoint
router.post('/register', validate(parentRegistrationSchema), async (req, res) => {
  try {
    const { user, verificationToken } = await authService.registerParent(req.body);
    
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email already exists',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Registration failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Email verification endpoint
router.post('/verify-email', validate(emailVerificationSchema), async (req, res) => {
  try {
    const user = await authService.verifyEmail(req.body.token);
    
    // Send welcome email after successful verification
    await emailService.sendWelcomeEmail(user.email, user.firstName || 'User');
    
    res.json({
      message: 'Email verified successfully. Welcome to AI Study Planner!',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid verification token') {
        return res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message === 'Email already verified') {
        return res.status(400).json({
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'Email is already verified',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'Email verification failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Parent login endpoint
router.post('/login', validate(parentLoginSchema), async (req, res) => {
  try {
    const authResult = await authService.authenticateParent(req.body);
    
    res.json({
      message: 'Login successful',
      ...authResult
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message === 'Please verify your email before logging in') {
        return res.status(403).json({
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before logging in',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Refresh token endpoint with session monitoring
router.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
  try {
    // Extract IP address and user agent for session validation
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    const authResult = await enhancedAuthService.refreshToken(
      req.body.refreshToken,
      ipAddress,
      userAgent
    );
    
    res.json({
      message: 'Token refreshed successfully',
      success: true,
      ...authResult
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    let errorCode = 'INVALID_REFRESH_TOKEN';
    let errorMessage = 'Invalid or expired refresh token';
    let userFriendlyMessage = 'Your session has expired. Please log in again.';
    
    if (error instanceof Error) {
      if (error.message === 'Invalid session') {
        errorCode = 'SESSION_INVALID';
        errorMessage = 'Session validation failed';
        userFriendlyMessage = 'Your session is no longer valid. Please log in again for security.';
      }
    }
    
    res.status(401).json({
      error: {
        code: errorCode,
        message: errorMessage,
        userFriendlyMessage,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Password reset request endpoint
router.post('/forgot-password', validate(passwordResetRequestSchema), async (req, res) => {
  try {
    await authService.resetPassword(req.body.email);
    
    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    
    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  }
});

// Password reset endpoint
router.post('/reset-password', validate(passwordResetSchema), async (req, res) => {
  try {
    await authService.resetPasswordWithToken(req.body.token, req.body.password);
    
    res.json({
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    
    if (error instanceof Error && error.message === 'Invalid or expired reset token') {
      return res.status(400).json({
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Invalid or expired reset token',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Password reset failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Password update endpoint (requires authentication)
router.put('/password', authenticateToken, validate(passwordUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    await authService.updatePassword(req.user.userId, req.body.oldPassword, req.body.newPassword);
    
    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    
    if (error instanceof Error && error.message === 'Current password is incorrect') {
      return res.status(400).json({
        error: {
          code: 'INCORRECT_PASSWORD',
          message: 'Current password is incorrect',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'PASSWORD_UPDATE_FAILED',
        message: 'Password update failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Logout endpoint (requires authentication)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    await authService.logout(req.user.userId);
    
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    res.status(500).json({
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Enhanced child login endpoint with session monitoring
router.post('/child/login', validate(enhancedChildLoginSchema), async (req, res) => {
  try {
    // Extract IP address and user agent from request
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Use enhanced auth service with session monitoring
    const authResult = await enhancedAuthService.childLogin(
      req.body.username,
      req.body.pin,
      ipAddress,
      userAgent
    );
    
    res.json({
      message: 'Child login successful',
      success: true,
      ...authResult
    });
  } catch (error) {
    console.error('Child login error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or PIN',
            userFriendlyMessage: 'Oops! Your username or PIN doesn\'t match. Let\'s try again! 🔑',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message === 'Child account is inactive') {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Child account is inactive',
            userFriendlyMessage: 'Your account isn\'t active right now. Ask your parent for help! 👨‍👩‍👧‍👦',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message.includes('Account temporarily locked')) {
        return res.status(429).json({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account temporarily locked due to suspicious activity. Please try again later.',
            userFriendlyMessage: 'Your account is taking a break for safety. Try again in a few minutes! ⏰',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed. Please try again.',
        userFriendlyMessage: 'Something went wrong! Let\'s try again in a moment. 🔄',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Legacy child login endpoint (for backward compatibility)
router.post('/child/login-legacy', validate(childLoginSchema), async (req, res) => {
  try {
    // Create a basic device info object for legacy requests
    const deviceInfo = {
      userAgent: req.get('User-Agent') || 'Unknown',
      platform: 'Unknown',
      isMobile: /Mobile|Android|iPhone|iPad/.test(req.get('User-Agent') || ''),
      screenResolution: undefined,
      language: req.get('Accept-Language')?.split(',')[0] || 'en',
      timezone: undefined
    };
    
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    
    const loginRequest = {
      credentials: req.body,
      deviceInfo,
      ipAddress
    };
    
    const authResult = await authService.authenticateChild(loginRequest);
    
    res.json({
      message: 'Child login successful',
      ...authResult
    });
  } catch (error) {
    console.error('Child login error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or PIN',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message.includes('Account temporarily locked')) {
        return res.status(429).json({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account temporarily locked due to suspicious activity. Please try again later.',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Child refresh token endpoint
router.post('/child/refresh', validate(refreshTokenSchema), async (req, res) => {
  try {
    const authResult = await authService.refreshChildToken(req.body.refreshToken);
    
    res.json({
      message: 'Child token refreshed successfully',
      ...authResult
    });
  } catch (error) {
    console.error('Child token refresh error:', error);
    
    res.status(401).json({
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Child logout endpoint with session cleanup
router.post('/child/logout', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Extract session ID from request body if provided
    const sessionId = req.body.sessionId;
    
    // Use enhanced auth service for logout with session monitoring
    await enhancedAuthService.childLogout(req.user.userId, sessionId);
    
    res.json({
      message: 'Child logged out successfully',
      success: true
    });
  } catch (error) {
    console.error('Child logout error:', error);
    
    res.status(500).json({
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed. Please try again.',
        userFriendlyMessage: 'We had trouble logging you out. Try again! 🔄',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Child session validation endpoint
router.get('/child/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'CHILD') {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Child authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    const isValid = await authService.validateChildSession(req.params.sessionId);
    
    res.json({
      valid: isValid,
      message: isValid ? 'Session is valid' : 'Session has expired'
    });
  } catch (error) {
    console.error('Session validation error:', error);
    
    res.status(500).json({
      error: {
        code: 'SESSION_VALIDATION_FAILED',
        message: 'Session validation failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Child session activity update endpoint
router.post('/child/session/:sessionId/activity', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'CHILD') {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Child authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    const { activityType } = req.body;
    
    if (!['ACTIVITY_COMPLETED', 'BADGE_EARNED', 'HELP_REQUESTED'].includes(activityType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ACTIVITY_TYPE',
          message: 'Invalid activity type',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    await authService.updateChildSessionActivity(
      req.user.userId,
      req.params.sessionId,
      activityType
    );
    
    res.json({
      message: 'Session activity updated successfully'
    });
  } catch (error) {
    console.error('Session activity update error:', error);
    
    res.status(500).json({
      error: {
        code: 'SESSION_UPDATE_FAILED',
        message: 'Session activity update failed. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Parent monitoring endpoints for child sessions
router.get('/parent/child/:childId/sessions', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'PARENT') {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Parent authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Verify parent owns the child
    const isParentOfChild = await authService.verifyParentOfChild(req.user.userId, req.params.childId);
    if (!isParentOfChild) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to child sessions',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    const limit = parseInt(req.query.limit as string) || 10;
    const sessions = await authService.getChildSessionHistory(req.params.childId, limit);
    
    res.json({
      sessions,
      message: 'Child session history retrieved successfully'
    });
  } catch (error) {
    console.error('Child session history error:', error);
    
    res.status(500).json({
      error: {
        code: 'SESSION_HISTORY_FAILED',
        message: 'Failed to retrieve session history. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

router.get('/parent/child/:childId/active-sessions', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'PARENT') {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Parent authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Verify parent owns the child
    const isParentOfChild = await authService.verifyParentOfChild(req.user.userId, req.params.childId);
    if (!isParentOfChild) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to child sessions',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    const activeSessions = await authService.getActiveChildSessions(req.params.childId);
    
    res.json({
      activeSessions,
      message: 'Active child sessions retrieved successfully'
    });
  } catch (error) {
    console.error('Active child sessions error:', error);
    
    res.status(500).json({
      error: {
        code: 'ACTIVE_SESSIONS_FAILED',
        message: 'Failed to retrieve active sessions. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

export default router;