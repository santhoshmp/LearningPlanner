import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  Quiz as QuizIcon,
  Extension as ExtensionIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { childProfileApi } from '../../services/api';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../../types/studyPlan';
import { LEARNING_STYLES } from '../../types/child';

// Types for Gemini integration
interface GeminiStudyPlanRequest {
  childAge: number;
  gradeLevel: string;
  subject: string;
  learningStyle: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
  };
  duration: number;
  objectives: string[];
  previousPerformance?: {
    averageScore: number;
    completionRate: number;
    strugglingAreas: string[];
    strongAreas: string[];
  };
}

interface GeminiActivity {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'quiz' | 'exercise';
  duration: number;
  difficulty: number;
  objectives: string[];
  instructions: string;
  materials?: string[];
  assessmentCriteria?: string[];
}

interface ContentRecommendation {
  type: 'video' | 'article' | 'interactive';
  title: string;
  description: string;
  url?: string;
  duration: number;
  ageAppropriate: boolean;
  safetyScore: number;
  source: string;
  tags: string[];
  difficulty: number;
}

interface GeminiStudyPlanResponse {
  planId: string;
  title: string;
  description: string;
  activities: GeminiActivity[];
  estimatedDuration: number;
  difficultyProgression: number[];
  contentRecommendations: ContentRecommendation[];
  learningObjectives: string[];
  prerequisites: string[];
}

interface AIStudyPlanGeneratorProps {
  childId?: string;
  onPlanGenerated?: (plan: GeminiStudyPlanResponse) => void;
  onClose?: () => void;
}

