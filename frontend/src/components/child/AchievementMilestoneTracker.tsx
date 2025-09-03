import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Badge,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Zoom,
  Fade,
  useTheme,
  alpha,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Flag as MilestoneIcon,
  AutoAwesome as SparkleIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Celebration as CelebrationIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { Confetti } from '../studyPlan/CelebrationAnimation';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  estimatedCompletion: Date;
  category: string;
  reward?: Achievement;
  isCompleted: boolean;
}

interface AchievementMilestoneTrackerProps {
  childId: string;
  achievements: Achievement[];
  milestones: Milestone[];
  showCelebration?: boolean;
  onCelebrationComplete?: () => void;
  compact?: boolean;
}

const AchievementMilestoneTracker: React.FC<AchievementMilestoneTrackerProps> = ({
  childId,
  achievements,
  milestones,
  showCelebration = false,
  onCelebrationComplete,
  compact = false
}) => {
  const theme = useTheme();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(showCelebration);

  useEffect(() => {
    if (showCelebration) {
      setCelebrationVisible(true);
      const timer = setTimeout(() => {
        setCelebrationVisible(false);
        onCelebrationComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration, onCelebrationComplete]);

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '#FFD700'; // Gold
      case 'epic': return '#9C27B0'; // Purple
      case 'rare': return '#2196F3'; // Blue
      case 'common': return '#4CAF50'; // Green
      default: return theme.palette.grey[500];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic': return <SchoolIcon />;
      case 'streak': return <TrendingUpIcon />;
      case 'completion': return <CheckCircleIcon />;
      case 'time': return <ScheduleIcon />;
      default: return <TrophyIcon />;
    }
  };

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleCloseDialog = () => {
    setSelectedAchievement(null);
  };

  const recentAchievements = achievements
    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
    .slice(0, compact ? 3 : 6);

  const activeMilestones = milestones
    .filter(m => !m.isCompleted)
    .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))
    .slice(0, compact ? 2 : 4);

  const completedMilestones = milestones.filter(m => m.isCompleted);

  if (compact) {
    return (
      <Box>
        {/* Celebration Animation */}
        {celebrationVisible && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              pointerEvents: 'none'
            }}
          >
            <Confetti />
          </Box>
        )}

        {/* Recent Achievements */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Recent Achievements
              </Typography>
              <Chip 
                label={achievements.length}
                color="primary"
                size="small"
              />
            </Box>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              {recentAchievements.map((achievement) => (
                <Tooltip 
                  key={achievement.id}
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption">
                        {achievement.description}
                      </Typography>
                      <br />
                      <Typography variant="caption">
                        Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                >
                  <Badge
                    badgeContent={<SparkleIcon sx={{ fontSize: 12 }} />}
                    color="primary"
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: getRarityColor(achievement.rarity),
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                      onClick={() => handleAchievementClick(achievement)}
                    >
                      {getCategoryIcon(achievement.category)}
                    </Avatar>
                  </Badge>
                </Tooltip>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Active Milestones */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Next Milestones
            </Typography>
            
            {activeMilestones.map((milestone) => (
              <Box key={milestone.id} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MilestoneIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight="medium">
                    {milestone.title}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(milestone.progress / milestone.target) * 100}
                    sx={{ 
                      flexGrow: 1, 
                      height: 6, 
                      borderRadius: 3 
                    }}
                  />
                  <Typography variant="caption">
                    {milestone.progress}/{milestone.target}
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Achievement Detail Dialog */}
        <Dialog 
          open={!!selectedAchievement} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          {selectedAchievement && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar 
                    sx={{ 
                      width: 50, 
                      height: 50, 
                      bgcolor: getRarityColor(selectedAchievement.rarity)
                    }}
                  >
                    {getCategoryIcon(selectedAchievement.category)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedAchievement.title}
                    </Typography>
                    <Chip 
                      label={selectedAchievement.rarity}
                      size="small"
                      sx={{ 
                        bgcolor: getRarityColor(selectedAchievement.rarity),
                        color: 'white'
                      }}
                    />
                  </Box>
                </Box>
                <IconButton
                  onClick={handleCloseDialog}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom>
                  {selectedAchievement.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Category: {selectedAchievement.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Points: {selectedAchievement.points}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Earned on {new Date(selectedAchievement.earnedAt).toLocaleDateString()}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      {/* Celebration Animation */}
      {celebrationVisible && (
        <Fade in={celebrationVisible}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Confetti />
            <Card 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white'
              }}
            >
              <CelebrationIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold">
                Achievement Unlocked!
              </Typography>
            </Card>
          </Box>
        </Fade>
      )}

      <Grid container spacing={3}>
        {/* Achievements Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6">
                  Achievements
                </Typography>
                <Chip 
                  label={`${achievements.length} earned`}
                  color="primary"
                />
              </Box>
              
              <Grid container spacing={2}>
                {recentAchievements.map((achievement) => (
                  <Grid item xs={6} sm={4} key={achievement.id}>
                    <Zoom in timeout={500}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          background: `linear-gradient(135deg, ${alpha(getRarityColor(achievement.rarity), 0.1)}, ${alpha(getRarityColor(achievement.rarity), 0.05)})`,
                          border: `2px solid ${alpha(getRarityColor(achievement.rarity), 0.3)}`,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8]
                          }
                        }}
                        onClick={() => handleAchievementClick(achievement)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                          <Badge
                            badgeContent={<SparkleIcon sx={{ fontSize: 14 }} />}
                            color="primary"
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                width: 50, 
                                height: 50, 
                                bgcolor: getRarityColor(achievement.rarity),
                                mx: 'auto',
                                mb: 1
                              }}
                            >
                              {getCategoryIcon(achievement.category)}
                            </Avatar>
                          </Badge>
                          
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {achievement.title}
                          </Typography>
                          
                          <Chip 
                            label={achievement.rarity}
                            size="small"
                            sx={{ 
                              mt: 1,
                              bgcolor: getRarityColor(achievement.rarity),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>

              {achievements.length > 6 && (
                <Box textAlign="center" sx={{ mt: 2 }}>
                  <Button variant="outlined" size="small">
                    View All Achievements
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Milestones Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6">
                  Milestones
                </Typography>
                <Chip 
                  label={`${completedMilestones.length} completed`}
                  color="success"
                />
              </Box>
              
              {/* Active Milestones */}
              <Typography variant="subtitle2" color="primary" gutterBottom>
                In Progress
              </Typography>
              
              {activeMilestones.map((milestone) => (
                <Card key={milestone.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <MilestoneIcon color="primary" />
                      <Box flexGrow={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {milestone.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {milestone.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          Progress: {milestone.progress} / {milestone.target}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round((milestone.progress / milestone.target) * 100)}%
                        </Typography>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={(milestone.progress / milestone.target) * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.primary.main, 0.2)
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        label={milestone.category}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Est. {new Date(milestone.estimatedCompletion).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* Completed Milestones */}
              {completedMilestones.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    onClick={() => setExpandedMilestones(!expandedMilestones)}
                    startIcon={expandedMilestones ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    size="small"
                  >
                    Completed Milestones ({completedMilestones.length})
                  </Button>
                  
                  <Collapse in={expandedMilestones}>
                    <List dense>
                      {completedMilestones.slice(0, 5).map((milestone) => (
                        <ListItem key={milestone.id}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={milestone.title}
                            secondary={milestone.category}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Achievement Detail Dialog */}
      <Dialog 
        open={!!selectedAchievement} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: getRarityColor(selectedAchievement.rarity)
                  }}
                >
                  {getCategoryIcon(selectedAchievement.category)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedAchievement.title}
                  </Typography>
                  <Box display="flex" gap={1} sx={{ mt: 1 }}>
                    <Chip 
                      label={selectedAchievement.rarity}
                      size="small"
                      sx={{ 
                        bgcolor: getRarityColor(selectedAchievement.rarity),
                        color: 'white'
                      }}
                    />
                    <Chip 
                      label={selectedAchievement.category}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
              <IconButton
                onClick={handleCloseDialog}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                {selectedAchievement.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Points Earned
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedAchievement.points}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Earned Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedAchievement.earnedAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} variant="contained">
                Awesome!
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AchievementMilestoneTracker;