import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import ChildSkillLevels from './ChildSkillLevels';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as KeyIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Circle as CircleIcon,
  TrendingUp as SkillsIcon,
} from '@mui/icons-material';
import { ChildProfile, LEARNING_STYLES } from '../../types/child';
import { childProfileApi } from '../../services/api';
import toast from 'react-hot-toast';

interface ChildProfileCardProps {
  child: ChildProfile;
  onEdit: (child: ChildProfile) => void;
  onDelete: (childId: string) => void;
  onUpdateCredentials: (child: ChildProfile) => void;
}

const ChildProfileCard: React.FC<ChildProfileCardProps> = ({
  child,
  onEdit,
  onDelete,
  onUpdateCredentials,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

  const learningStyleInfo = LEARNING_STYLES.find(style => style.value === child.learningStyle);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${child.name}'s profile? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await childProfileApi.deleteChild(child.id);
      toast.success(`${child.name}'s profile has been deleted`);
      onDelete(child.id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete child profile';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      handleMenuClose();
    }
  };

  const getThemeColors = () => {
    switch (child.preferences.theme) {
      case 'colorful':
        return 'linear-gradient(135deg, #9c27b0 0%, #f48fb1 100%)';
      case 'dark':
        return 'linear-gradient(135deg, #424242 0%, #212121 100%)';
      case 'light':
      default:
        return 'linear-gradient(135deg, #2196f3 0%, #3f51b5 100%)';
    }
  };

  const getAvatarInitials = () => {
    return child.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {getAvatarInitials()}
          </Avatar>
        }
        action={
          <IconButton 
            aria-label="settings" 
            onClick={handleMenuOpen}
            sx={{ color: 'white' }}
          >
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            {child.name}
          </Typography>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            @{child.username}
          </Typography>
        }
        sx={{
          background: getThemeColors(),
          color: 'white',
          '& .MuiCardHeader-subheader': {
            color: 'rgba(255, 255, 255, 0.8)',
          },
        }}
      />
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Age: {child.age}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Grade: {child.gradeLevel}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', mb: 2 }}>
          <PsychologyIcon fontSize="small" color="action" sx={{ mt: 0.3, mr: 1 }} />
          <Box>
            <Typography variant="body2" color="text.secondary" component="span">
              Learning Style:{' '}
            </Typography>
            <Typography variant="body2" fontWeight="medium" component="span">
              {learningStyleInfo?.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {learningStyleInfo?.description}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Preferences
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Theme: <Box component="span" sx={{ textTransform: 'capitalize' }}>{child.preferences.theme}</Box>
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Difficulty: <Box component="span" sx={{ textTransform: 'capitalize' }}>{child.preferences.difficultyPreference}</Box>
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Sound: {child.preferences.soundEnabled ? 'On' : 'Off'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Animations: {child.preferences.animationsEnabled ? 'On' : 'Off'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircleIcon 
              sx={{ 
                fontSize: 10, 
                mr: 1, 
                color: child.isActive ? 'success.main' : 'text.disabled' 
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              {child.isActive ? 'Active' : 'Inactive'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled">
            Created {new Date(child.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => {
            onEdit(child);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Profile</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            onUpdateCredentials(child);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Credentials</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setSkillsDialogOpen(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <SkillsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Skills</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleDelete}
          disabled={isDeleting}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{isDeleting ? 'Deleting...' : 'Delete Profile'}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Skills Dialog */}
      <Dialog
        open={skillsDialogOpen}
        onClose={() => setSkillsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {child.name}'s Skill Levels
        </DialogTitle>
        <DialogContent>
          <ChildSkillLevels childId={child.id} child={child} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ChildProfileCard;