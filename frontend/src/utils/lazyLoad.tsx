import React, { lazy, ComponentType, LazyExoticComponent, Suspense, ReactNode } from 'react';
import { LoadingState } from '../components/common';

/**
 * Helper function to lazy load components with better error handling
 * @param importFn - Dynamic import function
 * @param fallback - Optional fallback component to use if loading fails
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): LazyExoticComponent<T> {
  const lazyComponent = lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Error loading component:', error);
      if (fallback) {
        return { default: fallback } as { default: T };
      }
      throw error;
    }
  });
  
  return lazyComponent;
}

/**
 * Higher-order component that wraps lazy components with Suspense and loading state
 * @param LazyComponent - The lazy-loaded component
 * @param loadingMessage - Custom loading message
 */
export function withLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  loadingMessage?: string
) {
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingState message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component to improve perceived performance
 * @param importFn - Dynamic import function
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Start loading the component in the background
  importFn().catch(error => {
    console.warn('Failed to preload component:', error);
  });
}

/**
 * Create a lazy-loaded component with intersection observer for viewport-based loading
 * @param importFn - Dynamic import function
 * @param threshold - Intersection threshold (0-1)
 */
export function lazyLoadOnIntersection<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  threshold: number = 0.1
) {
  const LazyComponent = lazyLoad(importFn);
  
  return function IntersectionLazyWrapper(props: any) {
    const [shouldLoad, setShouldLoad] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { threshold }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref}>
        {shouldLoad ? (
          <Suspense fallback={<LoadingState />}>
            <LazyComponent {...props} />
          </Suspense>
        ) : (
          <div style={{ minHeight: '200px' }} /> // Placeholder to maintain layout
        )}
      </div>
    );
  };
}

// Child-specific lazy loading utilities

/**
 * Lazy load child dashboard components with child-friendly loading states
 */
export const lazyLoadChildComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) => {
  return lazyLoad(importFn, () => (
    <LoadingState 
      message={`Loading ${componentName}...`}
      childFriendly={true}
    />
  ) as any);
};

/**
 * Batch preload child dashboard components
 */
export function preloadChildDashboard(): void {
  // Preload critical child dashboard components
  const componentsToPreload = [
    () => import('../components/badges/BadgeCollection'),
    () => import('../components/progress/ProgressVisualization'),
    () => import('../components/childAnalytics/ChildAnalyticsDashboard'),
    () => import('../components/progress/ActivityProgressTracker')
  ];

  componentsToPreload.forEach(preloadComponent);
}