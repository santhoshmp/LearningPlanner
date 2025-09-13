import { StudyActivity } from './studyPlan';

export interface ActivityProgress {
  id: string;
  activityId: string;
  childId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_help';
  score: number;
  timeSpent: number; // in seconds
  helpRequests: HelpRequest[];
  completedAt?: string;
  startedAt: string;
  lastInteractionAt: string;
}

export interface HelpRequest {
  id: string;
  question: string;
  timestamp: string;
  response?: string;
}

export interface ActivityState {
  currentStep: number;
  totalSteps: number;
  answers: Record<string, any>;
  startTime: number;
  elapsedTime: number;
  isPaused: boolean;
}

export interface ActivitySubmission {
  answers?: Record<string, any>;
  score?: number;
  timeSpent?: number; // in seconds
}

export interface ActivityResponse {
  success: boolean;
  progress: {
    id: string;
    activityId: string;
    childId: string;
    status: string;
    score: number;
    timeSpent: number;
    completedAt: string;
    createdAt: string;
    updatedAt: string;
  };
  activity: {
    id: string;
    title: string;
    subject: string;
  };
  planProgress: {
    completedActivities: number;
    totalActivities: number;
    completionPercentage: number;
    isPlanCompleted: boolean;
  };
  message: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  type: 'badge' | 'milestone' | 'streak';
}

export interface TimeFrame {
  start: string;
  end: string;
}