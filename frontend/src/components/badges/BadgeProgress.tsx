import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import { TrendingUp, Timer, EmojiEvents } from '@mui/icons-material';
import BadgeDisplay from './BadgeDisplay';

interface BadgeProgressItem {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    category: string;
  };
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  estimatedTimeToCompletion?: string;
  progressType: 'activities' | 'streak' | 'score' | 'time' | 'subjects';
  unit?: string;
}

interface BadgeProgressProps {
  progressItems: BadgeProgressItem[];
  title?: string;
  maxItems?: number;
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({
  progressItems,
  title = "Next Badges",
  maxItems = 5
}) => {
  const sortedItems = progressItems
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, maxItems);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'primary';
  };

  const getProgressIcon = (type: string) => {
    switch (type) {
      case 'activities':
        return <EmojiEvents sx={{ fontSize: 16 }} />;
      case 'streak':
        return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'time':
        return <Timer sx={{ fontSize: 16 }} />;
      default:
        return <EmojiEvents sx={{ fontSize: 16 }} />;
    }
  };

  const formatProgressText = (item: BadgeProgressItem) => {
    const { currentValue, targetValue, unit = '' } = item;
    return `${currentValue}${unit} / ${targetValue}${unit}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  if (sortedItems.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All available badges have been earned! 🎉
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        {title}
      </Typography>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Stack spacing={2}>
          {sortedItems.map((item, index) => (
            <motion.div key={item.badge.id} variants={itemVariants}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  backgroundColor: item.progressPercentage >= 90 ? 'success.light' : 'background.default',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Badge Preview */}
                  <Box sx={{ flexShrink: 0 }}>
                    <BadgeDisplay
                      badge={item.badge}
                      size="small"
                      showAnimation={false}
                    />
                  </Box>

                  {/* Progress Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {item.badge.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={item.badge.rarity}
                        color={getProgressColor(item.progressPercentage)}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.4 }}
                    >
                      {item.badge.description}
                    </Typography>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getProgressIcon(item.progressType)}
                          <Typography variant="caption" color="text.secondary">
                            {formatProgressText(item)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {Math.round(item.progressPercentage)}%
                        </Typography>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={item.progressPercentage}
                        color={getProgressColor(item.progressPercentage)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>

                    {/* Additional Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Category: {item.badge.category}
                      </Typography>
                      
                      {item.estimatedTimeToCompletion && (
                        <Tooltip title="Estimated time to completion">
                          <Chip
                            size="small"
                            icon={<Timer sx={{ fontSize: 14 }} />}
                            label={item.estimatedTimeToCompletion}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Tooltip>
                      )}
                    </Box>

                    {/* Almost Complete Indicator */}
                    {item.progressPercentage >= 90 && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          backgroundColor: 'success.main',
                          color: 'white',
                          borderRadius: 1,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          🎯 Almost there! Keep going!
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Stack>
      </motion.div>

      {/* Show More Indicator */}
      {progressItems.length > maxItems && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            +{progressItems.length - maxItems} more badges available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default BadgeProgress;