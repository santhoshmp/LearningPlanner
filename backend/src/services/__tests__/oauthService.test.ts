import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

// Mock external dependencies
jest.mock('axios');
jest.mock('crypto');
jest.mock('crypto-js');
jest.mock('../utils/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCrypto = crypto as jest.Mocked<typeof crypto>;
const mockedCryptoJS = CryptoJS as jest.Mocked<typeof CryptoJS>;

// Mock Prisma
const mockPrisma = {
  socialAuthProvider: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  userSettings: {
    create: jest.fn(),
  },
  securityLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock global prisma
(global as any).__prisma = mockPrisma;

// Import the service after mocking
import OAuthService from '../oauthService';

describe('OAuthService', () => {
  let oauthService: OAuthService;
  
  const mockEnv = {
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
    APPLE_CLIENT_ID: 'test-apple-client-id',
    APPLE_TEAM_ID: 'test-apple-team-id',
    APPLE_KEY_ID: 'test-apple-key-id',
    APPLE_PRIVATE_KEY: 'test-apple-private-key',
    APPLE_REDIRECT_URI: 'http://localhost:3000/auth/apple/callback',
    INSTAGRAM_CLIENT_ID: 'test-instagram-client-id',
    INSTAGRAM_CLIENT_SECRET: 'test-instagram-client-secret',
    INSTAGRAM_REDIRECT_URI: 'http://localhost:3000/auth/instagram/callback',
    OAUTH_ENCRYPTION_KEY: 'test-encryption-key',
  };

  beforeAll(() => {
    // Set up environment variables
    Object.assign(process.env, mockEnv);
  });

  beforeEach(() => {
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

    // Create new service instance
    oauthService = new OAuthService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('PKCE Challenge Generation', () => {
    it('should generate valid PKCE challenge', () => {
      const mockCodeVerifier = 'mock-code-verifier-base64url';
      const mockCodeChallenge = 'mock-code-challenge-base64url';

      mockedCrypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockCodeVerifier)
      } as any);

      mockedCrypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(mockCodeChallenge)
      } as any);

      const challenge = oauthService.generatePKCEChallenge();

      expect(challenge).toEqual({
        codeVerifier: mockCodeVerifier,
        codeChallenge: mockCodeChallenge,
        codeChallengeMethod: 'S256'
      });

      expect(mockedCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockedCrypto.createHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('Authorization URL Generation', () => {
    it('should generate Google authorization URL', () => {
      const state = 'test-state';
      const pkceChallenge = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256'
      };

      mockedCrypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('random-state')
      } as any);

      const url = oauthService.getAuthorizationUrl('google', state, pkceChallenge);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(`client_id=${mockEnv.GOOGLE_CLIENT_ID}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(mockEnv.GOOGLE_REDIRECT_URI)}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=profile%20email');
      expect(url).toContain(`state=${state}`);
      expect(url).toContain(`code_challenge=${pkceChallenge.codeChallenge}`);
      expect(url).toContain(`code_challenge_method=${pkceChallenge.codeChallengeMethod}`);
    });

    it('should generate Apple authorization URL with form_post response mode', () => {
      const url = oauthService.getAuthorizationUrl('apple');

      expect(url).toContain('https://appleid.apple.com/auth/authorize');
      expect(url).toContain(`client_id=${mockEnv.APPLE_CLIENT_ID}`);
      expect(url).toContain('response_mode=form_post');
      expect(url).toContain('scope=name%20email');
    });

    it('should generate Instagram authorization URL', () => {
      const url = oauthService.getAuthorizationUrl('instagram');

      expect(url).toContain('https://api.instagram.com/oauth/authorize');
      expect(url).toContain(`client_id=${mockEnv.INSTAGRAM_CLIENT_ID}`);
      expect(url).toContain('scope=user_profile%20user_media');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        oauthService.getAuthorizationUrl('unsupported');
      }).toThrow('Provider unsupported not configured');
    });
  });

  describe('Token Exchange', () => {
    it('should exchange authorization code for Google tokens', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600
        }
      };

      mockedAxios.post.mockResolvedValue(mockTokenResponse);

      const tokens = await oauthService.exchangeCodeForTokens('google', 'auth-code', 'code-verifier');

      expect(tokens).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: expect.any(Date)
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          client_id: mockEnv.GOOGLE_CLIENT_ID,
          client_secret: mockEnv.GOOGLE_CLIENT_SECRET,
          code: 'auth-code',
          grant_type: 'authorization_code',
          redirect_uri: mockEnv.GOOGLE_REDIRECT_URI,
          code_verifier: 'code-verifier'
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );
    });

    it('should handle token exchange errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Token exchange failed'));

      await expect(
        oauthService.exchangeCodeForTokens('google', 'auth-code')
      ).rejects.toThrow('Failed to exchange code for tokens: google');
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        oauthService.exchangeCodeForTokens('unsupported', 'auth-code')
      ).rejects.toThrow('Provider unsupported not configured');
    });
  });

  describe('User Info Retrieval', () => {
    it('should fetch Google user info', async () => {
      const mockUserResponse = {
        data: {
          id: 'google-user-id',
          email: 'user@example.com',
          name: 'Test User',
          picture: 'https://example.com/picture.jpg'
        }
      };

      mockedAxios.get.mockResolvedValue(mockUserResponse);

      const userInfo = await oauthService.getUserInfo('google', 'access-token');

      expect(userInfo).toEqual({
        id: 'google-user-id',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg'
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer access-token'
          }
        })
      );
    });

    it('should fetch Instagram user info', async () => {
      const mockUserResponse = {
        data: {
          id: 'instagram-user-id',
          username: 'testuser'
        }
      };

      mockedAxios.get.mockResolvedValue(mockUserResponse);

      const userInfo = await oauthService.getUserInfo('instagram', 'access-token');

      expect(userInfo).toEqual({
        id: 'instagram-user-id',
        name: 'testuser'
      });
    });

    it('should handle user info fetch errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('User info fetch failed'));

      await expect(
        oauthService.getUserInfo('google', 'access-token')
      ).rejects.toThrow('Failed to fetch user info: google');
    });

    it('should throw error for Apple user info (not supported)', async () => {
      await expect(
        oauthService.getUserInfo('apple', 'access-token')
      ).rejects.toThrow('User info not supported for provider: apple');
    });
  });

  describe('OAuth Callback Handling', () => {
    const mockUserInfo = {
      id: 'provider-user-id',
      email: 'user@example.com',
      name: 'Test User'
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 3600000)
    };

    it('should handle existing social auth provider', async () => {
      const mockExistingSocialAuth = {
        id: 'social-auth-id',
        user: {
          id: 'user-id',
          email: 'user@example.com'
        }
      };

      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(mockExistingSocialAuth);
      mockPrisma.socialAuthProvider.update.mockResolvedValue({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      const result = await oauthService.handleOAuthCallback(
        'google',
        mockUserInfo,
        mockTokens,
        '127.0.0.1',
        'test-user-agent'
      );

      expect(result).toEqual({
        user: mockExistingSocialAuth.user,
        isNewUser: false,
        linkedAccount: false
      });

      expect(mockPrisma.socialAuthProvider.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: 'google',
            providerUserId: mockUserInfo.id
          }
        },
        include: {
          user: true
        }
      });
    });

    it('should create new user from OAuth', async () => {
      const mockNewUser = {
        id: 'new-user-id',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockNewUser);
      mockPrisma.socialAuthProvider.create.mockResolvedValue({});
      mockPrisma.userSettings.create.mockResolvedValue({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      // Mock crypto functions
      mockedCrypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('random-password-hash')
      } as any);

      const mockEncryptedToken = { toString: jest.fn().mockReturnValue('encrypted-token') };
      mockedCryptoJS.AES.encrypt.mockReturnValue(mockEncryptedToken as any);

      const result = await oauthService.handleOAuthCallback(
        'google',
        mockUserInfo,
        mockTokens
      );

      expect(result).toEqual({
        user: mockNewUser,
        isNewUser: true,
        linkedAccount: false
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockUserInfo.email,
          firstName: 'Test',
          lastName: 'User',
          isEmailVerified: true,
          role: 'PARENT'
        })
      });

      expect(mockPrisma.socialAuthProvider.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockNewUser.id,
          provider: 'google',
          providerUserId: mockUserInfo.id,
          providerEmail: mockUserInfo.email,
          providerName: mockUserInfo.name
        })
      });
    });

    it('should link social auth to existing user with same email', async () => {
      const mockExistingUser = {
        id: 'existing-user-id',
        email: 'user@example.com',
        socialAuthProviders: []
      };

      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrisma.socialAuthProvider.create.mockResolvedValue({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      const mockEncryptedToken = { toString: jest.fn().mockReturnValue('encrypted-token') };
      mockedCryptoJS.AES.encrypt.mockReturnValue(mockEncryptedToken as any);

      const result = await oauthService.handleOAuthCallback(
        'google',
        mockUserInfo,
        mockTokens
      );

      expect(result).toEqual({
        user: mockExistingUser,
        isNewUser: false,
        linkedAccount: true,
        conflictResolution: 'linked_to_existing_email'
      });

      expect(mockPrisma.socialAuthProvider.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockExistingUser.id,
          provider: 'google',
          providerUserId: mockUserInfo.id
        })
      });
    });

    it('should handle account conflict with different provider user ID', async () => {
      const mockExistingUser = {
        id: 'existing-user-id',
        email: 'user@example.com',
        socialAuthProviders: [{
          provider: 'google',
          providerUserId: 'different-provider-user-id'
        }]
      };

      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrisma.securityLog.create.mockResolvedValue({});

      await expect(
        oauthService.handleOAuthCallback('google', mockUserInfo, mockTokens)
      ).rejects.toThrow('This google account cannot be linked');

      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'ACCOUNT_CHANGE',
          details: expect.objectContaining({
            action: 'oauth_account_conflict',
            conflictType: 'different_provider_id_same_email'
          })
        })
      });
    });

    it('should handle callback errors and log them', async () => {
      mockPrisma.socialAuthProvider.findUnique.mockRejectedValue(new Error('Database error'));
      mockPrisma.securityLog.create.mockResolvedValue({});

      await expect(
        oauthService.handleOAuthCallback('google', mockUserInfo, mockTokens)
      ).rejects.toThrow('Database error');

      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'AUTHENTICATION',
          details: expect.objectContaining({
            action: 'oauth_callback_error',
            error: 'Database error'
          })
        })
      });
    });
  });

  describe('Token Encryption/Decryption', () => {
    it('should encrypt tokens', () => {
      const mockEncryptedToken = { toString: jest.fn().mockReturnValue('encrypted-token') };
      mockedCryptoJS.AES.encrypt.mockReturnValue(mockEncryptedToken as any);

      const encrypted = oauthService.encryptToken('plain-token');

      expect(encrypted).toBe('encrypted-token');
      expect(mockedCryptoJS.AES.encrypt).toHaveBeenCalledWith('plain-token', mockEnv.OAUTH_ENCRYPTION_KEY);
    });

    it('should decrypt tokens', () => {
      const mockDecryptedBytes = {
        toString: jest.fn().mockReturnValue('decrypted-token')
      };
      mockedCryptoJS.AES.decrypt.mockReturnValue(mockDecryptedBytes as any);

      const decrypted = oauthService.decryptToken('encrypted-token');

      expect(decrypted).toBe('decrypted-token');
      expect(mockedCryptoJS.AES.decrypt).toHaveBeenCalledWith('encrypted-token', mockEnv.OAUTH_ENCRYPTION_KEY);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh Google tokens', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }
      };

      mockedAxios.post.mockResolvedValue(mockTokenResponse);

      const tokens = await oauthService.refreshTokens('google', 'refresh-token');

      expect(tokens).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Date)
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          client_id: mockEnv.GOOGLE_CLIENT_ID,
          client_secret: mockEnv.GOOGLE_CLIENT_SECRET,
          refresh_token: 'refresh-token',
          grant_type: 'refresh_token'
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );
    });

    it('should handle token refresh errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Token refresh failed'));

      await expect(
        oauthService.refreshTokens('google', 'refresh-token')
      ).rejects.toThrow('Failed to refresh tokens: google');
    });
  });

  describe('Provider Management', () => {
    it('should unlink social auth provider', async () => {
      const mockSocialAuth = {
        id: 'social-auth-id',
        provider: 'google'
      };

      mockPrisma.socialAuthProvider.findFirst.mockResolvedValue(mockSocialAuth);
      mockPrisma.socialAuthProvider.delete.mockResolvedValue({});

      await oauthService.unlinkProvider('user-id', 'google');

      expect(mockPrisma.socialAuthProvider.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          provider: 'google'
        }
      });

      expect(mockPrisma.socialAuthProvider.delete).toHaveBeenCalledWith({
        where: { id: 'social-auth-id' }
      });
    });

    it('should throw error when unlinking non-existent provider', async () => {
      mockPrisma.socialAuthProvider.findFirst.mockResolvedValue(null);

      await expect(
        oauthService.unlinkProvider('user-id', 'google')
      ).rejects.toThrow('Social auth provider google not found for user');
    });

    it('should get user social providers', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          provider: 'google',
          providerEmail: 'user@example.com',
          providerName: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.socialAuthProvider.findMany.mockResolvedValue(mockProviders);

      const providers = await oauthService.getUserSocialProviders('user-id');

      expect(providers).toEqual(mockProviders);
      expect(mockPrisma.socialAuthProvider.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        select: expect.objectContaining({
          id: true,
          provider: true,
          providerEmail: true,
          providerName: true,
          createdAt: true,
          updatedAt: true
        })
      });
    });
  });

  describe('Token Status Checks', () => {
    it('should identify tokens that need refresh', () => {
      const fiveMinutesFromNow = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes from now
      const needsRefresh = oauthService.needsTokenRefresh(fiveMinutesFromNow);
      expect(needsRefresh).toBe(true);
    });

    it('should identify tokens that do not need refresh', () => {
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const needsRefresh = oauthService.needsTokenRefresh(tenMinutesFromNow);
      expect(needsRefresh).toBe(false);
    });

    it('should handle null token expiry', () => {
      const needsRefresh = oauthService.needsTokenRefresh(null);
      expect(needsRefresh).toBe(false);
    });
  });

  describe('Account Conflict Detection', () => {
    it('should detect provider already linked conflict', async () => {
      const mockExistingAuth = {
        userId: 'different-user-id',
        user: {
          id: 'different-user-id',
          email: 'different@example.com',
          firstName: 'Different',
          lastName: 'User'
        },
        createdAt: new Date()
      };

      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(mockExistingAuth);

      const result = await oauthService.checkAccountConflicts(
        { id: 'provider-user-id', email: 'user@example.com' },
        'google',
        'current-user-id'
      );

      expect(result).toEqual({
        hasConflict: true,
        conflictType: 'provider_already_linked',
        conflictDetails: {
          linkedToUser: mockExistingAuth.user,
          linkedAt: mockExistingAuth.createdAt
        }
      });
    });

    it('should detect email with different provider ID conflict', async () => {
      const mockExistingUser = {
        id: 'different-user-id',
        email: 'user@example.com',
        socialAuthProviders: [{
          providerUserId: 'different-provider-user-id'
        }]
      };

      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockExistingUser);

      const result = await oauthService.checkAccountConflicts(
        { id: 'provider-user-id', email: 'user@example.com' },
        'google',
        'current-user-id'
      );

      expect(result).toEqual({
        hasConflict: true,
        conflictType: 'email_different_provider_id',
        conflictDetails: {
          existingUser: {
            id: 'different-user-id',
            email: 'user@example.com'
          },
          existingProviderUserId: 'different-provider-user-id'
        }
      });
    });

    it('should return no conflict when none exists', async () => {
      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await oauthService.checkAccountConflicts(
        { id: 'provider-user-id', email: 'user@example.com' },
        'google',
        'current-user-id'
      );

      expect(result).toEqual({
        hasConflict: false
      });
    });
  });

  describe('Bulk Provider Unlinking', () => {
    it('should successfully unlink multiple providers', async () => {
      const mockUser = {
        id: 'user-id',
        passwordHash: 'has-password',
        socialAuthProviders: [
          { provider: 'google' },
          { provider: 'apple' },
          { provider: 'instagram' }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.socialAuthProvider.findFirst
        .mockResolvedValueOnce({ id: 'google-auth-id' })
        .mockResolvedValueOnce({ id: 'apple-auth-id' });
      mockPrisma.socialAuthProvider.delete
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      const result = await oauthService.bulkUnlinkProviders('user-id', ['google', 'apple']);

      expect(result).toEqual({
        success: ['google', 'apple'],
        failed: [],
        errors: {}
      });
    });

    it('should prevent unlinking all auth methods', async () => {
      const mockUser = {
        id: 'user-id',
        passwordHash: null, // No password
        socialAuthProviders: [
          { provider: 'google' }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        oauthService.bulkUnlinkProviders('user-id', ['google'])
      ).rejects.toThrow('Cannot unlink all authentication methods');
    });

    it('should handle partial failures', async () => {
      const mockUser = {
        id: 'user-id',
        passwordHash: 'has-password',
        socialAuthProviders: [
          { provider: 'google' },
          { provider: 'apple' }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.socialAuthProvider.findFirst
        .mockResolvedValueOnce({ id: 'google-auth-id' })
        .mockResolvedValueOnce(null); // Apple not found
      mockPrisma.socialAuthProvider.delete.mockResolvedValueOnce({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      const result = await oauthService.bulkUnlinkProviders('user-id', ['google', 'apple']);

      expect(result.success).toContain('google');
      expect(result.failed).toContain('apple');
      expect(result.errors.apple).toContain('not found');
    });
  });

  describe('Audit Logging', () => {
    it('should fetch OAuth audit logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          eventType: 'AUTHENTICATION',
          details: { provider: 'google', action: 'oauth_login_success' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date()
        }
      ];

      mockPrisma.securityLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.securityLog.count.mockResolvedValue(1);

      const result = await oauthService.getOAuthAuditLogs('user-id', {
        provider: 'google',
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        logs: mockLogs,
        total: 1
      });

      expect(mockPrisma.securityLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-id',
          eventType: {
            in: ['AUTHENTICATION', 'ACCOUNT_CHANGE', 'ACCESS_CONTROL']
          }
        }),
        orderBy: { timestamp: 'desc' },
        take: 10,
        skip: 0,
        select: expect.any(Object)
      });
    });
  });

  describe('Token Cleanup', () => {
    it('should clean up expired tokens by refreshing them', async () => {
      const mockExpiredTokens = [
        {
          id: 'token-1',
          userId: 'user-1',
          provider: 'google',
          tokenExpiresAt: new Date(Date.now() - 1000) // Expired
        }
      ];

      const mockSocialAuth = {
        id: 'token-1',
        refreshTokenEncrypted: 'encrypted-refresh-token'
      };

      const mockNewTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      };

      mockPrisma.socialAuthProvider.findMany.mockResolvedValue(mockExpiredTokens);
      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(mockSocialAuth);
      mockPrisma.socialAuthProvider.update.mockResolvedValue({});
      mockPrisma.securityLog.create.mockResolvedValue({});

      // Mock decryption and token refresh
      const mockDecryptedBytes = {
        toString: jest.fn().mockReturnValue('refresh-token')
      };
      mockedCryptoJS.AES.decrypt.mockReturnValue(mockDecryptedBytes as any);

      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }
      };
      mockedAxios.post.mockResolvedValue(mockTokenResponse);

      const mockEncryptedToken = { toString: jest.fn().mockReturnValue('encrypted-new-token') };
      mockedCryptoJS.AES.encrypt.mockReturnValue(mockEncryptedToken as any);

      const result = await oauthService.cleanupExpiredTokens();

      expect(result.cleaned).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockPrisma.socialAuthProvider.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: expect.objectContaining({
          accessTokenEncrypted: 'encrypted-new-token',
          tokenExpiresAt: expect.any(Date)
        })
      });
    });

    it('should handle tokens without refresh capability', async () => {
      const mockExpiredTokens = [
        {
          id: 'token-1',
          userId: 'user-1',
          provider: 'google',
          tokenExpiresAt: new Date(Date.now() - 1000)
        }
      ];

      const mockSocialAuth = {
        id: 'token-1',
        refreshTokenEncrypted: null // No refresh token
      };

      mockPrisma.socialAuthProvider.findMany.mockResolvedValue(mockExpiredTokens);
      mockPrisma.socialAuthProvider.findUnique.mockResolvedValue(mockSocialAuth);
      mockPrisma.securityLog.create.mockResolvedValue({});

      const result = await oauthService.cleanupExpiredTokens();

      expect(result.cleaned).toBe(0);
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'AUTHENTICATION',
          details: expect.objectContaining({
            action: 'token_expired_no_refresh'
          })
        })
      });
    });
  });
});