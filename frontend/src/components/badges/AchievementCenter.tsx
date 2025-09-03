import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  Button
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  Star,
  Timeline,
  LocalFireDepartment,
  School
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import BadgeCollection from './BadgeCollection';
import BadgeProgress from './BadgeProgress';
import BadgeEarnedModal from './BadgeEarnedModal';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
  category: string;
}

interface BadgeProgressItem {
  badge: Badge;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  estimatedTimeToCompletion?: string;
  progressType: 'activities' | 'streak' | 'score' | 'time' | 'subjects';
  unit?: string;
}

interface AchievementStats {
  totalBadges: number;
  earnedBadges: number;
  completionPercentage: number;
  currentStreak: number;
  longestStreak: number;
  recentAchievements: Badge[];
  categoryProgress: {
    category: string;
    earned: number;
    total: number;
    percentage: number;
  }[];
}

interface AchievementCenterProps {
  badges: Badge[];
  badgeProgress: BadgeProgressItem[];
  stats: AchievementStats;
  onBadgeClick?: (badge: Badge) => void;
  onShareBadge?: (badge: Badge) => void;
}

const AchievementCenter: React.FC<AchievementCenterProps> = ({
  badges,
  badgeProgress,
  stats,
  onBadgeClick,
  onShareBadge
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
    onBadgeClick?.(badge);
  };

  const handleCloseBadgeModal = () => {
    setShowBadgeModal(false);
    setSelectedBadge(null);
  };

  const rarityStats = useMemo(() => {
    const rarities = ['common', 'rare', 'epic', 'legendary'] as const;
    return rarities.map(rarity => {
      const total = badges.filter(b => b.rarity === rarity).length;
      const earned = badges.filter(b => b.rarity === rarity && b.earnedAt).length;
      return {
        rarity,
        total,
        earned,
        percentage: total > 0 ? (earned / total) * 100 : 0
      };
    });
  }, [badges]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
          🏆 Achievement Center
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Track your learning journey and celebrate your accomplishments!
        </Typography>
      </Paper>

      {/* Stats Overview */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={cardVariants}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
                <CardContent sx={{ color: 'white', textAlign: 'center' }}>
                  <EmojiEvents sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.earnedBadges}
                  </Typography>
                  <Typography variant="body2">
                    Badges Earned
                  </Typography>
                  <Typography variant="caption">
                    of {stats.totalBadges} total
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={cardVariants}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' }}>
                <CardContent sx={{ color: 'white', textAlign: 'center' }}>
                  <Timeline sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {Math.round(stats.completionPercentage)}%
                  </Typography>
                  <Typography variant="body2">
                    Complete
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.completionPercentage}
                    sx={{
                      mt: 1,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={cardVariants}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)' }}>
                <CardContent sx={{ color: 'white', textAlign: 'center' }}>
                  <LocalFireDepartment sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.currentStreak}
                  </Typography>
                  <Typography variant="body2">
                    Current Streak
                  </Typography>
                  <Typography variant="caption">
                    Best: {stats.longestStreak} days
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={cardVariants}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)' }}>
                <CardContent sx={{ color: 'white', textAlign: 'center' }}>
                  <Star sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.recentAchievements.length}
                  </Typography>
                  <Typography variant="body2">
                    Recent Badges
                  </Typography>
                  <Typography variant="caption">
                    This week
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Rarity Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Badge Rarity Progress
        </Typography>
        <Grid container spacing={2}>
          {rarityStats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.rarity}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                  {stat.rarity}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stat.earned} / {stat.total}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stat.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200'
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(stat.percentage)}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Category Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Progress by Category
        </Typography>
        <Grid container spacing={2}>
          {stats.categoryProgress.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.category}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <School sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {category.category}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {category.earned} / {category.total} badges
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={category.percentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.200'
                  }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(category.percentage)}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 'bold',
              fontSize: '1rem'
            }
          }}
        >
          <Tab label="All Badges" />
          <Tab label="Progress Tracker" />
          <Tab label="Recent Achievements" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <BadgeCollection
            badges={badges}
            onBadgeClick={handleBadgeClick}
            showFilters={true}
          />
        )}

        {activeTab === 1 && (
          <BadgeProgress
            progressItems={badgeProgress}
            title="Badges in Progress"
            maxItems={10}
          />
        )}

        {activeTab === 2 && (
          <Box>
            {stats.recentAchievements.length > 0 ? (
              <Grid container spacing={2}>
                {stats.recentAchievements.map((badge) => (
                  <Grid item xs={12} sm={6} md={4} key={badge.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleBadgeClick(badge)}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{ mb: 2 }}>
                          <BadgeDisplay
                            badge={badge}
                            size="medium"
                            showAnimation={false}
                          />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {badge.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {badge.description}
                        </Typography>
                        {badge.earnedAt && (
                          <Chip
                            label={`Earned ${badge.earnedAt.toLocaleDateString()}`}
                            size="small"
                            color="success"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No Recent Achievements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep learning to earn your next badge!
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      {/* Badge Earned Modal */}
      <BadgeEarnedModal
        open={showBadgeModal}
        badge={selectedBadge}
        onClose={handleCloseBadgeModal}
        onShare={onShareBadge}
      />
    </Box>
  );
};

export default AchievementCenter;