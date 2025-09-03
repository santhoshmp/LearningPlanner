import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Avatar,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as NotStartedIcon,
  PlayCircle as InProgressIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';

interface ProficiencyIndicatorsProps {
  subjectProficiencies: SubjectProficiency[];
  compact?: boolean;
  showTrends?: boolean;
  maxDisplay?: number;
}

interface SubjectProficiency {
  subjectId: string;
  subjectName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  proficiencyScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  confidenceLevel: number;
  topicsCompleted?: number;
  totalTopics?: number;
}

const ProficiencyIndicators: React.FC<ProficiencyIndicatorsProps> = ({
  subjectProficiencies,
  compact = false,
  showTrends = true,
  maxDisplay
}) => {
  const theme = useTheme();

  const getProficiencyColor = (level: string): string => {
    switch (level) {
      case 'mastery': return theme.palette.success.main;
      case 'advanced': return theme.palette.info.main;
      case 'intermediate': return theme.palette.warning.main;
      case 'beginner': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getProficiencyIcon = (level: string) => {
    switch (level) {
      case 'mastery': return <StarIcon />;
      case 'advanced': return <TrendingUpIcon />;
      case 'intermediate': return <SchoolIcon />;
      case 'beginner': return <TrendingDownIcon />;
      default: return <SchoolIcon />;
    }
  };

  const getTrendIcon = (trend: string, size: 'small' | 'medium' = 'small') => {
    const iconProps = { fontSize: size };
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" {...iconProps} />;
      case 'down': return <TrendingDownIcon color="error" {...iconProps} />;
      case 'stable': return <TrendingFlatIcon color="action" {...iconProps} />;
      default: return <TrendingFlatIcon color="action" {...iconProps} />;
    }
  };

  const displayedSubjects = maxDisplay 
    ? subjectProficiencies.slice(0, maxDisplay)
    : subjectProficiencies;

  if (compact) {
    return (
      <Box>
        <Grid container spacing={1}>
          {displayedSubjects.map((subject) => (
            <Grid item xs={12} sm={6} md={4} key={subject.subjectId}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {subject.subjectName}
                    </Typography>
                    <Typography variant="caption">
                      Level: {subject.proficiencyLevel}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      Score: {Math.round(subject.proficiencyScore)}%
                    </Typography>
                    {subject.topicsCompleted !== undefined && (
                      <>
                        <br />
                        <Typography variant="caption">
                          Topics: {subject.topicsCompleted}/{subject.totalTopics}
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              >
                <Card 
                  sx={{ 
                    p: 1,
                    background: `linear-gradient(135deg, ${alpha(getProficiencyColor(subject.proficiencyLevel), 0.1)}, ${alpha(getProficiencyColor(subject.proficiencyLevel), 0.05)})`,
                    border: `1px solid ${alpha(getProficiencyColor(subject.proficiencyLevel), 0.2)}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: getProficiencyColor(subject.proficiencyLevel),
                        fontSize: '0.75rem'
                      }}
                    >
                      {getProficiencyIcon(subject.proficiencyLevel)}
                    </Avatar>
                    <Box flexGrow={1} minWidth={0}>
                      <Typography variant="caption" noWrap>
                        {subject.subjectName}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={subject.proficiencyScore}
                        size="small"
                        sx={{ 
                          height: 3, 
                          borderRadius: 2,
                          bgcolor: alpha(getProficiencyColor(subject.proficiencyLevel), 0.2),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getProficiencyColor(subject.proficiencyLevel)
                          }
                        }}
                      />
                    </Box>
                    {showTrends && getTrendIcon(subject.trendDirection, 'small')}
                  </Box>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {displayedSubjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.subjectId}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getProficiencyColor(subject.proficiencyLevel),
                      width: 40,
                      height: 40
                    }}
                  >
                    {getProficiencyIcon(subject.proficiencyLevel)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" noWrap>
                      {subject.subjectName}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        size="small"
                        label={subject.proficiencyLevel}
                        sx={{ 
                          bgcolor: getProficiencyColor(subject.proficiencyLevel),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      {showTrends && getTrendIcon(subject.trendDirection)}
                    </Box>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Proficiency
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(subject.proficiencyScore)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={subject.proficiencyScore}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: alpha(getProficiencyColor(subject.proficiencyLevel), 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getProficiencyColor(subject.proficiencyLevel)
                      }
                    }}
                  />
                </Box>

                {subject.topicsCompleted !== undefined && (
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Topics Completed
                      </Typography>
                      <Typography variant="body2">
                        {subject.topicsCompleted}/{subject.totalTopics}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={subject.totalTopics ? (subject.topicsCompleted / subject.totalTopics) * 100 : 0}
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.2)
                      }}
                    />
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Confidence: {Math.round(subject.confidenceLevel * 100)}%
                  </Typography>
                  {subject.proficiencyLevel === 'mastery' && (
                    <SparkleIcon color="warning" fontSize="small" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProficiencyIndicators;