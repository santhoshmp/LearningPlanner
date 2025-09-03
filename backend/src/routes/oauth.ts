import express, { Request, Response } from 'express';
import passport from 'passport';
import { body, param, query, validationResult } from 'express-validator';
import { oauthService, PKCEChallenge } from '../services/oauthService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Store PKCE challenges temporarily (in production, use Redis)
const pkceStore = new Map<string, PKCEChallenge>();

/**
 * GET /oauth/:provider/authorize
 * Initiate OAuth flow for a provider
 */
router.get('/:provider/authorize', [
  param('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider'),
  query('state').optional().isString().withMessage('State must be a string'),
  query('use_pkce').optional().isBoolean().withMessage('use_pkce must be boolean')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { provider } = req.params;
    const { state, use_pkce } = req.query;

    let pkceChallenge: PKCEChallenge | undefined;
    let stateParam = state as string;

    // Generate PKCE challenge for enhanced security
    if (use_pkce === 'true' || provider === 'apple') {
      pkceChallenge = oauthService.generatePKCEChallenge();
      stateParam = stateParam || `pkce_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Store PKCE challenge temporarily
      pkceStore.set(stateParam, pkceChallenge);
      
      // Clean up old PKCE challenges (older than 10 minutes)
      setTimeout(() => {
        pkceStore.delete(stateParam);
      }, 10 * 60 * 1000);
    }

    const authUrl = oauthService.getAuthorizationUrl(provider, stateParam, pkceChallenge);

    res.json({
      success: true,
      data: {
        authUrl,
        state: stateParam,
        usesPKCE: !!pkceChallenge
      }
    });

  } catch (error) {
    logger.error('OAuth authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * POST /oauth/:provider/callback
 * Handle OAuth callback and exchange code for tokens
 */
router.post('/:provider/callback', [
  param('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider'),
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('state').optional().isString().withMessage('State must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { provider } = req.params;
    const { code, state } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Get PKCE challenge if it exists
    let codeVerifier: string | undefined;
    if (state && pkceStore.has(state)) {
      const pkceChallenge = pkceStore.get(state);
      codeVerifier = pkceChallenge?.codeVerifier;
      pkceStore.delete(state); // Clean up
    }

    // Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(provider, code, codeVerifier);

    // Get user info from provider
    const userInfo = await oauthService.getUserInfo(provider, tokens.accessToken);

    // Handle OAuth callback (create/link user) with enhanced logging
    const result = await oauthService.handleOAuthCallback(provider, userInfo, tokens, ipAddress, userAgent);

    // Generate JWT tokens for the user
    const jwtPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role
    };

    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          isEmailVerified: result.user.isEmailVerified
        },
        tokens: {
          accessToken,
          refreshToken
        },
        isNewUser: result.isNewUser,
        linkedAccount: result.linkedAccount,
        conflictResolution: result.conflictResolution,
        provider
      }
    });

  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'OAuth authentication failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * GET /oauth/providers
 * Get user's linked social auth providers
 */
router.get('/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const detailed = req.query.detailed === 'true';
    const providers = detailed 
      ? await oauthService.getUserSocialProvidersDetailed(userId)
      : await oauthService.getUserSocialProviders(userId);

    res.json({
      success: true,
      data: {
        providers
      }
    });

  } catch (error) {
    logger.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social providers',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * GET /oauth/:provider/status
 * Get status of a specific social auth provider
 */
router.get('/:provider/status', [
  authenticateToken,
  param('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { provider } = req.params;
    const socialAuth = await oauthService.getSocialAuthProvider(userId, provider);

    if (!socialAuth) {
      return res.status(404).json({
        success: false,
        message: `${provider} account not linked`
      });
    }

    res.json({
      success: true,
      data: {
        provider: socialAuth.provider,
        isLinked: true,
        providerEmail: socialAuth.providerEmail,
        providerName: socialAuth.providerName,
        linkedAt: socialAuth.createdAt,
        lastUpdated: socialAuth.updatedAt,
        tokenStatus: socialAuth.tokenExpiresAt ? (
          oauthService.needsTokenRefresh(socialAuth.tokenExpiresAt) ? 'needs_refresh' : 'valid'
        ) : 'no_expiry'
      }
    });

  } catch (error) {
    logger.error('Get provider status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider status',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * POST /oauth/check-conflicts
 * Check for account conflicts before linking
 */
router.post('/check-conflicts', [
  authenticateToken,
  body('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider'),
  body('userInfo').isObject().withMessage('User info is required'),
  body('userInfo.id').notEmpty().withMessage('Provider user ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { provider, userInfo } = req.body;
    const conflictCheck = await oauthService.checkAccountConflicts(userInfo, provider, userId);

    res.json({
      success: true,
      data: conflictCheck
    });

  } catch (error) {
    logger.error('Check conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check account conflicts',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * GET /oauth/audit-logs
 * Get OAuth audit logs for the authenticated user
 */
router.get('/audit-logs', [
  authenticateToken,
  query('provider').optional().isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider'),
  query('eventType').optional().isIn(['AUTHENTICATION', 'ACCOUNT_CHANGE', 'ACCESS_CONTROL']).withMessage('Invalid event type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const options = {
      provider: req.query.provider as string,
      eventType: req.query.eventType as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const auditLogs = await oauthService.getOAuthAuditLogs(userId, options);

    res.json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * POST /oauth/bulk-unlink
 * Bulk unlink multiple social auth providers
 */
router.post('/bulk-unlink', [
  authenticateToken,
  body('providers').isArray().withMessage('Providers must be an array'),
  body('providers.*').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { providers } = req.body;
    const results = await oauthService.bulkUnlinkProviders(userId, providers);

    const statusCode = results.failed.length > 0 ? 207 : 200; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: results.failed.length === 0,
      message: results.failed.length === 0 
        ? 'All providers unlinked successfully'
        : `${results.success.length} providers unlinked, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    logger.error('Bulk unlink error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to unlink providers',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * POST /oauth/:provider/link
 * Link additional social auth provider to existing account
 */
router.post('/:provider/link', [
  authenticateToken,
  param('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider'),
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('state').optional().isString().withMessage('State must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { provider } = req.params;
    const { code, state } = req.body;

    // Get PKCE challenge if it exists
    let codeVerifier: string | undefined;
    if (state && pkceStore.has(state)) {
      const pkceChallenge = pkceStore.get(state);
      codeVerifier = pkceChallenge?.codeVerifier;
      pkceStore.delete(state);
    }

    // Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(provider, code, codeVerifier);

    // Get user info from provider
    const userInfo = await oauthService.getUserInfo(provider, tokens.accessToken);

    // Check for account conflicts
    const conflictCheck = await oauthService.checkAccountConflicts(userInfo, provider, userId);
    
    if (conflictCheck.hasConflict) {
      let message = 'Cannot link this social account';
      let statusCode = 409;

      switch (conflictCheck.conflictType) {
        case 'provider_already_linked':
          if (conflictCheck.conflictDetails?.linkedToUser?.id === userId) {
            message = 'This social account is already linked to your account';
          } else {
            message = 'This social account is already linked to another user';
          }
          break;
        case 'email_different_provider_id':
          message = `An account with this email already exists with a different ${provider} ID`;
          break;
        default:
          message = 'Account linking conflict detected';
      }

      return res.status(statusCode).json({
        success: false,
        message,
        conflictType: conflictCheck.conflictType,
        conflictDetails: conflictCheck.conflictDetails
      });
    }

    // Link the social auth provider to the current user
    await prisma.socialAuthProvider.create({
      data: {
        userId,
        provider,
        providerUserId: userInfo.id,
        providerEmail: userInfo.email,
        providerName: userInfo.name,
        accessTokenEncrypted: oauthService['encryptToken'](tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? oauthService['encryptToken'](tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt
      }
    });

    // Log the account linking
    await oauthService['logSecurityEvent']('ACCOUNT_CHANGE', {
      provider,
      providerUserId: userInfo.id,
      action: 'oauth_manual_link_success',
      userId
    }, userId, null, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: `Successfully linked ${provider} account`,
      data: {
        provider,
        providerEmail: userInfo.email,
        providerName: userInfo.name,
        linkedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('OAuth link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link social account',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * DELETE /oauth/:provider/unlink
 * Unlink social auth provider from user account
 */
router.delete('/:provider/unlink', [
  authenticateToken,
  param('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { provider } = req.params;

    // Check if user has other authentication methods
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialAuthProviders: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user has at least one authentication method remaining
    const hasPassword = user.passwordHash && user.passwordHash.length > 0;
    const otherProviders = user.socialAuthProviders.filter((p: any) => p.provider !== provider);

    if (!hasPassword && otherProviders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unlink the last authentication method. Please set a password first.'
      });
    }

    await oauthService.unlinkProvider(userId, provider);

    res.json({
      success: true,
      message: `Successfully unlinked ${provider} account`
    });

  } catch (error) {
    logger.error('OAuth unlink error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Social auth provider not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to unlink social account',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * POST /oauth/:provider/refresh
 * Refresh OAuth tokens for a provider
 */
router.post('/:provider/refresh', [
  authenticateToken,
  param('provider').isIn(['google', 'apple', 'instagram']).withMessage('Invalid OAuth provider')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { provider } = req.params;

    // Get the social auth provider
    const socialAuth = await prisma.socialAuthProvider.findFirst({
      where: {
        userId,
        provider
      }
    });

    if (!socialAuth || !socialAuth.refreshTokenEncrypted) {
      return res.status(404).json({
        success: false,
        message: 'Social auth provider not found or no refresh token available'
      });
    }

    // Decrypt refresh token
    const refreshToken = oauthService.decryptToken(socialAuth.refreshTokenEncrypted);

    // Refresh tokens
    const newTokens = await oauthService.refreshTokens(provider, refreshToken);

    // Update stored tokens
    await prisma.socialAuthProvider.update({
      where: { id: socialAuth.id },
      data: {
        accessTokenEncrypted: oauthService['encryptToken'](newTokens.accessToken),
        refreshTokenEncrypted: newTokens.refreshToken ? oauthService['encryptToken'](newTokens.refreshToken) : socialAuth.refreshTokenEncrypted,
        tokenExpiresAt: newTokens.expiresAt,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        provider,
        expiresAt: newTokens.expiresAt
      }
    });

  } catch (error) {
    logger.error('OAuth token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh tokens',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * Passport OAuth routes for Google
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Generate JWT tokens
      const jwtPayload = {
        userId: user.user.id,
        email: user.user.email,
        role: user.user.role
      };

      const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });
      const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&new_user=${user.isNewUser}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
    }
  }
);

/**
 * Passport OAuth routes for Apple
 */
router.get('/apple', passport.authenticate('apple'));

router.post('/apple/callback',
  passport.authenticate('apple', { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Generate JWT tokens
      const jwtPayload = {
        userId: user.user.id,
        email: user.user.email,
        role: user.user.role
      };

      const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });
      const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&new_user=${user.isNewUser}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Apple OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
    }
  }
);

/**
 * POST /oauth/cleanup-tokens
 * Admin route to cleanup expired OAuth tokens
 */
router.post('/cleanup-tokens', [
  authenticateToken,
  // Add admin role check if needed
], async (req: Request, res: Response) => {
  try {
    // Only allow admin users to run cleanup (optional security measure)
    const userRole = req.user?.role;
    if (userRole !== 'PARENT') { // Adjust based on your role system
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const results = await oauthService.cleanupExpiredTokens();

    res.json({
      success: true,
      message: 'Token cleanup completed',
      data: {
        tokensRefreshed: results.cleaned,
        errors: results.errors,
        hasErrors: results.errors.length > 0
      }
    });

  } catch (error) {
    logger.error('Token cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup tokens',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;