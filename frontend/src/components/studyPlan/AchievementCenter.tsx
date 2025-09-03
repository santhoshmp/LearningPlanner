import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Achievement } from '../../types/activity';
import { GamificationState, LevelInfo } from '../../types/gamification';
import { gamificationService } from '../../services/gamificationService';
import { useTheme } from '../../theme/ThemeContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  LinearProgress,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grow,
  Zoom,
  Fade,
  Avatar,
  Divider
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

interface AchievementCenterProps {
  childId?: string; // Optional: if not provided, will use the current user's ID
}

const AchievementCenter: React.FC<AchievementCenterProps> = ({ childId }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [gamificationState, setGamificationState] = useState<GamificationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'badges' | 'streaks'>('achievements');
  const [error, setError] = useState('');

  const userId = childId || user?.id;

  useEffect(() => {
    const fetchGamificationState = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const state = await gamificationService.getGamificationState(userId);
        setGamificationState(state);
      } catch (err) {
        console.error('Failed to load gamification state:', err);
        setError('Failed to load achievements. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGamificationState();
  }, [userId]);

  const { level, title, progress } = gamificationState 
    ? gamificationService.calculateLevel(gamificationState.points)
    : { level: 1, title: 'Beginner', progress: 0 };

  const filterAchievements = (type: 'badge' | 'milestone' | 'streak') => {
    if (!gamificationState?.achievements) return [];
    return gamificationState.achievements.filter(achievement => achievement.type === type);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'achievements' | 'badges' | 'streaks') => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card elevation={3} sx={{ 
      borderRadius: 4, 
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        boxShadow: 8
      }
    }}>
      {/* Level and Points Section */}
      <Box 
        sx={{ 
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' 
            : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          color: 'white',
          p: 3
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEventsIcon sx={{ mr: 1 }} /> Level {level}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {title}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="h5" fontWeight="bold">
              {gamificationState?.points || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Total Points
            </Typography>
          </Box>
        </Box>
        
        {/* Level Progress Bar */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.secondary.main,
                borderRadius: 5
              }
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', display: 'block', textAlign: 'right' }}>
          {progress}% to next level
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth" 
        textColor="primary"
        indicatorColor="primary"
        aria-label="achievement tabs"
      >
        <Tab 
          label="All Achievements" 
          value="achievements" 
          sx={{ 
            fontWeight: 'medium',
            textTransform: 'none',
            fontSize: '0.95rem'
          }} 
        />
        <Tab 
          label="Badges" 
          value="badges" 
          sx={{ 
            fontWeight: 'medium',
            textTransform: 'none',
            fontSize: '0.95rem'
          }} 
        />
        <Tab 
          label="Streaks" 
          value="streaks" 
          sx={{ 
            fontWeight: 'medium',
            textTransform: 'none',
            fontSize: '0.95rem'
          }} 
        />
      </Tabs>

      {/* Achievement Content */}
      <CardContent sx={{ p: 3 }}>
        {activeTab === 'achievements' && (
          <Fade in={activeTab === 'achievements'} timeout={500}>
            <Box>
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color="text.primary">
                  All Achievements
                </Typography>
                <Chip 
                  label={`${gamificationState?.achievements?.length || 0} earned`} 
                  color="primary" 
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Grid container spacing={2}>
                {gamificationState?.achievements?.map((achievement, index) => (
                  <Grid item xs={6} sm={4} md={3} key={achievement.id}>
                    <Grow in={true} timeout={300 + (index * 100)}>
                      <Box>
                        <AchievementCard achievement={achievement} />
                      </Box>
                    </Grow>
                  </Grid>
                ))}
                {(!gamificationState?.achievements || gamificationState.achievements.length === 0) && (
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
                        borderRadius: 3
                      }}
                    >
                      <StarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography color="text.secondary">
                        No achievements yet. Keep learning to earn some!
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Fade>
        )}

        {activeTab === 'badges' && (
          <Fade in={activeTab === 'badges'} timeout={500}>
            <Box>
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color="text.primary">
                  Badges
                </Typography>
                <Chip 
                  label={`${filterAchievements('badge').length} earned`} 
                  color="primary" 
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Grid container spacing={2}>
                {filterAchievements('badge').map((achievement, index) => (
                  <Grid item xs={6} sm={4} md={3} key={achievement.id}>
                    <Zoom in={true} timeout={300 + (index * 100)}>
                      <Box>
                        <AchievementCard achievement={achievement} />
                      </Box>
                    </Zoom>
                  </Grid>
                ))}
                {filterAchievements('badge').length === 0 && (
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
                        borderRadius: 3
                      }}
                    >
                      <MilitaryTechIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography color="text.secondary">
                        No badges yet. Complete activities to earn badges!
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Fade>
        )}

        {activeTab === 'streaks' && (
          <Fade in={activeTab === 'streaks'} timeout={500}>
            <Box>
              <Box mb={3}>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Learning Streaks
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'warning.main',
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    <LocalFireDepartmentIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {gamificationState?.streaks.currentStreak || 0} day streak
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Longest streak: {gamificationState?.streaks.longestStreak || 0} days
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.2)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <TipsAndUpdatesIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2" color="text.secondary">
                  <Box component="span" fontWeight="bold">Tip:</Box> Log in and complete at least one activity every day to build your streak!
                </Typography>
              </Paper>
              
              <Grid container spacing={2}>
                {filterAchievements('streak').map((achievement, index) => (
                  <Grid item xs={6} sm={4} md={3} key={achievement.id}>
                    <Zoom in={true} timeout={300 + (index * 100)}>
                      <Box>
                        <AchievementCard achievement={achievement} />
                      </Box>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const { theme } = useTheme();
  
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'badge':
        return <MilitaryTechIcon fontSize="large" />;
      case 'milestone':
        return <EmojiEventsIcon fontSize="large" />;
      case 'streak':
        return <LocalFireDepartmentIcon fontSize="large" />;
      default:
        return <StarIcon fontSize="large" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'badge':
        return theme.palette.primary.main;
      case 'milestone':
        return theme.palette.secondary.main;
      case 'streak':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        textAlign: 'center',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        backgroundColor: theme.palette.mode === 'light' 
          ? `${getAchievementColor(achievement.type)}15` 
          : `${getAchievementColor(achievement.type)}25`,
        border: `2px solid ${getAchievementColor(achievement.type)}40`
      }}
    >
      <Avatar 
        sx={{ 
          width: 56, 
          height: 56, 
          mb: 1.5,
          bgcolor: getAchievementColor(achievement.type),
          color: '#fff'
        }}
      >
        {achievement.iconUrl ? (
          <img src={achievement.iconUrl} alt={achievement.title} width="32" height="32" />
        ) : (
          getAchievementIcon(achievement.type)
        )}
      </Avatar>
      
      <Typography 
        variant="subtitle1" 
        fontWeight="medium" 
        color="text.primary"
        sx={{ mb: 0.5 }}
      >
        {achievement.title}
      </Typography>
      
      <Typography 
        variant="caption" 
        color="text.secondary"
      >
        {achievement.description}
      </Typography>
    </Card>
  );
};

export default AchievementCenter;