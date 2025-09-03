import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Tooltip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Radar as RadarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as NotStartedIcon,
  PlayCircle as InProgressIcon,
  AutoAwesome as SparkleIcon,
  Flag as MilestoneIcon
} from '@mui/icons-material';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { enhancedAnalyticsService } from '../../services/analyticsService';
import { ChildProfile } from '../../types/child';

interface SkillProficiencyVisualizationProps {
  childId: string;
  child?: ChildProfile;
}

interface SubjectProficiency {
  subjectId: string;
  subjectName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  proficiencyScore: number;
  visualIndicator: VisualIndicator;
  topicBreakdown: TopicProficiency[];
  trendDirection: 'up' | 'down' | 'stable';
  confidenceLevel: number;
}

interface TopicProficiency {
  topicId: string;
  topicName: string;
  masteryLevel: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
}

interface VisualIndicator {
  type: 'progress-bar' | 'circular-progress' | 'star-rating' | 'level-badge';
  value: number;
  maxValue: number;
  color: string;
  icon?: string;
  animation?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  category: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  estimatedCompletion: Date;
  category: string;
}

interface SkillVisualization {
  childId: string;
  overallLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  subjectProficiencies: SubjectProficiency[];
  skillRadarChart: any;
  progressTimeline: any[];
  achievementBadges: Achievement[];
  nextMilestones: Milestone[];
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
      id={`skill-tabpanel-${index}`}
      aria-labelledby={`skill-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SkillProficiencyVisualization: React.FC<SkillProficiencyVisualizationProps> = ({ 
  childId, 
  child 
}) => {
  const theme = useTheme();
  const [skillVisualization, setSkillVisualization] = useState<SkillVisualization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSkillVisualization();
  }, [childId]);

  const fetchSkillVisualization = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enhancedAnalyticsService.getSkillProficiencyVisualization(childId);
      setSkillVisualization(data);
    } catch (err) {
      console.error('Error fetching skill visualization:', err);
      setError('Failed to load skill proficiency data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
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

  const getProficiencyIcon = (level: string) => {
    switch (level) {
      case 'mastery': return <StarIcon />;
      case 'advanced': return <TrendingUpIcon />;
      case 'intermediate': return <SchoolIcon />;
      case 'beginner': return <TrendingDownIcon />;
      default: return <SchoolIcon />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingDownIcon color="error" />;
      case 'stable': return <TrendingFlatIcon color="action" />;
      default: return <TrendingFlatIcon color="action" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered': return <CheckCircleIcon color="success" />;
      case 'completed': return <CheckCircleIcon color="primary" />;
      case 'in_progress': return <InProgressIcon color="warning" />;
      case 'not_started': return <NotStartedIcon color="disabled" />;
      default: return <NotStartedIcon color="disabled" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
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

  if (!skillVisualization) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No skill proficiency data available yet. Complete some activities to see your progress!
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with Overall Level */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${alpha(getProficiencyColor(skillVisualization.overallLevel), 0.1)}, ${alpha(getProficiencyColor(skillVisualization.overallLevel), 0.05)})` }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: getProficiencyColor(skillVisualization.overallLevel),
                  fontSize: '1.5rem'
                }}
              >
                {getProficiencyIcon(skillVisualization.overallLevel)}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {child?.name || 'Student'}'s Skill Profile
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Overall Level: {skillVisualization.overallLevel.charAt(0).toUpperCase() + skillVisualization.overallLevel.slice(1)}
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                Subjects Mastered
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {skillVisualization.subjectProficiencies.filter(s => s.proficiencyLevel === 'mastery').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {skillVisualization.subjectProficiencies.length}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<RadarIcon />} label="Skill Radar" />
          <Tab icon={<SchoolIcon />} label="Subject Breakdown" />
          <Tab icon={<TimelineIcon />} label="Progress Timeline" />
          <Tab icon={<TrophyIcon />} label="Achievements" />
          <Tab icon={<MilestoneIcon />} label="Milestones" />
        </Tabs>

        {/* Skill Radar Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Skill Proficiency Radar
                  </Typography>
                  <Box height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={skillVisualization.skillRadarChart}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]} 
                          tick={false}
                        />
                        <Radar
                          name="Proficiency"
                          dataKey="proficiency"
                          stroke={theme.palette.primary.main}
                          fill={theme.palette.primary.main}
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Proficiency Distribution
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Mastery', value: skillVisualization.subjectProficiencies.filter(s => s.proficiencyLevel === 'mastery').length, fill: getProficiencyColor('mastery') },
                            { name: 'Advanced', value: skillVisualization.subjectProficiencies.filter(s => s.proficiencyLevel === 'advanced').length, fill: getProficiencyColor('advanced') },
                            { name: 'Intermediate', value: skillVisualization.subjectProficiencies.filter(s => s.proficiencyLevel === 'intermediate').length, fill: getProficiencyColor('intermediate') },
                            { name: 'Beginner', value: skillVisualization.subjectProficiencies.filter(s => s.proficiencyLevel === 'beginner').length, fill: getProficiencyColor('beginner') }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Subject Breakdown Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            {skillVisualization.subjectProficiencies.map((subject) => (
              <Grid item xs={12} key={subject.subjectId}>
                <Card>
                  <CardContent>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="space-between"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => toggleSubjectExpansion(subject.subjectId)}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getProficiencyColor(subject.proficiencyLevel),
                            width: 40,
                            height: 40
                          }}
                        >
                          {getProficiencyIcon(subject.proficiencyLevel)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {subject.subjectName}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              size="small"
                              label={subject.proficiencyLevel}
                              sx={{ 
                                bgcolor: getProficiencyColor(subject.proficiencyLevel),
                                color: 'white'
                              }}
                            />
                            {getTrendIcon(subject.trendDirection)}
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight="bold">
                            {Math.round(subject.proficiencyScore)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confidence: {Math.round(subject.confidenceLevel * 100)}%
                          </Typography>
                        </Box>
                        <IconButton>
                          {expandedSubjects.has(subject.subjectId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={subject.proficiencyScore}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(getProficiencyColor(subject.proficiencyLevel), 0.2),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getProficiencyColor(subject.proficiencyLevel)
                          }
                        }}
                      />
                    </Box>

                    <Collapse in={expandedSubjects.has(subject.subjectId)}>
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Topic Breakdown
                        </Typography>
                        <List dense>
                          {subject.topicBreakdown.map((topic) => (
                            <ListItem key={topic.topicId}>
                              <ListItemIcon>
                                {getStatusIcon(topic.status)}
                              </ListItemIcon>
                              <ListItemText
                                primary={topic.topicName}
                                secondary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={topic.masteryLevel}
                                      sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                                    />
                                    <Typography variant="caption">
                                      {Math.round(topic.masteryLevel)}%
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Progress Timeline Tab */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Learning Progress Over Time
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={skillVisualization.progressTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="overallProgress" 
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      name="Overall Progress"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke={theme.palette.success.main}
                      strokeWidth={2}
                      name="Average Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Achievements Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            {skillVisualization.achievementBadges.length > 0 ? (
              skillVisualization.achievementBadges.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${alpha(achievement.color, 0.1)}, ${alpha(achievement.color, 0.05)})`,
                    border: `2px solid ${alpha(achievement.color, 0.3)}`
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Badge
                        badgeContent={<SparkleIcon sx={{ fontSize: 16 }} />}
                        color="primary"
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: achievement.color,
                            mx: 'auto',
                            mb: 2
                          }}
                        >
                          <TrophyIcon sx={{ fontSize: 30 }} />
                        </Avatar>
                      </Badge>
                      
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {achievement.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {achievement.description}
                      </Typography>
                      
                      <Chip 
                        label={achievement.category}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  No achievements earned yet. Keep learning to unlock your first badge!
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Milestones Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            {skillVisualization.nextMilestones.length > 0 ? (
              skillVisualization.nextMilestones.map((milestone) => (
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
                          <Typography variant="body2">
                            {Math.round((milestone.progress / milestone.target) * 100)}%
                          </Typography>
                        </Box>
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={(milestone.progress / milestone.target) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                        <Chip 
                          label={milestone.category}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Est. completion: {new Date(milestone.estimatedCompletion).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Great job! You've completed all current milestones. New ones will appear as you continue learning.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SkillProficiencyVisualization;