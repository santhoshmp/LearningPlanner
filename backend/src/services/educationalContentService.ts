import { 
  EDUCATIONAL_CONTENT_DATA, 
  getContentByTopic, 
  getContentByType,
  EducationalContent,
  TopicContent 
} from '../data/educationalContentData';
import { 
  getDefaultSkillLevels, 
  updateSkillProgress,
  ChildSkillProfile,
  SkillLevel,
  calculateOverallLevel 
} from '../data/skillLevelData';
import { CURRICULUM_MASTER_DATA, getSubjectsByGrade, getTopicsByGradeAndSubject } from '../data/curriculumMasterData';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EducationalContentService {
  
  // Get educational content for a specific topic
  async getTopicContent(grade: string, subjectId: string, topicId: string): Promise<TopicContent | null> {
    try {
      return getContentByTopic(grade, subjectId, topicId);
    } catch (error) {
      console.error('Error fetching topic content:', error);
      return null;
    }
  }

  // Get content by type (articles or videos)
  async getContentByType(
    grade: string, 
    subjectId: string, 
    topicId: string, 
    type: 'article' | 'video'
  ): Promise<EducationalContent[]> {
    try {
      return getContentByType(grade, subjectId, topicId, type);
    } catch (error) {
      console.error('Error fetching content by type:', error);
      return [];
    }
  }

  // Get all content for a grade level
  async getAllContentForGrade(grade: string): Promise<any> {
    try {
      const gradeContent = EDUCATIONAL_CONTENT_DATA.find(g => g.grade === grade);
      if (!gradeContent) return null;

      // Combine with curriculum data for complete information
      const subjects = getSubjectsByGrade(grade);
      
      return {
        grade,
        subjects: subjects.map(subject => {
          const subjectContent = gradeContent.subjects.find(s => s.subjectId === subject.id);
          return {
            ...subject,
            topics: subject.topics.map(topic => {
              const topicContent = subjectContent?.topics.find(t => t.topicId === topic.id);
              return {
                ...topic,
                content: topicContent || { articles: [], videos: [] }
              };
            })
          };
        })
      };
    } catch (error) {
      console.error('Error fetching grade content:', error);
      return null;
    }
  }

  // Initialize skill profile for a new child
  async initializeChildSkillProfile(childId: string, gradeLevel: string): Promise<ChildSkillProfile> {
    try {
      const skillLevels = getDefaultSkillLevels(gradeLevel);
      const overallProgress = skillLevels.reduce((sum, skill) => sum + skill.progress, 0) / skillLevels.length;
      
      const skillProfile: ChildSkillProfile = {
        childId,
        gradeLevel,
        overallProgress,
        skillLevels,
        learningVelocity: 'average',
        preferredDifficulty: 'adaptive',
        lastUpdated: new Date()
      };

      // Save to database
      await prisma.childProfile.update({
        where: { id: childId },
        data: {
          skillProfile: JSON.stringify(skillProfile)
        }
      });

      return skillProfile;
    } catch (error) {
      console.error('Error initializing skill profile:', error);
      throw error;
    }
  }

  // Get child's skill profile
  async getChildSkillProfile(childId: string): Promise<ChildSkillProfile | null> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: { skillProfile: true, gradeLevel: true }
      });

      if (!child) return null;

      // If no skill profile exists, initialize it
      if (!child.skillProfile || Object.keys(child.skillProfile as any).length === 0) {
        return await this.initializeChildSkillProfile(childId, child.gradeLevel);
      }

      return child.skillProfile as ChildSkillProfile;
    } catch (error) {
      console.error('Error fetching skill profile:', error);
      return null;
    }
  }

  // Update skill progress after activity completion
  async updateChildSkillProgress(
    childId: string,
    subjectId: string,
    topicId: string,
    score: number,
    timeSpent: number
  ): Promise<ChildSkillProfile | null> {
    try {
      const currentProfile = await this.getChildSkillProfile(childId);
      if (!currentProfile) return null;

      // Find and update the relevant skill
      const updatedSkillLevels = currentProfile.skillLevels.map(skill => {
        if (skill.subjectId === subjectId) {
          return updateSkillProgress(skill, topicId, score, timeSpent);
        }
        return skill;
      });

      // Calculate new overall progress
      const overallProgress = updatedSkillLevels.reduce((sum, skill) => sum + skill.progress, 0) / updatedSkillLevels.length;

      // Update learning velocity based on performance
      let learningVelocity: ChildSkillProfile['learningVelocity'] = currentProfile.learningVelocity;
      if (score >= 90 && timeSpent < 30) learningVelocity = 'fast';
      else if (score < 60 || timeSpent > 60) learningVelocity = 'slow';
      else learningVelocity = 'average';

      const updatedProfile: ChildSkillProfile = {
        ...currentProfile,
        overallProgress,
        skillLevels: updatedSkillLevels,
        learningVelocity,
        lastUpdated: new Date()
      };

      // Save to database
      await prisma.childProfile.update({
        where: { id: childId },
        data: {
          skillProfile: JSON.stringify(updatedProfile)
        }
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error updating skill progress:', error);
      return null;
    }
  }

  // Get recommended content based on skill level
  async getRecommendedContent(childId: string, subjectId?: string): Promise<any> {
    try {
      const skillProfile = await this.getChildSkillProfile(childId);
      if (!skillProfile) return null;

      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: { gradeLevel: true }
      });

      if (!child) return null;

      const recommendations = [];

      // Filter by subject if specified
      const skillsToAnalyze = subjectId 
        ? skillProfile.skillLevels.filter(skill => skill.subjectId === subjectId)
        : skillProfile.skillLevels;

      for (const skill of skillsToAnalyze) {
        // Find topics that need improvement
        const topicsNeedingWork = skill.topicProgress
          .filter(topic => topic.mastery < 70)
          .sort((a, b) => a.mastery - b.mastery)
          .slice(0, 3); // Top 3 topics needing work

        for (const topic of topicsNeedingWork) {
          const content = await this.getTopicContent(child.gradeLevel, skill.subjectId, topic.topicId);
          if (content) {
            recommendations.push({
              subject: skill.subjectName,
              topic: topic.topicName,
              currentMastery: topic.mastery,
              recommendedContent: {
                articles: content.articles.slice(0, 2), // Top 2 articles
                videos: content.videos.slice(0, 2)      // Top 2 videos
              },
              priority: topic.mastery < 30 ? 'high' : topic.mastery < 50 ? 'medium' : 'low'
            });
          }
        }
      }

      return {
        childId,
        overallProgress: skillProfile.overallProgress,
        learningVelocity: skillProfile.learningVelocity,
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        })
      };
    } catch (error) {
      console.error('Error getting recommended content:', error);
      return null;
    }
  }

  // Get skill summary for dashboard
  async getSkillSummary(childId: string): Promise<any> {
    try {
      const skillProfile = await this.getChildSkillProfile(childId);
      if (!skillProfile) return null;

      const summary = {
        childId,
        overallProgress: skillProfile.overallProgress,
        overallLevel: calculateOverallLevel(skillProfile.skillLevels),
        learningVelocity: skillProfile.learningVelocity,
        lastUpdated: skillProfile.lastUpdated,
        subjectBreakdown: skillProfile.skillLevels.map(skill => ({
          subjectId: skill.subjectId,
          subjectName: skill.subjectName,
          currentLevel: skill.currentLevel,
          progress: skill.progress,
          strengthAreas: skill.strengthAreas,
          improvementAreas: skill.improvementAreas,
          topicCount: skill.topicProgress.length,
          masteredTopics: skill.topicProgress.filter(t => t.status === 'mastered').length,
          inProgressTopics: skill.topicProgress.filter(t => t.status === 'in-progress').length
        }))
      };

      return summary;
    } catch (error) {
      console.error('Error getting skill summary:', error);
      return null;
    }
  }
}

export const educationalContentService = new EducationalContentService();