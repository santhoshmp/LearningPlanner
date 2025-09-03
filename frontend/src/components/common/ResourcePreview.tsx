import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Skeleton,
  Alert,
  Tooltip,
  Badge,
  Avatar
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Article as ArticleIcon,
  Extension as InteractiveIcon,
  Assignment as WorksheetIcon,
  SportsEsports as GameIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { masterDataService, MasterDataResource } from '../../services/masterDataService';

interface ResourcePreviewProps {
  topicId: string;
  grade: string;
  onResourceSelect?: (resource: MasterDataResource) => void;
  selectedResources?: string[];
  maxSelections?: number;
  showPreview?: boolean;
  compact?: boolean;
}

const ResourcePreview: React.FC<ResourcePreviewProps> = ({
  topicId,
  grade,
  onResourceSelect,
  selectedResources = [],
  maxSelections,
  showPreview = true,
  compact = false
}) => {
  const [resources, setResources] = useState<MasterDataResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<MasterDataResource | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      if (!topicId) {
        setResources([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const resourceData = await masterDataService.getResourcesByTopic(topicId);
        setResources(resourceData);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setError('Failed to load resources. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [topicId]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayIcon />;
      case 'article': return <ArticleIcon />;
      case 'interactive': return <InteractiveIcon />;
      case 'worksheet': return <WorksheetIcon />;
      case 'game': return <GameIcon />;
      default: return <ArticleIcon />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'error';
      case 'article': return 'primary';
      case 'interactive': return 'secondary';
      case 'worksheet': return 'warning';
      case 'game': return 'success';
      default: return 'default';
    }
  };

  const getSafetyRatingColor = (rating: string) => {
    switch (rating) {
      case 'safe': return 'success';
      case 'moderate': return 'warning';
      case 'restricted': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const handleResourceClick = (resource: MasterDataResource) => {
    if (onResourceSelect) {
      onResourceSelect(resource);
    } else if (showPreview) {
      setPreviewResource(resource);
    }
  };

  const isResourceSelected = (resourceId: string) => {
    return selectedResources.includes(resourceId);
  };

  const canSelectMore = () => {
    return !maxSelections || selectedResources.length < maxSelections;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Learning Resources
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={24} />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={40} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (resources.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No resources available for this topic yet.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Learning Resources ({resources.length})
        </Typography>
        {onResourceSelect && maxSelections && (
          <Chip
            label={`${selectedResources.length}/${maxSelections} selected`}
            size="small"
            color={selectedResources.length > 0 ? 'primary' : 'default'}
          />
        )}
      </Box>

      <Grid container spacing={2}>
        {resources.map((resource) => {
          const isSelected = isResourceSelected(resource.id);
          const canSelect = canSelectMore() || isSelected;

          return (
            <Grid item xs={12} sm={6} md={compact ? 6 : 4} key={resource.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  opacity: onResourceSelect && !canSelect ? 0.6 : 1,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => canSelect && handleResourceClick(resource)}
              >
                {resource.thumbnailUrl && (
                  <CardMedia
                    component="img"
                    height={compact ? 100 : 140}
                    image={resource.thumbnailUrl}
                    alt={resource.title}
                    sx={{
                      objectFit: 'cover',
                      position: 'relative'
                    }}
                  />
                )}
                
                <CardContent sx={{ p: compact ? 1.5 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: `${getResourceTypeColor(resource.type)}.main`
                      }}
                    >
                      {getResourceIcon(resource.type)}
                    </Avatar>
                    <Typography
                      variant={compact ? "body2" : "subtitle2"}
                      sx={{
                        fontWeight: 600,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {resource.title}
                    </Typography>
                  </Box>

                  {!compact && resource.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {resource.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    <Chip
                      label={resource.type}
                      size="small"
                      color={getResourceTypeColor(resource.type) as any}
                      variant="outlined"
                    />
                    
                    <Chip
                      label={resource.difficulty}
                      size="small"
                      color={getDifficultyColor(resource.difficulty) as any}
                      variant="outlined"
                    />

                    {resource.duration && (
                      <Chip
                        icon={<ScheduleIcon />}
                        label={formatDuration(resource.duration)}
                        size="small"
                        variant="outlined"
                      />
                    )}

                    <Chip
                      icon={<SecurityIcon />}
                      label={resource.safetyRating}
                      size="small"
                      color={getSafetyRatingColor(resource.safetyRating) as any}
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {resource.source}
                    </Typography>
                    
                    {showPreview && (
                      <Tooltip title="Preview resource">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewResource(resource);
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Resource Preview Dialog */}
      {previewResource && (
        <Dialog
          open={!!previewResource}
          onClose={() => setPreviewResource(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getResourceIcon(previewResource.type)}
              <Typography variant="h6">
                {previewResource.title}
              </Typography>
            </Box>
            <IconButton onClick={() => setPreviewResource(null)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent>
            {previewResource.thumbnailUrl && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <img
                  src={previewResource.thumbnailUrl}
                  alt={previewResource.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                />
              </Box>
            )}

            <Typography variant="body1" paragraph>
              {previewResource.description}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label={`Type: ${previewResource.type}`}
                color={getResourceTypeColor(previewResource.type) as any}
              />
              <Chip
                label={`Difficulty: ${previewResource.difficulty}`}
                color={getDifficultyColor(previewResource.difficulty) as any}
              />
              <Chip
                label={`Safety: ${previewResource.safetyRating}`}
                color={getSafetyRatingColor(previewResource.safetyRating) as any}
              />
              {previewResource.duration && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={formatDuration(previewResource.duration)}
                />
              )}
            </Box>

            {previewResource.tags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {previewResource.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary">
              Source: {previewResource.source}
            </Typography>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setPreviewResource(null)}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(previewResource.url, '_blank')}
            >
              Open Resource
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ResourcePreview;