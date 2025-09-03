import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useTheme } from '../../theme/ThemeContext';
import { 
  combineClasses, 
  getButtonClasses, 
  getFocusClasses,
  getBorderRadius
} from '../../utils/themeHelpers';

interface StandardButtonProps extends Omit<ButtonProps, 'size'> {
  loading?: boolean;
  loadingText?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  animation?: boolean;
}

const StandardButton: React.FC<StandardButtonProps> = ({
  children,
  loading = false,
  loadingText,
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'start',
  variant = 'contained',
  color = 'primary',
  animation = true,
  disabled,
  className,
  onClick,
  ...props
}) => {
  const { userRole } = useTheme();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          padding: userRole === 'child' ? 'px-3 py-1.5' : 'px-2 py-1',
          text: 'text-sm',
          minHeight: 'min-h-8',
          iconSize: 'text-sm'
        };
      case 'large':
        return {
          padding: userRole === 'child' ? 'px-8 py-4' : 'px-6 py-3',
          text: 'text-lg',
          minHeight: 'min-h-12',
          iconSize: 'text-lg'
        };
      default:
        return {
          padding: userRole === 'child' ? 'px-5 py-2.5' : 'px-4 py-2',
          text: 'text-base',
          minHeight: 'min-h-10',
          iconSize: 'text-base'
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const getVariantClasses = () => {
    const baseClasses = combineClasses(
      getButtonClasses(userRole),
      getFocusClasses(userRole),
      sizeConfig.padding,
      sizeConfig.text,
      sizeConfig.minHeight,
      "font-semibold transition-all duration-200",
      animation && "hover:scale-105 active:scale-95",
      fullWidth && "w-full",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    );

    switch (variant) {
      case 'outlined':
        return combineClasses(
          baseClasses,
          "border-2 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
        );
      case 'text':
        return combineClasses(
          baseClasses,
          "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 shadow-none"
        );
      default: // contained
        return combineClasses(
          baseClasses,
          "text-white shadow-md hover:shadow-lg"
        );
    }
  };

  const getColorClasses = () => {
    if (variant === 'text' || variant === 'outlined') {
      switch (color) {
        case 'secondary':
          return 'text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20';
        case 'success':
          return 'text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20';
        case 'error':
          return 'text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20';
        case 'warning':
          return 'text-amber-600 border-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-900/20';
        case 'info':
          return 'text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20';
        default: // primary
          return userRole === 'child' 
            ? 'text-purple-600 border-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20'
            : 'text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20';
      }
    } else {
      // contained variant
      switch (color) {
        case 'secondary':
          return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
        case 'success':
          return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
        case 'error':
          return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        case 'warning':
          return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
        case 'info':
          return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        default: // primary
          return userRole === 'child'
            ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      }
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onClick?.(event);
  };

  const renderIcon = (position: 'start' | 'end') => {
    if (!icon || iconPosition !== position) return null;
    
    return (
      <span className={combineClasses(
        sizeConfig.iconSize,
        position === 'start' ? 'mr-2' : 'ml-2'
      )}>
        {icon}
      </span>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <CircularProgress 
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            className="mr-2"
          />
          {loadingText || 'Loading...'}
        </>
      );
    }

    return (
      <>
        {renderIcon('start')}
        {children}
        {renderIcon('end')}
      </>
    );
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      className={combineClasses(
        getVariantClasses(),
        getColorClasses(),
        getBorderRadius(userRole, 'md'),
        className
      )}
    >
      {renderContent()}
    </Button>
  );
};

export default StandardButton;