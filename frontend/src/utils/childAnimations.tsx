import React from 'react';

/**
 * Optimized animations and transitions for child-friendly interfaces
 * Uses CSS transforms and GPU acceleration for smooth performance
 */

// Animation configuration for child components
export const childAnimationConfig = {
  // Reduced motion for accessibility
  respectsReducedMotion: true,
  
  // Durations optimized for child attention spans
  durations: {
    fast: 200,
    normal: 300,
    slow: 500,
    celebration: 2000
  },
  
  // Easing functions that feel natural to children
  easings: {
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    playful: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
};

// CSS-in-JS animation styles for performance
export const animationStyles = {
  // Fade animations
  fadeIn: {
    opacity: 0,
    animation: 'fadeIn 0.3s ease-out forwards'
  },
  
  fadeOut: {
    opacity: 1,
    animation: 'fadeOut 0.3s ease-out forwards'
  },

  // Scale animations for buttons and badges
  scaleIn: {
    transform: 'scale(0.8)',
    opacity: 0,
    animation: 'scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
  },

  // Slide animations for panels
  slideInFromRight: {
    transform: 'translateX(100%)',
    animation: 'slideInFromRight 0.3s ease-out forwards'
  },

  slideInFromBottom: {
    transform: 'translateY(100%)',
    animation: 'slideInFromBottom 0.3s ease-out forwards'
  },

  // Bounce animation for achievements
  bounceIn: {
    transform: 'scale(0)',
    animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
  },

  // Pulse animation for notifications
  pulse: {
    animation: 'pulse 2s infinite'
  },

  // Wiggle animation for interactive elements
  wiggle: {
    animation: 'wiggle 0.5s ease-in-out'
  },

  // Loading spinner optimized for children
  childSpinner: {
    animation: 'spin 1s linear infinite, colorCycle 3s ease-in-out infinite'
  }
};

// CSS keyframes as a string for injection
export const keyframesCSS = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes slideInFromRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  @keyframes slideInFromBottom {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes colorCycle {
    0%, 100% { filter: hue-rotate(0deg); }
    33% { filter: hue-rotate(120deg); }
    66% { filter: hue-rotate(240deg); }
  }

  @keyframes fireFlicker {
    0% { transform: scale(1) rotate(-2deg); }
    50% { transform: scale(1.1) rotate(1deg); }
    100% { transform: scale(1.05) rotate(-1deg); }
  }

  @keyframes confetti {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  @keyframes starTwinkle {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2) rotate(180deg);
      opacity: 1;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// React component for injecting keyframes
export const AnimationStyles: React.FC = () => {
  React.useEffect(() => {
    // Check if styles are already injected
    if (document.getElementById('child-animations')) return;

    const style = document.createElement('style');
    style.id = 'child-animations';
    style.textContent = keyframesCSS;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('child-animations');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
};

// Hook for managing animation states
export const useChildAnimation = (animationType: keyof typeof animationStyles) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationClass, setAnimationClass] = React.useState('');

  const triggerAnimation = React.useCallback(() => {
    setIsAnimating(true);
    setAnimationClass(animationType);

    // Reset animation after completion
    const duration = animationType.includes('celebration') 
      ? childAnimationConfig.durations.celebration
      : childAnimationConfig.durations.normal;

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationClass('');
    }, duration);
  }, [animationType]);

  return {
    isAnimating,
    animationClass,
    triggerAnimation,
    animationStyle: animationStyles[animationType]
  };
};

// Performance-optimized transition components
export const AnimatedContainer: React.FC<{
  children: React.ReactNode;
  animationType?: keyof typeof animationStyles;
  delay?: number;
  className?: string;
}> = ({ children, animationType = 'fadeIn', delay = 0, className = '' }) => {
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        ...animationStyles[animationType],
        animationDelay: `${delay}ms`,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {children}
    </div>
  );
};

// Badge celebration animation component
export const BadgeCelebration: React.FC<{
  isVisible: boolean;
  badgeName: string;
  onComplete: () => void;
}> = ({ isVisible, badgeName, onComplete }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, childAnimationConfig.durations.celebration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        ...animationStyles.fadeIn
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          ...animationStyles.bounceIn
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏅</div>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '10px' }}>
          Congratulations!
        </h2>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>
          You earned the {badgeName} badge!
        </p>
        
        {/* Confetti animation */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-10px',
              left: `${Math.random() * 100}%`,
              width: '10px',
              height: '10px',
              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5],
              animation: `confetti ${2 + Math.random()}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Progress bar with smooth animation
export const AnimatedProgressBar: React.FC<{
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}> = ({ progress, color = '#3b82f6', height = 8, showLabel = false }) => {
  const [animatedProgress, setAnimatedProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '8px',
          color: '#374151'
        }}>
          {Math.round(animatedProgress)}%
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#e5e7eb',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${animatedProgress}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: `${height / 2}px`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'width'
          }}
        />
      </div>
    </div>
  );
};

// Floating action button with child-friendly animations
export const FloatingActionButton: React.FC<{
  onClick: () => void;
  icon: string;
  label: string;
  color?: string;
}> = ({ onClick, icon, label, color = '#3b82f6' }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '30px',
        backgroundColor: color,
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        willChange: 'transform',
        zIndex: 1000
      }}
      title={label}
    >
      {icon}
    </button>
  );
};

export default {
  animationStyles,
  childAnimationConfig,
  useChildAnimation,
  AnimatedContainer,
  BadgeCelebration,
  AnimatedProgressBar,
  FloatingActionButton,
  AnimationStyles
};