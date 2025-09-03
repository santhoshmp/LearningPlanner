import api from './api';

// Master Data Types
export interface MasterDataGradeLevel {
  id: string;
  grade: string;
  displayName: string;
  ageMin: number;
  ageMax: number;
  ageTypical: number;
  educationalLevel: 'elementary' | 'middle' | 'high';
  sortOrder: number;
  isActive: boolean;
}

export interface MasterDataSubject {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  isCore: boolean;
  sortOrder: number;
}

export interface MasterDataTopic {
  id: string;
  name: string;
  displayName: string;
  description: string;
  subjectId: string;
  gradeId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  skills: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface MasterDataResource {
  id: string;
  topicId: string;
  type: 'video' | 'article' | 'interactive' | 'worksheet' | 'game';
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ageAppropriate: boolean;
  safetyRating: 'safe' | 'moderate' | 'restricted';
  source: string;
  tags: string[];
  isActive: boolean;
}

export interface TopicHierarchy {
  grade: string;
  subjects: {
    id: string;
    name: string;
    displayName: string;
    topics: {
      id: string;
      name: string;
      displayName: string;
      difficulty: string;
      estimatedHours: number;
      resourceCount: number;
    }[];
  }[];
}

// Master Data Service
export const masterDataService = {
  // Grade Management
  getAllGrades: async (): Promise<MasterDataGradeLevel[]> => {
    try {
      const response = await api.get('/master-data-simple/grades');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      throw error;
    }
  },

  getGradeByAge: async (age: number): Promise<MasterDataGradeLevel | null> => {
    try {
      const response = await api.get(`/master-data/grades/by-age/${age}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch grade by age:', error);
      return null;
    }
  },

  getAgeRangeByGrade: async (grade: string): Promise<{ min: number; max: number; typical: number } | null> => {
    try {
      const response = await api.get(`/master-data/grades/${grade}/age-range`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch age range:', error);
      return null;
    }
  },

  // Subject Management
  getSubjectsByGrade: async (grade: string): Promise<MasterDataSubject[]> => {
    try {
      const response = await api.get(`/master-data/subjects/by-grade/${grade}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subjects by grade:', error);
      throw error;
    }
  },

  getAllSubjects: async (): Promise<MasterDataSubject[]> => {
    try {
      const response = await api.get('/master-data-simple/subjects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all subjects:', error);
      throw error;
    }
  },

  getSubjectById: async (subjectId: string): Promise<MasterDataSubject | null> => {
    try {
      const response = await api.get(`/master-data/subjects/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subject by ID:', error);
      return null;
    }
  },

  // Topic Management
  getTopicsBySubject: async (grade: string, subjectId: string): Promise<MasterDataTopic[]> => {
    try {
      const response = await api.get(`/master-data-simple/topics/by-subject/${grade}/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch topics by subject:', error);
      throw error;
    }
  },

  getTopicHierarchy: async (grade: string): Promise<TopicHierarchy | null> => {
    try {
      const response = await api.get(`/master-data/topics/hierarchy/${grade}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch topic hierarchy:', error);
      return null;
    }
  },

  getTopicById: async (topicId: string): Promise<MasterDataTopic | null> => {
    try {
      const response = await api.get(`/master-data/topics/${topicId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch topic by ID:', error);
      return null;
    }
  },

  // Resource Management
  getResourcesByTopic: async (topicId: string): Promise<MasterDataResource[]> => {
    try {
      const response = await api.get(`/master-data/resources/by-topic/${topicId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch resources by topic:', error);
      throw error;
    }
  },

  getYouTubeVideosByTopic: async (topicId: string, grade: string): Promise<MasterDataResource[]> => {
    try {
      const response = await api.get(`/master-data/resources/youtube/${topicId}/${grade}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch YouTube videos:', error);
      throw error;
    }
  },

  getReadingMaterialsByTopic: async (topicId: string, grade: string): Promise<MasterDataResource[]> => {
    try {
      const response = await api.get(`/master-data/resources/reading/${topicId}/${grade}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reading materials:', error);
      throw error;
    }
  },

  // Validation
  validateMasterData: async (): Promise<any> => {
    try {
      const response = await api.get('/master-data/validate');
      return response.data;
    } catch (error) {
      console.error('Failed to validate master data:', error);
      throw error;
    }
  }
};