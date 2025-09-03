/**
 * Touch-friendly button component optimized for children
 * Features large touch targets, visual feedback, and accessibility
 */

import React from 'react';
import { Button, ButtonProps, styled, alpha } from '@mui/material';
import { useTouchFriendly, useMobileOptimizations } from '../../hooks/useMobileOptimizations';
import { getTouchFriendlyStyles } from '../../utils/mobileOptimizations';

interface TouchFriendlyButtonProps extends Omit<ButtonProps, 'size'> {
  size?: 'small' | 'medium' | 'large';
  rippleColor?: string;
  hapticFeedback?: boolean;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => !['rippleColor', 'touchSize'].includes(prop as string)
})<{ rippleColor?: string; touchSize: 'small' | 'medium' | 'large' }>(
  ({ theme, rippleColor, touchSize }) => {
    const touchStyles = getTouchFriendlyStyles(touchSize);
    
    return {
      ...touchStyles,
      position: 'relative',
      overflow: 'hidden',
      transition: theme.transitions.create([
        'background-color',
        'box-shadow',
        'transform'
      ], {
        duration: theme.transitions.duration.short
      }),
      
      '&:active': {
        transform: 'scale(0.98)',
        boxShadow: theme.shadows[2]
      },
      
      '&:focus-visible': {
        outline: `3px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px'
      },
      
      // Ripple effect container
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: rippleColor || alpha(theme.palette.primary.main, 0.1),
        borderRadius: 'inherit',
        transform: 'scale(0)',
        opacity: 0,
        transition: theme.transitions.create(['transform', 'opacity'], {
          duration: theme.transitions.duration.short
        })
      },
      
      '&.ripple-active::before': {
        transform: 'scale(1)',
        opacity: 1
      }
    };
  }
);

const RippleEffect = styled('div')<{ x: number; y: number; show: boolean }>(
  ({ theme, x, y, show }) => ({
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: alpha(theme.palette.common.white, 0.6),
    transform: `translate(${x - 10}px, ${y - 10}px) scale(${show ? 4 : 0})`,
    opacity: show ? 0.8 : 0,
    transition: theme.transitions.create(['transform', 'opacity'], {
      duration: theme.transitions.duration.short,
      easing: theme.transitions.easing.easeOut
    }),
    pointerEvents: 'none'
  })
);

export const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  size = 'medium',
  rippleColor,
  hapticFeedback = true,
  onClick,
  disabled,
  className,
  ...props
}) => {
  const { isPressed, ripplePosition, touchProps } = useTouchFriendly();
  const { animationConfig, isTablet } = useMobileOptimizations();
  const [rippleActive, setRippleActive] = React.useState(false);

  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Haptic feedback for supported devices
    if (hapticFeedback && 'vibrate' in navigator && isTablet) {
      navigator.vibrate(10); // Short vibration
    }

    // Trigger ripple effect
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), animationConfig.duration);

    onClick?.(event);
  }, [disabled, hapticFeedback, isTablet, animationConfig.duration, onClick]);

  const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled) return;
    touchProps.onTouchStart(e);
  }, [disabled, touchProps]);

  return (
    <StyledButton
      {...props}
      touchSize={size}
      rippleColor={rippleColor}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={touchProps.onTouchEnd}
      onTouchCancel={touchProps.onTouchCancel}
      disabled={disabled}
      className={`${className || ''} ${rippleActive ? 'ripple-active' : ''}`}
      disableRipple // Use custom ripple
      aria-pressed={isPressed}
    >
      {children}
      
      {/* Custom ripple effect */}
      {ripplePosition && (
        <RippleEffect
          x={ripplePosition.x}
          y={ripplePosition.y}
          show={isPressed}
        />
      )}
    </StyledButton>
  );
};

export default TouchFriendlyButton;