import React from 'react';
import { motion } from 'framer-motion';
import { Badge, Chip, Box, Typography, Tooltip } from '@mui/material';
import { Star, EmojiEvents, LocalFireDepartment, School } from '@mui/icons-material';

interface BadgeDisplayProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earnedAt?: Date;
    category: string;
  };
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  onClick?: () => void;
}

const rarityColors = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800'
};

const rarityGradients = {
  common: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
  rare: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  epic: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
  legendary: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
};

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'star': return Star;
    case 'trophy': return EmojiEvents;
    case 'fire': return LocalFireDepartment;
    case 'school': return School;
    default: return EmojiEvents;
  }
};

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'medium',
  showAnimation = false,
  onClick
}) => {
  const IconComponent = getIconComponent(badge.icon);
  
  const sizeMap = {
    small: { container: 60, icon: 24, fontSize: '0.75rem' },
    medium: { container: 80, icon: 32, fontSize: '0.875rem' },
    large: { container: 120, icon: 48, fontSize: '1rem' }
  };
  
  const dimensions = sizeMap[size];

  const badgeVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        `0 0 20px ${rarityColors[badge.rarity]}40`,
        `0 0 30px ${rarityColors[badge.rarity]}60`,
        `0 0 20px ${rarityColors[badge.rarity]}40`
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <Tooltip 
      title={
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {badge.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {badge.description}
          </Typography>
          {badge.earnedAt && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Earned: {badge.earnedAt.toLocaleDateString()}
            </Typography>
          )}
        </Box>
      }
      arrow
      placement="top"
    >
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
      >
        <motion.div
          variants={badgeVariants}
          initial={showAnimation ? "initial" : false}
          animate={showAnimation ? "animate" : false}
          whileHover="hover"
          whileTap="tap"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: '50%',
            background: rarityGradients[badge.rarity],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: `3px solid ${rarityColors[badge.rarity]}`,
          }}
        >
          {badge.rarity === 'legendary' && (
            <motion.div
              variants={glowVariants}
              animate="animate"
              style={{
                position: 'absolute',
                inset: -5,
                borderRadius: '50%',
                background: rarityGradients[badge.rarity],
                zIndex: -1
              }}
            />
          )}
          
          <IconComponent
            sx={{
              fontSize: dimensions.icon,
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          />
          
          {/* Rarity indicator */}
          <Chip
            label={badge.rarity.toUpperCase()}
            size="small"
            sx={{
              position: 'absolute',
              bottom: -8,
              fontSize: '0.6rem',
              height: 16,
              backgroundColor: rarityColors[badge.rarity],
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-label': {
                px: 0.5
              }
            }}
          />
        </motion.div>
        
        {/* Category badge */}
        <Box
          sx={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
            fontWeight: 'bold',
            border: '2px solid white'
          }}
        >
          {badge.category.charAt(0).toUpperCase()}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default BadgeDisplay;