import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthResult {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class EnhancedAuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private readonly ACCESS_TOKEN_EXPIRY = '20m'; // 20 minutes for children
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  async childLogin(
    username: string,
    pin: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      // Find child by username
      const child = await prisma.childProfile.findUnique({
        where: { username },
        include: { parent: true }
      });

      if (!child) {
        logger.warn(`Child login attempt with invalid username: ${username}`);
        throw new Error('Invalid credentials');
      }

      if (!child.isActive) {
        logger.warn(`Login attempt for inactive child: ${username}`);
        throw new Error('Account is inactive');
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(pin, child.pinHash);
      if (!isValidPin) {
        logger.warn(`Child login attempt with invalid PIN: ${username}`);
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken({
        childId: child.id,
        role: 'CHILD'
      });

      const refreshToken = crypto.randomBytes(32).toString('hex');

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          childId: child.id,
          expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY)
        }
      });

      // Prepare user object (without sensitive data)
      const userObject = {
        id: child.id,
        username: child.username,
        name: child.name,
        role: 'CHILD',
        parentId: child.parentId,
        age: child.age,
        gradeLevel: child.gradeLevel,
        isActive: child.isActive
      };

      logger.info(`Child login successful: ${username}`);

      return {
        user: userObject,
        accessToken,
        refreshToken,
        expiresIn: 1200 // 20 minutes in seconds
      };
    } catch (error) {
      logger.error('Child login error:', error);
      throw error;
    }
  }

  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      // Find and validate refresh token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { 
          user: true,
          child: { include: { parent: true } }
        }
      });

      if (!tokenRecord || tokenRecord.isRevoked) {
        throw new Error('Invalid refresh token');
      }

      if (tokenRecord.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.refreshToken.delete({
          where: { token: refreshToken }
        });
        throw new Error('Refresh token expired');
      }

      let user: any;
      let newAccessToken: string;

      if (tokenRecord.childId) {
        // Child token refresh
        const child = tokenRecord.child;
        if (!child || !child.isActive) {
          throw new Error('Child account is inactive');
        }

        user = {
          id: child.id,
          username: child.username,
          name: child.name,
          role: 'CHILD',
          parentId: child.parentId,
          age: child.age,
          gradeLevel: child.gradeLevel,
          isActive: child.isActive
        };

        newAccessToken = this.generateAccessToken({
          childId: child.id,
          role: 'CHILD'
        });
      } else {
        // Parent token refresh
        const parentUser = tokenRecord.user;
        if (!parentUser) {
          throw new Error('User not found');
        }

        user = {
          id: parentUser.id,
          email: parentUser.email,
          firstName: parentUser.firstName,
          lastName: parentUser.lastName,
          role: parentUser.role
        };

        newAccessToken = this.generateAccessToken({
          userId: parentUser.id,
          role: parentUser.role
        });
      }

      // Generate new refresh token
      const newRefreshToken = crypto.randomBytes(32).toString('hex');

      // Revoke old token and create new one
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { isRevoked: true }
      });

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: tokenRecord.userId,
          childId: tokenRecord.childId,
          expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY)
        }
      });

      return {
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 1200
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async childLogout(childId: string): Promise<void> {
    try {
      // Revoke all refresh tokens for this child
      await prisma.refreshToken.updateMany({
        where: { childId, isRevoked: false },
        data: { isRevoked: true }
      });

      logger.info(`Child logout successful: ${childId}`);
    } catch (error) {
      logger.error('Child logout error:', error);
      throw error;
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      logger.info(`Cleaned up ${result.count} expired tokens`);
      return result.count;
    } catch (error) {
      logger.error('Token cleanup error:', error);
      return 0;
    }
  }

  getTokenInfo(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  private generateAccessToken(payload: any): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'ai-study-planner',
      audience: 'ai-study-planner-users'
    });
  }
}

export const enhancedAuthService = new EnhancedAuthService();