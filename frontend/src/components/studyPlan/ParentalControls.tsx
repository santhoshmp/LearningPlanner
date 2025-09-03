import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Slider,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ParentalControlSettings {
  contentFilterLevel: 'strict' | 'moderate' | 'relaxed';
  sessionTimeLimit: number; // minutes
  breakReminders: boolean;
  parentalNotifications: boolean;
  aiAssistanceEnabled: boolean;
  videoAutoplay: boolean;
  maxVolumeLevel: number; // 0-100
  blockedKeywords: string[];
  allowedDomains: string[];
  requireApprovalFor: {
    newContent: boolean;
    externalLinks: boolean;
    socialFeatures: boolean;
  };
  timeRestrictions: {
    enabled: boolean;
    allowedHours: {
      start: string; // HH:MM format
      end: string;   // HH:MM format
    };
    allowedDays: number[]; // 0-6, Sunday = 0
  };
}

interface ParentalControlsProps {
  childId: string;
  childAge: number;
  onSettingsChange?: (settings: ParentalControlSettings) => void;
  readOnly?: boolean;
}

const ParentalControls: React.FC<ParentalControlsProps> = ({
  childId,
  childAge,
  onSettingsChange,
  readOnly = false,
}) => {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<ParentalControlSettings>({
    contentFilterLevel: 'moderate',
    sessionTimeLimit: 60,
    breakReminders: true,
    parentalNotifications: true,
    aiAssistanceEnabled: true,
    videoAutoplay: false,
    maxVolumeLevel: 80,
    blockedKeywords: [],
    allowedDomains: [],
    requireApprovalFor: {
      newContent: false,
      externalLinks: true,
      socialFeatures: true,
    },
    timeRestrictions: {
      enabled: false,
      allowedHours: {
        start: '09:00',
        end: '17:00',
      },
      allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
    },
  });

  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [showDomainDialog, setShowDomainDialog] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['childSettings', childId],
    queryFn: async () => {
      const response = await fetch(`/api/child-profiles/${childId}/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch child settings');
      }
      
      return response.json();
    },
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ParentalControlSettings) => {
      const response = await fetch(`/api/child-profiles/${childId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['childSettings', childId] });
      setHasUnsavedChanges(false);
      toast.success('Parental controls updated successfully');
      
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const handleSettingChange = (key: keyof ParentalControlSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleNestedSettingChange = (
    parentKey: keyof ParentalControlSettings,
    childKey: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setSettings(prev => ({
        ...prev,
        blockedKeywords: [...prev.blockedKeywords, newKeyword.trim().toLowerCase()],
      }));
      setNewKeyword('');
      setShowKeywordDialog(false);
      setHasUnsavedChanges(true);
    }
  };

  const removeKeyword = (keyword: string) => {
    setSettings(prev => ({
      ...prev,
      blockedKeywords: prev.blockedKeywords.filter(k => k !== keyword),
    }));
    setHasUnsavedChanges(true);
  };

  const addDomain = () => {
    if (newDomain.trim()) {
      setSettings(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, newDomain.trim().toLowerCase()],
      }));
      setNewDomain('');
      setShowDomainDialog(false);
      setHasUnsavedChanges(true);
    }
  };

  const removeDomain = (domain: string) => {
    setSettings(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const getFilterLevelDescription = (level: string) => {
    switch (level) {
      case 'strict':
        return 'Blocks most content, only allows pre-approved educational materials';
      case 'moderate':
        return 'Balanced filtering with age-appropriate content screening';
      case 'relaxed':
        return 'Minimal filtering, allows most age-appropriate content';
      default:
        return '';
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading parental controls...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<SecurityIcon />}
          title="Parental Controls"
          subheader={`Settings for child (Age ${childAge})`}
          action={
            !readOnly && hasUnsavedChanges && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSettings(currentSettings);
                    setHasUnsavedChanges(false);
                  }}
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={saveSettingsMutation.isPending}
                  startIcon={<SaveIcon />}
                >
                  Save Changes
                </Button>
              </Box>
            )
          }
        />
      </Card>

      <Grid container spacing={3}>
        {/* Content Filtering */}
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<BlockIcon />}
              title="Content Filtering"
              subheader="Control what content your child can access"
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Filter Level: {settings.contentFilterLevel}
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={settings.contentFilterLevel === 'strict' ? 0 : settings.contentFilterLevel === 'moderate' ? 1 : 2}
                    onChange={(_, value) => {
                      const levels = ['strict', 'moderate', 'relaxed'];
                      handleSettingChange('contentFilterLevel', levels[value as number]);
                    }}
                    min={0}
                    max={2}
                    step={1}
                    marks={[
                      { value: 0, label: 'Strict' },
                      { value: 1, label: 'Moderate' },
                      { value: 2, label: 'Relaxed' },
                    ]}
                    disabled={readOnly}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {getFilterLevelDescription(settings.contentFilterLevel)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Blocked Keywords
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {settings.blockedKeywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      size="small"
                      onDelete={readOnly ? undefined : () => removeKeyword(keyword)}
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
                {!readOnly && (
                  <Button
                    size="small"
                    onClick={() => setShowKeywordDialog(true)}
                    startIcon={<AddIcon />}
                  >
                    Add Keyword
                  </Button>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Allowed Domains
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {settings.allowedDomains.map((domain, index) => (
                    <Chip
                      key={index}
                      label={domain}
                      size="small"
                      onDelete={readOnly ? undefined : () => removeDomain(domain)}
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
                {!readOnly && (
                  <Button
                    size="small"
                    onClick={() => setShowDomainDialog(true)}
                    startIcon={<AddIcon />}
                  >
                    Add Domain
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Controls */}
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<ScheduleIcon />}
              title="Session Controls"
              subheader="Manage screen time and session limits"
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Session Time Limit: {settings.sessionTimeLimit} minutes
                </Typography>
                <Slider
                  value={settings.sessionTimeLimit}
                  onChange={(_, value) => handleSettingChange('sessionTimeLimit', value)}
                  min={15}
                  max={180}
                  step={15}
                  marks={[
                    { value: 15, label: '15m' },
                    { value: 60, label: '1h' },
                    { value: 120, label: '2h' },
                    { value: 180, label: '3h' },
                  ]}
                  disabled={readOnly}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.breakReminders}
                    onChange={(e) => handleSettingChange('breakReminders', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="Break Reminders"
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Maximum Volume: {settings.maxVolumeLevel}%
                </Typography>
                <Slider
                  value={settings.maxVolumeLevel}
                  onChange={(_, value) => handleSettingChange('maxVolumeLevel', value)}
                  min={0}
                  max={100}
                  step={10}
                  disabled={readOnly}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.videoAutoplay}
                    onChange={(e) => handleSettingChange('videoAutoplay', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="Video Autoplay"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Approval Requirements */}
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<VisibilityIcon />}
              title="Approval Requirements"
              subheader="Choose what requires parental approval"
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireApprovalFor.newContent}
                    onChange={(e) => handleNestedSettingChange('requireApprovalFor', 'newContent', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="New Content"
                sx={{ mb: 1, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireApprovalFor.externalLinks}
                    onChange={(e) => handleNestedSettingChange('requireApprovalFor', 'externalLinks', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="External Links"
                sx={{ mb: 1, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireApprovalFor.socialFeatures}
                    onChange={(e) => handleNestedSettingChange('requireApprovalFor', 'socialFeatures', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="Social Features"
                sx={{ mb: 1, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.parentalNotifications}
                    onChange={(e) => handleSettingChange('parentalNotifications', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="Parental Notifications"
                sx={{ mb: 1, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.aiAssistanceEnabled}
                    onChange={(e) => handleSettingChange('aiAssistanceEnabled', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="AI Assistance"
                sx={{ display: 'block' }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Time Restrictions */}
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<ScheduleIcon />}
              title="Time Restrictions"
              subheader="Set allowed usage times"
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.timeRestrictions.enabled}
                    onChange={(e) => handleNestedSettingChange('timeRestrictions', 'enabled', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="Enable Time Restrictions"
                sx={{ mb: 2, display: 'block' }}
              />

              {settings.timeRestrictions.enabled && (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid xs={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="time"
                        value={settings.timeRestrictions.allowedHours.start}
                        onChange={(e) => handleNestedSettingChange('timeRestrictions', 'allowedHours', {
                          ...settings.timeRestrictions.allowedHours,
                          start: e.target.value,
                        })}
                        disabled={readOnly}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid xs={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="time"
                        value={settings.timeRestrictions.allowedHours.end}
                        onChange={(e) => handleNestedSettingChange('timeRestrictions', 'allowedHours', {
                          ...settings.timeRestrictions.allowedHours,
                          end: e.target.value,
                        })}
                        disabled={readOnly}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Allowed Days
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                      <Chip
                        key={dayIndex}
                        label={getDayName(dayIndex)}
                        size="small"
                        color={settings.timeRestrictions.allowedDays.includes(dayIndex) ? 'primary' : 'default'}
                        onClick={readOnly ? undefined : () => {
                          const newDays = settings.timeRestrictions.allowedDays.includes(dayIndex)
                            ? settings.timeRestrictions.allowedDays.filter(d => d !== dayIndex)
                            : [...settings.timeRestrictions.allowedDays, dayIndex];
                          
                          handleNestedSettingChange('timeRestrictions', 'allowedDays', newDays);
                        }}
                        variant={settings.timeRestrictions.allowedDays.includes(dayIndex) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Keyword Dialog */}
      <Dialog
        open={showKeywordDialog}
        onClose={() => setShowKeywordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Blocked Keyword</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            helperText="Enter a word or phrase to block in content"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeywordDialog(false)}>
            Cancel
          </Button>
          <Button onClick={addKeyword} variant="contained" disabled={!newKeyword.trim()}>
            Add Keyword
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog
        open={showDomainDialog}
        onClose={() => setShowDomainDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Allowed Domain</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Domain"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            helperText="Enter a domain name (e.g., youtube.com, khanacademy.org)"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDomainDialog(false)}>
            Cancel
          </Button>
          <Button onClick={addDomain} variant="contained" disabled={!newDomain.trim()}>
            Add Domain
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You have unsaved changes. Don't forget to save your parental control settings.
        </Alert>
      )}
    </Box>
  );
};

export default ParentalControls;