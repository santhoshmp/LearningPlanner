import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Flag as MilestoneIcon,
  Radar as RadarIcon
} from '@mui/icons-material';
import { ChildProfile, SubjectProficiency, Achievement, Milestone } from '../../types/child';
import SkillProficiencyVisualization from './SkillProficiencyVisualization';
import ProficiencyIndicators from './ProficiencyIndicators';
import AchievementMilestoneTracker from './AchievementMilestoneTracker';
import { enhancedAnalyticsService } from '../../services/analyticsService';

interface SkillDashboardProps {
  child: ChildProfile;
  compact?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`skill-dashboard-tabpanel-${index}`}
      aria-labelledby={`skill-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SkillDashboard: React.FC<SkillDashboardProps> = ({ child, compact = false }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [skillData, setSkillData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkillData();
  }, [child.id]);

  const fetchSkillData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enhancedAnalyticsService.getSkillProficiencyVisualization(child.id);
      setSkillData(data);
    } catch (err) {
      console.error('Error fetching skill data:', err);
      setError('Failed to load skill data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getProficiencyColor = (level: string): string => {
    switch (level) {
      case 'mastery': return theme.palette.success.main;
      case 'advanced': return theme.palette.info.main;
      case 'intermediate': return theme.palette.warning.main;
      case 'beginner': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
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

  if (!skillData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No skill data available yet. Complete some activities to see progress!
      </Alert>
    );
  }

  if (compact) {
    return (
      <Box>
        {/* Compact Overview */}
        <Card sx={{ 
          mb: 2,
          background: `linear-gradient(135deg, ${alpha(getProficiencyColor(skillData.overallLevel), 0.1)}, ${alpha(getProficiencyColor(skillData.overallLevel), 0.05)})`
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: getProficiencyColor(skillData.overallLevel),
                    width: 40,
                    height: 40
                  }}
                >
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {child.name}'s Skills
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {skillData.overallLevel.charAt(0).toUpperCase() + skillData.overallLevel.slice(1)} Level
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" fontWeight="bold">
                  {skillData.subjectProficiencies.filter((s: SubjectProficiency) => s.proficiencyLevel === 'mastery').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Subjects Mastered
                </Typography>
              </Box>
            </Box>

            {/* Compact Proficiency Indicators */}
            <ProficiencyIndicators 
              subjectProficiencies={skillData.subjectProficiencies}
              compact={true}
              maxDisplay={4}
            />
          </CardContent>
        </Card>

        {/* Compact Achievements */}
        <AchievementMilestoneTracker
          childId={child.id}
          achievements={skillData.achievementBadges || []}
          milestones={skillData.nextMilestones || []}
          compact={true}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(getProficiencyColor(skillData.overallLevel), 0.1)}, ${alpha(getProficiencyColor(skillData.overallLevel), 0.05)})`
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: getProficiencyColor(skillData.overallLevel),
                  fontSize: '2rem'
                }}
              >
                <StarIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {child.name}'s Skill Dashboard
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Overall Level: {skillData.overallLevel.charAt(0).toUpperCase() + skillData.overallLevel.slice(1)}
                </Typography>
                <Box display="flex" gap={1} sx={{ mt: 1 }}>
                  <Chip 
                    icon={<SchoolIcon />}
                    label={`Grade ${child.gradeLevel}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<TrophyIcon />}
                    label={`${skillData.achievementBadges?.length || 0} Achievements`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Box>
            </Box>
            
            <Grid container spacing={2} sx={{ maxWidth: 300 }}>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {skillData.subjectProficiencies.filter((s: SubjectProficiency) => s.proficiencyLevel === 'mastery').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mastered
                </Typography>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {skillData.subjectProficiencies.filter((s: SubjectProficiency) => s.proficiencyLevel === 'advanced').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Advanced
                </Typography>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {skillData.subjectProficiencies.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Subjects
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<RadarIcon />} label="Skill Overview" />
          <Tab icon={<SchoolIcon />} label="Subject Details" />
          <Tab icon={<TimelineIcon />} label="Progress Timeline" />
          <Tab icon={<TrophyIcon />} label="Achievements" />
          <Tab icon={<MilestoneIcon />} label="Goals" />
        </Tabs>

        {/* Skill Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <ProficiencyIndicators 
                subjectProficiencies={skillData.subjectProficiencies}
                showTrends={true}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Stats
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Learning Velocity
                    </Typography>
                    <Typography variant="h6">
                      {skillData.subjectProficiencies.filter((s: SubjectProficiency) => s.trendDirection === 'up').length > 
                       skillData.subjectProficiencies.filter((s: SubjectProficiency) => s.trendDirection === 'down').length ? 
                       'Accelerating' : 'Steady'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Strongest Subject
                    </Typography>
                    <Typography variant="h6">
                      {skillData.subjectProficiencies.reduce((prev: SubjectProficiency, current: SubjectProficiency) => 
                        prev.proficiencyScore > current.proficiencyScore ? prev : current
                      )?.subjectName || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Next Milestone
                    </Typography>
                    <Typography variant="h6">
                      {skillData.nextMilestones?.[0]?.title || 'Keep learning!'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Subject Details Tab */}
        <TabPanel value={activeTab} index={1}>
          <SkillProficiencyVisualization childId={child.id} child={child} />
        </TabPanel>

        {/* Progress Timeline Tab */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Learning Progress Over Time
              </Typography>
              <Alert severity="info">
                Progress timeline visualization will be implemented with real activity data.
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Achievements Tab */}
        <TabPanel value={activeTab} index={3}>
          <AchievementMilestoneTracker
            childId={child.id}
            achievements={skillData.achievementBadges || []}
            milestones={skillData.nextMilestones || []}
          />
        </TabPanel>

        {/* Goals Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            {skillData.nextMilestones?.map((milestone: Milestone) => (
              <Grid item xs={12} md={6} key={milestone.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <MilestoneIcon color="primary" />
                      <Typography variant="h6">
                        {milestone.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {milestone.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          Progress: {milestone.progress} / {milestone.target}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round((milestone.progress / milestone.target) * 100)}%
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                        <Box
                          sx={{
                            width: `${(milestone.progress / milestone.target) * 100}%`,
                            bgcolor: 'primary.main',
                            height: '100%',
                            borderRadius: 1,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
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
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SkillDashboard;