import React from 'react';
import { CircularProgress, Box, Typography, Skeleton } from '@mui/material';
import { useTheme } from '../../theme/ThemeContext';
import { 
  combineClasses, 
  getLoadingClasses, 
  getCardClasses, 
  getBorderRadius,
  getResponsivePadding 
} from '../../utils/themeHelpers';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullHeight?: boolean;
  variant?: 'card' | 'inline' | 'overlay';
  children?: React.ReactNode;
  childFriendly?: boolean;
  icon?: string;
  showProgress?: boolean;
  style?: React.CSSProperties;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'medium',
  message,
  fullHeight = false,
  variant = 'inline',
  children,
  childFriendly = false,
  icon,
  showProgress = false,
  style
}) => {
  const { userRole } = useTheme();

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { spinner: 20, text: 'text-sm', padding: 'p-2' };
      case 'large':
        return { spinner: 48, text: 'text-lg', padding: 'p-6' };
      default:
        return { spinner: 32, text: 'text-base', padding: 'p-4' };
    }
  };

  const sizeConfig = getSizeClasses();

  const renderSpinner = () => {
    if (childFriendly || icon) {
      return (
        <Box className="flex flex-col items-center justify-center gap-3">
          <div 
            className="animate-bounce"
            style={{
              fontSize: `${sizeConfig.spinner}px`,
              animation: 'bounce 1s infinite, colorCycle 3s ease-in-out infinite'
            }}
          >
            {icon || '🌈'}
          </div>
          {message && (
            <Typography 
              variant="body2" 
              className={combineClasses(
                sizeConfig.text,
                "text-primary-600 dark:text-primary-400 text-center font-medium"
              )}
            >
              {message}
            </Typography>
          )}
          {showProgress && (
            <div style={{
              marginTop: '16px',
              width: '200px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#fbbf24',
                borderRadius: '2px',
                animation: 'loading 1.5s ease-in-out infinite'
              }} />
            </div>
          )}
        </Box>
      );
    }

    return (
      <Box className="flex flex-col items-center justify-center gap-3">
        <CircularProgress 
          size={sizeConfig.spinner} 
          className={getLoadingClasses('spin')}
        />
        {message && (
          <Typography 
            variant="body2" 
            className={combineClasses(
              sizeConfig.text,
              "text-gray-600 dark:text-gray-400 text-center animate-pulse"
            )}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  };

  const renderSkeleton = () => (
    <Box className="space-y-3">
      <Skeleton 
        variant="rectangular" 
        height={40} 
        className={getBorderRadius(userRole, 'md')}
      />
      <Skeleton 
        variant="rectangular" 
        height={20} 
        width="80%" 
        className={getBorderRadius(userRole, 'sm')}
      />
      <Skeleton 
        variant="rectangular" 
        height={20} 
        width="60%" 
        className={getBorderRadius(userRole, 'sm')}
      />
      {message && (
        <Typography 
          variant="caption" 
          className="text-gray-500 dark:text-gray-400 text-center block mt-2"
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  const renderPulse = () => (
    <Box className={combineClasses(
      "flex items-center justify-center",
      getLoadingClasses('pulse')
    )}>
      <Box className={combineClasses(
        "bg-gray-200 dark:bg-gray-700",
        getBorderRadius(userRole, 'lg'),
        sizeConfig.padding,
        "min-w-32 min-h-16"
      )}>
        {message && (
          <Typography 
            variant="body2" 
            className={combineClasses(
              sizeConfig.text,
              "text-gray-600 dark:text-gray-400 text-center"
            )}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderDots = () => (
    <Box className="flex flex-col items-center justify-center gap-3">
      <Box className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            className={combineClasses(
              "w-2 h-2 bg-primary-500 rounded-full animate-bounce",
              getBorderRadius(userRole, 'sm')
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </Box>
      {message && (
        <Typography 
          variant="body2" 
          className={combineClasses(
            sizeConfig.text,
            "text-gray-600 dark:text-gray-400 text-center"
          )}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  const renderLoadingContent = () => {
    switch (type) {
      case 'skeleton':
        return renderSkeleton();
      case 'pulse':
        return renderPulse();
      case 'dots':
        return renderDots();
      default:
        return renderSpinner();
    }
  };

  const containerClasses = combineClasses(
    fullHeight && "min-h-screen",
    "flex items-center justify-center",
    variant === 'card' && getCardClasses(userRole),
    variant === 'card' && "bg-white dark:bg-gray-800",
    variant === 'card' && getBorderRadius(userRole, 'md'),
    variant === 'card' && getResponsivePadding('lg'),
    variant === 'overlay' && "absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50",
    "animate-fade-in"
  );

  if (children) {
    return (
      <Box className="relative">
        {children}
        {variant === 'overlay' && (
          <Box className={containerClasses}>
            {renderLoadingContent()}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      {childFriendly && (
        <style>{`
          @keyframes colorCycle {
            0%, 100% { filter: hue-rotate(0deg); }
            33% { filter: hue-rotate(120deg); }
            66% { filter: hue-rotate(240deg); }
          }
        `}</style>
      )}
      <Box className={containerClasses} style={style}>
        {renderLoadingContent()}
      </Box>
      {showProgress && (
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      )}
    </>
  );
};

export default LoadingState;