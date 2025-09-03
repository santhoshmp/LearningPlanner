import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import { Close, Star, EmojiEvents, Celebration } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

interface CompletionCelebrationProps {
  open: boolean;
  onClose: () => void;
  activityTitle: string;
  score?: number;
  badgeEarned?: {
    name: string;
    icon: string;
    description: string;
  };
  celebrationType?: 'activity' | 'badge' | 'streak' | 'milestone';
  streakCount?: number;
  encouragementMessage?: string;
}

// Keyframe animations
const confettiAnimation = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const bounceAnimation = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
`;

const sparkleAnimation = keyframes`
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  open,
  onClose,
  activityTitle,
  score,
  badgeEarned,
  celebrationType = 'activity',
  streakCount,
  encouragementMessage
}) => {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      setAnimationPhase(1);
      
      // Sequence animations
      const timer1 = setTimeout(() => setAnimationPhase(2), 500);
      const timer2 = setTimeout(() => setAnimationPhase(3), 1000);
      const timer3 = setTimeout(() => setShowConfetti(false), 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [open]);

  const getMainIcon = () => {
    switch (celebrationType) {
      case 'badge':
        return <EmojiEvents sx={{ fontSize: 80, color: 'gold' }} />;
      case 'streak':
        return <Celebration sx={{ fontSize: 80, color: theme.palette.warning.main }} />;
      case 'milestone':
        return <Star sx={{ fontSize: 80, color: theme.palette.secondary.main }} />;
      default:
        return <Star sx={{ fontSize: 80, color: theme.palette.primary.main }} />;
    }
  };

  const getMainMessage = () => {
    switch (celebrationType) {
      case 'badge':
        return 'New Badge Earned!';
      case 'streak':
        return `${streakCount} Day Streak!`;
      case 'milestone':
        return 'Milestone Reached!';
      default:
        return 'Activity Complete!';
    }
  };

  const getEncouragementMessage = () => {
    if (encouragementMessage) return encouragementMessage;
    
    const messages = [
      "You're doing amazing! 🌟",
      "Keep up the great work! 🚀",
      "You're a learning superstar! ⭐",
      "Fantastic job! 🎉",
      "You're getting smarter every day! 🧠",
      "Way to go, champion! 🏆"
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const ConfettiPiece = ({ delay, color }: { delay: number; color: string }) => (
    <Box
      sx={{
        position: 'absolute',
        width: 10,
        height: 10,
        backgroundColor: color,
        animation: `${confettiAnimation} 3s linear ${delay}s infinite`,
        left: `${Math.random() * 100}%`,
        top: '-10px'
      }}
    />
  );

  const Sparkle = ({ top, left, delay }: { top: string; left: string; delay: number }) => (
    <Star
      sx={{
        position: 'absolute',
        top,
        left,
        color: 'gold',
        fontSize: 16,
        animation: `${sparkleAnimation} 2s ease-in-out ${delay}s infinite`
      }}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
          position: 'relative'
        }
      }}
    >
      {/* Confetti */}
      {showConfetti && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiPiece
              key={i}
              delay={i * 0.1}
              color={[
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.warning.main,
                theme.palette.success.main,
                'gold',
                'pink'
              ][i % 6]}
            />
          ))}
        </Box>
      )}

      {/* Sparkles */}
      <Sparkle top="10%" left="10%" delay={0} />
      <Sparkle top="20%" left="80%" delay={0.5} />
      <Sparkle top="70%" left="15%" delay={1} />
      <Sparkle top="80%" left="85%" delay={1.5} />

      <DialogContent sx={{ textAlign: 'center', py: 4, position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1001
          }}
        >
          <Close />
        </IconButton>

        <Zoom in={animationPhase >= 1} timeout={500}>
          <Box
            sx={{
              animation: `${bounceAnimation} 2s ease-in-out infinite`,
              mb: 3
            }}
          >
            {getMainIcon()}
          </Box>
        </Zoom>

        <Fade in={animationPhase >= 2} timeout={500}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 2,
                animation: `${pulseAnimation} 2s ease-in-out infinite`
              }}
            >
              {getMainMessage()}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {activityTitle}
            </Typography>

            {score !== undefined && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: theme.palette.success.light,
                  px: 3,
                  py: 1,
                  borderRadius: 3,
                  mb: 2
                }}
              >
                <Star sx={{ color: 'gold' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                  Score: {score}%
                </Typography>
              </Box>
            )}

            {badgeEarned && (
              <Box
                sx={{
                  backgroundColor: theme.palette.warning.light,
                  p: 2,
                  borderRadius: 2,
                  mb: 2,
                  border: `2px solid gold`
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  🏅 {badgeEarned.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {badgeEarned.description}
                </Typography>
              </Box>
            )}

            <Typography
              variant="h6"
              sx={{
                color: theme.palette.secondary.main,
                fontWeight: 600,
                mb: 3
              }}
            >
              {getEncouragementMessage()}
            </Typography>
          </Box>
        </Fade>

        <Fade in={animationPhase >= 3} timeout={500}>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={onClose}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                }
              }}
            >
              Continue Learning! 🚀
            </Button>
          </Box>
        </Fade>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionCelebration;