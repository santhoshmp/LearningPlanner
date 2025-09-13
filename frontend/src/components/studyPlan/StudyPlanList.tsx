import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { studyPlanApi, childProfileApi } from '../../services/api';
import { StudyPlan } from '../../types/studyPlan';
import { ChildProfile } from '../../types/child';
import { ParentDashboardLayout } from '../layout';

const StudyPlanList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['children'],
    queryFn: childProfileApi.getChildren,
  });
  
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['studyPlans', selectedChildId],
    queryFn: () => {
      console.log('Fetching study plans for child:', selectedChildId);
      return studyPlanApi.getPlans(selectedChildId || undefined);
    },
  });

  // Mutation for activating plans
  const activatePlanMutation = useMutation({
    mutationFn: studyPlanApi.activatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      toast.success('Study plan activated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate study plan');
    },
  });

  // Mutation for pausing plans
  const pausePlanMutation = useMutation({
    mutationFn: studyPlanApi.pausePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      toast.success('Study plan paused successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pause study plan');
    },
  });
  
  const handleChildChange = (event: any) => {
    setSelectedChildId(event.target.value);
  };

  const handleActivatePlan = (planId: string) => {
    activatePlanMutation.mutate(planId);
  };

  const handlePausePlan = (planId: string) => {
    pausePlanMutation.mutate(planId);
  };
  
  const getStatusChip = (status: string) => {
    let color: 'success' | 'default' | 'warning' | 'info' = 'default';
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'active':
        color = 'success';
        break;
      case 'paused':
        color = 'warning';
        break;
      case 'completed':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)} 
        color={color}
        size="small"
      />
    );
  };
  
  // Test function to create a study plan directly
  const testCreatePlan = async () => {
    if (!children || children.length === 0) {
      alert('No children available');
      return;
    }
    
    const testData = {
      childId: children[0].id,
      subject: 'MATH',
      difficulty: 'BEGINNER',
      learningStyle: 'VISUAL',
      additionalNotes: 'Test study plan'
    };
    
    try {
      console.log('Testing study plan creation with:', testData);
      console.log('Available children:', children);
      const result = await studyPlanApi.createPlan(testData);
      console.log('Study plan created:', result);
      alert('Study plan created successfully! ID: ' + result.id);
      // Refresh the plans list
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to create study plan:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to create study plan: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  // Action buttons for the layout
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {process.env.NODE_ENV === 'development' && (
        <Button
          variant="outlined"
          onClick={testCreatePlan}
          size="small"
          sx={{ opacity: 0.7 }}
        >
          Quick Test Plan
        </Button>
      )}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => navigate('/study-plans/create')}
        size="small"
      >
        Create New Plan
      </Button>
    </Box>
  );
  
  if (isLoadingChildren) {
    return (
      <ParentDashboardLayout
        title="Study Plans"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Study Plans' }]}
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
        title="Study Plans"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Study Plans' }]}
      >
        <Alert severity="info" sx={{ mb: 3 }}>
          You need to create a child profile first before creating study plans.
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
      title="Study Plans"
      breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Study Plans' }]}
      actions={actionButtons}
    >
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage and track your children's study plans
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="child-filter-label">Filter by Child</InputLabel>
          <Select
            labelId="child-filter-label"
            id="childFilter"
            value={selectedChildId}
            label="Filter by Child"
            onChange={handleChildChange}
          >
            <MenuItem value="">All Children</MenuItem>
            {children.map((child: ChildProfile) => (
              <MenuItem key={child.id} value={child.id}>
                {child.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {isLoadingPlans ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !plans || plans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No study plans found.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Click "Create New Plan" to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/study-plans/create')}
          >
            Create New Plan
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Child</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan: StudyPlan) => {
                const childName = children.find(c => c.id === plan.childId)?.name || 'Unknown';
                
                return (
                  <TableRow key={plan.id} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {plan.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>{childName}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{plan.difficulty}</TableCell>
                    <TableCell>{getStatusChip(plan.status)}</TableCell>
                    <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          component={RouterLink}
                          to={`/study-plans/${plan.id}`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        >
                          View
                        </Button>
                        {plan.status.toLowerCase() === 'draft' && (
                          <Button
                            color="success"
                            size="small"
                            variant="contained"
                            onClick={() => handleActivatePlan(plan.id)}
                            disabled={activatePlanMutation.isPending}
                          >
                            Activate
                          </Button>
                        )}
                        {plan.status.toLowerCase() === 'active' && (
                          <Button
                            color="warning"
                            size="small"
                            variant="contained"
                            onClick={() => handlePausePlan(plan.id)}
                            disabled={pausePlanMutation.isPending}
                          >
                            Pause
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </ParentDashboardLayout>
  );
};

export default StudyPlanList;