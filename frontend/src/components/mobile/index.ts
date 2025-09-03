/**
 * Mobile optimization components for child-friendly interfaces
 */

export { default as TouchFriendlyButton } from './TouchFriendlyButton';
export { default as SwipeableActivityNavigation } from './SwipeableActivityNavigation';
export { default as TabletOptimizedLayout } from './TabletOptimizedLayout';
export { default as ResponsiveChildDashboard } from './ResponsiveChildDashboard';
export {
  OptimizedAnimation,
  CelebrationAnimation,
  ProgressAnimation,
  LoadingShimmer,
  StaggeredAnimation
} from './BatteryOptimizedAnimations';

// Re-export hooks for convenience
export {
  useMobileOptimizations,
  useSwipeGestures,
  useTouchFriendly,
  usePerformanceMonitoring
} from '../../hooks/useMobileOptimizations';

// Re-export utilities
export * from '../../utils/mobileOptimizations';