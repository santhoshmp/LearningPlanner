import { Theme as MuiTheme } from '@mui/material/styles';

export interface AppTheme extends MuiTheme {
  name: 'parent' | 'child';
  custom?: {
    subjectColors: Record<string, string>;
    proficiencyColors: Record<string, string>;
    statusColors: Record<string, string>;
    shadows: {
      card: string;
      elevated: string;
      floating: string;
    };
    animations: {
      duration: Record<string, number>;
      easing: Record<string, string>;
    };
    spacing: Record<string, number>;
  };
}

export type ThemeMode = 'light' | 'dark';
export type UserRole = 'parent' | 'child';
export type TextSize = 'normal' | 'large' | 'larger';

// Proficiency levels
export type ProficiencyLevel = 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';

// Activity status types
export type ActivityStatus = 'not-started' | 'in-progress' | 'completed' | 'pending';

// Subject categories
export type SubjectCategory = 'core' | 'elective' | 'enrichment' | 'special';

// Component size variants
export type ComponentSize = 'small' | 'medium' | 'large';

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';