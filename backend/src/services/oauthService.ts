import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import crypto from 'crypto';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { logger } from '../utils/logger';

// Use the global prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

const getPrisma = () => globalThis.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production' && !globalThis.__prisma) {
  globalThis.__prisma = new PrismaClient();
}

interface OAuthProvider {
  provider: 'google' | 'apple' | 'instagram';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

class OAuthService {
  private encryptionKey: string;
  private providers: Map<string, OAuthProvider>;

  constructor() {
    this.encryptionKey = process.env.OAUTH_ENCRYPTION_KEY || 'default-key-change-in-production';
    this.providers = new Map();
    this.initializeProviders();
    this.configurePassportStrategies();
  }

  private initializeProviders(): void {
    // Google OAuth configuration
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.providers.set('google', {
        provider: 'google',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      });
    }

    // Apple OAuth configuration
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
      this.providers.set('apple', {
        provider: 'apple',
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_PRIVATE_KEY || '',
        redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/auth/apple/callback'
      });
    }

    // Instagram OAuth configuration
    if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
      this.providers.set('instagram', {
        provider: 'instagram',
        clientId: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback'
      });
    }
  }

  private configurePassportStrategies(): void {
    // Google Strategy
    const googleProvider = this.providers.get('google');
    if (googleProvider) {
      passport.use(new GoogleStrategy({
        clientID: googleProvider.clientId,
        clientSecret: googleProvider.clientSecret,
        callbackURL: googleProvider.redirectUri,
        scope: ['profile', 'email']
      }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const userInfo: OAuthUserInfo = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value
          };

          const tokens: OAuthTokens = {
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
          };

          const result = await this.handleOAuthCallback('google', userInfo, tokens);
          return done(null, result);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error, null);
        }
      }));
    }

    // Apple Strategy
    const appleProvider = this.providers.get('apple');
    if (appleProvider) {
      passport.use(new AppleStrategy({
        clientID: appleProvider.clientId,
        teamID: process.env.APPLE_TEAM_ID!,
        keyID: process.env.APPLE_KEY_ID!,
        privateKeyString: process.env.APPLE_PRIVATE_KEY!,
        callbackURL: appleProvider.redirectUri,
        scope: ['name', 'email'],
        passReqToCallback: false
      }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const userInfo: OAuthUserInfo = {
            id: profile.id,
            email: profile.email,
            name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : undefined
          };

          const tokens: OAuthTokens = {
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
          };

          const result = await this.handleOAuthCallback('apple', userInfo, tokens);
          return done(null, result);
        } catch (error) {
          logger.error('Apple OAuth error:', error);
          return done(error, null);
        }
      }));
    }
  }

  /**
   * Generate PKCE challenge for secure OAuth flow with enhanced security
   */
  generatePKCEChallenge(): PKCEChallenge {
    // Generate cryptographically secure random code verifier (43-128 characters)
    const codeVerifier = crypto.randomBytes(64).toString('base64url').slice(0, 128);
    
    // Create SHA256 hash of code verifier
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Validate PKCE challenge during token exchange
   */
  validatePKCEChallenge(codeVerifier: string, codeChallenge: string): boolean {
    if (!codeVerifier || !codeChallenge) {
      return false;
    }

    // Verify code verifier format (43-128 characters, base64url)
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return false;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(codeVerifier)) {
      return false;
    }

    // Generate challenge from verifier and compare
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return expectedChallenge === codeChallenge;
  }

  /**
   * Generate secure state parameter for OAuth flow
   */
  generateSecureState(userId?: string): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const userPart = userId ? crypto.createHash('sha256').update(userId).digest('hex').slice(0, 8) : '';
    
    return `${timestamp}.${randomBytes}.${userPart}`;
  }

  /**
   * Validate OAuth state parameter
   */
  validateState(state: string, maxAge: number = 10 * 60 * 1000): boolean {
    if (!state) return false;

    const parts = state.split('.');
    if (parts.length < 2) return false;

    const timestamp = parseInt(parts[0]);
    if (isNaN(timestamp)) return false;

    // Check if state is not too old (default 10 minutes)
    const age = Date.now() - timestamp;
    return age <= maxAge;
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  getAuthorizationUrl(provider: string, state?: string, pkceChallenge?: PKCEChallenge): string {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      apple: 'https://appleid.apple.com/auth/authorize',
      instagram: 'https://api.instagram.com/oauth/authorize'
    };

    const scopes = {
      google: 'profile email',
      apple: 'name email',
      instagram: 'user_profile user_media'
    };

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      response_type: 'code',
      scope: scopes[provider as keyof typeof scopes],
      state: state || crypto.randomBytes(16).toString('hex')
    });

    // Add PKCE parameters for enhanced security
    if (pkceChallenge) {
      params.append('code_challenge', pkceChallenge.codeChallenge);
      params.append('code_challenge_method', pkceChallenge.codeChallengeMethod);
    }

    // Provider-specific parameters
    if (provider === 'apple') {
      params.append('response_mode', 'form_post');
    }

    const baseUrl = baseUrls[provider as keyof typeof baseUrls];
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(
    provider: string, 
    code: string, 
    codeVerifier?: string
  ): Promise<OAuthTokens> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const tokenUrls = {
      google: 'https://oauth2.googleapis.com/token',
      apple: 'https://appleid.apple.com/auth/token',
      instagram: 'https://api.instagram.com/oauth/access_token'
    };

    const tokenData: any = {
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: providerConfig.redirectUri
    };

    // Add PKCE code verifier if provided
    if (codeVerifier) {
      tokenData.code_verifier = codeVerifier;
    }

    try {
      const response = await axios.post(tokenUrls[provider as keyof typeof tokenUrls], tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined
      };
    } catch (error) {
      logger.error(`Token exchange error for ${provider}:`, error);
      throw new Error(`Failed to exchange code for tokens: ${provider}`);
    }
  }

  /**
   * Get user information from OAuth provider
   */
  async getUserInfo(provider: string, accessToken: string): Promise<OAuthUserInfo> {
    const userInfoUrls = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      apple: 'https://appleid.apple.com/auth/userinfo', // Note: Apple doesn't provide a userinfo endpoint
      instagram: 'https://graph.instagram.com/me?fields=id,username'
    };

    try {
      const response = await axios.get(userInfoUrls[provider as keyof typeof userInfoUrls], {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = response.data;

      switch (provider) {
        case 'google':
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture
          };
        case 'instagram':
          return {
            id: data.id,
            name: data.username
          };
        default:
          throw new Error(`User info not supported for provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`User info fetch error for ${provider}:`, error);
      throw new Error(`Failed to fetch user info: ${provider}`);
    }
  }

  /**
   * Handle OAuth callback and create/link user account
   */
  async handleOAuthCallback(
    provider: string, 
    userInfo: OAuthUserInfo, 
    tokens: OAuthTokens,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: any; isNewUser: boolean; linkedAccount: boolean; conflictResolution?: string }> {
    try {
      // Log authentication attempt
      await this.logSecurityEvent('AUTHENTICATION', {
        provider,
        providerUserId: userInfo.id,
        providerEmail: userInfo.email,
        action: 'oauth_callback_attempt'
      }, null, null, ipAddress, userAgent);

      // Check if social auth provider already exists
      const existingSocialAuth = await getPrisma().socialAuthProvider.findUnique({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId: userInfo.id
          }
        },
        include: {
          user: true
        }
      });

      if (existingSocialAuth) {
        // Update tokens for existing social auth
        await this.updateSocialAuthTokens(existingSocialAuth.id, tokens);
        
        // Log successful authentication
        await this.logSecurityEvent('AUTHENTICATION', {
          provider,
          providerUserId: userInfo.id,
          action: 'oauth_login_success',
          userId: existingSocialAuth.user.id
        }, existingSocialAuth.user.id, null, ipAddress, userAgent);

        return {
          user: existingSocialAuth.user,
          isNewUser: false,
          linkedAccount: false
        };
      }

      // Handle account linking and conflict resolution
      const linkingResult = await this.handleAccountLinking(userInfo, provider, tokens, ipAddress, userAgent);

      return linkingResult;
    } catch (error) {
      // Log authentication failure
      await this.logSecurityEvent('AUTHENTICATION', {
        provider,
        providerUserId: userInfo.id,
        action: 'oauth_callback_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, null, null, ipAddress, userAgent);

      logger.error('OAuth callback handling error:', error);
      throw error;
    }
  }

  /**
   * Handle account linking with conflict resolution
   */
  private async handleAccountLinking(
    userInfo: OAuthUserInfo,
    provider: string,
    tokens: OAuthTokens,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: any; isNewUser: boolean; linkedAccount: boolean; conflictResolution?: string }> {
    let user: any = null;
    let linkedAccount = false;
    let conflictResolution: string | undefined;

    if (userInfo.email) {
      // Check for existing user with same email
      user = await getPrisma().user.findUnique({
        where: { email: userInfo.email },
        include: {
          socialAuthProviders: true
        }
      });

      if (user) {
        // Check if user already has this provider linked
        const existingProvider = user.socialAuthProviders.find(
          (p: any) => p.provider === provider
        );

        if (existingProvider) {
          // Conflict: Same email, different provider user ID
          conflictResolution = 'email_conflict_different_provider_id';
          
          await this.logSecurityEvent('ACCOUNT_CHANGE', {
            provider,
            providerUserId: userInfo.id,
            existingProviderUserId: existingProvider.providerUserId,
            action: 'oauth_account_conflict',
            conflictType: 'different_provider_id_same_email',
            resolution: 'rejected'
          }, user.id, null, ipAddress, userAgent);

          throw new Error(`This ${provider} account cannot be linked. An account with email ${userInfo.email} already exists with a different ${provider} ID.`);
        }

        // Link social auth to existing user
        await this.createSocialAuthProvider(user.id, provider, userInfo, tokens);
        linkedAccount = true;
        conflictResolution = 'linked_to_existing_email';

        await this.logSecurityEvent('ACCOUNT_CHANGE', {
          provider,
          providerUserId: userInfo.id,
          action: 'oauth_account_linked',
          linkedToUserId: user.id
        }, user.id, null, ipAddress, userAgent);
      }
    }

    // Create new user if none exists
    if (!user) {
      user = await this.createUserFromOAuth(userInfo, provider, tokens);
      
      await this.logSecurityEvent('ACCOUNT_CHANGE', {
        provider,
        providerUserId: userInfo.id,
        action: 'oauth_user_created',
        userId: user.id
      }, user.id, null, ipAddress, userAgent);
    }

    return {
      user,
      isNewUser: !linkedAccount,
      linkedAccount,
      conflictResolution
    };
  }

  /**
   * Create new user from OAuth information
   */
  private async createUserFromOAuth(
    userInfo: OAuthUserInfo, 
    provider: string, 
    tokens: OAuthTokens
  ): Promise<any> {
    const userData = {
      email: userInfo.email || `${provider}_${userInfo.id}@oauth.local`,
      passwordHash: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
      firstName: userInfo.name?.split(' ')[0] || '',
      lastName: userInfo.name?.split(' ').slice(1).join(' ') || '',
      isEmailVerified: !!userInfo.email, // Consider OAuth emails as verified
      role: 'PARENT' as const
    };

    const user = await getPrisma().user.create({
      data: userData
    });

    // Create social auth provider record
    await this.createSocialAuthProvider(user.id, provider, userInfo, tokens);

    // Create default user settings
    await getPrisma().userSettings.create({
      data: {
        userId: user.id
      }
    });

    return user;
  }

  /**
   * Create social auth provider record
   */
  private async createSocialAuthProvider(
    userId: string, 
    provider: string, 
    userInfo: OAuthUserInfo, 
    tokens: OAuthTokens
  ): Promise<void> {
    await getPrisma().socialAuthProvider.create({
      data: {
        userId,
        provider,
        providerUserId: userInfo.id,
        providerEmail: userInfo.email,
        providerName: userInfo.name,
        accessTokenEncrypted: this.encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt
      }
    });
  }

  /**
   * Update social auth provider tokens
   */
  private async updateSocialAuthTokens(socialAuthId: string, tokens: OAuthTokens): Promise<void> {
    await getPrisma().socialAuthProvider.update({
      where: { id: socialAuthId },
      data: {
        accessTokenEncrypted: this.encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Encrypt OAuth tokens for secure storage with enhanced security
   */
  private encryptToken(token: string): string {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
      cipher.setAAD(Buffer.from('oauth-token'));
      
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Token encryption error:', error);
      // Fallback to CryptoJS for compatibility
      return CryptoJS.AES.encrypt(token, this.encryptionKey).toString();
    }
  }

  /**
   * Decrypt OAuth tokens with enhanced security
   */
  decryptToken(encryptedToken: string): string {
    try {
      // Check if it's new format (with IV and auth tag)
      if (encryptedToken.includes(':')) {
        const parts = encryptedToken.split(':');
        if (parts.length === 3) {
          const iv = Buffer.from(parts[0], 'hex');
          const authTag = Buffer.from(parts[1], 'hex');
          const encrypted = parts[2];
          
          const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
          decipher.setAuthTag(authTag);
          decipher.setAAD(Buffer.from('oauth-token'));
          
          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          
          return decrypted;
        }
      }
      
      // Fallback to CryptoJS for old format
      const bytes = CryptoJS.AES.decrypt(encryptedToken, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error('Token decryption error:', error);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Securely hash sensitive data for comparison
   */
  private hashSensitiveData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed sensitive data
   */
  private verifySensitiveData(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const expectedHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
      return hash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(provider: string, refreshToken: string): Promise<OAuthTokens> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const tokenUrls = {
      google: 'https://oauth2.googleapis.com/token',
      apple: 'https://appleid.apple.com/auth/token',
      instagram: 'https://api.instagram.com/oauth/access_token'
    };

    const tokenData = {
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    try {
      const response = await axios.post(tokenUrls[provider as keyof typeof tokenUrls], tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken, // Some providers don't return new refresh token
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined
      };
    } catch (error) {
      logger.error(`Token refresh error for ${provider}:`, error);
      throw new Error(`Failed to refresh tokens: ${provider}`);
    }
  }

  /**
   * Unlink social auth provider from user account
   */
  async unlinkProvider(userId: string, provider: string): Promise<void> {
    const socialAuth = await getPrisma().socialAuthProvider.findFirst({
      where: {
        userId,
        provider
      }
    });

    if (!socialAuth) {
      throw new Error(`Social auth provider ${provider} not found for user`);
    }

    await getPrisma().socialAuthProvider.delete({
      where: { id: socialAuth.id }
    });

    logger.info(`Unlinked ${provider} from user ${userId}`);
  }

  /**
   * Get user's linked social auth providers
   */
  async getUserSocialProviders(userId: string): Promise<any[]> {
    const providers = await getPrisma().socialAuthProvider.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerEmail: true,
        providerName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return providers;
  }

  /**
   * Check if tokens need refresh
   */
  needsTokenRefresh(tokenExpiresAt: Date | null): boolean {
    if (!tokenExpiresAt) return false;
    
    // Refresh if token expires within 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return tokenExpiresAt <= fiveMinutesFromNow;
  }

  /**
   * Enhanced social auth provider operations
   */

  /**
   * Get social auth provider by user and provider
   */
  async getSocialAuthProvider(userId: string, provider: string): Promise<any | null> {
    try {
      const socialAuth = await getPrisma().socialAuthProvider.findFirst({
        where: {
          userId,
          provider
        },
        select: {
          id: true,
          provider: true,
          providerUserId: true,
          providerEmail: true,
          providerName: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return socialAuth;
    } catch (error) {
      logger.error('Error fetching social auth provider:', error);
      throw error;
    }
  }

  /**
   * Get all social auth providers for a user with detailed info
   */
  async getUserSocialProvidersDetailed(userId: string): Promise<any[]> {
    try {
      const providers = await getPrisma().socialAuthProvider.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          providerUserId: true,
          providerEmail: true,
          providerName: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Add token status information
      return providers.map(provider => ({
        ...provider,
        tokenStatus: this.getTokenStatus(provider.tokenExpiresAt),
        needsRefresh: this.needsTokenRefresh(provider.tokenExpiresAt)
      }));
    } catch (error) {
      logger.error('Error fetching detailed social providers:', error);
      throw error;
    }
  }

  /**
   * Get token status
   */
  private getTokenStatus(tokenExpiresAt: Date | null): string {
    if (!tokenExpiresAt) return 'no_expiry';
    
    const now = new Date();
    if (tokenExpiresAt <= now) return 'expired';
    if (this.needsTokenRefresh(tokenExpiresAt)) return 'expires_soon';
    return 'valid';
  }

  /**
   * Bulk unlink multiple providers (with safety checks)
   */
  async bulkUnlinkProviders(userId: string, providers: string[]): Promise<{ success: string[]; failed: string[]; errors: Record<string, string> }> {
    const results = {
      success: [] as string[],
      failed: [] as string[],
      errors: {} as Record<string, string>
    };

    // Get user with all auth methods
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      include: {
        socialAuthProviders: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasPassword = user.passwordHash && user.passwordHash.length > 0;
    const totalProviders = user.socialAuthProviders.length;
    const providersToUnlink = providers.filter(p => 
      user.socialAuthProviders.some((sp: any) => sp.provider === p)
    );

    // Safety check: ensure user has at least one auth method remaining
    if (!hasPassword && totalProviders - providersToUnlink.length < 1) {
      throw new Error('Cannot unlink all authentication methods. Please set a password first.');
    }

    // Process each provider
    for (const provider of providers) {
      try {
        await this.unlinkProvider(userId, provider);
        results.success.push(provider);
        
        await this.logSecurityEvent('ACCOUNT_CHANGE', {
          provider,
          action: 'oauth_provider_unlinked',
          userId
        }, userId);
      } catch (error) {
        results.failed.push(provider);
        results.errors[provider] = error instanceof Error ? error.message : 'Unknown error';
        
        await this.logSecurityEvent('ACCOUNT_CHANGE', {
          provider,
          action: 'oauth_provider_unlink_failed',
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, userId);
      }
    }

    return results;
  }

  /**
   * Check for account conflicts before linking
   */
  async checkAccountConflicts(userInfo: OAuthUserInfo, provider: string, currentUserId?: string): Promise<{
    hasConflict: boolean;
    conflictType?: string;
    conflictDetails?: any;
  }> {
    try {
      // Check if provider user ID is already linked to another account
      const existingProviderAuth = await getPrisma().socialAuthProvider.findUnique({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId: userInfo.id
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (existingProviderAuth && existingProviderAuth.userId !== currentUserId) {
        return {
          hasConflict: true,
          conflictType: 'provider_already_linked',
          conflictDetails: {
            linkedToUser: existingProviderAuth.user,
            linkedAt: existingProviderAuth.createdAt
          }
        };
      }

      // Check if email is already used by another account with different provider ID
      if (userInfo.email && currentUserId) {
        const existingEmailUser = await getPrisma().user.findUnique({
          where: { email: userInfo.email },
          include: {
            socialAuthProviders: {
              where: { provider }
            }
          }
        });

        if (existingEmailUser && existingEmailUser.id !== currentUserId) {
          const existingProvider = existingEmailUser.socialAuthProviders[0];
          if (existingProvider && existingProvider.providerUserId !== userInfo.id) {
            return {
              hasConflict: true,
              conflictType: 'email_different_provider_id',
              conflictDetails: {
                existingUser: {
                  id: existingEmailUser.id,
                  email: existingEmailUser.email
                },
                existingProviderUserId: existingProvider.providerUserId
              }
            };
          }
        }
      }

      return { hasConflict: false };
    } catch (error) {
      logger.error('Error checking account conflicts:', error);
      throw error;
    }
  }

  /**
   * Log security events for OAuth operations
   */
  private async logSecurityEvent(
    eventType: 'AUTHENTICATION' | 'ACCOUNT_CHANGE' | 'ACCESS_CONTROL' | 'SUSPICIOUS_ACTIVITY',
    details: Record<string, any>,
    userId?: string | null,
    childId?: string | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await getPrisma().securityLog.create({
        data: {
          eventType,
          userId,
          childId,
          ipAddress,
          userAgent,
          details,
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Don't throw on logging errors, just log them
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Get OAuth audit logs for a user
   */
  async getOAuthAuditLogs(userId: string, options?: {
    provider?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {
        userId,
        eventType: {
          in: ['AUTHENTICATION', 'ACCOUNT_CHANGE', 'ACCESS_CONTROL']
        }
      };

      // Add filters
      if (options?.provider) {
        where.details = {
          path: ['provider'],
          equals: options.provider
        };
      }

      if (options?.eventType) {
        where.eventType = options.eventType;
      }

      if (options?.startDate || options?.endDate) {
        where.timestamp = {};
        if (options.startDate) where.timestamp.gte = options.startDate;
        if (options.endDate) where.timestamp.lte = options.endDate;
      }

      const [logs, total] = await Promise.all([
        getPrisma().securityLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: options?.limit || 50,
          skip: options?.offset || 0,
          select: {
            id: true,
            eventType: true,
            details: true,
            ipAddress: true,
            userAgent: true,
            timestamp: true
          }
        }),
        getPrisma().securityLog.count({ where })
      ]);

      return { logs, total };
    } catch (error) {
      logger.error('Error fetching OAuth audit logs:', error);
      throw error;
    }
  }

  /**
   * Clean up expired OAuth tokens and log cleanup
   */
  async cleanupExpiredTokens(): Promise<{ cleaned: number; errors: string[] }> {
    const results = {
      cleaned: 0,
      errors: [] as string[]
    };

    try {
      // Find expired tokens
      const expiredTokens = await getPrisma().socialAuthProvider.findMany({
        where: {
          tokenExpiresAt: {
            lte: new Date()
          }
        },
        select: {
          id: true,
          userId: true,
          provider: true,
          tokenExpiresAt: true
        }
      });

      // Try to refresh each expired token
      for (const tokenRecord of expiredTokens) {
        try {
          const socialAuth = await getPrisma().socialAuthProvider.findUnique({
            where: { id: tokenRecord.id }
          });

          if (socialAuth?.refreshTokenEncrypted) {
            const refreshToken = this.decryptToken(socialAuth.refreshTokenEncrypted);
            const newTokens = await this.refreshTokens(tokenRecord.provider, refreshToken);
            
            await this.updateSocialAuthTokens(tokenRecord.id, newTokens);
            results.cleaned++;

            await this.logSecurityEvent('AUTHENTICATION', {
              provider: tokenRecord.provider,
              action: 'token_auto_refreshed',
              tokenId: tokenRecord.id
            }, tokenRecord.userId);
          } else {
            // No refresh token available, log as expired
            await this.logSecurityEvent('AUTHENTICATION', {
              provider: tokenRecord.provider,
              action: 'token_expired_no_refresh',
              tokenId: tokenRecord.id
            }, tokenRecord.userId);
          }
        } catch (error) {
          const errorMsg = `Failed to refresh ${tokenRecord.provider} token for user ${tokenRecord.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          
          await this.logSecurityEvent('AUTHENTICATION', {
            provider: tokenRecord.provider,
            action: 'token_refresh_failed',
            tokenId: tokenRecord.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, tokenRecord.userId);
        }
      }

      logger.info(`OAuth token cleanup completed: ${results.cleaned} tokens refreshed, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      logger.error('OAuth token cleanup error:', error);
      throw error;
    }
  }
}

export const oauthService = new OAuthService();
export { OAuthService, PKCEChallenge, OAuthTokens, OAuthUserInfo };