const AIStudyPlanGenerator: React.FC<AIStudyPlanGeneratorProps> = ({
  childId: initialChildId,
  onPlanGenerated,
  onClose,
}) => {
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<GeminiStudyPlanRequest>({
    childAge: 8,
    gradeLevel: '3',
    subject: '',
    learningStyle: {
      visual: 0.4,
      auditory: 0.3,
      kinesthetic: 0.2,
      readingWriting: 0.1,
    },
    duration: 60,
    objectives: [],
  });
  
  const [selectedChildId, setSelectedChildId] = useState(initialChildId || '');
  const [customObjective, setCustomObjective] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<GeminiStudyPlanResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editedActivity, setEditedActivity] = useState<GeminiActivity | null>(null);

  // Fetch children
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['children'],
    queryFn: childProfileApi.getChildren,
  });

  // Update form data when child is selected
  useEffect(() => {
    if (selectedChildId && children) {
      const selectedChild = children.find(child => child.id === selectedChildId);
      if (selectedChild) {
        setFormData(prev => ({
          ...prev,
          childAge: selectedChild.age,
          gradeLevel: selectedChild.gradeLevel,
        }));
      }
    }
  }, [selectedChildId, children]);

  // Generate study plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (request: GeminiStudyPlanRequest) => {
      const response = await fetch('/api/gemini/generate-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate study plan');
      }
      
      return response.json();
    },
    onSuccess: (data: GeminiStudyPlanResponse) => {
      setGeneratedPlan(data);
      setShowPreview(true);
      toast.success('Study plan generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate study plan');
      setIsGenerating(false);
    },
  });

  const handleInputChange = (field: keyof GeminiStudyPlanRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLearningStyleChange = (style: keyof typeof formData.learningStyle, value: number) => {
    setFormData(prev => ({
      ...prev,
      learningStyle: {
        ...prev.learningStyle,
        [style]: value / 100,
      },
    }));
  };

  const addObjective = () => {
    if (customObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, customObjective.trim()],
      }));
      setCustomObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  const handleGenerate = async () => {
    if (!selectedChildId || !formData.subject || formData.objectives.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    generatePlanMutation.mutate(formData);
  };

  const handleEditActivity = (activity: GeminiActivity) => {
    setEditingActivity(activity.id);
    setEditedActivity({ ...activity });
  };

  const handleSaveActivity = () => {
    if (editedActivity && generatedPlan) {
      const updatedActivities = generatedPlan.activities.map(activity =>
        activity.id === editedActivity.id ? editedActivity : activity
      );
      
      setGeneratedPlan({
        ...generatedPlan,
        activities: updatedActivities,
      });
      
      setEditingActivity(null);
      setEditedActivity(null);
      toast.success('Activity updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setEditedActivity(null);
  };

  const handleApprovePlan = () => {
    if (generatedPlan && onPlanGenerated) {
      onPlanGenerated(generatedPlan);
      toast.success('Study plan approved and ready to use!');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayArrowIcon />;
      case 'article':
        return <ArticleIcon />;
      case 'quiz':
        return <QuizIcon />;
      case 'interactive':
        return <ExtensionIcon />;
      case 'exercise':
        return <AssignmentIcon />;
      default:
        return <SchoolIcon />;
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'success';
    if (difficulty <= 6) return 'warning';
    return 'error';
  };

  if (isLoadingChildren) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <AutoAwesomeIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            AI Study Plan Generator
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Create personalized study plans powered by advanced AI technology
        </Typography>
      </Box>

      {!showPreview ? (
        <Grid container spacing={3}>
          {/* Configuration Panel */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon sx={{ mr: 1 }} />
                Study Plan Configuration
              </Typography>

              {/* Child Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Child</InputLabel>
                <Select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  label="Select Child"
                >
                  {children?.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.name} (Age {child.age}, Grade {child.gradeLevel})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Subject and Duration */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      label="Subject"
                    >
                      {SUBJECTS.map((subject) => (
                        <MenuItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography gutterBottom>
                      Duration: {formData.duration} minutes
                    </Typography>
                    <Slider
                      value={formData.duration}
                      onChange={(_, value) => handleInputChange('duration', value)}
                      min={15}
                      max={180}
                      step={15}
                      marks={[
                        { value: 15, label: '15m' },
                        { value: 60, label: '1h' },
                        { value: 120, label: '2h' },
                        { value: 180, label: '3h' },
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>

              {/* Learning Style Configuration */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Learning Style Preferences
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(formData.learningStyle).map(([style, value]) => (
                  <Grid item xs={12} sm={6} key={style}>
                    <Typography gutterBottom sx={{ textTransform: 'capitalize' }}>
                      {style.replace(/([A-Z])/g, ' $1')}: {Math.round(value * 100)}%
                    </Typography>
                    <Slider
                      value={value * 100}
                      onChange={(_, newValue) => handleLearningStyleChange(style as any, newValue as number)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Learning Objectives */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Learning Objectives
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Add a learning objective..."
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                />
                <Button variant="outlined" onClick={addObjective}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {formData.objectives.map((objective, index) => (
                  <Chip
                    key={index}
                    label={objective}
                    onDelete={() => removeObjective(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Summary Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Plan Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Child: {children?.find(c => c.id === selectedChildId)?.name || 'Not selected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Subject: {SUBJECTS.find(s => s.value === formData.subject)?.label || 'Not selected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {formData.duration} minutes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Objectives: {formData.objectives.length}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Dominant Learning Style:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {Object.entries(formData.learningStyle)
                  .sort(([,a], [,b]) => b - a)[0][0]
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
              </Typography>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedChildId || !formData.subject || formData.objectives.length === 0}
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                sx={{ mt: 3 }}
              >
                {isGenerating ? 'Generating...' : 'Generate AI Study Plan'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        /* Preview Panel */
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Generated Study Plan Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setShowPreview(false)}
                startIcon={<EditIcon />}
              >
                Edit Configuration
              </Button>
              <Button
                variant="contained"
                onClick={handleApprovePlan}
                startIcon={<SaveIcon />}
              >
                Approve & Use Plan
              </Button>
            </Box>
          </Box>

          {generatedPlan && (
            <Box>
              {/* Plan Overview */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {generatedPlan.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {generatedPlan.description}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">{generatedPlan.estimatedDuration}m</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Estimated Duration
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <SchoolIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">{generatedPlan.activities.length}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Activities
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">
                        {Math.round(generatedPlan.difficultyProgression.reduce((a, b) => a + b, 0) / generatedPlan.difficultyProgression.length)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg Difficulty
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PreviewIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">{generatedPlan.contentRecommendations.length}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Content Items
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Activities */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Study Activities
              </Typography>
              {generatedPlan.activities.map((activity, index) => (
                <Accordion key={activity.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ mr: 2 }}>
                        {getActivityIcon(activity.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {activity.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={activity.type}
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={`${activity.duration}m`}
                            color="info"
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={`Difficulty: ${activity.difficulty}/10`}
                            color={getDifficultyColor(activity.difficulty) as any}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditActivity(activity);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {editingActivity === activity.id ? (
                      <Box sx={{ p: 2 }}>
                        <TextField
                          fullWidth
                          label="Title"
                          value={editedActivity?.title || ''}
                          onChange={(e) => setEditedActivity(prev => prev ? { ...prev, title: e.target.value } : null)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={editedActivity?.description || ''}
                          onChange={(e) => setEditedActivity(prev => prev ? { ...prev, description: e.target.value } : null)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Instructions"
                          value={editedActivity?.instructions || ''}
                          onChange={(e) => setEditedActivity(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            onClick={handleCancelEdit}
                            startIcon={<CancelIcon />}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSaveActivity}
                            startIcon={<SaveIcon />}
                          >
                            Save Changes
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {activity.description}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Instructions:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {activity.instructions}
                        </Typography>
                        {activity.objectives.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Learning Objectives:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {activity.objectives.map((objective, idx) => (
                                <Chip
                                  key={idx}
                                  size="small"
                                  label={objective}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Content Recommendations */}
              {generatedPlan.contentRecommendations.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Recommended Content
                  </Typography>
                  <Grid container spacing={2}>
                    {generatedPlan.contentRecommendations.map((content, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {getActivityIcon(content.type)}
                              <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                                {content.title}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {content.description}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                              <Chip size="small" label={`${content.duration}m`} />
                              <Chip size="small" label={content.source} color="info" />
                              <Chip 
                                size="small" 
                                label={`Safety: ${Math.round(content.safetyScore * 100)}%`}
                                color={content.safetyScore > 0.8 ? 'success' : 'warning'}
                              />
                            </Box>
                            {content.tags.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {content.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Chip
                                    key={tagIndex}
                                    size="small"
                                    label={tag}
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AIStudyPlanGenerator;