import React from 'react';
import { Achievement } from '../../types/activity';
import { useTheme } from '../../theme/ThemeContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Paper,
  Avatar,
  CircularProgress,
  Zoom,
  Grow,
  Slide
} from '@mui/material';
import { keyframes } from '@mui/system';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { TransitionProps } from '@mui/material/transitions';

interface ActivityCompletionModalProps {
  score: number;
  feedback: string;
  achievements: Achievement[];
  onContinue: () => void;
}

// Define bounce animation
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

// Slide up transition for dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ActivityCompletionModal: React.FC<ActivityCompletionModalProps> = ({
  score,
  feedback,
  achievements,
  onContinue
}) => {
  const { theme } = useTheme();

  // Determine celebration level based on score
  const getCelebrationContent = () => {
    if (score >= 90) {
      return {
        icon: <CelebrationIcon fontSize="large" />,
        title: 'Amazing Job!',
        color: theme.palette.success.main,
        bgColor: theme.palette.success.light,
        textColor: theme.palette.success.dark
      };
    } else if (score >= 70) {
      return {
        icon: <StarIcon fontSize="large" />,
        title: 'Great Work!',
        color: theme.palette.info.main,
        bgColor: theme.palette.info.light,
        textColor: theme.palette.info.dark
      };
    } else if (score >= 50) {
      return {
        icon: <ThumbUpIcon fontSize="large" />,
        title: 'Good Effort!',
        color: theme.palette.warning.main,
        bgColor: theme.palette.warning.light,
        textColor: theme.palette.warning.dark
      };
    } else {
      return {
        icon: <FitnessCenterIcon fontSize="large" />,
        title: 'Keep Practicing!',
        color: theme.palette.error.main,
        bgColor: theme.palette.error.light,
        textColor: theme.palette.error.dark
      };
    }
  };

  const celebration = getCelebrationContent();

  // Get achievement icon based on type
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'badge':
        return <MilitaryTechIcon fontSize="large" />;
      case 'milestone':
        return <EmojiEventsIcon fontSize="large" />;
      case 'streak':
        return <LocalFireDepartmentIcon fontSize="large" />;
      default:
        return <StarIcon fontSize="large" />;
    }
  };

  // Get achievement color based on type
  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'badge':
        return theme.palette.primary.main;
      case 'milestone':
        return theme.palette.secondary.main;
      case 'streak':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Dialog
      open={true}
      TransitionComponent={Transition}
      keepMounted
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 8,
        sx: {
          borderRadius: 4,
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Score and Feedback Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              textAlign: 'center',
              borderRadius: 3,
              backgroundColor: `${celebration.bgColor}30`,
              border: `2px solid ${celebration.color}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated background circles for visual interest */}
            <Box
              sx={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: `${celebration.color}20`,
                top: '-30px',
                right: '-30px',
                zIndex: 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: `${celebration.color}15`,
                bottom: '-20px',
                left: '-20px',
                zIndex: 0
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Animated Icon */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                  animation: `${bounce} 2s infinite`,
                  color: celebration.color
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: `${celebration.color}30`,
                    color: celebration.color,
                    mb: 2
                  }}
                >
                  {celebration.icon}
                </Avatar>
              </Box>

              <Typography variant="h4" fontWeight="bold" color={celebration.textColor} gutterBottom>
                {celebration.title}
              </Typography>

              {/* Score Display */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={score}
                  size={100}
                  thickness={4}
                  sx={{
                    color: celebration.color,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                      transition: 'stroke-dashoffset 1s ease-in-out'
                    }
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color={celebration.textColor}>
                    {score}
                  </Typography>
                  <Typography variant="caption" color={celebration.textColor}>
                    points
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" color="text.secondary">
                {feedback}
              </Typography>
            </Box>
          </Paper>

          {/* Achievements Section */}
          {achievements.length > 0 && (
            <Box mb={3}>
              <Typography
                variant="h5"
                fontWeight="bold"
                textAlign="center"
                color="primary"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 3
                }}
              >
                <EmojiEventsIcon color="primary" /> Achievements Unlocked!
              </Typography>

              <Grid container spacing={2}>
                {achievements.map((achievement, index) => (
                  <Grid item xs={12} sm={6} key={achievement.id}>
                    <Grow in={true} timeout={500 + index * 200}>
                      <Card
                        elevation={3}
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          },
                          backgroundColor: `${getAchievementColor(achievement.type)}15`,
                          border: `1px solid ${getAchievementColor(achievement.type)}30`
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Zoom in={true} timeout={700 + index * 200}>
                            <Avatar
                              sx={{
                                width: 60,
                                height: 60,
                                mx: 'auto',
                                mb: 2,
                                backgroundColor: getAchievementColor(achievement.type),
                                color: '#fff'
                              }}
                            >
                              {achievement.iconUrl ? (
                                <img src={achievement.iconUrl} alt={achievement.title} width="32" height="32" />
                              ) : (
                                getAchievementIcon(achievement.type)
                              )}
                            </Avatar>
                          </Zoom>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {achievement.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {achievement.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grow>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onContinue}
          sx={{
            px: 4,
            py: 1,
            borderRadius: 8,
            fontWeight: 'bold',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)'
            },
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityCompletionModal;