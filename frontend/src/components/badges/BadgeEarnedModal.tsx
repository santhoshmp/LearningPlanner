import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Paper
} from '@mui/material';
import { Close, Share, EmojiEvents } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import BadgeDisplay from './BadgeDisplay';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
  category: string;
}

interface BadgeEarnedModalProps {
  open: boolean;
  badge: Badge | null;
  onClose: () => void;
  onShare?: (badge: Badge) => void;
}

// Confetti component
const Confetti: React.FC = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)]
  }));

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}%`,
            y: -20,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: '120vh',
            rotate: 360,
            opacity: 0
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            backgroundColor: piece.color,
            borderRadius: '2px'
          }}
        />
      ))}
    </Box>
  );
};

// Fireworks component
const Fireworks: React.FC = () => {
  const [explosions, setExplosions] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setExplosions(prev => [
        ...prev,
        {
          id: Date.now(),
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60
        }
      ]);
    }, 800);

    const cleanup = setTimeout(() => {
      clearInterval(interval);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        {explosions.map((explosion) => (
          <motion.div
            key={explosion.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              position: 'absolute',
              left: `${explosion.x}%`,
              top: `${explosion.y}%`,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,165,0,0.4) 50%, transparent 100%)',
              transform: 'translate(-50%, -50%)'
            }}
            onAnimationComplete={() => {
              setExplosions(prev => prev.filter(e => e.id !== explosion.id));
            }}
          />
        ))}
      </AnimatePresence>
    </Box>
  );
};

const BadgeEarnedModal: React.FC<BadgeEarnedModalProps> = ({
  open,
  badge,
  onClose,
  onShare
}) => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (open && badge) {
      setShowCelebration(true);
      // Play celebration sound if available (skip in test environment)
      if (typeof window !== 'undefined' && !window.location.href.includes('test')) {
        try {
          const audio = new Audio('/sounds/badge-earned.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignore audio play errors (user interaction required)
          });
        } catch (error) {
          // Ignore audio errors
        }
      }
    }
  }, [open, badge]);

  if (!badge) return null;

  const getCelebrationComponent = () => {
    switch (badge.rarity) {
      case 'legendary':
        return <Fireworks />;
      case 'epic':
      case 'rare':
        return <Confetti />;
      default:
        return null;
    }
  };

  const getCelebrationMessage = () => {
    switch (badge.rarity) {
      case 'legendary':
        return "🎆 LEGENDARY ACHIEVEMENT! 🎆";
      case 'epic':
        return "✨ EPIC BADGE EARNED! ✨";
      case 'rare':
        return "🌟 RARE BADGE UNLOCKED! 🌟";
      default:
        return "🎉 BADGE EARNED! 🎉";
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const badgeVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.3,
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.6,
        duration: 0.5
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative'
        }
      }}
    >
      {showCelebration && getCelebrationComponent()}
      
      <DialogContent sx={{ position: 'relative', textAlign: 'center', py: 4 }}>
        <IconButton
          onClick={onClose}
          aria-label="Close badge modal"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          <Close />
        </IconButton>

        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div variants={textVariants}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              {getCelebrationMessage()}
            </Typography>
          </motion.div>

          <motion.div variants={badgeVariants}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <BadgeDisplay
                badge={badge}
                size="large"
                showAnimation={true}
              />
            </Box>
          </motion.div>

          <motion.div variants={textVariants}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              {badge.name}
            </Typography>
            
            <Typography
              variant="body1"
              sx={{ mb: 3, color: 'text.secondary', maxWidth: 400, mx: 'auto' }}
            >
              {badge.description}
            </Typography>

            <Paper
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'inline-block',
                borderRadius: 2
              }}
            >
              <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
              <Typography variant="body2" component="span">
                Category: {badge.category} • Rarity: {badge.rarity.toUpperCase()}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {onShare && (
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={() => onShare(badge)}
                  sx={{ borderRadius: 2 }}
                >
                  Share Achievement
                </Button>
              )}
              
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                }}
              >
                Awesome!
              </Button>
            </Box>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeEarnedModal;