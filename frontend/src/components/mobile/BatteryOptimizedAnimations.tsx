/**
 * Battery-optimized animation components for extended learning sessions
 * Automatically adjusts animation complexity based on battery status
 */

import React, { useMemo } from 'react';
import { Box, Fade, Grow, Slide, Zoom, styled, keyframes } from '@mui/material';
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations';

interface OptimizedAnimationProps {
  children: React.ReactNode;
  type?: 'fade' | 'grow' | 'slide' | 'zoom' | 'bounce' | 'pulse';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  in?: boolean;
  disabled?: boolean;
}

// Keyframe animations with battery optimization
const bounceAnimation = keyframes`
  0%, 20%, 53%, 80%, to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const shimmerAnimation = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const AnimationContainer = styled(Box)<{ 
  animationType: string; 
  optimized: boolean; 
  duration: number;
}>(({ theme, animationType, optimized, duration }) => {
  const baseDuration = optimized ? Math.min(duration, 150) : duration;
  
  const animations = {
    bounce: `${bounceAnimation} ${baseDuration * 4}ms ease-in-out`,
    pulse: `${pulseAnimation} ${baseDuration * 6}ms ease-in-out infinite`,
    shimmer: `${shimmerAnimation} ${baseDuration * 8}ms ease-in-out infinite`
  };

  return {
    ...(animations[animationType as keyof typeof animations] && {
      animation: optimized ? 'none' : animations[animationType as keyof typeof animations]
    }),
    
    // Optimize for performance
    willChange: optimized ? 'auto' : 'transform, opacity',
    backfaceVisibility: 'hidden',
    perspective: 1000,
    
    // Reduce motion for battery optimization
    ...(optimized && {
      transition: theme.transitions.create(['opacity', 'transform'], {
        duration: baseDuration,
        easing: 'ease-out'
      })
    })
  };
});

export const OptimizedAnimation: React.FC<OptimizedAnimationProps> = ({
  children,
  type = 'fade',
  direction = 'up',
  duration,
  delay = 0,
  in: inProp = true,
  disabled = false
}) => {
  const { animationConfig, batteryStatus } = useMobileOptimizations();
  
  const effectiveDuration = duration || animationConfig.duration;
  const shouldOptimize = batteryStatus.reducedAnimations || animationConfig.reduceMotion;
  
  const animationProps = useMemo(() => ({
    in: inProp && !disabled,
    timeout: shouldOptimize ? Math.min(effectiveDuration, 150) : effectiveDuration,
    style: { transitionDelay: `${delay}ms` }
  }), [inProp, disabled, shouldOptimize, effectiveDuration, delay]);

  // Return children without animation if disabled or battery optimization is active
  if (disabled || (shouldOptimize && type !== 'fade')) {
    return <Box>{children}</Box>;
  }

  // Choose animation based on type and optimization level
  switch (type) {
    case 'fade':
      return (
        <Fade {...animationProps}>
          <Box>{children}</Box>
        </Fade>
      );
      
    case 'grow':
      return shouldOptimize ? (
        <Fade {...animationProps}>
          <Box>{children}</Box>
        </Fade>
      ) : (
        <Grow {...animationProps}>
          <Box>{children}</Box>
        </Grow>
      );
      
    case 'slide':
      return shouldOptimize ? (
        <Fade {...animationProps}>
          <Box>{children}</Box>
        </Fade>
      ) : (
        <Slide {...animationProps} direction={direction}>
          <Box>{children}</Box>
        </Slide>
      );
      
    case 'zoom':
      return shouldOptimize ? (
        <Fade {...animationProps}>
          <Box>{children}</Box>
        </Fade>
      ) : (
        <Zoom {...animationProps}>
          <Box>{children}</Box>
        </Zoom>
      );
      
    case 'bounce':
    case 'pulse':
      return (
        <AnimationContainer
          animationType={type}
          optimized={shouldOptimize}
          duration={effectiveDuration}
        >
          {children}
        </AnimationContainer>
      );
      
    default:
      return <Box>{children}</Box>;
  }
};

// Specialized components for common use cases
export const CelebrationAnimation: React.FC<{
  children: React.ReactNode;
  show: boolean;
  onComplete?: () => void;
}> = ({ children, show, onComplete }) => {
  const { animationConfig, batteryStatus } = useMobileOptimizations();
  
  React.useEffect(() => {
    if (show && onComplete) {
      const timeout = setTimeout(onComplete, animationConfig.duration * 2);
      return () => clearTimeout(timeout);
    }
  }, [show, onComplete, animationConfig.duration]);

  if (batteryStatus.reducedAnimations) {
    return (
      <OptimizedAnimation type="fade" in={show}>
        {children}
      </OptimizedAnimation>
    );
  }

  return (
    <OptimizedAnimation type="bounce" in={show}>
      <OptimizedAnimation type="zoom" in={show} delay={100}>
        {children}
      </OptimizedAnimation>
    </OptimizedAnimation>
  );
};

export const ProgressAnimation: React.FC<{
  children: React.ReactNode;
  progress: number;
  showPulse?: boolean;
}> = ({ children, progress, showPulse = false }) => {
  const { batteryStatus } = useMobileOptimizations();
  
  const shouldPulse = showPulse && progress > 0 && !batteryStatus.reducedAnimations;
  
  return (
    <OptimizedAnimation 
      type={shouldPulse ? 'pulse' : 'fade'} 
      in={progress > 0}
    >
      {children}
    </OptimizedAnimation>
  );
};

export const LoadingShimmer: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}> = ({ width = '100%', height = 20, borderRadius = 4 }) => {
  const { batteryStatus } = useMobileOptimizations();
  
  if (batteryStatus.reducedAnimations) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          backgroundColor: 'grey.200',
          opacity: 0.7
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        background: `
          linear-gradient(90deg, 
            transparent, 
            rgba(255,255,255,0.4), 
            transparent
          ), 
          #f0f0f0
        `,
        backgroundSize: '200px 100%',
        animation: `${shimmerAnimation} 1.5s ease-in-out infinite`
      }}
    />
  );
};

export const StaggeredAnimation: React.FC<{
  children: React.ReactNode[];
  staggerDelay?: number;
  type?: OptimizedAnimationProps['type'];
}> = ({ children, staggerDelay = 100, type = 'fade' }) => {
  const { batteryStatus } = useMobileOptimizations();
  
  // Reduce stagger delay for battery optimization
  const effectiveDelay = batteryStatus.reducedAnimations ? 
    Math.min(staggerDelay, 50) : staggerDelay;
  
  return (
    <>
      {children.map((child, index) => (
        <OptimizedAnimation
          key={index}
          type={type}
          delay={index * effectiveDelay}
          in={true}
        >
          {child}
        </OptimizedAnimation>
      ))}
    </>
  );
};

export default OptimizedAnimation;