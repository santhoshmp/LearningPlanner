import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient, User, Role, ChildProfile, SecurityEventType, ChildLoginSession } from '@prisma/client';
import { emailService } from './emailService';
import { redisService } from './redisService';

const prisma = new PrismaClient();

export interface ParentRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChildLoginCredentials {
  username: string;
  pin: string;
}

export interface ChildAuthResult {
  child: Omit<ChildProfile, 'pinHash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  screenResolution?: string;
  language?: string;
  timezone?: string;
}

export interface ChildLoginRequest {
  credentials: ChildLoginCredentials;
  deviceInfo: DeviceInfo;
  ipAddress: string;
}

class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  private readonly jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private readonly accessTokenExpiry = process.env.NODE_ENV === 'development' ? '2h' : '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly tokenBlacklistExpiry = 60 * 60; // 1 hour in seconds
  
  // Child-specific session settings
  private readonly childSessionTimeout = 20 * 60; // 20 minutes in seconds
  private readonly childMaxSessionDuration = 2 * 60 * 60; // 2 hours in seconds
  private readonly suspiciousActivityThreshold = 5; // Failed login attempts

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateAccessToken(userId: string, role: Role): string {
    return jwt.sign(
      { userId, role },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async registerParent(data: ParentRegistrationData): Promise<{ user: Omit<User, 'passwordHash'>, verificationToken: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password and generate verification token
    const passwordHash = await this.hashPassword(data.password);
    const verificationToken = this.generateVerificationToken();

    // Create user - automatically set as verified for testing
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.PARENT,
        emailVerificationToken: verificationToken,
        isEmailVerified: true // Auto-verify for testing
      }
    });

    // Skip email verification for testing
    // await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName || 'User');
    console.log('Email verification skipped for testing');

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, verificationToken };
  }

  async verifyEmail(token: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async authenticateParent(credentials: LoginCredentials): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user || user.role !== Role.PARENT) {
      throw new Error('Invalid credentials');
    }

    // Email verification check disabled for testing
    // if (!user.isEmailVerified) {
    //   throw new Error('Please verify your email before logging in');
    // }

    const isPasswordValid = await this.comparePassword(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    // Store session in Redis
    const sessionData = {
      userId: user.id,
      role: user.role,
      email: user.email,
      loginTime: new Date().toISOString(),
      refreshToken
    };
    
    try {
      await redisService.setSession(refreshToken, sessionData, 7 * 24 * 60 * 60); // 7 days
    } catch (error) {
      console.warn('Failed to store session in Redis:', error);
      // Continue without Redis session - fallback to database only
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresIn: process.env.NODE_ENV === 'development' ? 2 * 60 * 60 : 15 * 60 // 2 hours in dev, 15 minutes in prod
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { 
        user: true,
        child: {
          include: {
            parent: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    // Handle child token refresh
    if (tokenRecord.childId && tokenRecord.child) {
      // Refresh child token and transform to AuthResult format
      const childResult = await this.refreshChildToken(refreshToken);
      
      // Transform ChildAuthResult to AuthResult format for compatibility
      return {
        user: {
          ...childResult.child,
          role: 'CHILD' as Role
        },
        accessToken: childResult.accessToken,
        refreshToken: childResult.refreshToken,
        expiresIn: childResult.expiresIn
      };
    }

    // Handle regular user token refresh
    if (!tokenRecord.user) {
      throw new Error('User not found');
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true }
    });

    // Generate new tokens
    const accessToken = this.generateAccessToken(tokenRecord.user.id, tokenRecord.user.role);
    const newRefreshToken = this.generateRefreshToken();

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt
      }
    });

    // Update Redis session with new refresh token
    try {
      await redisService.deleteSession(refreshToken); // Remove old session
      const sessionData = {
        userId: tokenRecord.user.id,
        role: tokenRecord.user.role,
        email: tokenRecord.user.email,
        loginTime: new Date().toISOString(),
        refreshToken: newRefreshToken
      };
      await redisService.setSession(newRefreshToken, sessionData, 7 * 24 * 60 * 60); // 7 days
    } catch (error) {
      console.warn('Failed to update session in Redis:', error);
      // Continue without Redis session - fallback to database only
    }

    const { passwordHash: _, ...userWithoutPassword } = tokenRecord.user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.NODE_ENV === 'development' ? 2 * 60 * 60 : 15 * 60
    };
  }

  async logout(userId: string): Promise<void> {
    // Get all active refresh tokens for the user
    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId, isRevoked: false }
    });

    // Revoke all refresh tokens for the user
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    });

    // Clean up Redis sessions for all active tokens
    try {
      for (const token of activeTokens) {
        await redisService.deleteSession(token.token);
      }
    } catch (error) {
      console.warn('Failed to clean up Redis sessions during logout:', error);
      // Continue - database tokens are already revoked
    }
  }

  verifyAccessToken(token: string): { userId: string; role: Role } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; role: Role };
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async resetPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    const resetToken = this.generateVerificationToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName || 'User');
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isOldPasswordValid = await this.comparePassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const newPasswordHash = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token }
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const newPasswordHash = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
  }

  // Enhanced child authentication methods
  async authenticateChild(loginRequest: ChildLoginRequest): Promise<ChildAuthResult> {
    console.log('🔐 Starting child authentication for:', loginRequest.credentials.username);
    const { credentials, deviceInfo, ipAddress } = loginRequest;
    
    // Check for suspicious activity first
    console.log('Checking suspicious activity...');
    await this.checkSuspiciousActivity(credentials.username, ipAddress);
    console.log('Suspicious activity check passed');
    
    console.log('Finding child profile...');
    const childProfile = await prisma.childProfile.findUnique({
      where: { 
        username: credentials.username,
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!childProfile) {
      console.log('Child profile not found for username:', credentials.username);
      // Log failed login attempt
      await this.logFailedChildLogin(credentials.username, ipAddress, deviceInfo, 'INVALID_USERNAME');
      throw new Error('Invalid credentials');
    }
    
    console.log('Child profile found:', childProfile.id, childProfile.name);

    console.log('Validating PIN...');
    const isPinValid = await this.comparePassword(credentials.pin, childProfile.pinHash);
    if (!isPinValid) {
      console.log('PIN validation failed for username:', credentials.username);
      // Log failed login attempt
      await this.logFailedChildLogin(credentials.username, ipAddress, deviceInfo, 'INVALID_PIN');
      throw new Error('Invalid credentials');
    }
    
    console.log('PIN validation successful');

    // Create login session record
    const loginSession = await prisma.childLoginSession.create({
      data: {
        childId: childProfile.id,
        loginTime: new Date(),
        deviceInfo: deviceInfo as any,
        ipAddress,
        isActive: true
      }
    });

    // Generate tokens with enhanced claims
    const accessToken = this.generateEnhancedAccessToken(
      childProfile.id, 
      Role.CHILD, 
      childProfile.parentId
    );
    const refreshToken = this.generateRefreshToken();

    // Store refresh token in database with session reference
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        childId: childProfile.id,
        expiresAt
      }
    });

    // Store enhanced session in Redis with child-specific timeout
    const sessionData = {
      childId: childProfile.id,
      sessionId: loginSession.id,
      role: Role.CHILD,
      username: childProfile.username,
      parentId: childProfile.parentId,
      loginTime: new Date().toISOString(),
      deviceInfo,
      ipAddress,
      refreshToken,
      lastActivity: new Date().toISOString()
    };
    
    try {
      await redisService.setSession(refreshToken, sessionData, this.childSessionTimeout);
    } catch (error) {
      console.warn('Failed to store child session in Redis:', error);
      // Continue without Redis session - fallback to database only
    }

    // Log successful login
    await this.logSecurityEvent(SecurityEventType.AUTHENTICATION, null, {
      action: 'CHILD_LOGIN_SUCCESS',
      username: credentials.username,
      childId: childProfile.id,
      ipAddress,
      deviceInfo,
      sessionId: loginSession.id
    });

    // Send parental notification for login
    await this.notifyParentOfChildLogin(childProfile, deviceInfo, ipAddress);
    
    // Also use the new parental notification service
    try {
      const { parentalNotificationService } = await import('./parentalNotificationService');
      await parentalNotificationService.sendLoginNotification(childProfile.id, deviceInfo, ipAddress);
    } catch (notificationError) {
      console.error('Error sending login notification via parental service:', notificationError);
      // Don't fail login if notification fails
    }

    const { pinHash: _, ...childWithoutPin } = childProfile;
    return {
      child: childWithoutPin,
      accessToken,
      refreshToken,
      sessionId: loginSession.id,
      expiresIn: this.childSessionTimeout
    };
  }

  async refreshChildToken(refreshToken: string): Promise<ChildAuthResult> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { child: true }
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    if (!tokenRecord.child) {
      throw new Error('Child profile not found');
    }

    // Get the current session ID from Redis or create a new one
    let sessionId = 'refresh-session';
    try {
      const sessionData = await redisService.getSession(refreshToken);
      if (sessionData && sessionData.sessionId) {
        sessionId = sessionData.sessionId;
      }
    } catch (error) {
      console.warn('Failed to get session from Redis during refresh:', error);
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true }
    });

    // Generate new tokens
    const accessToken = this.generateEnhancedAccessToken(
      tokenRecord.child.id, 
      Role.CHILD, 
      tokenRecord.child.parentId
    );
    const newRefreshToken = this.generateRefreshToken();

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        childId: tokenRecord.child.id,
        expiresAt
      }
    });

    // Update Redis session with new refresh token
    try {
      await redisService.deleteSession(refreshToken); // Remove old session
      const sessionData = {
        childId: tokenRecord.child.id,
        sessionId,
        role: Role.CHILD,
        username: tokenRecord.child.username,
        parentId: tokenRecord.child.parentId,
        loginTime: new Date().toISOString(),
        refreshToken: newRefreshToken,
        lastActivity: new Date().toISOString()
      };
      await redisService.setSession(newRefreshToken, sessionData, this.childSessionTimeout);
    } catch (error) {
      console.warn('Failed to update child session in Redis:', error);
      // Continue without Redis session - fallback to database only
    }

    const { pinHash: _, ...childWithoutPin } = tokenRecord.child;
    return {
      child: childWithoutPin,
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
      expiresIn: this.childSessionTimeout
    };
  }

  async logoutChild(childId: string, sessionId?: string): Promise<void> {
    // Get all active refresh tokens for the child
    const activeTokens = await prisma.refreshToken.findMany({
      where: { childId, isRevoked: false }
    });

    // Update login session with logout time and duration
    if (sessionId) {
      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });

      if (session && session.isActive) {
        const logoutTime = new Date();
        const sessionDuration = Math.floor((logoutTime.getTime() - session.loginTime.getTime()) / 1000);

        await prisma.childLoginSession.update({
          where: { id: sessionId },
          data: {
            logoutTime,
            sessionDuration,
            isActive: false
          }
        });

        // Log session end
        await this.logSecurityEvent(SecurityEventType.AUTHENTICATION, null, {
          action: 'CHILD_LOGOUT',
          childId: childId,
          sessionId,
          sessionDuration,
          logoutTime: logoutTime.toISOString()
        });
      }
    } else {
      // If no specific session ID, mark all active sessions as inactive
      await prisma.childLoginSession.updateMany({
        where: { 
          childId, 
          isActive: true 
        },
        data: { 
          logoutTime: new Date(),
          isActive: false 
        }
      });
    }

    // Revoke all refresh tokens for the child
    await prisma.refreshToken.updateMany({
      where: { childId, isRevoked: false },
      data: { isRevoked: true }
    });

    // Clean up Redis sessions for all active tokens
    try {
      for (const token of activeTokens) {
        await redisService.deleteSession(token.token);
      }
    } catch (error) {
      console.warn('Failed to clean up child Redis sessions during logout:', error);
      // Continue - database tokens are already revoked
    }
  }

  /**
   * Check if child session has timed out
   * @param sessionId Session ID to check
   * @returns True if session is valid, false if timed out
   */
  async validateChildSession(sessionId: string): Promise<boolean> {
    const session = await prisma.childLoginSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || !session.isActive) {
      return false;
    }

    const now = new Date();
    const sessionAge = (now.getTime() - session.loginTime.getTime()) / 1000;

    // Check if session has exceeded maximum duration
    if (sessionAge > this.childMaxSessionDuration) {
      await this.expireChildSession(sessionId, 'MAX_DURATION_EXCEEDED');
      return false;
    }

    // Check Redis for last activity (if available)
    try {
      const activeTokens = await prisma.refreshToken.findMany({
        where: { childId: session.childId, isRevoked: false }
      });

      for (const token of activeTokens) {
        const sessionData = await redisService.getSession(token.token);
        if (sessionData && sessionData.sessionId === sessionId) {
          const lastActivity = new Date(sessionData.lastActivity);
          const inactivityTime = (now.getTime() - lastActivity.getTime()) / 1000;

          if (inactivityTime > this.childSessionTimeout) {
            await this.expireChildSession(sessionId, 'INACTIVITY_TIMEOUT');
            return false;
          }

          // Update last activity
          sessionData.lastActivity = now.toISOString();
          await redisService.setSession(token.token, sessionData, this.childSessionTimeout);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to check Redis session activity:', error);
      // Fall back to database-only validation
    }

    return true;
  }

  /**
   * Expire a child session
   * @param sessionId Session ID to expire
   * @param reason Reason for expiration
   */
  private async expireChildSession(sessionId: string, reason: string): Promise<void> {
    const session = await prisma.childLoginSession.findUnique({
      where: { id: sessionId }
    });

    if (session && session.isActive) {
      const logoutTime = new Date();
      const sessionDuration = Math.floor((logoutTime.getTime() - session.loginTime.getTime()) / 1000);

      await prisma.childLoginSession.update({
        where: { id: sessionId },
        data: {
          logoutTime,
          sessionDuration,
          isActive: false
        }
      });

      // Revoke associated refresh tokens
      await prisma.refreshToken.updateMany({
        where: { childId: session.childId, isRevoked: false },
        data: { isRevoked: true }
      });

      // Log session expiration
      await this.logSecurityEvent(SecurityEventType.AUTHENTICATION, null, {
        action: 'CHILD_SESSION_EXPIRED',
        childId: session.childId,
        sessionId,
        reason,
        sessionDuration,
        expiredAt: logoutTime.toISOString()
      });
    }
  }

  /**
   * Update child session activity
   * @param childId Child ID
   * @param sessionId Session ID
   * @param activityType Type of activity
   */
  async updateChildSessionActivity(
    childId: string, 
    sessionId: string, 
    activityType: 'ACTIVITY_COMPLETED' | 'BADGE_EARNED' | 'HELP_REQUESTED'
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      if (activityType === 'ACTIVITY_COMPLETED') {
        updateData.activitiesCompleted = { increment: 1 };
      } else if (activityType === 'BADGE_EARNED') {
        updateData.badgesEarned = { increment: 1 };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.childLoginSession.update({
          where: { id: sessionId },
          data: updateData
        });
      }

      // Update Redis session activity timestamp
      const activeTokens = await prisma.refreshToken.findMany({
        where: { childId, isRevoked: false }
      });

      for (const token of activeTokens) {
        const sessionData = await redisService.getSession(token.token);
        if (sessionData && sessionData.sessionId === sessionId) {
          sessionData.lastActivity = new Date().toISOString();
          await redisService.setSession(token.token, sessionData, this.childSessionTimeout);
          break;
        }
      }
    } catch (error) {
      console.warn('Failed to update child session activity:', error);
      // Don't throw error - activity should still be recorded elsewhere
    }
  }

  /**
   * Get active child sessions for monitoring
   * @param childId Child ID
   * @returns Array of active sessions
   */
  async getActiveChildSessions(childId: string): Promise<ChildLoginSession[]> {
    return prisma.childLoginSession.findMany({
      where: {
        childId,
        isActive: true
      },
      orderBy: {
        loginTime: 'desc'
      }
    });
  }

  /**
   * Get child session history for parental monitoring
   * @param childId Child ID
   * @param limit Number of sessions to return
   * @returns Array of recent sessions
   */
  async getChildSessionHistory(childId: string, limit: number = 10): Promise<ChildLoginSession[]> {
    return prisma.childLoginSession.findMany({
      where: {
        childId
      },
      orderBy: {
        loginTime: 'desc'
      },
      take: limit
    });
  }

  /**
   * Verify that a parent is the owner of a child profile
   * @param parentId The ID of the parent user
   * @param childId The ID of the child profile
   * @returns True if the parent owns the child profile, false otherwise
   */
  async verifyParentOfChild(parentId: string, childId: string): Promise<boolean> {
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId }
    });

    if (!childProfile) {
      return false;
    }

    return childProfile.parentId === parentId;
  }

  /**
   * Blacklist a token to prevent its further use
   * @param token The token to blacklist
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = jwt.decode(token) as { exp?: number };
      const expiryTime = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : this.tokenBlacklistExpiry;
      
      // Store in Redis blacklist
      await redisService.blacklistToken(token, expiryTime);
    } catch (error) {
      console.warn('Failed to blacklist token:', error);
      // Continue even if blacklisting fails
    }
  }

  /**
   * Generate enhanced access token with additional claims for child users
   * @param userId User or child ID
   * @param role User role
   * @param parentId Optional parent ID for child users
   */
  generateEnhancedAccessToken(userId: string, role: Role, parentId?: string): string {
    const payload: any = { userId, role };
    
    // Add parent ID for child users
    if (role === Role.CHILD && parentId) {
      payload.parentId = parentId;
    }
    
    return jwt.sign(
      payload,
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );
  }

  /**
   * Check for suspicious login activity
   * @param username Child username
   * @param ipAddress IP address of login attempt
   */
  private async checkSuspiciousActivity(username: string, ipAddress: string): Promise<void> {
    // Temporarily bypass suspicious activity check for debugging
    console.log('Checking suspicious activity for:', username, ipAddress);
    
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Check for failed login attempts in the last hour
      const failedAttempts = await prisma.securityLog.count({
        where: {
          eventType: SecurityEventType.AUTHENTICATION,
          details: {
            path: ['action'],
            equals: 'CHILD_LOGIN_FAILED'
          },
          timestamp: {
            gte: oneHourAgo
          },
          OR: [
            {
              details: {
                path: ['username'],
                equals: username
              }
            },
            {
              ipAddress
            }
          ]
        }
      });

      console.log('Failed attempts found:', failedAttempts);

      if (failedAttempts >= this.suspiciousActivityThreshold) {
        // Log suspicious activity
        await this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, null, {
          action: 'EXCESSIVE_FAILED_LOGINS',
          username,
          ipAddress,
          failedAttempts,
          threshold: this.suspiciousActivityThreshold
        });

        throw new Error('Account temporarily locked due to suspicious activity. Please try again later.');
      }
    } catch (error) {
      console.error('Error in suspicious activity check:', error);
      // Don't fail login due to suspicious activity check errors during debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Bypassing suspicious activity check in development mode');
        return;
      }
      throw error;
    }
  }

  /**
   * Log failed child login attempt
   * @param username Child username
   * @param ipAddress IP address
   * @param deviceInfo Device information
   * @param reason Reason for failure
   */
  private async logFailedChildLogin(
    username: string, 
    ipAddress: string, 
    deviceInfo: DeviceInfo, 
    reason: string
  ): Promise<void> {
    await this.logSecurityEvent(SecurityEventType.AUTHENTICATION, null, {
      action: 'CHILD_LOGIN_FAILED',
      username,
      ipAddress,
      deviceInfo,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send parental notification for child login
   * @param childProfile Child profile with parent information
   * @param deviceInfo Device information
   * @param ipAddress IP address
   */
  private async notifyParentOfChildLogin(
    childProfile: ChildProfile & { parent: { id: string; email: string; firstName: string | null; lastName: string | null } },
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<void> {
    try {
      const deviceDescription = this.getDeviceDescription(deviceInfo);
      const loginTime = new Date().toLocaleString();
      
      // Create notification record
      await prisma.notification.create({
        data: {
          userId: childProfile.parent.id,
          type: 'CHILD_LOGIN',
          message: `${childProfile.name} logged in from ${deviceDescription}`,
          details: {
            childId: childProfile.id,
            childName: childProfile.name,
            loginTime,
            deviceInfo: {
              userAgent: deviceInfo.userAgent,
              platform: deviceInfo.platform,
              isMobile: deviceInfo.isMobile,
              screenResolution: deviceInfo.screenResolution || null,
              language: deviceInfo.language || null,
              timezone: deviceInfo.timezone || null
            },
            ipAddress: ipAddress.substring(0, ipAddress.lastIndexOf('.')) + '.xxx' // Partially mask IP
          }
        }
      });

      // Send email notification if enabled
      const parentName = childProfile.parent.firstName || 'Parent';
      await emailService.sendChildLoginNotification(
        childProfile.parent.email,
        parentName,
        childProfile.name,
        deviceDescription,
        loginTime
      );
    } catch (error) {
      console.warn('Failed to send parental notification:', error);
      // Don't throw error - login should still succeed
    }
  }

  /**
   * Get human-readable device description
   * @param deviceInfo Device information
   * @returns Human-readable device description
   */
  private getDeviceDescription(deviceInfo: DeviceInfo): string {
    const { platform, isMobile, userAgent } = deviceInfo;
    
    if (isMobile) {
      if (platform.toLowerCase().includes('ios')) {
        return 'iPhone/iPad';
      } else if (platform.toLowerCase().includes('android')) {
        return 'Android device';
      } else {
        return 'Mobile device';
      }
    } else {
      if (platform.toLowerCase().includes('mac')) {
        return 'Mac computer';
      } else if (platform.toLowerCase().includes('win')) {
        return 'Windows computer';
      } else if (platform.toLowerCase().includes('linux')) {
        return 'Linux computer';
      } else {
        return 'Computer';
      }
    }
  }

  /**
   * Log security event for auditing purposes
   * @param eventType Type of security event
   * @param userId User ID associated with the event (can be null for system events)
   * @param details Additional event details
   */
  async logSecurityEvent(eventType: SecurityEventType, userId: string | null, details: any): Promise<void> {
    await prisma.securityLog.create({
      data: {
        eventType,
        userId,
        childId: details.childId || null,
        ipAddress: details.ipAddress || null,
        userAgent: details.deviceInfo?.userAgent || null,
        details: JSON.stringify(details),
        timestamp: new Date()
      }
    });
  }
}

export const authService = new AuthService();