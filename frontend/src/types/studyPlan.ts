export interface StudyPlan {
  id: string;
  childId: string;
  subject: string;
  grade: string;
  difficulty: string;
  objectives: LearningObjective[];
  activities: StudyActivity[];
  selectedTopics: string[]; // Array of topic IDs
  status: 'draft' | 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface LearningObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface StudyActivity {
  id: string;
  planId: string;
  title: string;
  description: string;
  subject: string;
  content: ActivityContent;
  estimatedDuration: number;
  difficulty: number;
  prerequisites: string[];
  completionCriteria: CompletionCriteria;
}

export interface ActivityContent {
  type: 'text' | 'quiz' | 'interactive' | 'video';
  data: TextContentData | QuizContentData | InteractiveContentData | VideoContentData | any;
}

export interface TextContentData {
  content: string;
  comprehensionQuestion?: string;
}

export interface QuizContentData {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id?: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer?: number | boolean | string;
  image?: string;
}

export interface InteractiveContentData {
  description: string;
  instructions?: string;
  exercises?: InteractiveExercise[];
}

export interface InteractiveExercise {
  number?: number;
  word?: string;
  description?: string;
}

export interface VideoContentData {
  videoUrl: string;
  title: string;
  description?: string;
  comprehensionQuestion?: string;
}

export interface CompletionCriteria {
  type: 'completion' | 'score' | 'time';
  threshold: number;
}

export interface CreateStudyPlanRequest {
  childId: string;
  subject: string;
  grade: string;
  difficulty: string;
  selectedTopics: string[];
  learningStyle: string;
  additionalNotes?: string;
}

export interface UpdateStudyPlanRequest {
  subject?: string;
  difficulty?: string;
  objectives?: Partial<LearningObjective>[];
  status?: 'draft' | 'active' | 'completed' | 'paused';
}

export const SUBJECTS = [
  { value: 'MATH', label: 'Mathematics' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'HISTORY', label: 'History' },
  { value: 'GEOGRAPHY', label: 'Geography' },
  { value: 'ART', label: 'Art' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'FOREIGN_LANGUAGE', label: 'Foreign Language' },
  { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' }
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Foundational concepts and basic skills' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Building on basics with moderate complexity' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Complex concepts requiring deeper understanding' },
  { value: 'EXPERT', label: 'Expert', description: 'Challenging material for mastery of the subject' }
] as const;

// Curriculum and Topic types
export interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: Topic[];
}

export interface GradeCurriculum {
  grade: string;
  subjects: Subject[];
}