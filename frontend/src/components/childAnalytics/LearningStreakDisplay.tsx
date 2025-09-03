import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { LocalFireDepartment, EmojiEvents, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface LearningStreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  streakType: 'daily' | 'weekly' | 'activity_completion';
  lastActivityDate?: Date;
  isActive: boolean;
}

const LearningStreakDisplay: React.FC<LearningStreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  streakType,
  lastActivityDate,
  isActive
}) => {
  const getStreakIcon = () => {
    if (currentStreak === 0) return <LocalFireDepartment sx={{ color: '#9e9e9e', fontSize: 40 }} />;
    if (currentStreak < 3) return <LocalFireDepartment sx={{ color: '#ff9800', fontSize: 40 }} />;
    if (currentStreak < 7) return <LocalFireDepartment sx={{ color: '#ff5722', fontSize: 40 }} />;
    return <LocalFireDepartment sx={{ color: '#d32f2f', fontSize: 40 }} />;
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your learning streak today! 🚀";
    if (currentStreak === 1) return "Great start! Keep it going! 🌟";
    if (currentStreak < 7) return "You're on fire! 🔥";
    if (currentStreak < 30) return "Amazing streak! You're a learning champion! 🏆";
    return "Incredible! You're a learning legend! 👑";
  };

  const getStreakTypeLabel = () => {
    switch (streakType) {
      case 'daily': return 'Daily Learning';
      case 'weekly': return 'Weekly Goals';
      case 'activity_completion': return 'Activity Streak';
      default: return 'Learning Streak';
    }
  };

  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            {getStreakTypeLabel()}
          </Typography>
          <Chip 
            label={isActive ? 'Active' : 'Inactive'} 
            color={isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <motion.div
            animate={{ 
              scale: currentStreak > 0 ? [1, 1.1, 1] : 1,
              rotate: currentStreak > 0 ? [0, 5, -5, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: currentStreak > 0 ? Infinity : 0,
              repeatDelay: 3
            }}
          >
            {getStreakIcon()}
          </motion.div>
          
          <Box>
            <Typography variant="h3" fontWeight="bold" component="div">
              {currentStreak}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {streakType === 'daily' ? 'days' : streakType === 'weekly' ? 'weeks' : 'activities'}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          {getStreakMessage()}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <EmojiEvents sx={{ color: '#ffd700', fontSize: 20 }} />
            <Typography variant="body2">
              Best: {longestStreak} {streakType === 'daily' ? 'days' : streakType === 'weekly' ? 'weeks' : 'activities'}
            </Typography>
          </Box>
          
          {lastActivityDate && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Last: {lastActivityDate.toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {currentStreak > 0 && (
          <Box mt={2}>
            <Box 
              sx={{ 
                height: 4, 
                backgroundColor: 'rgba(255,255,255,0.3)', 
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentStreak / longestStreak) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #ffd700, #ff6b6b)',
                  borderRadius: 2
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
              Progress to personal best
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningStreakDisplay;