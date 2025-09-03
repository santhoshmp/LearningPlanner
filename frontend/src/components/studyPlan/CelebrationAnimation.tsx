import React, { useEffect, useState, useRef } from 'react';
import { CelebrationConfig } from '../../types/gamification';
import { useTheme } from '../../theme/ThemeContext';
import { 
  Box, 
  Paper, 
  Typography, 
  Zoom, 
  Fade, 
  Grow,
  Backdrop
} from '@mui/material';
import { keyframes } from '@mui/system';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';

interface CelebrationAnimationProps {
  config: CelebrationConfig;
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

// Define keyframes for animations
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const confettiAnimation = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const fireworksAnimation = keyframes`
  0% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x-end), var(--y-end));
    opacity: 0;
  }
`;

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ 
  config, 
  onComplete,
  duration = 3000 
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(true);
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    color: string;
    size: number;
    xEnd?: number;
    yEnd?: number;
    delay: number;
    duration: number;
  }>>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Play sound if available and enabled
    if (config.sound) {
      try {
        const audio = new Audio(`/sounds/${config.sound}.mp3`);
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (err) {
        console.error('Failed to play celebration sound:', err);
      }
    }

    // Generate particles for animations
    if (config.animation === 'confetti') {
      const newParticles = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -5 - Math.random() * 10, // Start above the viewport
        color: getRandomColor(),
        size: 5 + Math.random() * 10,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 4
      }));
      setParticles(newParticles);
    } else if (config.animation === 'fireworks') {
      // Create fireworks effect - particles exploding from center
      const newParticles = Array.from({ length: 80 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 70;
        return {
          id: i,
          x: 50, // Start at center
          y: 50, // Start at center
          xEnd: 50 + Math.cos(angle) * distance,
          yEnd: 50 + Math.sin(angle) * distance,
          color: getRandomColor(),
          size: 3 + Math.random() * 6,
          delay: Math.random() * 0.5,
          duration: 0.8 + Math.random() * 1.2
        };
      });
      setParticles(newParticles);
    }

    // Auto-hide after duration
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [config, duration, onComplete]);

  const getRandomColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.primary.light,
      theme.palette.secondary.main,
      theme.palette.secondary.light,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', 
      '#40C4FF', '#64FFDA', '#69F0AE', '#B2FF59', '#FFFF00', '#FFD740'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getIconComponent = () => {
    switch (config.type) {
      case 'badge':
        return <MilitaryTechIcon sx={{ fontSize: 80, color: theme.palette.primary.main }} />;
      case 'milestone':
        return <EmojiEventsIcon sx={{ fontSize: 80, color: theme.palette.secondary.main }} />;
      case 'streak':
        return <LocalFireDepartmentIcon sx={{ fontSize: 80, color: theme.palette.warning.main }} />;
      default:
        return <StarIcon sx={{ fontSize: 80, color: theme.palette.info.main }} />;
    }
  };

  if (!visible) return null;

  return (
    <Backdrop
      open={visible}
      sx={{ 
        zIndex: theme.zIndex.modal + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <Box 
        ref={containerRef}
        sx={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        <Zoom in={visible} timeout={500}>
          <Box
            sx={{
              position: 'relative',
              textAlign: 'center',
              animation: config.animation === 'bounce' 
                ? `${bounce} 2s infinite` 
                : config.animation === 'stars' 
                  ? `${pulse} 1.5s infinite` 
                  : 'none',
              zIndex: 2
            }}
          >
            {/* Icon */}
            <Grow in={visible} timeout={800}>
              <Box mb={3}>
                {config.icon ? (
                  <Typography variant="h1" component="div" sx={{ fontSize: 80, mb: 2 }}>
                    {config.icon}
                  </Typography>
                ) : (
                  getIconComponent()
                )}
              </Box>
            </Grow>
            
            {/* Title and message */}
            <Fade in={visible} timeout={1000}>
              <Paper 
                elevation={4} 
                sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  maxWidth: 400
                }}
              >
                <Typography 
                  variant="h4" 
                  component="h2" 
                  fontWeight="bold" 
                  color="primary.main" 
                  gutterBottom
                >
                  {config.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {config.message}
                </Typography>
              </Paper>
            </Fade>
          </Box>
        </Zoom>

        {/* Confetti particles */}
        {config.animation === 'confetti' && (
          <Box 
            sx={{ 
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            {particles.map(particle => (
              <Box
                key={particle.id}
                sx={{
                  position: 'absolute',
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  borderRadius: '2px',
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animation: `${confettiAnimation} ${particle.duration}s forwards cubic-bezier(0, 0.5, 0.5, 1)`,
                  animationDelay: `${particle.delay}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: 0.8
                }}
              />
            ))}
          </Box>
        )}

        {/* Fireworks particles */}
        {config.animation === 'fireworks' && (
          <Box 
            sx={{ 
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            {particles.map(particle => (
              <Box
                key={particle.id}
                sx={{
                  position: 'absolute',
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  borderRadius: '50%',
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  opacity: 0.8,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                  animation: `${fireworksAnimation} ${particle.duration}s forwards ease-out`,
                  animationDelay: `${particle.delay}s`,
                  '--x-end': `${particle.xEnd ? particle.xEnd - particle.x : 0}%`,
                  '--y-end': `${particle.yEnd ? particle.yEnd - particle.y : 0}%`
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Backdrop>
  );
};

export default CelebrationAnimation;