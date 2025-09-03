import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Button,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Article as ArticleIcon,
  PlayArrow as VideoIcon,
  OpenInNew as OpenInNewIcon,
  AccessTime as TimeIcon,
  School as DifficultyIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { educationalContentService, EducationalContent, TopicContent } from '../../services/educationalContentService';
import { masterDataService, MasterDataResource } from '../../services/masterDataService';

interface EducationalContentViewerProps {
  grade: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  onContentComplete?: (contentId: string, timeSpent: number) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// Resource Card Component for Master Data Resources
const ResourceCard: React.FC<{ 
  resource: MasterDataResource; 
  onResourceClick: (resource: MasterDataResource) => void;
}> = ({ resource, onResourceClick }) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoIcon />;
      case 'article': return <ArticleIcon />;
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

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
      onClick={() => onResourceClick(resource)}
    >
      {resource.thumbnailUrl && (
        <CardMedia
          component="img"
          height={140}
          image={resource.thumbnailUrl}
          alt={resource.title}
        />
      )}
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getResourceIcon(resource.type)}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
            {resource.title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {resource.description}
        </Typography>

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
            variant="outlined"
          />
          <Chip
            label={resource.safetyRating}
            size="small"
            color={getSafetyRatingColor(resource.safetyRating) as any}
            variant="outlined"
          />
          {resource.duration && (
            <Chip
              icon={<TimeIcon />}
              label={`${resource.duration}m`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Source: {resource.source}
        </Typography>
      </CardContent>
    </Card>
  );
};

const EducationalContentViewer: React.FC<EducationalContentViewerProps> = ({
  grade,
  subjectId,
  topicId,
  topicName,
  onContentComplete
}) => {
  const [content, setContent] = useState<TopicContent | null>(null);
  const [masterDataResources, setMasterDataResources] = useState<MasterDataResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [selectedResource, setSelectedResource] = useState<MasterDataResource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [contentStartTime, setContentStartTime] = useState<number | null>(null);

  useEffect(() => {
    fetchContent();
  }, [grade, subjectId, topicId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch both educational content and master data resources
      const [topicContent, resources] = await Promise.allSettled([
        educationalContentService.getTopicContent(grade, subjectId, topicId),
        masterDataService.getResourcesByTopic(topicId)
      ]);
      
      if (topicContent.status === 'fulfilled') {
        setContent(topicContent.value);
      } else {
        console.warn('Failed to fetch educational content:', topicContent.reason);
      }
      
      if (resources.status === 'fulfilled') {
        setMasterDataResources(resources.value);
      } else {
        console.warn('Failed to fetch master data resources:', resources.reason);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load educational content');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleContentClick = (contentItem: EducationalContent) => {
    setSelectedContent(contentItem);
    setSelectedResource(null);
    setDialogOpen(true);
    setContentStartTime(Date.now());
  };

  const handleResourceClick = (resource: MasterDataResource) => {
    setSelectedResource(resource);
    setSelectedContent(null);
    setDialogOpen(true);
    setContentStartTime(Date.now());
  };

  const handleContentOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleContentComplete = () => {
    if (contentStartTime && onContentComplete) {
      const timeSpent = Math.round((Date.now() - contentStartTime) / 1000 / 60); // Convert to minutes
      const contentId = selectedContent?.id || selectedResource?.id || '';
      onContentComplete(contentId, timeSpent);
    }
    setDialogOpen(false);
    setContentStartTime(null);
  };

  const toggleBookmark = (contentId: string) => {
    const newBookmarks = new Set(bookmarkedItems);
    if (newBookmarks.has(contentId)) {
      newBookmarks.delete(contentId);
    } else {
      newBookmarks.add(contentId);
    }
    setBookmarkedItems(newBookmarks);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Unknown duration';
    return duration < 60 ? `${duration} min` : `${Math.round(duration / 60)}h ${duration % 60}m`;
  };

  const ContentCard: React.FC<{ contentItem: EducationalContent }> = ({ contentItem }) => (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }} 
      onClick={() => handleContentClick(contentItem)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, pr: 1 }}>
            {contentItem.type === 'video' ? <VideoIcon color="error" /> : <ArticleIcon color="primary" />}
            <Typography variant="h6" component="h3">
              {contentItem.title}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(contentItem.id);
            }}
          >
            {bookmarkedItems.has(contentItem.id) ? (
              <BookmarkIcon color="primary" />
            ) : (
              <BookmarkBorderIcon />
            )}
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {contentItem.description}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip
            size="small"
            label={contentItem.type}
            color={contentItem.type === 'video' ? 'error' : 'primary'}
            variant="filled"
          />
          <Chip
            size="small"
            label={contentItem.difficulty}
            color={getDifficultyColor(contentItem.difficulty) as any}
            icon={<DifficultyIcon />}
          />
          {contentItem.duration && (
            <Chip
              size="small"
              label={formatDuration(contentItem.duration)}
              icon={<TimeIcon />}
              variant="outlined"
            />
          )}
          <Chip
            size="small"
            label="Safe"
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            label={contentItem.source}
            variant="outlined"
          />
        </Box>

        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
          {contentItem.tags.map((tag, index) => (
            <Chip
              key={index}
              size="small"
              label={tag}
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>

        <Button
          variant="outlined"
          startIcon={contentItem.type === 'video' ? <VideoIcon /> : <ArticleIcon />}
          endIcon={<OpenInNewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleContentOpen(contentItem.url);
          }}
          size="small"
        >
          {contentItem.type === 'video' ? 'Watch Video' : 'Read Article'}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
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

  if (!content || (content.articles.length === 0 && content.videos.length === 0)) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No educational content available for this topic yet. Check back later!
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Educational Resources: {topicName}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            label={`Articles (${content.articles.length})`} 
            icon={<ArticleIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`Videos (${content.videos.length})`} 
            icon={<VideoIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`Resources (${masterDataResources.length})`} 
            icon={<BookmarkIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {content.articles.length > 0 ? (
          content.articles.map((article) => (
            <ContentCard key={article.id} contentItem={article} />
          ))
        ) : (
          <Alert severity="info">No articles available for this topic.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {content.videos.length > 0 ? (
          content.videos.map((video) => (
            <ContentCard key={video.id} contentItem={video} />
          ))
        ) : (
          <Alert severity="info">No videos available for this topic.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {masterDataResources.length > 0 ? (
          <Grid container spacing={2}>
            {masterDataResources.map((resource) => (
              <Grid item xs={12} sm={6} md={4} key={resource.id}>
                <ResourceCard resource={resource} onResourceClick={handleResourceClick} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">No additional resources available for this topic.</Alert>
        )}
      </TabPanel>

      {/* Content Preview Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedContent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {selectedContent.type === 'video' ? <VideoIcon /> : <ArticleIcon />}
                {selectedContent.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedContent.description}
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  size="small"
                  label={selectedContent.difficulty}
                  color={getDifficultyColor(selectedContent.difficulty) as any}
                />
                {selectedContent.duration && (
                  <Chip
                    size="small"
                    label={formatDuration(selectedContent.duration)}
                    icon={<TimeIcon />}
                    variant="outlined"
                  />
                )}
                <Chip
                  size="small"
                  label={`Ages ${selectedContent.ageRange.min}-${selectedContent.ageRange.max}`}
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Source: {selectedContent.source}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => handleContentOpen(selectedContent.url)}
                startIcon={<OpenInNewIcon />}
              >
                Open Content
              </Button>
              <Button
                variant="outlined"
                onClick={handleContentComplete}
                color="success"
              >
                Mark as Complete
              </Button>
            </DialogActions>
          </>
        )}

        {selectedResource && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {selectedResource.type === 'video' ? <VideoIcon /> : <ArticleIcon />}
                {selectedResource.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedResource.thumbnailUrl && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img
                    src={selectedResource.thumbnailUrl}
                    alt={selectedResource.title}
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
                {selectedResource.description}
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  size="small"
                  label={selectedResource.type}
                  color="primary"
                />
                <Chip
                  size="small"
                  label={selectedResource.difficulty}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={selectedResource.safetyRating}
                  color={selectedResource.safetyRating === 'safe' ? 'success' : 'warning'}
                />
                {selectedResource.duration && (
                  <Chip
                    size="small"
                    label={`${selectedResource.duration}m`}
                    icon={<TimeIcon />}
                    variant="outlined"
                  />
                )}
              </Box>

              {selectedResource.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedResource.tags.map((tag, index) => (
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
                Source: {selectedResource.source}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => handleContentOpen(selectedResource.url)}
                startIcon={<OpenInNewIcon />}
              >
                Open Resource
              </Button>
              <Button
                variant="outlined"
                onClick={handleContentComplete}
                color="success"
              >
                Mark as Complete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EducationalContentViewer;