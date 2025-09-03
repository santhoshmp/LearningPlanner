/**
 * Responsive child dashboard optimized for tablets and mobile devices
 * Integrates with existing child dashboard while adding mobile optimizations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  School,
  EmojiEvents,
  TrendingUp,
  Favorite,
  Settings,
  Help
} from '@mui/icons-material';
import { useMobileOptimizations, usePerformanceMonitoring } from '../../hooks/useMobileOptimizations';
import TabletOptimizedLayout from './TabletOptimizedLayout';
import TouchFriendlyButton from './TouchFriendlyButton';
import SwipeableActivityNavigation from './SwipeableActivityNavigation';
import { OptimizedAnimation, CelebrationAnimation, StaggeredAnimation } from './BatteryOptimizedAnimations';

interface ChildProfile {
  id: string;
  name: string;
  avatar?: string;
  grade: string;
  currentStreak: number;
  totalBadges: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  progress: number;
  totalActivities: number;
  completedActivities: number;
  nextActivity?: {
    id: string;
    title: string;
    type: 'reading' | 'math' | 'science' | 'art' | 'game';
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  isNew: boolean;
}

interface ResponsiveChildDashboardProps {
  profile: ChildProfile;
  studyPlans: StudyPlan[];
  recentAchievements: Achievement[];
  onActivityStart: (activityId: string) => void;
  onStudyPlanSelect: (planId: string) => void;
  onSettingsOpen: () => void;
  onHelpRequest: () => void;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const { isTablet } = useMobileOptimizations();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        border: `2px solid ${color}30`,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          p: isTablet ? 3 : 2
        }}
      >
        <Box
          sx={{
            color,
            fontSize: isTablet ? '3rem' : '2.5rem',
            mb: 1
          }}
        >
          {icon}
        </Box>
        
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 'bold',
            color,
            fontSize: isTablet ? '2rem' : '1.5rem',
            mb: 0.5
          }}
        >
          {value}
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: isTablet ? '1rem' : '0.875rem',
            fontWeight: 500
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const StudyPlanCard: React.FC<{
  plan: StudyPlan;
  onSelect: () => void;
  onActivityStart: () => void;
}> = ({ plan, onSelect, onActivityStart }) => {
  const { isTablet } = useMobileOptimizations();
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={onSelect}
    >
      <CardContent sx={{ p: isTablet ? 3 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 'bold',
              fontSize: isTablet ? '1.25rem' : '1rem',
              color: 'primary.main'
            }}
          >
            {plan.title}
          </Typography>
          
          <Chip
            label={plan.subject}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {plan.completedActivities}/{plan.totalActivities}
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={plan.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }}
          />
        </Box>
        
        {plan.nextActivity && (
          <TouchFriendlyButton
            variant="contained"
            size={isTablet ? 'medium' : 'small'}
            onClick={(e) => {
              e.stopPropagation();
              onActivityStart();
            }}
            sx={{ width: '100%' }}
          >
            Continue: {plan.nextActivity.title}
          </TouchFriendlyButton>
        )}
      </CardContent>
    </Card>
  );
};

const AchievementBadge: React.FC<{
  achievement: Achievement;
  showCelebration: boolean;
}> = ({ achievement, showCelebration }) => {
  const { isTablet } = useMobileOptimizations();
  
  return (
    <CelebrationAnimation show={showCelebration}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: isTablet ? 2 : 1.5,
          borderRadius: 2,
          backgroundColor: achievement.isNew ? 'primary.light' : 'background.paper',
          border: achievement.isNew ? '2px solid' : '1px solid',
          borderColor: achievement.isNew ? 'primary.main' : 'divider',
          minWidth: isTablet ? 120 : 100
        }}
      >
        <Typography
          sx={{
            fontSize: isTablet ? '2.5rem' : '2rem',
            mb: 1
          }}
        >
          {achievement.icon}
        </Typography>
        
        <Typography
          variant="caption"
          align="center"
          sx={{
            fontWeight: achievement.isNew ? 'bold' : 'normal',
            color: achievement.isNew ? 'primary.main' : 'text.secondary',
            fontSize: isTablet ? '0.875rem' : '0.75rem'
          }}
        >
          {achievement.title}
        </Typography>
        
        {achievement.isNew && (
          <Chip
            label="NEW!"
            size="small"
            color="primary"
            sx={{ mt: 0.5, fontSize: '0.7rem' }}
          />
        )}
      </Box>
    </CelebrationAnimation>
  );
};

export const ResponsiveChildDashboard: React.FC<ResponsiveChildDashboardProps> = ({
  profile,
  studyPlans,
  recentAchievements,
  onActivityStart,
  onStudyPlanSelect,
  onSettingsOpen,
  onHelpRequest
}) => {
  const { isTablet, orientation, screenSize } = useMobileOptimizations();
  const { performanceMetrics } = usePerformanceMonitoring();
  const [showNewAchievements, setShowNewAchievements] = useState(false);
  
  const theme = useTheme();
  const newAchievements = recentAchievements.filter(a => a.isNew);
  
  // Show celebration for new achievements
  useEffect(() => {
    if (newAchievements.length > 0) {
      setShowNewAchievements(true);
      const timer = setTimeout(() => setShowNewAchievements(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [newAchievements.length]);

  // Convert study plans to activities for swipeable navigation
  const activities = studyPlans
    .filter(plan => plan.nextActivity)
    .map(plan => ({
      id: plan.nextActivity!.id,
      title: plan.nextActivity!.title,
      description: `Continue with ${plan.title}`,
      progress: plan.progress,
      completed: plan.progress === 100,
      type: plan.nextActivity!.type
    }));

  const headerContent = (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          src={profile.avatar}
          sx={{
            width: isTablet ? 64 : 48,
            height: isTablet ? 64 : 48,
            fontSize: isTablet ? '1.5rem' : '1.2rem'
          }}
        >
          {profile.name.charAt(0)}
        </Avatar>
        
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              fontSize: isTablet ? '2rem' : '1.5rem'
            }}
          >
            Welcome back, {profile.name}!
          </Typography>
          
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ fontSize: isTablet ? '1.1rem' : '1rem' }}
          >
            Grade {profile.grade} • Ready to learn?
          </Typography>
        </Box>
      </Box>
      
      <Box display="flex" gap={1}>
        <IconButton
          onClick={onHelpRequest}
          sx={{
            minWidth: isTablet ? 56 : 48,
            minHeight: isTablet ? 56 : 48
          }}
        >
          <Help fontSize={isTablet ? 'large' : 'medium'} />
        </IconButton>
        
        <IconButton
          onClick={onSettingsOpen}
          sx={{
            minWidth: isTablet ? 56 : 48,
            minHeight: isTablet ? 56 : 48
          }}
        >
          <Settings fontSize={isTablet ? 'large' : 'medium'} />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <TabletOptimizedLayout
      header={headerContent}
      showPerformanceIndicator={isTablet}
      educationalMode={true}
    >
      <Box sx={{ width: '100%' }}>
        {/* Stats Overview */}
        <OptimizedAnimation type="fade" in={true}>
          <Box mb={4}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                mb: 3,
                fontSize: isTablet ? '1.5rem' : '1.25rem'
              }}
            >
              Your Progress Today
            </Typography>
            
            <Grid container spacing={isTablet ? 3 : 2}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Learning Streak"
                  value={`${profile.currentStreak} days`}
                  icon="🔥"
                  color={theme.palette.error.main}
                  subtitle="Keep it up!"
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Badges Earned"
                  value={profile.totalBadges}
                  icon={<EmojiEvents />}
                  color={theme.palette.warning.main}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Weekly Goal"
                  value={`${Math.round(profile.weeklyProgress)}%`}
                  icon={<TrendingUp />}
                  color={theme.palette.success.main}
                  subtitle={`${profile.weeklyGoal} activities`}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Study Plans"
                  value={studyPlans.length}
                  icon={<School />}
                  color={theme.palette.primary.main}
                  subtitle="Active plans"
                />
              </Grid>
            </Grid>
          </Box>
        </OptimizedAnimation>

        {/* Quick Activity Access */}
        {activities.length > 0 && (
          <OptimizedAnimation type="slide" direction="up" delay={200}>
            <Box mb={4}>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: isTablet ? '1.5rem' : '1.25rem'
                }}
              >
                Continue Learning
              </Typography>
              
              <Box
                sx={{
                  height: isTablet ? 400 : 300,
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <SwipeableActivityNavigation
                  activities={activities}
                  currentIndex={0}
                  onActivityChange={() => {}}
                  onActivityStart={(activity) => onActivityStart(activity.id)}
                  showSwipeHints={isTablet}
                />
              </Box>
            </Box>
          </OptimizedAnimation>
        )}

        {/* Study Plans Grid */}
        <OptimizedAnimation type="slide" direction="up" delay={400}>
          <Box mb={4}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                mb: 3,
                fontSize: isTablet ? '1.5rem' : '1.25rem'
              }}
            >
              Your Study Plans
            </Typography>
            
            <Grid container spacing={isTablet ? 3 : 2}>
              <StaggeredAnimation staggerDelay={100}>
                {studyPlans.map((plan) => (
                  <Grid item xs={12} sm={6} md={4} key={plan.id}>
                    <StudyPlanCard
                      plan={plan}
                      onSelect={() => onStudyPlanSelect(plan.id)}
                      onActivityStart={() => plan.nextActivity && onActivityStart(plan.nextActivity.id)}
                    />
                  </Grid>
                ))}
              </StaggeredAnimation>
            </Grid>
          </Box>
        </OptimizedAnimation>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <OptimizedAnimation type="slide" direction="up" delay={600}>
            <Box>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: isTablet ? '1.5rem' : '1.25rem'
                }}
              >
                Recent Achievements
              </Typography>
              
              <Box
                sx={{
                  display: 'flex',
                  gap: isTablet ? 2 : 1.5,
                  overflowX: 'auto',
                  pb: 2,
                  '&::-webkit-scrollbar': {
                    height: 8
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: 4
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.grey[400],
                    borderRadius: 4
                  }
                }}
              >
                {recentAchievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    showCelebration={showNewAchievements && achievement.isNew}
                  />
                ))}
              </Box>
            </Box>
          </OptimizedAnimation>
        )}
      </Box>
    </TabletOptimizedLayout>
  );
};

export default ResponsiveChildDashboard;