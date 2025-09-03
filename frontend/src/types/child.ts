export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  age: number;
  gradeLevel: string;
  learningStyle: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'MIXED';
  username: string;
  preferences: ChildPreferences;
  skillProfile?: ChildSkillProfile;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillLevel {
  subjectId: string;
  subjectName: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  progress: number; // 0-100 percentage
  topicProgress: TopicSkillProgress[];
  lastAssessed: Date;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface SubjectProficiency {
  subjectId: string;
  subjectName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  proficiencyScore: number;
  visualIndicator: VisualIndicator;
  topicBreakdown: TopicProficiency[];
  trendDirection: 'up' | 'down' | 'stable';
  confidenceLevel: number;
  topicsCompleted?: number;
  totalTopics?: number;
}

export interface TopicProficiency {
  topicId: string;
  topicName: string;
  masteryLevel: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
}

export interface VisualIndicator {
  type: 'progress-bar' | 'circular-progress' | 'star-rating' | 'level-badge';
  value: number;
  maxValue: number;
  color: string;
  icon?: string;
  animation?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  estimatedCompletion: Date;
  category: string;
  reward?: Achievement;
  isCompleted: boolean;
}

export interface TopicSkillProgress {
  topicId: string;
  topicName: string;
  mastery: number; // 0-100 percentage
  attemptsCount: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastActivity: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
}

export interface ChildSkillProfile {
  childId: string;
  gradeLevel: string;
  overallProgress: number; // 0-100 percentage
  skillLevels: SkillLevel[];
  learningVelocity: 'slow' | 'average' | 'fast';
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  lastUpdated: Date;
}

export interface ChildPreferences {
  theme: 'light' | 'dark' | 'colorful';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'adaptive';
}

export interface CreateChildProfileData {
  name: string;
  age: number;
  gradeLevel: string;
  learningStyle: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'MIXED';
  username: string;
  pin: string;
  preferences?: Partial<ChildPreferences>;
}

export interface UpdateChildProfileData {
  name?: string;
  age?: number;
  gradeLevel?: string;
  learningStyle?: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'MIXED';
  preferences?: Partial<ChildPreferences>;
}

export interface UpdateChildCredentialsData {
  username?: string;
  pin?: string;
}

export const GRADE_LEVELS = [
  'Pre-K',
  'K',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th'
] as const;

export const LEARNING_STYLES = [
  { value: 'VISUAL', label: 'Visual', description: 'Learns best through images, diagrams, and visual aids' },
  { value: 'AUDITORY', label: 'Auditory', description: 'Learns best through listening and verbal instruction' },
  { value: 'KINESTHETIC', label: 'Kinesthetic', description: 'Learns best through hands-on activities and movement' },
  { value: 'MIXED', label: 'Mixed', description: 'Benefits from a combination of learning styles' }
] as const;