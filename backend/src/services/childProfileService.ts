import bcrypt from 'bcrypt';
import { PrismaClient, ChildProfile, LearningStyle } from '@prisma/client';
import { educationalContentService } from './educationalContentService';

const prisma = new PrismaClient();

export interface ChildProfileData {
  name: string;
  age: number;
  gradeLevel: string;
  learningStyle?: LearningStyle;
  username: string;
  pin: string;
  preferences?: {
    theme?: string;
    soundEnabled?: boolean;
    animationsEnabled?: boolean;
    difficultyPreference?: string;
  };
}

export interface ChildProfileUpdate {
  name?: string;
  age?: number;
  gradeLevel?: string;
  learningStyle?: LearningStyle;
  username?: string;
  pin?: string;
  preferences?: {
    theme?: string;
    soundEnabled?: boolean;
    animationsEnabled?: boolean;
    difficultyPreference?: string;
  };
  isActive?: boolean;
}

class ChildProfileService {
  private readonly saltRounds = 12;

  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.saltRounds);
  }

  async comparePin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  async createChildProfile(parentId: string, data: ChildProfileData): Promise<Omit<ChildProfile, 'pinHash'>> {
    // Check if username is already taken
    const existingChild = await prisma.childProfile.findUnique({
      where: { username: data.username }
    });

    if (existingChild) {
      throw new Error('Username is already taken');
    }

    // Hash the PIN
    const pinHash = await this.hashPin(data.pin);

    // Create child profile
    const childProfile = await prisma.childProfile.create({
      data: {
        parentId,
        name: data.name,
        age: data.age,
        gradeLevel: data.gradeLevel,
        learningStyle: data.learningStyle || LearningStyle.MIXED,
        username: data.username,
        pinHash,
        preferences: data.preferences || {},
        isActive: true
      }
    });

    // Initialize skill profile for the child
    try {
      await educationalContentService.initializeChildSkillProfile(childProfile.id, data.gradeLevel);
    } catch (error) {
      console.error('Failed to initialize skill profile:', error);
      // Don't fail the child creation if skill profile initialization fails
    }

    // Return child profile without PIN hash
    const { pinHash: _, ...childWithoutPin } = childProfile;
    return childWithoutPin;
  }

  async getChildProfilesByParent(parentId: string): Promise<Omit<ChildProfile, 'pinHash'>[]> {
    const childProfiles = await prisma.childProfile.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' }
    });

    // Remove PIN hash from all profiles
    return childProfiles.map(({ pinHash, ...child }) => child);
  }

  async getChildProfileById(childId: string, parentId: string): Promise<Omit<ChildProfile, 'pinHash'> | null> {
    const childProfile = await prisma.childProfile.findFirst({
      where: { 
        id: childId,
        parentId // Ensure parent can only access their own child's profile
      }
    });

    if (!childProfile) {
      return null;
    }

    const { pinHash: _, ...childWithoutPin } = childProfile;
    return childWithoutPin;
  }

  async updateChildProfile(childId: string, parentId: string, data: ChildProfileUpdate): Promise<Omit<ChildProfile, 'pinHash'>> {
    // First verify the child belongs to the parent
    const existingChild = await prisma.childProfile.findFirst({
      where: { 
        id: childId,
        parentId
      }
    });

    if (!existingChild) {
      throw new Error('Child profile not found or access denied');
    }

    // If username is being updated, check if it's available
    if (data.username && data.username !== existingChild.username) {
      const usernameExists = await prisma.childProfile.findUnique({
        where: { username: data.username }
      });

      if (usernameExists) {
        throw new Error('Username is already taken');
      }
    }

    // Prepare update data
    const updateData: any = {
      ...data
    };

    // Hash new PIN if provided
    if (data.pin) {
      updateData.pinHash = await this.hashPin(data.pin);
      delete updateData.pin; // Remove plain PIN from update data
    }

    // Update child profile
    const updatedChild = await prisma.childProfile.update({
      where: { id: childId },
      data: updateData
    });

    const { pinHash: _, ...childWithoutPin } = updatedChild;
    return childWithoutPin;
  }

  async deleteChildProfile(childId: string, parentId: string): Promise<void> {
    // First verify the child belongs to the parent
    const existingChild = await prisma.childProfile.findFirst({
      where: { 
        id: childId,
        parentId
      }
    });

    if (!existingChild) {
      throw new Error('Child profile not found or access denied');
    }

    // Soft delete by setting isActive to false
    await prisma.childProfile.update({
      where: { id: childId },
      data: { isActive: false }
    });
  }

  async authenticateChild(username: string, pin: string): Promise<Omit<ChildProfile, 'pinHash'> | null> {
    const childProfile = await prisma.childProfile.findUnique({
      where: { 
        username,
        isActive: true
      }
    });

    if (!childProfile) {
      return null;
    }

    const isPinValid = await this.comparePin(pin, childProfile.pinHash);
    if (!isPinValid) {
      return null;
    }

    const { pinHash: _, ...childWithoutPin } = childProfile;
    return childWithoutPin;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const existingChild = await prisma.childProfile.findUnique({
      where: { username }
    });

    return !existingChild;
  }

  async getActiveChildrenCount(parentId: string): Promise<number> {
    return await prisma.childProfile.count({
      where: { 
        parentId,
        isActive: true
      }
    });
  }
}

export const childProfileService = new ChildProfileService();