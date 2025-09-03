import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
  RadioButtonUnchecked as NotStartedIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { educationalContentService, SkillSummary } from '../../services/educationalContentService';
import SkillProficiencyVisualization from './SkillProficiencyVisualization';
import ProficiencyIndicators from './ProficiencyIndicators';
import AchievementMilestoneTracker from './AchievementMilestoneTracker';
import { ChildProfile } from '../../types/child';

interface ChildSkillLevelsProps {
  childId: string;
  child?: ChildProfile;
  showEnhancedView?: boolean;
}

const ChildSkillLevels: React.FC<ChildSkillLevelsProps> = ({ 
  childId, 
  child, 
  showEnhancedView = false 
}) => {
  const [skillSummary, setSkillSummary] = useState<SkillSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  useEffect(() => {
    fetchSkillSummary();
  }, [childId]);

  const fetchSkillSummary = async () => {
    try {
      setLoading(true);
      const summary = await educationalContentService.getSkillSummary(childId);
      setSkillSummary(summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching skill summary:', err);
      setError('Failed to load skill levels');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'mastery': return '#4caf50';
      case 'advanced': return '#2196f3';
      case 'intermediate': return '#ff9800';
      case 'beginner': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'mastery': return <StarIcon />;
      case 'advanced': return <TrendingUpIcon />;
      case 'intermediate': return <SchoolIcon />;
      case 'beginner': return <TrendingDownIcon />;
      default: return <SchoolIcon />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered': return <CheckCircleIcon color="success" />;
      case 'completed': return <CheckCircleIcon color="primary" />;
      case 'in-progress': return <PlayCircleIcon color="warning" />;
      case 'not-started': return <NotStartedIcon color="disabled" />;
      default: return <NotStartedIcon color="disabled" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!skillSummary) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No skill data available yet. Complete some activities to see progress!
      </Alert>
    );
  }

  // If enhanced view is requested, show the full skill proficiency visualization
  if (showEnhancedView) {
    return <SkillProficiencyVisualization childId={childId} child={child} />;
  }

  return (
    <Box>
      {/* Overall Progress Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Overall Learning Progress
            </Typography>
            <Button
              startIcon={<ViewIcon />}
              variant="outlined"
              size="small"
              onClick={() => setShowDetailedView(true)}
            >
              Detailed View
            </Button>
          </Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box flexGrow={1}>
              <LinearProgress 
                variant="determinate" 
                value={skillSummary.overallProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {Math.round(skillSummary.overallProgress)}%
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Chip
                icon={getLevelIcon(skillSummary.overallLevel)}
                label={`${skillSummary.overallLevel.charAt(0).toUpperCase() + skillSummary.overallLevel.slice(1)} Level`}
                sx={{ 
                  backgroundColor: getLevelColor(skillSummary.overallLevel),
                  color: 'white'
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <Chip
                label={`${skillSummary.learningVelocity.charAt(0).toUpperCase() + skillSummary.learningVelocity.slice(1)} Pace`}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Typography variant="h6" gutterBottom>
        Subject Skills
      </Typography>
      
      {skillSummary.subjectBreakdown.map((subject) => (
        <Accordion key={subject.subjectId} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%" gap={2}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {subject.subjectName}
              </Typography>
              <Chip
                size="small"
                icon={getLevelIcon(subject.currentLevel)}
                label={subject.currentLevel}
                sx={{ 
                  backgroundColor: getLevelColor(subject.currentLevel),
                  color: 'white',
                  mr: 2
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(subject.progress)}%
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Progress Bar */}
              <Grid item xs={12}>
                <LinearProgress 
                  variant="determinate" 
                  value={subject.progress} 
                  sx={{ height: 6, borderRadius: 3, mb: 2 }}
                />
              </Grid>

              {/* Topic Progress */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Topic Progress
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip 
                    size="small" 
                    label={`${subject.masteredTopics} Mastered`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip 
                    size="small" 
                    label={`${subject.inProgressTopics} In Progress`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip 
                    size="small" 
                    label={`${subject.topicCount - subject.masteredTopics - subject.inProgressTopics} Not Started`}
                    color="default"
                    variant="outlined"
                  />
                </Box>
              </Grid>

              {/* Strength Areas */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="success.main">
                  Strength Areas
                </Typography>
                {subject.strengthAreas.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {subject.strengthAreas.map((area, index) => (
                      <Chip 
                        key={index}
                        size="small" 
                        label={area}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Complete more activities to identify strengths
                  </Typography>
                )}
              </Grid>

              {/* Improvement Areas */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom color="warning.main">
                  Areas for Improvement
                </Typography>
                {subject.improvementAreas.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {subject.improvementAreas.map((area, index) => (
                      <Chip 
                        key={index}
                        size="small" 
                        label={area}
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Great job! No specific areas need improvement right now.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Last updated: {new Date(skillSummary.lastUpdated).toLocaleDateString()}
      </Typography>

      {/* Detailed View Dialog */}
      <Dialog 
        open={showDetailedView} 
        onClose={() => setShowDetailedView(false)}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              {child?.name || 'Student'}'s Detailed Skill Analysis
            </Typography>
            <IconButton onClick={() => setShowDetailedView(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <SkillProficiencyVisualization childId={childId} child={child} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailedView(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChildSkillLevels;