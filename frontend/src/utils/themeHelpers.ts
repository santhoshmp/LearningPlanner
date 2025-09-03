import { 
  SUBJECT_COLORS, 
  PROFICIENCY_COLORS, 
  STATUS_COLORS,
  getSubjectColor,
  getProficiencyColor,
  getStatusColor
} from '../theme/standardizedTheme';
import { ProficiencyLevel, ActivityStatus } from '../theme/theme.types';

// Theme helper functions for consistent styling across components

/**
 * Get consistent subject color with fallback
 */
export const useSubjectColor = (subjectId: string): string => {
  return getSubjectColor(subjectId);
};

/**
 * Get consistent proficiency color with fallback
 */
export const useProficiencyColor = (level: ProficiencyLevel): string => {
  return getProficiencyColor(level);
};

/**
 * Get consistent status color with fallback
 */
export const useStatusColor = (status: ActivityStatus | string): string => {
  return getStatusColor(status);
};

/**
 * Generate consistent CSS classes for subjects
 */
export const getSubjectClasses = (subjectId: string, variant: 'text' | 'background' = 'text'): string => {
  const normalizedId = subjectId.toLowerCase().replace(/\s+/g, '-');
  const prefix = variant === 'background' ? 'bg-subject-' : 'subject-';
  return `${prefix}${normalizedId}`;
};

/**
 * Generate consistent CSS classes for proficiency levels
 */
export const getProficiencyClasses = (level: ProficiencyLevel, variant: 'text' | 'background' = 'text'): string => {
  const prefix = variant === 'background' ? 'bg-proficiency-' : 'proficiency-';
  return `${prefix}${level}`;
};

/**
 * Generate consistent CSS classes for status
 */
export const getStatusClasses = (status: ActivityStatus | string, variant: 'text' | 'background' = 'text'): string => {
  const prefix = variant === 'background' ? 'bg-status-' : 'status-';
  return `${prefix}${status}`;
};

/**
 * Get card classes based on theme role
 */
export const getCardClasses = (role: 'parent' | 'child' = 'parent'): string => {
  return role === 'child' ? 'card-child' : 'card-standard';
};

/**
 * Get button classes based on theme role
 */
export const getButtonClasses = (role: 'parent' | 'child' = 'parent'): string => {
  return role === 'child' ? 'btn-child' : 'btn-standard';
};

/**
 * Get responsive padding classes
 */
export const getResponsivePadding = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizeMap = {
    sm: 'p-2 sm:p-3 md:p-4',
    md: 'p-3 sm:p-4 md:p-5',
    lg: 'p-4 sm:p-5 md:p-6',
  };
  return sizeMap[size];
};

/**
 * Get responsive margin classes
 */
export const getResponsiveMargin = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizeMap = {
    sm: 'm-2 sm:m-3 md:m-4',
    md: 'm-3 sm:m-4 md:m-5',
    lg: 'm-4 sm:m-5 md:m-6',
  };
  return sizeMap[size];
};

/**
 * Get responsive text size classes
 */
export const getResponsiveText = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizeMap = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
  };
  return sizeMap[size];
};

/**
 * Get loading state classes
 */
export const getLoadingClasses = (type: 'pulse' | 'spin' | 'bounce' = 'pulse'): string => {
  const typeMap = {
    pulse: 'loading',
    spin: 'spinning',
    bounce: 'bouncing',
  };
  return typeMap[type];
};

/**
 * Get shadow classes based on elevation
 */
export const getShadowClasses = (elevation: 'card' | 'elevated' | 'floating' = 'card'): string => {
  return `shadow-${elevation} dark:shadow-${elevation}-dark`;
};

/**
 * Get focus classes for accessibility
 */
export const getFocusClasses = (role: 'parent' | 'child' = 'parent'): string => {
  return role === 'child' 
    ? 'focus:outline-none focus-visible:outline-3 focus-visible:outline-child-primary-500 focus-visible:outline-offset-3'
    : 'focus:outline-none focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2';
};

/**
 * Get animation classes
 */
export const getAnimationClasses = (animation: 'fade-in' | 'slide-up' | 'scale-in' = 'fade-in'): string => {
  return `animate-${animation}`;
};

/**
 * Combine multiple class strings safely
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get theme-aware border radius
 */
export const getBorderRadius = (role: 'parent' | 'child' = 'parent', size: 'sm' | 'md' | 'lg' = 'md'): string => {
  if (role === 'child') {
    const sizeMap = { sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl' };
    return sizeMap[size];
  } else {
    const sizeMap = { sm: 'rounded-md', md: 'rounded-lg', lg: 'rounded-xl' };
    return sizeMap[size];
  }
};

/**
 * Get consistent spacing based on design system
 */
export const getSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): string => {
  const sizeMap = {
    xs: 'spacing-xs',
    sm: 'spacing-sm', 
    md: 'spacing-md',
    lg: 'spacing-lg',
    xl: 'spacing-xl',
    xxl: 'spacing-xxl',
  };
  return sizeMap[size];
};

/**
 * Get consistent padding based on design system
 */
export const getPadding = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): string => {
  const sizeMap = {
    xs: 'padding-xs',
    sm: 'padding-sm',
    md: 'padding-md', 
    lg: 'padding-lg',
    xl: 'padding-xl',
    xxl: 'padding-xxl',
  };
  return sizeMap[size];
};

/**
 * Format proficiency level for display
 */
export const formatProficiencyLevel = (level: ProficiencyLevel): string => {
  const levelMap: Record<ProficiencyLevel, string> = {
    beginner: 'Beginner',
    developing: 'Developing',
    proficient: 'Proficient', 
    advanced: 'Advanced',
    expert: 'Expert',
  };
  return levelMap[level];
};

/**
 * Format activity status for display
 */
export const formatActivityStatus = (status: ActivityStatus): string => {
  const statusMap: Record<ActivityStatus, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    completed: 'Completed',
    pending: 'Pending',
  };
  return statusMap[status];
};

/**
 * Get progress bar color based on percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-status-success';
  if (percentage >= 75) return 'bg-proficiency-advanced';
  if (percentage >= 50) return 'bg-status-warning';
  if (percentage >= 25) return 'bg-proficiency-developing';
  return 'bg-status-error';
};

/**
 * Get grade display color
 */
export const getGradeColor = (score: number): string => {
  if (score >= 90) return 'text-status-success';
  if (score >= 80) return 'text-proficiency-advanced';
  if (score >= 70) return 'text-status-warning';
  if (score >= 60) return 'text-proficiency-developing';
  return 'text-status-error';
};