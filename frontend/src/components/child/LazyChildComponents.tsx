import React from 'react';
import { lazyLoadChildComponent, withLazyLoading, preloadChildDashboard } from '../../utils/lazyLoad';

// Lazy load child dashboard components
export const LazyBadgeCollection = lazyLoadChildComponent(
  () => import('../badges/BadgeCollection'),
  'Badge Collection'
);

export const LazyBadgeDisplay = lazyLoadChildComponent(
  () => import('../badges/BadgeDisplay'),
  'Badges'
);

export const LazyBadgeProgress = lazyLoadChildComponent(
  () => import('../badges/BadgeProgress'),
  'Badge Progress'
);

export const LazyAchievementCenter = lazyLoadChildComponent(
  () => import('../badges/AchievementCenter'),
  'Achievement Center'
);

export const LazyProgressVisualization = lazyLoadChildComponent(
  () => import('../progress/ProgressVisualization'),
  'Progress Charts'
);

export const LazyActivityProgressTracker = lazyLoadChildComponent(
  () => import('../progress/ActivityProgressTracker'),
  'Activity Progress'
);

export const LazyProgressHistory = lazyLoadChildComponent(
  () => import('../progress/ProgressHistory'),
  'Progress History'
);

export const LazyChildAnalyticsDashboard = lazyLoadChildComponent(
  () => import('../childAnalytics/ChildAnalyticsDashboard'),
  'Learning Analytics'
);

export const LazyLearningStreakDisplay = lazyLoadChildComponent(
  () => import('../childAnalytics/LearningStreakDisplay'),
  'Learning Streaks'
);

export const LazyWeeklyProgressChart = lazyLoadChildComponent(
  () => import('../childAnalytics/WeeklyProgressChart'),
  'Weekly Progress'
);

export const LazySubjectMasteryRadar = lazyLoadChildComponent(
  () => import('../childAnalytics/SubjectMasteryRadar'),
  'Subject Mastery'
);

export const LazyLearningTimeTracker = lazyLoadChildComponent(
  () => import('../childAnalytics/LearningTimeTracker'),
  'Learning Time'
);

// Wrapped components with Suspense
export const BadgeCollectionWithSuspense = withLazyLoading(LazyBadgeCollection, 'Loading your badges...');
export const ProgressVisualizationWithSuspense = withLazyLoading(LazyProgressVisualization, 'Loading progress charts...');
export const ChildAnalyticsWithSuspense = withLazyLoading(LazyChildAnalyticsDashboard, 'Loading your learning stats...');

// Preload function for child dashboard
export { preloadChildDashboard };

// Hook to preload components when child dashboard is likely to be accessed
export const useChildDashboardPreload = () => {
  React.useEffect(() => {
    // Preload components after a short delay to not block initial render
    const timer = setTimeout(() => {
      preloadChildDashboard();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
};