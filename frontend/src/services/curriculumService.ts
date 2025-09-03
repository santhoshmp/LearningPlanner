import api from './api';
import { Subject, Topic } from '../types/studyPlan';

export interface CurriculumResponse {
  grades?: string[];
  subjects?: Subject[];
  topics?: Topic[];
}

export const curriculumService = {
  // Get all available grades
  async getGrades(): Promise<string[]> {
    try {
      const response = await api.get<CurriculumResponse>('/curriculum/grades');
      return response.data.grades || [];
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw error;
    }
  },

  // Get subjects by grade
  async getSubjectsByGrade(grade: string): Promise<Subject[]> {
    try {
      const response = await api.get<CurriculumResponse>(`/curriculum/subjects/${grade}`);
      return response.data.subjects || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  // Get topics by grade and subject
  async getTopicsByGradeAndSubject(grade: string, subjectId: string): Promise<Topic[]> {
    try {
      const response = await api.get<CurriculumResponse>(`/curriculum/topics/${grade}/${subjectId}`);
      return response.data.topics || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }
};