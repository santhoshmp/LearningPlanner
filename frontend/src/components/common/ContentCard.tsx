import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  IconButton,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as VideoIcon,
  Article as ArticleIcon,
  Extension as InteractiveIcon,
  Assignment as WorksheetIcon,
  SportsEsports as GameIcon,
  Schedule as TimeIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'worksheet' | 'game';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  thumbnailUrl?: string;
  safetyRating: 'safe' | 'moderate' | 'restricted';
  source: string;
  tags?: string[];
  isBookmarked?: boolean;
  onClick: () => void;
  onBookmarkToggle?: () => void;
  compact?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  description,
  type,
  difficulty,
  duration,
  thumbnailUrl,
  safetyRating,
  source,
  tags = [],
  isBookmarked = false,
  onClick,
  onBookmarkToggle,
  compact = false
}) => {
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'video': return <VideoIcon />;
      case 'article': return <ArticleIcon />;
      case 'interactive': return <InteractiveIcon />;
      case 'worksheet': return <WorksheetIcon />;
      case 'game': return <GameIcon />;
      default: return <ArticleIcon />;
    }
  };

  const getResourceTypeColor = (resourceType: string) => {
    switch (resourceType) {
      case 'video': return 'error';
      case 'article': return 'primary';
      case 'interactive': return 'secondary';
      case 'worksheet': return 'warning';
      case 'game': return 'success';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficultyLevel: string) => {
    switch (difficultyLevel) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
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

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          borderColor: 'primary.main'
        }
      }}
      onClick={onClick}
    >
      {thumbnailUrl && (
        <CardMedia
          component="img"
          height={compact ? 120 : 160}
          image={thumbnailUrl}
          alt={title}
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with icon, title, and bookmark */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: `${getResourceTypeColor(type)}.main`
            }}
          >
            {getResourceIcon(type)}
          </Avatar>
          
          <Typography
            variant={compact ? "body1" : "h6"}
            component="h3"
            sx={{
              flex: 1,
              fontWeight: 600,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {title}
          </Typography>

          {onBookmarkToggle && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkToggle();
              }}
            >
              {isBookmarked ? (
                <BookmarkIcon color="primary" />
              ) : (
                <BookmarkBorderIcon />
              )}
            </IconButton>
          )}
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: compact ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {description}
        </Typography>

        {/* Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip
            label={type}
            size="small"
            color={getResourceTypeColor(type) as any}
            variant="filled"
          />
          
          <Chip
            label={difficulty}
            size="small"
            color={getDifficultyColor(difficulty) as any}
            variant="outlined"
          />

          {duration && (
            <Chip
              icon={<TimeIcon />}
              label={formatDuration(duration)}
              size="small"
              variant="outlined"
            />
          )}

          <Tooltip title={`Content safety rating: ${safetyRating}`}>
            <Chip
              icon={<SecurityIcon />}
              label={safetyRating}
              size="small"
              color={getSafetyRatingColor(safetyRating) as any}
              variant="outlined"
            />
          </Tooltip>
        </Box>

        {/* Tags */}
        {tags.length > 0 && !compact && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
            {tags.length > 3 && (
              <Chip
                label={`+${tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
        )}

        {/* Source */}
        <Typography variant="caption" color="text.secondary">
          Source: {source}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ContentCard;