import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Pagination,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  Extension as ExtensionIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SubjectSelector } from '../common';

interface StudyContent {
  id: string;
  activityId: string;
  contentType: 'video' | 'article' | 'interactive';
  title: string;
  description: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration: number;
  difficultyLevel: number;
  ageAppropriate: {
    min: number;
    max: number;
  };
  safetyRating: 'safe' | 'review_needed' | 'blocked';
  sourceAttribution: string;
  metadata: {
    tags: string[];
    subject: string;
    curriculum: string[];
  };
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContentFilters {
  search: string;
  contentType: string;
  subject: string;
  ageRange: [number, number];
  safetyRating: string;
  difficultyLevel: string;
  duration: string;
  bookmarked: boolean;
}

interface ContentLibraryProps {
  childId: string;
  childAge: number;
  onContentSelect?: (content: StudyContent) => void;
  showBookmarksOnly?: boolean;
  compactView?: boolean;
}

const ContentLibrary: React.FC<ContentLibraryProps> = ({
  childId,
  childAge,
  onContentSelect,
  showBookmarksOnly = false,
  compactView = false,
}) => {
  const queryClient = useQueryClient();
  
  // State
  const [filters, setFilters] = useState<ContentFilters>({
    search: '',
    contentType: '',
    subject: '',
    ageRange: [Math.max(5, childAge - 2), Math.min(18, childAge + 2)],
    safetyRating: '',
    difficultyLevel: '',
    duration: '',
    bookmarked: showBookmarksOnly,
  });
  
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [activeTab, setActiveTab] = useState(0);
  
  // Menu states
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Fetch content
  const { data: contentData, isLoading, error } = useQuery({
    queryKey: ['content', childId, filters, sortBy, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        childId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            if (key === 'ageRange') {
              acc.minAge = value[0].toString();
              acc.maxAge = value[1].toString();
            } else {
              acc[key] = Array.isArray(value) ? value.join(',') : value.toString();
            }
          }
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/content/library?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      return response.json();
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ contentId, bookmark }: { contentId: string; bookmark: boolean }) => {
      const response = await fetch(`/api/content/${contentId}/bookmark`, {
        method: bookmark ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ childId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success(variables.bookmark ? 'Content bookmarked!' : 'Bookmark removed');
    },
    onError: () => {
      toast.error('Failed to update bookmark');
    },
  });

  // Filter content based on active tab
  const filteredContent = useMemo(() => {
    if (!contentData?.content) return [];
    
    let filtered = contentData.content;
    
    // Apply tab filter
    switch (activeTab) {
      case 1: // Videos
        filtered = filtered.filter((item: StudyContent) => item.contentType === 'video');
        break;
      case 2: // Articles
        filtered = filtered.filter((item: StudyContent) => item.contentType === 'article');
        break;
      case 3: // Interactive
        filtered = filtered.filter((item: StudyContent) => item.contentType === 'interactive');
        break;
      case 4: // Bookmarks
        filtered = filtered.filter((item: StudyContent) => item.isBookmarked);
        break;
      default: // All
        break;
    }
    
    return filtered;
  }, [contentData?.content, activeTab]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ContentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', event.target.value);
  };

  const handleSubjectChange = (event: SelectChangeEvent) => {
    handleFilterChange('subject', event.target.value);
  };

  const handleContentTypeChange = (event: SelectChangeEvent) => {
    handleFilterChange('contentType', event.target.value);
  };

  const handleSafetyRatingChange = (event: SelectChangeEvent) => {
    handleFilterChange('safetyRating', event.target.value);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      contentType: '',
      subject: '',
      ageRange: [Math.max(5, childAge - 2), Math.min(18, childAge + 2)],
      safetyRating: '',
      difficultyLevel: '',
      duration: '',
      bookmarked: showBookmarksOnly,
    });
    setCurrentPage(1);
  };

  const handleBookmark = (content: StudyContent) => {
    bookmarkMutation.mutate({
      contentId: content.id,
      bookmark: !content.isBookmarked,
    });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayArrowIcon sx={{ color: 'error.main' }} />;
      case 'article':
        return <ArticleIcon sx={{ color: 'info.main' }} />;
      case 'interactive':
        return <ExtensionIcon sx={{ color: 'success.main' }} />;
      default:
        return <SchoolIcon />;
    }
  };

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case 'safe':
        return 'success';
      case 'review_needed':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (duration: number, type: string) => {
    if (type === 'video') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${Math.ceil(duration / 60)} min read`;
    }
  };

  const renderContentCard = (content: StudyContent) => {
    if (compactView || viewMode === 'list') {
      return (
        <Card key={content.id} sx={{ mb: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                {getContentIcon(content.contentType)}
                <Box sx={{ ml: 1, minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {content.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {content.description}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={formatDuration(content.duration, content.contentType)}
                  icon={<ScheduleIcon />}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={content.safetyRating}
                  color={getSafetyColor(content.safetyRating) as any}
                  icon={<SecurityIcon />}
                />
                <IconButton
                  size="small"
                  onClick={() => handleBookmark(content)}
                  color={content.isBookmarked ? 'primary' : 'default'}
                >
                  {content.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onContentSelect?.(content)}
                >
                  View
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={content.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {content.thumbnailUrl && (
          <Box
            sx={{
              height: 160,
              backgroundImage: `url(${content.thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {getContentIcon(content.contentType)}
              <Chip
                size="small"
                label={formatDuration(content.duration, content.contentType)}
                sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
              />
            </Box>
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
              }}
              size="small"
              onClick={() => handleBookmark(content)}
              color={content.isBookmarked ? 'primary' : 'default'}
            >
              {content.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Box>
        )}
        
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
            {content.title}
          </Typography>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              flexGrow: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {content.description}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            <Chip
              size="small"
              label={content.metadata.subject}
              color="primary"
              variant="outlined"
            />
            <Chip
              size="small"
              label={`Level ${content.difficultyLevel}`}
              variant="outlined"
            />
            <Chip
              size="small"
              label={content.safetyRating}
              color={getSafetyColor(content.safetyRating) as any}
              icon={<SecurityIcon />}
            />
          </Box>
          
          <Button
            variant="contained"
            fullWidth
            onClick={() => onContentSelect?.(content)}
            startIcon={getContentIcon(content.contentType)}
          >
            {content.contentType === 'video' ? 'Watch' : content.contentType === 'article' ? 'Read' : 'Play'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load content library. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          Content Library
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Discover educational videos, articles, and interactive content
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search content..."
            value={filters.search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleFilterChange('search', '')}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, flex: 1 }}
          />
          
          <Box sx={{ minWidth: 200 }}>
            <SubjectSelector
              value={filters.subject}
              onChange={(subjectId) => handleFilterChange('subject', subjectId)}
              label="Subject"
              showIcons
              showColors
              size="small"
            />
          </Box>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.contentType}
              label="Type"
              onChange={handleContentTypeChange}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="article">Articles</MenuItem>
              <MenuItem value="interactive">Interactive</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Safety</InputLabel>
            <Select
              value={filters.safetyRating}
              label="Safety"
              onChange={handleSafetyRatingChange}
            >
              <MenuItem value="">All Ratings</MenuItem>
              <MenuItem value="safe">Safe</MenuItem>
              <MenuItem value="review_needed">Needs Review</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              variant="outlined"
              size="small"
            >
              More Filters
            </Button>
            
            <Button
              startIcon={<SortIcon />}
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              variant="outlined"
              size="small"
            >
              Sort: {sortBy}
            </Button>
            
            {(filters.search || filters.subject || filters.contentType || filters.safetyRating) && (
              <Button
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {contentData?.total || 0} items
            </Typography>
            
            <IconButton
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              size="small"
            >
              {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Content Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="All Content" />
        <Tab
          label={
            <Badge
              badgeContent={contentData?.stats?.videoCount || 0}
              color="error"
              max={999}
            >
              Videos
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={contentData?.stats?.articleCount || 0}
              color="info"
              max={999}
            >
              Articles
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={contentData?.stats?.interactiveCount || 0}
              color="success"
              max={999}
            >
              Interactive
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={contentData?.stats?.bookmarkedCount || 0}
              color="primary"
              max={999}
            >
              Bookmarks
            </Badge>
          }
        />
      </Tabs>

      {/* Content Grid/List */}
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ height: 300 }}>
                <Skeleton variant="rectangular" height={160} />
                <CardContent>
                  <Skeleton variant="text" height={24} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={36} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredContent.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No content found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Try adjusting your filters or search terms
          </Typography>
          <Button variant="outlined" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {filteredContent.map((content: StudyContent) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={content.id}>
                  {renderContentCard(content)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              {filteredContent.map((content: StudyContent) => renderContentCard(content))}
            </Box>
          )}
          
          {/* Pagination */}
          {contentData?.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={contentData.totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem onClick={() => setFilterMenuAnchor(null)}>
          Difficulty Level
        </MenuItem>
        <MenuItem onClick={() => setFilterMenuAnchor(null)}>
          Duration Range
        </MenuItem>
        <MenuItem onClick={() => setFilterMenuAnchor(null)}>
          Age Range
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setSortBy('relevance'); setSortMenuAnchor(null); }}>
          Relevance
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('newest'); setSortMenuAnchor(null); }}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('oldest'); setSortMenuAnchor(null); }}>
          Oldest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('duration'); setSortMenuAnchor(null); }}>
          Duration
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('difficulty'); setSortMenuAnchor(null); }}>
          Difficulty
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('rating'); setSortMenuAnchor(null); }}>
          Safety Rating
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ContentLibrary;