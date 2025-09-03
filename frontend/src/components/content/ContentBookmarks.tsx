import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Grid,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  Extension as ExtensionIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

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
  bookmarkedAt: string;
  bookmarkFolder?: string;
}

interface BookmarkFolder {
  id: string;
  name: string;
  description?: string;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ContentBookmarksProps {
  childId: string;
  onContentSelect?: (content: StudyContent) => void;
  compactView?: boolean;
}

const ContentBookmarks: React.FC<ContentBookmarksProps> = ({
  childId,
  onContentSelect,
  compactView = false,
}) => {
  const queryClient = useQueryClient();
  
  // State
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContent, setSelectedContent] = useState<StudyContent | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Fetch bookmarked content
  const { data: bookmarksData, isLoading, error } = useQuery({
    queryKey: ['bookmarks', childId, selectedFolder],
    queryFn: async () => {
      const params = new URLSearchParams({
        childId,
        ...(selectedFolder && { folder: selectedFolder }),
      });

      const response = await fetch(`/api/content/bookmarks?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      return response.json();
    },
  });

  // Fetch bookmark folders
  const { data: foldersData } = useQuery({
    queryKey: ['bookmark-folders', childId],
    queryFn: async () => {
      const response = await fetch(`/api/content/bookmark-folders?childId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      return response.json();
    },
  });

  // Remove bookmark mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await fetch(`/api/content/${contentId}/bookmark`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ childId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-folders'] });
      toast.success('Bookmark removed');
      setShowDeleteDialog(false);
      setSelectedContent(null);
    },
    onError: () => {
      toast.error('Failed to remove bookmark');
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const response = await fetch('/api/content/bookmark-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          childId,
          name: folderName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-folders'] });
      toast.success('Folder created');
      setShowFolderDialog(false);
      setNewFolderName('');
    },
    onError: () => {
      toast.error('Failed to create folder');
    },
  });

  // Move to folder mutation
  const moveToFolderMutation = useMutation({
    mutationFn: async ({ contentId, folderId }: { contentId: string; folderId: string }) => {
      const response = await fetch(`/api/content/${contentId}/bookmark/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          childId,
          folderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move bookmark');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-folders'] });
      toast.success('Bookmark moved');
      setMenuAnchor(null);
      setSelectedContent(null);
    },
    onError: () => {
      toast.error('Failed to move bookmark');
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, content: StudyContent) => {
    setMenuAnchor(event.currentTarget);
    setSelectedContent(content);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedContent(null);
  };

  const handleRemoveBookmark = (content: StudyContent) => {
    setSelectedContent(content);
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const handleMoveToFolder = (folderId: string) => {
    if (selectedContent) {
      moveToFolderMutation.mutate({
        contentId: selectedContent.id,
        folderId,
      });
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
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
                    Bookmarked {new Date(content.bookmarkedAt).toLocaleDateString()}
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
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, content)}
                >
                  <MoreVertIcon />
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
              onClick={(e) => handleMenuOpen(e, content)}
            >
              <MoreVertIcon />
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
              label={content.safetyRating}
              color={getSafetyColor(content.safetyRating) as any}
              icon={<SecurityIcon />}
            />
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            Bookmarked {new Date(content.bookmarkedAt).toLocaleDateString()}
          </Typography>
          
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
        Failed to load bookmarks. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            My Bookmarks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bookmarksData?.total || 0} bookmarked items
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowFolderDialog(true)}
        >
          New Folder
        </Button>
      </Box>

      {/* Folders */}
      {foldersData?.folders?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Folders
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedFolder === '' ? 2 : 1,
                  borderColor: selectedFolder === '' ? 'primary.main' : 'divider',
                }}
                onClick={() => setSelectedFolder('')}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <FolderOpenIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2">
                    All Bookmarks
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bookmarksData?.total || 0} items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {foldersData.folders.map((folder: BookmarkFolder) => (
              <Grid item xs={12} sm={6} md={4} key={folder.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedFolder === folder.id ? 2 : 1,
                    borderColor: selectedFolder === folder.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <FolderIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="subtitle2">
                      {folder.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {folder.contentCount} items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Content Grid/List */}
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
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
      ) : !bookmarksData?.content?.length ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BookmarkBorderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No bookmarks yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start bookmarking content to build your personal library
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {bookmarksData.content.map((content: StudyContent) => (
                <Grid item xs={12} sm={6} md={4} key={content.id}>
                  {renderContentCard(content)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              {bookmarksData.content.map((content: StudyContent) => renderContentCard(content))}
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => onContentSelect?.(selectedContent!)}>
          <ListItemIcon>
            {selectedContent && getContentIcon(selectedContent.contentType)}
          </ListItemIcon>
          <ListItemText>Open Content</ListItemText>
        </MenuItem>
        
        <Divider />
        
        {foldersData?.folders?.map((folder: BookmarkFolder) => (
          <MenuItem
            key={folder.id}
            onClick={() => handleMoveToFolder(folder.id)}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText>Move to {folder.name}</ListItemText>
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={() => handleRemoveBookmark(selectedContent!)}>
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>Remove Bookmark</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog
        open={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFolderDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim() || createFolderMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Bookmark</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{selectedContent?.title}" from your bookmarks?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedContent && removeBookmarkMutation.mutate(selectedContent.id)}
            color="error"
            variant="contained"
            disabled={removeBookmarkMutation.isPending}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentBookmarks;