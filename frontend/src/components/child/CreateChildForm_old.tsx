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
  Divider,
  Box,
  Radio,
  RadioGroup,
  CircularProgress,
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
import { CreateChildProfileData, GRADE_LEVELS, LEARNING_STYLES } from '../../types/child';
import { childProfileApi } from '../../services/api';
import toast from 'react-hot-toast';

const createChildSchema = z.object({
  name: z.string().min(1, 'Child name is required').max(50, 'Name must not exceed 50 characters'),
  age: z.number().min(3, 'Child must be at least 3 years old').max(18, 'Child must be 18 years old or younger'),
  gradeLevel: z.enum(GRADE_LEVELS, { required_error: 'Please select a grade level' }),
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
    watch,
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
      console.log('Submitting child data:', childData);
      console.log('Access token:', localStorage.getItem('accessToken'));
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

  // Debug: Check if GRADE_LEVELS is loaded
  React.useEffect(() => {
    console.log('GRADE_LEVELS:', GRADE_LEVELS);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Add New Child</Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Basic Information</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  />
                )}
              />

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                    />
                  )}
                />

                <Controller
                  name="gradeLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Grade Level"
                      fullWidth
                      error={!!errors.gradeLevel}
                      helperText={errors.gradeLevel?.message}
                      variant="outlined"
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Select grade</em>
                      </MenuItem>
                      {GRADE_LEVELS.map((grade) => (
                        <MenuItem key={grade} value={grade}>
                          {grade}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Learning Style */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PsychologyIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Learning Style</Typography>
            </Box>

            <Controller
              name="learningStyle"
              control={control}
              render={({ field }) => (
                <FormControl component="fieldset" error={!!errors.learningStyle} fullWidth>
                  <RadioGroup
                    {...field}
                    sx={{ width: '100%' }}
                  >
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2
                    }}>
                      {LEARNING_STYLES.map((style) => (
                        <Box
                          key={style.value}
                          sx={{
                            border: '1px solid',
                            borderColor: field.value === style.value ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            p: 2,
                            position: 'relative',
                            boxShadow: field.value === style.value ? 2 : 0,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'flex-start',
                            '&:hover': {
                              borderColor: 'primary.main',
                              cursor: 'pointer',
                            },
                          }}
                          onClick={() => field.onChange(style.value)}
                        >
                          <FormControlLabel
                            value={style.value}
                            control={<Radio />}
                            label={
                              <Box>
                                <Typography variant="subtitle1">{style.label}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {style.description}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', m: 0 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </RadioGroup>
                  {errors.learningStyle && (
                    <FormHelperText error>{errors.learningStyle.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Login Credentials */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <KeyIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Login Credentials</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Preferences */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SettingsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Preferences</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Controller
                  name="preferences.theme"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        {...field}
                        label="Theme"
                      >
                        <MenuItem value="colorful">Colorful</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
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
                      >
                        <MenuItem value="adaptive">Adaptive</MenuItem>
                        <MenuItem value="easy">Easy</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="hard">Hard</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Controller
                  name="preferences.soundEnabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label="Enable sound effects"
                      sx={{ flex: 1 }}
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
                        />
                      }
                      label="Enable animations"
                      sx={{ flex: 1 }}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        >
          {isSubmitting ? 'Creating...' : 'Create Child Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChildForm;