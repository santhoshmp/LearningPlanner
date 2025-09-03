import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { ParentDashboardLayout } from '../layout';
import { profileApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePageWrapper: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
      });
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const updatedProfile = await profileApi.updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  if (loading) {
    return (
      <ParentDashboardLayout
        title="Profile Settings"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Profile' }
        ]}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ParentDashboardLayout>
    );
  }

  return (
    <ParentDashboardLayout
      title="Profile Settings"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Profile' }
      ]}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mr: 3,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {profile?.firstName?.[0] || user?.firstName?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {profile?.firstName} {profile?.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {profile?.email}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={profile?.role || 'Parent'} 
                    color="primary" 
                    size="small" 
                  />
                  {profile?.isEmailVerified && (
                    <Chip 
                      label="Email Verified" 
                      color="success" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Personal Information
              </Typography>
              {!isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    variant="outlined"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={!isEditing}
                  type="email"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
            </Grid>

            {profile && (
              <>
                <Divider sx={{ my: 4 }} />
                
                <Typography variant="h6" gutterBottom>
                  Account Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Account Type
                      </Typography>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {profile.role?.toLowerCase() || 'Parent'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email Status
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color={profile.isEmailVerified ? 'success.main' : 'warning.main'}
                      >
                        {profile.isEmailVerified ? 'Verified' : 'Unverified'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Child Profiles
                      </Typography>
                      <Typography variant="h6">
                        {profile.childrenCount || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </ParentDashboardLayout>
  );
};

export default ProfilePageWrapper;