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
  activityId: string;
  answers: Record<string, any>;
  timeSpent: number; // in seconds
  helpRequests: Omit<HelpRequest, 'id'>[];
}

export interface ActivityResponse {
  score: number;
  feedback: string;
  nextActivityId?: string;
  achievements?: Achievement[];
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