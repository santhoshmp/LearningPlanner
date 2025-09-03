import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import {
  Book as BookIcon,
  Notes as NotesIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { childProfileApi, studyPlanApi } from '../../services/api';
import { DIFFICULTY_LEVELS } from '../../types/studyPlan';
import { LEARNING_STYLES } from '../../types/child';
import { CreateStudyPlanRequest } from '../../types/studyPlan';
import { ParentDashboardLayout } from '../layout';
import { curriculumService } from '../../services/curriculumService';
import { GradeSelector, SubjectSelector, TopicSelector, ResourcePreview } from '../common';

const CreateStudyPlanForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateStudyPlanRequest>({
    childId: '',
    subject: '',
    grade: '',
    difficulty: '',
    selectedTopics: [],
    learningStyle: '',
    additionalNotes: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['children'],
    queryFn: childProfileApi.getChildren,
  });

  const { data: grades, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['grades'],
    queryFn: curriculumService.getGrades,
  });
  

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    
    // Reset selected topics when subject or grade changes
    if (name === 'subject' || name === 'grade') {
      setFormData((prev) => ({ ...prev, [name]: value, selectedTopics: [] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTopicsChange = (topics: string[]) => {
    setFormData((prev) => ({ ...prev, selectedTopics: topics }));
    validateForm({ ...formData, selectedTopics: topics });
  };

  const validateForm = (data: CreateStudyPlanRequest) => {
    const errors: string[] = [];

    if (!data.childId) {
      errors.push('Please select a child');
    }

    if (!data.grade) {
      errors.push('Please select a grade level');
    }

    if (!data.subject) {
      errors.push('Please select a subject');
    }

    if (!data.difficulty) {
      errors.push('Please select a difficulty level');
    }

    if (!data.learningStyle) {
      errors.push('Please select a learning style');
    }

    if (data.selectedTopics.length === 0) {
      errors.push('Please select at least one topic');
    }

    if (data.selectedTopics.length > 10) {
      errors.push('Please select no more than 10 topics for optimal learning');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!validateForm(formData)) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setIsGenerating(true);
    console.log('Creating study plan with valid data...');
    
    try {
      const result = await studyPlanApi.createPlan(formData);
      console.log('Study plan created successfully:', result);
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      toast.success('Study plan created successfully!');
      navigate(`/study-plans/${result.id}`);
    } catch (error: any) {
      console.error('Failed to create study plan:', error);
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create study plan');
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoadingChildren || isLoadingGrades) {
    return (
      <ParentDashboardLayout
        title="Create Study Plan"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Study Plans', path: '/study-plans' },
          { label: 'Create' },
        ]}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </ParentDashboardLayout>
    );
  }
  
  if (!children || children.length === 0) {
    return (
      <ParentDashboardLayout
        title="Create Study Plan"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Study Plans', path: '/study-plans' },
          { label: 'Create' },
        ]}
      >
        <Alert severity="info" sx={{ mb: 3 }}>
          You need to create a child profile first before creating a study plan.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/child-profiles')}
            sx={{ mt: 2 }}
          >
            Create Child Profile
          </Button>
        </Box>
      </ParentDashboardLayout>
    );
  }
  
  return (
    <ParentDashboardLayout
      title="Create Study Plan"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Study Plans', path: '/study-plans' },
        { label: 'Create' },
      ]}
    >
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create a personalized study plan for your child using AI technology.
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Child Selection Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Child Selection
              </Typography>
            </Box>
            
            <FormControl fullWidth required>
              <InputLabel id="child-select-label">Child *</InputLabel>
              <Select
                labelId="child-select-label"
                id="childId"
                name="childId"
                value={formData.childId}
                label="Child *"
                onChange={(e) => handleChange(e)}
                sx={{ 
                  backgroundColor: 'white',
                  borderRadius: 2
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      borderRadius: 8
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>Select the child for this study plan</em>
                </MenuItem>
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: '20px' }}>👦</Typography>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {child.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {child.age} years old • Grade {child.gradeLevel}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText sx={{ mt: 1 }}>
                Choose which child this study plan is for
              </FormHelperText>
            </FormControl>
          </Paper>

          {/* Study Plan Configuration */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BookIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Study Plan Configuration
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Subject Selection */}
              <Box sx={{
                '& .MuiFormControl-root': {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2
                  }
                }
              }}>
                <SubjectSelector
                  value={formData.subject}
                  onChange={(subjectId) => setFormData(prev => ({ ...prev, subject: subjectId }))}
                  label="Subject"
                  required
                  showIcons
                  showColors
                  fullWidth
                />
              </Box>

              {/* Grade Selection */}
              <Box sx={{
                '& .MuiFormControl-root': {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2
                  }
                }
              }}>
                <GradeSelector
                  value={formData.grade}
                  onChange={(grade) => setFormData(prev => ({ ...prev, grade }))}
                  label="Grade Level"
                  required
                  showAgeRange
                  fullWidth
                />
              </Box>

              {/* Difficulty and Learning Style Row */}
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                {/* Difficulty Level */}
                <FormControl fullWidth required>
                  <InputLabel id="difficulty-select-label">Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-select-label"
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    label="Difficulty"
                    onChange={(e) => handleChange(e)}
                    sx={{ 
                      backgroundColor: 'white',
                      borderRadius: 2
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          borderRadius: 8
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Select difficulty level</em>
                    </MenuItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>📊</span>
                            {level.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {level.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Learning Style */}
                <FormControl fullWidth required>
                  <InputLabel id="learning-style-select-label">Learning Style</InputLabel>
                  <Select
                    labelId="learning-style-select-label"
                    id="learningStyle"
                    name="learningStyle"
                    value={formData.learningStyle}
                    label="Learning Style"
                    onChange={(e) => handleChange(e)}
                    sx={{ 
                      backgroundColor: 'white',
                      borderRadius: 2
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          borderRadius: 8
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Select learning style</em>
                    </MenuItem>
                    {LEARNING_STYLES.map((style) => (
                      <MenuItem key={style.value} value={style.value}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>🧠</span>
                            {style.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {style.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>

          {/* Topic Selection Section */}
          {formData.grade && formData.subject && (
            <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <TopicSelector
                grade={formData.grade}
                subjectId={formData.subject}
                selectedTopics={formData.selectedTopics}
                onTopicsChange={handleTopicsChange}
                showDifficulty
                showEstimatedHours
                groupByDifficulty
                allowSelectAll
              />
            </Paper>
          )}

          {/* Resource Preview Section */}
          {formData.selectedTopics.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BookIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Available Resources
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Preview educational resources available for your selected topics. These will be included in your study plan.
              </Typography>

              {formData.selectedTopics.slice(0, 3).map((topicId) => (
                <Box key={topicId} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Resources for Topic: {topicId}
                  </Typography>
                  <ResourcePreview
                    topicId={topicId}
                    grade={formData.grade}
                    showPreview
                    compact
                  />
                </Box>
              ))}

              {formData.selectedTopics.length > 3 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Showing resources for first 3 topics. More resources will be available in your complete study plan.
                </Typography>
              )}
            </Paper>
          )}

          {/* Additional Notes Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NotesIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Additional Notes (Optional)
              </Typography>
            </Box>
            
            <TextField
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              placeholder="Any specific topics to focus on, areas of interest, or learning accommodations..."
              helperText="Provide any additional information to customize the study plan"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: 2
                }
              }}
            />
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2,
            pt: 2
          }}>
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Please fix the following errors:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate('/study-plans')}
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 4
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isGenerating || validationErrors.length > 0}
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 4
              }}
              startIcon={isGenerating ? <CircularProgress size={20} /> : undefined}
            >
              {isGenerating ? 'Generating Plan...' : 'Generate Study Plan'}
            </Button>
          </Box>
        </Box>
      </Container>
    </ParentDashboardLayout>
  );
};

export default CreateStudyPlanForm;