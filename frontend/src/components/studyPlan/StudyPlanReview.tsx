import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { studyPlanApi } from '../../services/api';
import { StudyPlan, UpdateStudyPlanRequest } from '../../types/studyPlan';
import { ParentDashboardLayout } from '../layout';

const StudyPlanReview: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedObjectives, setEditedObjectives] = useState<{ id: string; description: string }[]>([]);
  
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['studyPlan', planId],
    queryFn: () => studyPlanApi.getPlan(planId!),
    enabled: !!planId,
  });
  
  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: UpdateStudyPlanRequest }) => 
      studyPlanApi.updatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan', planId] });
      toast.success('Study plan updated successfully!');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update study plan');
    },
  });
  
  const activatePlanMutation = useMutation({
    mutationFn: studyPlanApi.activatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan', planId] });
      toast.success('Study plan activated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate study plan');
    },
  });
  
  const pausePlanMutation = useMutation({
    mutationFn: studyPlanApi.pausePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan', planId] });
      toast.success('Study plan paused successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pause study plan');
    },
  });
  
  const deletePlanMutation = useMutation({
    mutationFn: studyPlanApi.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      toast.success('Study plan deleted successfully!');
      navigate('/study-plans');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete study plan');
    },
  });
  
  const handleEditStart = () => {
    if (plan) {
      setEditedObjectives(plan.objectives.map(obj => ({ id: obj.id, description: obj.description })));
      setIsEditing(true);
    }
  };
  
  const handleObjectiveChange = (id: string, description: string) => {
    setEditedObjectives(prev => 
      prev.map(obj => obj.id === id ? { ...obj, description } : obj)
    );
  };
  
  const handleSaveChanges = () => {
    if (!planId) return;
    
    const updatedObjectives = editedObjectives.map(obj => ({
      id: obj.id,
      description: obj.description,
    }));
    
    updatePlanMutation.mutate({
      planId,
      data: { objectives: updatedObjectives }
    });
  };
  
  const handleActivate = () => {
    if (!planId) return;
    activatePlanMutation.mutate(planId);
  };
  
  const handlePause = () => {
    if (!planId) return;
    pausePlanMutation.mutate(planId);
  };
  
  const handleDelete = () => {
    if (!planId || !window.confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) return;
    deletePlanMutation.mutate(planId);
  };
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <ParentDashboardLayout
        title="Study Plan Review"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Study Plans', path: '/study-plans' },
          { label: 'Review' }
        ]}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </ParentDashboardLayout>
    );
  }
  
  if (error || !plan) {
    return (
      <ParentDashboardLayout
        title="Study Plan Review"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Study Plans', path: '/study-plans' },
          { label: 'Review' }
        ]}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load the study plan. Please try again later.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/study-plans')}
        >
          Back to Study Plans
        </Button>
      </ParentDashboardLayout>
    );
  }
  
  return (
    <ParentDashboardLayout
      title="Study Plan Review"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Study Plans', path: '/study-plans' },
        { label: 'Review' }
      ]}
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/study-plans')}
            sx={{ mr: 1 }}
          >
            Back to Study Plans
          </Button>
          {plan.status.toLowerCase() === 'draft' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayIcon />}
              onClick={handleActivate}
              disabled={activatePlanMutation.isPending}
            >
              Activate Plan
            </Button>
          )}
          {plan.status.toLowerCase() === 'active' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<PauseIcon />}
              onClick={handlePause}
              disabled={pausePlanMutation.isPending}
            >
              Pause Plan
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deletePlanMutation.isPending}
          >
            Delete
          </Button>
        </Box>
      }
    >
      <Grid container spacing={3}>
        {/* Plan Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                Plan Overview
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Subject
                </Typography>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {plan.subject.toLowerCase()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Difficulty
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {plan.difficulty.toLowerCase()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={plan.status.charAt(0).toUpperCase() + plan.status.slice(1)} 
                  color={getStatusColor(plan.status) as any}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Objectives */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="primary" />
                  Learning Objectives
                </Typography>
                {!isEditing && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleEditStart}
                  >
                    Edit Objectives
                  </Button>
                )}
              </Box>

              {isEditing ? (
                <Box>
                  {editedObjectives.map((objective, index) => (
                    <TextField
                      key={objective.id}
                      fullWidth
                      multiline
                      rows={2}
                      value={objective.description}
                      onChange={(e) => handleObjectiveChange(objective.id, e.target.value)}
                      sx={{ mb: 2 }}
                      label={`Objective ${index + 1}`}
                    />
                  ))}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveChanges}
                      disabled={updatePlanMutation.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <List>
                  {(Array.isArray(plan.objectives) ? plan.objectives : []).map((objective, index) => (
                    <ListItem key={objective.id || `obj_${index}`} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {objective.completed ? (
                          <CheckIcon color="success" />
                        ) : (
                          <UncheckedIcon color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={objective.description}
                        primaryTypographyProps={{
                          sx: { 
                            textDecoration: objective.completed ? 'line-through' : 'none',
                            color: objective.completed ? 'text.secondary' : 'text.primary'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                  {(!Array.isArray(plan.objectives) || plan.objectives.length === 0) && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="No objectives available"
                        primaryTypographyProps={{
                          sx: { color: 'text.secondary', fontStyle: 'italic' }
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Study Activities */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="primary" />
                Study Activities
              </Typography>
              
              <Grid container spacing={2}>
                {plan.activities.map((activity, index) => (
                  <Grid item xs={12} md={6} lg={4} key={activity.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {activity.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {activity.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {activity.estimatedDuration} minutes
                          </Typography>
                        </Box>
                        
                        <Chip 
                          label={`Difficulty: ${activity.difficulty}/4`}
                          size="small"
                          color={activity.difficulty <= 2 ? 'success' : activity.difficulty === 3 ? 'warning' : 'error'}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Study Plan</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this study plan? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleDelete();
              setDeleteDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ParentDashboardLayout>
  );
};

export default StudyPlanReview;