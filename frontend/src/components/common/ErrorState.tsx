import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Button, 
  Box, 
  Typography, 
  IconButton 
} from '@mui/material';
import { 
  ErrorOutline, 
  Warning, 
  Info, 
  Refresh, 
  Close 
} from '@mui/icons-material';
import { useTheme } from '../../theme/ThemeContext';
import { 
  combineClasses, 
  getCardClasses, 
  getBorderRadius, 
  getButtonClasses,
  getResponsivePadding,
  getFocusClasses
} from '../../utils/themeHelpers';

interface ErrorStateProps {
  type?: 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  dismissible?: boolean;
  variant?: 'card' | 'inline' | 'banner';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'error',
  title,
  message,
  details,
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  dismissible = false,
  variant = 'card',
  size = 'medium',
  icon,
  actions
}) => {
  const { userRole } = useTheme();

  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          severity: 'warning' as const,
          icon: <Warning />,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      case 'info':
        return {
          severity: 'info' as const,
          icon: <Info />,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          severity: 'error' as const,
          icon: <ErrorOutline />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          padding: 'p-3',
          text: 'text-sm',
          title: 'text-base',
          iconSize: 'text-lg'
        };
      case 'large':
        return {
          padding: 'p-6',
          text: 'text-base',
          title: 'text-xl',
          iconSize: 'text-2xl'
        };
      default:
        return {
          padding: 'p-4',
          text: 'text-sm',
          title: 'text-lg',
          iconSize: 'text-xl'
        };
    }
  };

  const typeConfig = getTypeConfig();
  const sizeConfig = getSizeConfig();

  if (variant === 'inline') {
    return (
      <Alert 
        severity={typeConfig.severity}
        className={combineClasses(
          getBorderRadius(userRole, 'md'),
          "animate-slide-up"
        )}
        action={
          <Box className="flex items-center gap-2">
            {onRetry && (
              <Button
                size="small"
                onClick={onRetry}
                startIcon={<Refresh />}
                className={combineClasses(
                  getButtonClasses(userRole),
                  getFocusClasses(userRole)
                )}
              >
                {retryLabel}
              </Button>
            )}
            {dismissible && onDismiss && (
              <IconButton
                size="small"
                onClick={onDismiss}
                className={getFocusClasses(userRole)}
              >
                <Close />
              </IconButton>
            )}
          </Box>
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
        {details && (
          <Typography variant="caption" className="block mt-1 opacity-75">
            {details}
          </Typography>
        )}
      </Alert>
    );
  }

  if (variant === 'banner') {
    return (
      <Box className={combineClasses(
        typeConfig.bgColor,
        typeConfig.borderColor,
        "border-l-4 animate-slide-up",
        sizeConfig.padding
      )}>
        <Box className="flex items-start justify-between">
          <Box className="flex items-start gap-3">
            <Box className={combineClasses(typeConfig.color, sizeConfig.iconSize)}>
              {icon || typeConfig.icon}
            </Box>
            <Box className="flex-1">
              {title && (
                <Typography 
                  variant="h6" 
                  className={combineClasses(
                    sizeConfig.title,
                    typeConfig.color,
                    "font-semibold mb-1"
                  )}
                >
                  {title}
                </Typography>
              )}
              <Typography 
                className={combineClasses(
                  sizeConfig.text,
                  "text-gray-700 dark:text-gray-300"
                )}
              >
                {message}
              </Typography>
              {details && (
                <Typography 
                  variant="caption" 
                  className="block mt-1 text-gray-600 dark:text-gray-400"
                >
                  {details}
                </Typography>
              )}
            </Box>
          </Box>
          <Box className="flex items-center gap-2 ml-4">
            {onRetry && (
              <Button
                size="small"
                onClick={onRetry}
                startIcon={<Refresh />}
                className={combineClasses(
                  getButtonClasses(userRole),
                  getFocusClasses(userRole)
                )}
              >
                {retryLabel}
              </Button>
            )}
            {dismissible && onDismiss && (
              <IconButton
                size="small"
                onClick={onDismiss}
                className={getFocusClasses(userRole)}
              >
                <Close />
              </IconButton>
            )}
            {actions}
          </Box>
        </Box>
      </Box>
    );
  }

  // Card variant (default)
  return (
    <Box className={combineClasses(
      getCardClasses(userRole),
      typeConfig.bgColor,
      getBorderRadius(userRole, 'md'),
      getResponsivePadding('lg'),
      "animate-fade-in"
    )}>
      <Box className="flex items-start gap-4">
        <Box className={combineClasses(
          typeConfig.color,
          sizeConfig.iconSize,
          "flex-shrink-0 mt-1"
        )}>
          {icon || typeConfig.icon}
        </Box>
        <Box className="flex-1 min-w-0">
          {title && (
            <Typography 
              variant="h6" 
              className={combineClasses(
                sizeConfig.title,
                typeConfig.color,
                "font-semibold mb-2"
              )}
            >
              {title}
            </Typography>
          )}
          <Typography 
            className={combineClasses(
              sizeConfig.text,
              "text-gray-700 dark:text-gray-300 mb-3"
            )}
          >
            {message}
          </Typography>
          {details && (
            <Typography 
              variant="caption" 
              className="block mb-3 text-gray-600 dark:text-gray-400"
            >
              {details}
            </Typography>
          )}
          <Box className="flex items-center gap-3 flex-wrap">
            {onRetry && (
              <Button
                variant="contained"
                size="small"
                onClick={onRetry}
                startIcon={<Refresh />}
                className={combineClasses(
                  getButtonClasses(userRole),
                  getFocusClasses(userRole)
                )}
              >
                {retryLabel}
              </Button>
            )}
            {actions}
          </Box>
        </Box>
        {dismissible && onDismiss && (
          <IconButton
            size="small"
            onClick={onDismiss}
            className={combineClasses(
              "flex-shrink-0",
              getFocusClasses(userRole)
            )}
          >
            <Close />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ErrorState;