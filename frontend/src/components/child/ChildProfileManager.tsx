import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  InputAdornment,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { childProfileApi } from '../../services/api';
import { ChildProfile } from '../../types/child';
import ChildProfileCard from './ChildProfileCard';
import CreateChildForm from './CreateChildForm';
import EditChildForm from './EditChildForm';
import UpdateCredentialsForm from './UpdateCredentialsForm';
import toast from 'react-hot-toast';
import { ParentDashboardLayout } from '../layout';

const ChildProfileManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);

  const queryClient = useQueryClient();

  // Fetch child profiles
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['childProfiles'],
    queryFn: childProfileApi.getChildren,
  });
  
  // Ensure data is properly initialized to prevent undefined errors
  const children = data || [];

  // Delete child mutation
  const deleteMutation = useMutation({
    mutationFn: childProfileApi.deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['childProfiles'] });
    },
  });

  // Filter children based on search term
  const filteredChildren = children.filter(child => 
    child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit child
  const handleEditChild = (child: ChildProfile) => {
    setSelectedChild(child);
    setIsEditModalOpen(true);
  };

  // Handle update credentials
  const handleUpdateCredentials = (child: ChildProfile) => {
    setSelectedChild(child);
    setIsCredentialsModalOpen(true);
  };

  // Handle delete child
  const handleDeleteChild = (childId: string) => {
    deleteMutation.mutate(childId);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Action buttons for the layout
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        size="small"
      >
        Refresh
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setIsCreateModalOpen(true)}
        size="small"
      >
        Add Child
      </Button>
    </Box>
  );

  return (
    <ParentDashboardLayout
      title="Child Profiles"
      breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Child Profiles' }]}
      actions={actionButtons}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Manage your children's profiles and login credentials
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3, maxWidth: 300 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search profiles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          }
        >
          <AlertTitle>Error loading child profiles</AlertTitle>
          {(error as Error)?.message || 'An unexpected error occurred'}
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredChildren.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          {searchTerm ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                No matching profiles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No child profiles match your search. Try a different search term or clear the search.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </Button>
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <AddIcon color="primary" />
              </Box>
              <Typography variant="h6" gutterBottom>
                No child profiles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Get started by creating a child profile
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Add Child
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Child Profile Grid */}
      {!isLoading && !isError && filteredChildren.length > 0 && (
        <Grid container spacing={3}>
          {filteredChildren.map((child) => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <ChildProfileCard
                child={child}
                onEdit={handleEditChild}
                onDelete={handleDeleteChild}
                onUpdateCredentials={handleUpdateCredentials}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modals */}
      <CreateChildForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['childProfiles'] });
          toast.success('Child profile created successfully!');
        }}
      />

      <EditChildForm
        child={selectedChild}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['childProfiles'] });
          toast.success('Child profile updated successfully!');
        }}
      />

      <UpdateCredentialsForm
        child={selectedChild}
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['childProfiles'] });
          toast.success('Credentials updated successfully!');
        }}
      />
    </ParentDashboardLayout>
  );
};

export default ChildProfileManager;