import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  InputAdornment,
  Switch,
  Box,
  Radio,
  RadioGroup,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  VpnKey as KeyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { CreateChildProfileData, LEARNING_STYLES } from '../../types/child';
import { childProfileApi } from '../../services/api';
import { GradeSelector } from '../common';
import toast from 'react-hot-toast';

const createChildSchema = z.object({
  name: z.string().min(1, 'Child name is required').max(50, 'Name must not exceed 50 characters'),
  age: z.number().min(3, 'Child must be at least 3 years old').max(18, 'Child must be 18 years old or younger'),
  gradeLevel: z.string().min(1, 'Please select a grade level'),
  learningStyle: z.enum(['VISUAL', 'AUDITORY', 'KINESTHETIC', 'MIXED'], { required_error: 'Please select a learning style' }),
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  pin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers'),
  confirmPin: z.string(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'colorful']).default('colorful'),
    soundEnabled: z.boolean().default(true),
    animationsEnabled: z.boolean().default(true),
    difficultyPreference: z.enum(['easy', 'medium', 'hard', 'adaptive']).default('adaptive'),
  }).default({}),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

type CreateChildFormData = z.infer<typeof createChildSchema>;

interface CreateChildFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateChildForm: React.FC<CreateChildFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateChildFormData>({
    resolver: zodResolver(createChildSchema),
    defaultValues: {
      preferences: {
        theme: 'colorful',
        soundEnabled: true,
        animationsEnabled: true,
        difficultyPreference: 'adaptive',
      },
    },
  });

  const onSubmit = async (data: CreateChildFormData) => {
    try {
      const { confirmPin, ...childData } = data;
      await childProfileApi.createChild(childData as CreateChildProfileData);
      toast.success('Child profile created successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Child profile creation error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to create child profile';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Add New Child
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          {/* Basic Information Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Basic Information
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Child's Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />

              <Box sx={{
                display: 'flex',
                gap: 3,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Box sx={{ flex: '0 0 120px' }}>
                  <Controller
                    name="age"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Age"
                        type="number"
                        fullWidth
                        error={!!errors.age}
                        helperText={errors.age?.message}
                        variant="outlined"
                        inputProps={{ min: 3, max: 18 }}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white'
                          }
                        }}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Controller
                    name="gradeLevel"
                    control={control}
                    render={({ field }) => (
                      <Box sx={{
                        '& .MuiFormControl-root': {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white'
                          }
                        }
                      }}>
                        <GradeSelector
                          value={field.value}
                          onChange={field.onChange}
                          label="Grade Level"
                          required
                          error={!!errors.gradeLevel}
                          helperText={errors.gradeLevel?.message}
                          showAgeRange
                          fullWidth
                        />
                      </Box>
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Learning Style Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PsychologyIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Learning Style
              </Typography>
            </Box>

            <Controller
              name="learningStyle"
              control={control}
              render={({ field }) => (
                <FormControl component="fieldset" error={!!errors.learningStyle} fullWidth>
                  <RadioGroup {...field}>
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2
                    }}>
                      {LEARNING_STYLES.map((style) => (
                        <Paper
                          key={style.value}
                          elevation={field.value === style.value ? 3 : 1}
                          sx={{
                            p: 2.5,
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: field.value === style.value ? 'primary.main' : 'transparent',
                            backgroundColor: field.value === style.value ? 'primary.50' : 'white',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.50',
                              transform: 'translateY(-2px)',
                            },
                          }}
                          onClick={() => field.onChange(style.value)}
                        >
                          <FormControlLabel
                            value={style.value}
                            control={<Radio sx={{ alignSelf: 'flex-start' }} />}
                            label={
                              <Box sx={{ ml: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {style.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {style.description}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', m: 0, alignItems: 'flex-start' }}
                          />
                        </Paper>
                      ))}
                    </Box>
                  </RadioGroup>
                  {errors.learningStyle && (
                    <FormHelperText error sx={{ mt: 1, ml: 2 }}>
                      {errors.learningStyle.message}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Paper>

          {/* Login Credentials Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <KeyIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Login Credentials
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{
                display: 'flex',
                gap: 3,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Username"
                      fullWidth
                      error={!!errors.username}
                      helperText={errors.username?.message}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white'
                        }
                      }}
                    />
                  )}
                />

                <Controller
                  name="pin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="PIN (4 digits)"
                      type={showPin ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.pin}
                      helperText={errors.pin?.message}
                      variant="outlined"
                      inputProps={{ maxLength: 4 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white'
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle pin visibility"
                              onClick={() => setShowPin(!showPin)}
                              edge="end"
                            >
                              {showPin ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Controller
                name="confirmPin"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm PIN"
                    type={showConfirmPin ? 'text' : 'password'}
                    fullWidth
                    error={!!errors.confirmPin}
                    helperText={errors.confirmPin?.message}
                    variant="outlined"
                    inputProps={{ maxLength: 4 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white'
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm pin visibility"
                            onClick={() => setShowConfirmPin(!showConfirmPin)}
                            edge="end"
                          >
                            {showConfirmPin ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Paper>

          {/* Preferences Section */}
          <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Preferences
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{
                display: 'flex',
                gap: 3,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Controller
                  name="preferences.theme"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        {...field}
                        label="Theme"
                        sx={{
                          borderRadius: 2,
                          backgroundColor: 'white'
                        }}
                      >
                        <MenuItem value="colorful">🎨 Colorful</MenuItem>
                        <MenuItem value="light">☀️ Light</MenuItem>
                        <MenuItem value="dark">🌙 Dark</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="preferences.difficultyPreference"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Difficulty Preference</InputLabel>
                      <Select
                        {...field}
                        label="Difficulty Preference"
                        sx={{
                          borderRadius: 2,
                          backgroundColor: 'white'
                        }}
                      >
                        <MenuItem value="adaptive">🎯 Adaptive</MenuItem>
                        <MenuItem value="easy">😊 Easy</MenuItem>
                        <MenuItem value="medium">🤔 Medium</MenuItem>
                        <MenuItem value="hard">💪 Hard</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>

              <Paper sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                <Box sx={{
                  display: 'flex',
                  gap: 4,
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-around'
                }}>
                  <Controller
                    name="preferences.soundEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>🔊</span>
                            <span>Enable sound effects</span>
                          </Box>
                        }
                        sx={{
                          flex: 1,
                          '& .MuiFormControlLabel-label': {
                            fontWeight: 500
                          }
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="preferences.animationsEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>✨</span>
                            <span>Enable animations</span>
                          </Box>
                        }
                        sx={{
                          flex: 1,
                          '& .MuiFormControlLabel-label': {
                            fontWeight: 500
                          }
                        }}
                      />
                    )}
                  />
                </Box>
              </Paper>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 4,
        py: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 2
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          size="large"
          sx={{
            borderRadius: 2,
            px: 4
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
          size="large"
          sx={{
            borderRadius: 2,
            px: 4
          }}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        >
          {isSubmitting ? 'Creating...' : 'Create Child Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChildForm;