import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  LinearProgress,
  Slider,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  TextIncrease as TextIncreaseIcon,
  TextDecrease as TextDecreaseIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface StudyContent {
  id: string;
  activityId: string;
  contentType: 'video' | 'article' | 'interactive';
  title: string;
  description: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration: number; // seconds for videos, estimated reading time for articles
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
}

interface ContentInteraction {
  contentId: string;
  interactionType: 'view' | 'complete' | 'like' | 'bookmark' | 'progress';
  progressPercentage: number;
  timeSpent: number; // seconds
  timestamp: Date;
}

interface UnifiedContentPlayerProps {
  content: StudyContent;
  childId: string;
  childAge: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onInteraction?: (interaction: ContentInteraction) => void;
  parentalControlsEnabled?: boolean;
  autoplay?: boolean;
  showSafetyIndicators?: boolean;
}

const UnifiedContentPlayer: React.FC<UnifiedContentPlayerProps> = ({
  content,
  childId,
  childAge,
  onProgress,
  onComplete,
  onInteraction,

  autoplay = false,
  showSafetyIndicators = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(content.duration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  
  // Article-specific state
  const [fontSize, setFontSize] = useState(16);
  const [readingProgress, setReadingProgress] = useState(0);

  
  // UI state
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showParentalApproval, setShowParentalApproval] = useState(false);
  
  // Safety checks
  const isContentBlocked = content.safetyRating === 'blocked';
  const needsParentalApproval = content.safetyRating === 'review_needed' || 
    childAge < content.ageAppropriate.min || 
    childAge > content.ageAppropriate.max;

  // Track interaction mutation
  const trackInteractionMutation = useMutation({
    mutationFn: async (interaction: Omit<ContentInteraction, 'timestamp'>) => {
      const response = await fetch('/api/content/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...interaction,
          childId,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to track interaction');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (onInteraction) {
        onInteraction({
          ...variables,
          timestamp: new Date(),
        });
      }
    },
  });

  // Track progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && content.contentType === 'video' && videoRef.current) {
        const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(currentProgress);
        
        if (onProgress) {
          onProgress(currentProgress);
        }
        
        // Track progress every 10%
        if (Math.floor(currentProgress / 10) > Math.floor(progress / 10)) {
          trackInteractionMutation.mutate({
            contentId: content.id,
            interactionType: 'progress',
            progressPercentage: currentProgress,
            timeSpent: videoRef.current.currentTime,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, progress, content.id, onProgress]);

  // Handle video events
  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
    trackInteractionMutation.mutate({
      contentId: content.id,
      interactionType: 'view',
      progressPercentage: progress,
      timeSpent: currentTime,
    });
  }, [content.id, progress, currentTime]);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(100);
    
    trackInteractionMutation.mutate({
      contentId: content.id,
      interactionType: 'complete',
      progressPercentage: 100,
      timeSpent: duration,
    });
    
    if (onComplete) {
      onComplete();
    }
    
    toast.success('Content completed! Great job!');
  }, [content.id, duration, onComplete]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const newProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(newProgress);
    }
  }, []);

  // Player controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };



  // Article-specific functions
  const handleFontSizeChange = (change: number) => {
    const newSize = Math.max(12, Math.min(24, fontSize + change));
    setFontSize(newSize);
  };

  const handleScroll = useCallback(() => {
    if (content.contentType === 'article') {
      const scrolled = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = (scrolled / maxScroll) * 100;
      
      setReadingProgress(Math.min(100, scrollProgress));
      
      if (onProgress) {
        onProgress(scrollProgress);
      }
    }
  }, [content.contentType, onProgress]);

  useEffect(() => {
    if (content.contentType === 'article') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [content.contentType, handleScroll]);

  // Interaction handlers
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    trackInteractionMutation.mutate({
      contentId: content.id,
      interactionType: 'bookmark',
      progressPercentage: progress,
      timeSpent: currentTime,
    });
    toast.success(isBookmarked ? 'Bookmark removed' : 'Content bookmarked!');
  };

  const handleLike = () => {
    if (!hasLiked) {
      setHasLiked(true);
      setHasDisliked(false);
      trackInteractionMutation.mutate({
        contentId: content.id,
        interactionType: 'like',
        progressPercentage: progress,
        timeSpent: currentTime,
      });
      toast.success('Thanks for the feedback!');
    }
  };

  const handleDislike = () => {
    if (!hasDisliked) {
      setHasDisliked(true);
      setHasLiked(false);
      // Could trigger content review or alternative suggestions
      toast('We\'ll find better content for you!');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Safety check rendering
  if (isContentBlocked) {
    return (
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <WarningIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Content Blocked
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This content has been blocked due to safety concerns.
            Please contact your parent or guardian for assistance.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (needsParentalApproval && !showParentalApproval) {
    return (
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Parental Approval Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This content requires parental approval before viewing.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowParentalApproval(true)}
          >
            Request Approval
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box ref={containerRef} sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Safety Indicators */}
      {showSafetyIndicators && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            icon={<SecurityIcon />}
            label={`Safety: ${content.safetyRating}`}
            color={content.safetyRating === 'safe' ? 'success' : 'warning'}
          />
          <Chip
            size="small"
            icon={<VisibilityIcon />}
            label={`Ages ${content.ageAppropriate.min}-${content.ageAppropriate.max}`}
            color={childAge >= content.ageAppropriate.min && childAge <= content.ageAppropriate.max ? 'success' : 'warning'}
          />
          <Chip
            size="small"
            icon={<ScheduleIcon />}
            label={content.contentType === 'video' ? formatTime(duration) : `${Math.ceil(duration / 60)} min read`}
          />
        </Box>
      )}

      <Card>
        {/* Content Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {content.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {content.description}
          </Typography>
        </Box>

        {/* Video Player */}
        {content.contentType === 'video' && (
          <Box sx={{ position: 'relative', bgcolor: 'black' }}>
            <video
              ref={videoRef}
              src={content.contentUrl}
              poster={content.thumbnailUrl}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '400px',
              }}
              autoPlay={autoplay}
            />
            
            {/* Video Controls */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                p: 1,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 1, height: 4 }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={togglePlayPause}
                  sx={{ color: 'white' }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                
                <Typography variant="caption" sx={{ color: 'white', minWidth: 80 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <IconButton
                  onClick={toggleMute}
                  sx={{ color: 'white' }}
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                
                <Slider
                  size="small"
                  value={volume}
                  onChange={(_, value) => handleVolumeChange(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ width: 80, color: 'white' }}
                />
                
                <IconButton
                  onClick={toggleFullscreen}
                  sx={{ color: 'white' }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}

        {/* Article Reader */}
        {content.contentType === 'article' && (
          <Box>
            {/* Article Controls */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Reading Progress: {Math.round(readingProgress)}%
              </Typography>
              
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={readingProgress}
                  sx={{ height: 4 }}
                />
              </Box>
              
              <Tooltip title="Decrease font size">
                <IconButton
                  size="small"
                  onClick={() => handleFontSizeChange(-2)}
                >
                  <TextDecreaseIcon />
                </IconButton>
              </Tooltip>
              
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
                {fontSize}px
              </Typography>
              
              <Tooltip title="Increase font size">
                <IconButton
                  size="small"
                  onClick={() => handleFontSizeChange(2)}
                >
                  <TextIncreaseIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Article Content */}
            <Box
              sx={{
                p: 3,
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                maxHeight: '600px',
                overflow: 'auto',
              }}
            >
              {/* This would typically render the actual article content */}
              <Typography variant="body1">
                {content.description}
              </Typography>
              {/* In a real implementation, you would fetch and render the full article content */}
            </Box>
          </Box>
        )}

        {/* Interactive Content */}
        {content.contentType === 'interactive' && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Interactive Content
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This interactive content will be loaded from: {content.contentUrl}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.open(content.contentUrl, '_blank')}
            >
              Launch Interactive Content
            </Button>
          </Box>
        )}

        {/* Content Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleBookmark}
            color={isBookmarked ? 'primary' : 'default'}
          >
            {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
          
          <IconButton
            onClick={handleLike}
            color={hasLiked ? 'primary' : 'default'}
          >
            <ThumbUpIcon />
          </IconButton>
          
          <IconButton
            onClick={handleDislike}
            color={hasDisliked ? 'error' : 'default'}
          >
            <ThumbDownIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="caption" color="text.secondary">
            Source: {content.sourceAttribution}
          </Typography>
          
          <IconButton
            onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Card>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
      >
        <MenuItem onClick={() => setShowSafetyDialog(true)}>
          <SecurityIcon sx={{ mr: 1 }} />
          Safety Information
        </MenuItem>
        <MenuItem>
          <ShareIcon sx={{ mr: 1 }} />
          Share Content
        </MenuItem>
        <Divider />
        <MenuItem>
          <WarningIcon sx={{ mr: 1 }} />
          Report Content
        </MenuItem>
      </Menu>

      {/* Safety Information Dialog */}
      <Dialog
        open={showSafetyDialog}
        onClose={() => setShowSafetyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Content Safety Information</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Safety Rating
            </Typography>
            <Chip
              label={content.safetyRating}
              color={content.safetyRating === 'safe' ? 'success' : 'warning'}
              icon={<SecurityIcon />}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Age Appropriateness
            </Typography>
            <Typography variant="body2">
              Recommended for ages {content.ageAppropriate.min} to {content.ageAppropriate.max}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Content Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {content.metadata.tags.map((tag, index) => (
                <Chip key={index} size="small" label={tag} variant="outlined" />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSafetyDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedContentPlayer;