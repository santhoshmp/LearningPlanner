import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';
import {
  ChildCare as ChildIcon,
  Security as SecurityIcon,
  Schedule as TimeIcon,
  Block as BlockIcon,
  Notifications as NotificationIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { childProfileApi } from '../../services/api';
import { ChildProfile } from '../../types/child';

interface ChildSafetySettingsProps {
  settings: any;
  onSettingsUpdate: (settings: any) => void;
}

const CONTENT_FILTER_LEVELS = [
  {
    value: 'strict',
    label: 'Strict',
    description: 'Maximum filtering with only pre-approved educational content',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced filtering suitable for most children',
  },
  {
    value: 'relaxed',
    label: 'Relaxed',
    description: 'Minimal filtering with basic safety checks',
  },
];

const TIME_LIMIT_PRESETS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 0, label: 'No limit' },
];

const ChildSafetySettings: React.FC<ChildSafetySettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [childSettings, setChildSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockedWordsDialog, setBlockedWordsDialog] = useState(false);
  const [newBlockedWord, setNewBlockedWord] = useState('');
  const [blockedWords, setBlockedWords] = useState<string[]>([]);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild && children.length > 0) {
      loadChildSettings(selectedChild);
    }
  }, [selectedChild, children]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const childProfiles = await childProfileApi.getChildren();
      setChildren(childProfiles);
      if (childProfiles.length > 0 && !selectedChild) {
        setSelectedChild(childProfiles[0].id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
      setError('Failed to load child profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadChildSettings = async (childId: string) => {
    try {
      // In a real implementation, this would load child-specific settings
      // For now, we'll use default values
      setChildSettings({
        contentFilterLevel: 'moderate',
        sessionTimeLimit: 60,
        breakReminders: true,
        parentalNotifications: true,
        aiAssistanceEnabled: true,
        videoAutoplay: false,
        allowedTimeStart: '08:00',
        allowedTimeEnd: '20:00',
        weekendTimeLimit: 120,
        requireApprovalForNewContent: true,
        blockInappropriateContent: true,
        enableSafeSearch: true,
        allowSocialFeatures: false,
      });
      setBlockedWords(['inappropriate', 'violence', 'scary']);
    } catch (err) {
      console.error('Failed to load child settings:', err);
      setError('Failed to load child settings. Please try again.');
    }
  };

  const handleChildChange = (event: SelectChangeEvent) => {
    setSelectedChild(event.target.value);
  };

  const handleSettingChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setChildSettings((prev: any) => ({ ...prev, [field]: event.target.checked }));
  };

  const handleSelectChange = (field: string) => (event: SelectChangeEvent) => {
    setChildSettings((prev: any) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSliderChange = (field: string) => (event: Event, newValue: number | number[]) => {
    setChildSettings((prev: any) => ({ ...prev, [field]: newValue }));
  };

  const handleTimeChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setChildSettings((prev: any) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddBlockedWord = () => {
    if (newBlockedWord.trim() && !blockedWords.includes(newBlockedWord.trim().toLowerCase())) {
      setBlockedWords(prev => [...prev, newBlockedWord.trim().toLowerCase()]);
      setNewBlockedWord('');
    }
  };

  const handleRemoveBlockedWord = (word: string) => {
    setBlockedWords(prev => prev.filter(w => w !== word));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      // In a real implementation, this would save child-specific settings
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveMessage('Child safety settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save child safety settings:', err);
      setError('Failed to save child safety settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading child profiles...</Typography>
      </Box>
    );
  }

  if (children.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          <Typography variant="body1">
            No child profiles found. Create a child profile first to configure safety settings.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Child Safety & Parental Controls
      </Typography>

      {saveMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {saveMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Child Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Select Child Profile
          </Typography>
          
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel id="child-select-label">Child</InputLabel>
            <Select
              labelId="child-select-label"
              value={selectedChild}
              label="Child"
              onChange={handleChildChange}
            >
              {children.map((child) => (
                <MenuItem key={child.id} value={child.id}>
                  {child.firstName} {child.lastName} (Age {child.age})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedChild && (
        <>
          {/* Content Filtering */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Content Filtering
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Control what content your child can access and interact with.
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="content-filter-label">Content Filter Level</InputLabel>
                <Select
                  labelId="content-filter-label"
                  value={childSettings.contentFilterLevel}
                  label="Content Filter Level"
                  onChange={handleSelectChange('contentFilterLevel')}
                >
                  {CONTENT_FILTER_LEVELS.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box>
                        <Typography variant="body1">{level.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={childSettings.requireApprovalForNewContent}
                      onChange={handleSettingChange('requireApprovalForNewContent')}
                      color="primary"
                    />
                  }
                  label="Require approval for new content"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={childSettings.blockInappropriateContent}
                      onChange={handleSettingChange('blockInappropriateContent')}
                      color="primary"
                    />
                  }
                  label="Block inappropriate content automatically"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={childSettings.enableSafeSearch}
                      onChange={handleSettingChange('enableSafeSearch')}
                      color="primary"
                    />
                  }
                  label="Enable safe search for all content"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={childSettings.allowSocialFeatures}
                      onChange={handleSettingChange('allowSocialFeatures')}
                      color="primary"
                    />
                  }
                  label="Allow social features and interactions"
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  onClick={() => setBlockedWordsDialog(true)}
                >
                  Manage Blocked Words ({blockedWords.length})
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Time Management */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Time Management
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set time limits and schedules for your child's learning sessions.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Daily Time Limit: {childSettings.sessionTimeLimit} minutes
                </Typography>
                <Slider
                  value={childSettings.sessionTimeLimit}
                  onChange={handleSliderChange('sessionTimeLimit')}
                  min={0}
                  max={240}
                  step={15}
                  marks={TIME_LIMIT_PRESETS.map(preset => ({
                    value: preset.value,
                    label: preset.value === 0 ? 'No limit' : `${preset.value}m`,
                  }))}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value === 0 ? 'No limit' : `${value} min`}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Weekend Time Limit: {childSettings.weekendTimeLimit} minutes
                </Typography>
                <Slider
                  value={childSettings.weekendTimeLimit}
                  onChange={handleSliderChange('weekendTimeLimit')}
                  min={0}
                  max={360}
                  step={15}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value === 0 ? 'No limit' : `${value} min`}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Allowed Time Start"
                  type="time"
                  value={childSettings.allowedTimeStart}
                  onChange={handleTimeChange('allowedTimeStart')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  label="Allowed Time End"
                  type="time"
                  value={childSettings.allowedTimeEnd}
                  onChange={handleTimeChange('allowedTimeEnd')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={childSettings.breakReminders}
                    onChange={handleSettingChange('breakReminders')}
                    color="primary"
                  />
                }
                label="Enable break reminders"
              />
            </CardContent>
          </Card>

          {/* AI and Features */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChildIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  AI Assistance & Features
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure AI-powered features and assistance for your child.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={childSettings.aiAssistanceEnabled}
                      onChange={handleSettingChange('aiAssistanceEnabled')}
                      color="primary"
                    />
                  }
                  label="Enable AI assistance and help"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={childSettings.videoAutoplay}
                      onChange={handleSettingChange('videoAutoplay')}
                      color="primary"
                    />
                  }
                  label="Auto-play videos in activities"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Parental Notifications
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose what notifications you want to receive about your child's activity.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={childSettings.parentalNotifications}
                    onChange={handleSettingChange('parentalNotifications')}
                    color="primary"
                  />
                }
                label="Receive notifications about child's activity"
              />
            </CardContent>
          </Card>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || !selectedChild}
          sx={{ minWidth: 120 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Blocked Words Dialog */}
      <Dialog 
        open={blockedWordsDialog} 
        onClose={() => setBlockedWordsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Blocked Words</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add words or phrases that should be blocked from appearing in content for your child.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              label="Add blocked word"
              value={newBlockedWord}
              onChange={(e) => setNewBlockedWord(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddBlockedWord();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddBlockedWord}
              disabled={!newBlockedWord.trim()}
            >
              Add
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Current Blocked Words:
          </Typography>

          {blockedWords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No blocked words added yet.
            </Typography>
          ) : (
            <List dense>
              {blockedWords.map((word, index) => (
                <ListItem key={index}>
                  <ListItemText primary={word} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveBlockedWord(word)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockedWordsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChildSafetySettings;