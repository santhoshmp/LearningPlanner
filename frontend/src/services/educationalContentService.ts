import api from './api';
import { ChildSkillProfile } from '../types/child';

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ageRange: {
    min: number;
    max: number;
  };
  tags: string[];
  source: string;
  safetyRating: 'safe' | 'review_needed';
}

export interface TopicContent {
  topicId: string;
  articles: EducationalContent[];
  videos: EducationalContent[];
}

export interface ContentRecommendation {
  subject: string;
  topic: string;
  currentMastery: number;
  recommendedContent: {
    articles: EducationalContent[];
    videos: EducationalContent[];
  };
  priority: 'high' | 'medium' | 'low';
}

export interface SkillSummary {
  childId: string;
  overallProgress: number;
  overallLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  learningVelocity: 'slow' | 'average' | 'fast';
  lastUpdated: Date;
  subjectBreakdown: {
    subjectId: string;
    subjectName: string;
    currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
    progress: number;
    strengthAreas: string[];
    improvementAreas: string[];
    topicCount: number;
    masteredTopics: number;
    inProgressTopics: number;
  }[];
}

class EducationalContentService {
  
  // Get educational content for a specific topic
  async getTopicContent(grade: string, subjectId: string, topicId: string): Promise<TopicContent> {
    const response = await api.get(`/educational-content/topic/${grade}/${subjectId}/${topicId}`);
    return response.data.data;
  }

  // Get content by type (articles or videos)
  async getContentByType(
    grade: string, 
    subjectId: string, 
    topicId: string, 
    type: 'article' | 'video'
  ): Promise<EducationalContent[]> {
    const response = await api.get(`/educational-content/type/${grade}/${subjectId}/${topicId}/${type}`);
    return response.data.data;
  }

  // Get all content for a grade level
  async getAllContentForGrade(grade: string): Promise<any> {
    const response = await api.get(`/educational-content/grade/${grade}`);
    return response.data.data;
  }

  // Get child's skill profile
  async getChildSkillProfile(childId: string): Promise<ChildSkillProfile> {
    const response = await api.get(`/educational-content/skills/${childId}`);
    return response.data.data;
  }

  // Get skill summary for dashboard
  async getSkillSummary(childId: string): Promise<SkillSummary> {
    const response = await api.get(`/educational-content/skills/${childId}/summary`);
    return response.data.data;
  }

  // Update skill progress after activity completion
  async updateSkillProgress(
    childId: string,
    subjectId: string,
    topicId: string,
    score: number,
    timeSpent: number
  ): Promise<ChildSkillProfile> {
    const response = await api.post(`/educational-content/skills/${childId}/progress`, {
      subjectId,
      topicId,
      score,
      timeSpent
    });
    return response.data.data;
  }

  // Get recommended content based on skill level
  async getRecommendedContent(childId: string, subjectId?: string): Promise<{
    childId: string;
    overallProgress: number;
    learningVelocity: 'slow' | 'average' | 'fast';
    recommendations: ContentRecommendation[];
  }> {
    const params = subjectId ? `?subjectId=${subjectId}` : '';
    const response = await api.get(`/educational-content/recommendations/${childId}${params}`);
    return response.data.data;
  }

  // Initialize skill profile for a child
  async initializeSkillProfile(childId: string, gradeLevel: string): Promise<ChildSkillProfile> {
    const response = await api.post(`/educational-content/skills/${childId}/initialize`, {
      gradeLevel
    });
    return response.data.data;
  }
}

export const educationalContentService = new EducationalContentService();