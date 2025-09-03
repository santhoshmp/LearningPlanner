import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  Extension as ExtensionIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface ContentRecommendation {
  type: 'video' | 'article' | 'interactive';
  title: string;
  description: string;
  url?: string;
  duration: number;
  ageAppropriate: boolean;
  safetyScore: number;
  source: string;
  tags: string[];
  difficulty: number;
}

interface ContentPreviewProps {
  content: ContentRecommendation;
  onApprove?: (content: ContentRecommendation) => void;
  onReject?: (content: ContentRecommendation, reason: string) => void;
  onRequestReview?: (content: ContentRecommendation) => void;
  showActions?: boolean;
  compact?: boolean;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  onApprove,
  onReject,
  onRequestReview,
  showActions = true,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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

  const getSafetyColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 0.9) return 'Very Safe';
    if (score >= 0.7) return 'Moderately Safe';
    return 'Needs Review';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'success';
    if (difficulty <= 6) return 'warning';
    return 'error';
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(content);
    }
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (onReject) {
      onReject(content, rejectReason);
    }
    setRejectDialogOpen(false);
    setRejectReason('');
  };

  const handleRequestReview = () => {
    if (onRequestReview) {
      onRequestReview(content);
    }
  };

  if (compact) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {getContentIcon(content.type)}
            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
              {content.title}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4 }}>
            {content.description.length > 100 
              ? `${content.description.substring(0, 100)}...` 
              : content.description}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Chip 
              size="small" 
              label={`${content.duration}m`} 
              icon={<ScheduleIcon />}
              variant="outlined"
            />
            <Chip 
              size="small" 
              label={`Level ${content.difficulty}`}
              color={getDifficultyColor(content.difficulty) as any}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip
              size="small"
              label={getSafetyLabel(content.safetyScore)}
              color={getSafetyColor(content.safetyScore) as any}
              icon={<SecurityIcon />}
            />
            <Button
              size="small"
              onClick={() => setShowDetails(true)}
              startIcon={<VisibilityIcon />}
            >
              Details
            </Button>
          </Box>
        </CardContent>

        {showActions && (
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Button
              size="small"
              color="error"
              onClick={handleReject}
              startIcon={<ThumbDownIcon />}
            >
              Reject
            </Button>
            <Button
              size="small"
              color="primary"
              variant="contained"
              onClick={handleApprove}
              startIcon={<ThumbUpIcon />}
            >
              Approve
            </Button>
          </CardActions>
        )}

        {/* Details Dialog */}
        <Dialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getContentIcon(content.type)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {content.title}
              </Typography>
            </Box>
            <IconButton onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <ContentPreview
              content={content}
              onApprove={onApprove}
              onReject={onReject}
              onRequestReview={onRequestReview}
              showActions={false}
              compact={false}
            />
          </DialogContent>
          {showActions && (
            <DialogActions>
              <Button onClick={handleReject} color="error" startIcon={<ThumbDownIcon />}>
                Reject
              </Button>
              <Button onClick={handleRequestReview} startIcon={<WarningIcon />}>
                Request Review
              </Button>
              <Button onClick={handleApprove} variant="contained" startIcon={<ThumbUpIcon />}>
                Approve
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </Card>
    );
  }

  return (
    <Box>
      {/* Content Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {getContentIcon(content.type)}
        <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
          {content.title}
        </Typography>
      </Box>

      {/* Safety Alert */}
      {content.safetyScore < 0.7 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This content has a low safety score ({Math.round(content.safetyScore * 100)}%). 
            Parental review is recommended before approval.
          </Typography>
        </Alert>
      )}

      {!content.ageAppropriate && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This content may not be age-appropriate for the selected child. 
            Please review carefully before approval.
          </Typography>
        </Alert>
      )}

      {/* Content Description */}
      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
        {content.description}
      </Typography>

      {/* Content Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{content.duration}m</Typography>
            <Typography variant="caption" color="text.secondary">
              Duration
            </Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <SchoolIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{content.difficulty}/10</Typography>
            <Typography variant="caption" color="text.secondary">
              Difficulty
            </Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <SecurityIcon sx={{ fontSize: 32, color: getSafetyColor(content.safetyScore) === 'success' ? 'success.main' : 'warning.main', mb: 1 }} />
            <Typography variant="h6">{Math.round(content.safetyScore * 100)}%</Typography>
            <Typography variant="caption" color="text.secondary">
              Safety Score
            </Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 32, color: content.ageAppropriate ? 'success.main' : 'error.main', mb: 1 }} />
            <Typography variant="h6">{content.ageAppropriate ? 'Yes' : 'No'}</Typography>
            <Typography variant="caption" color="text.secondary">
              Age Appropriate
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Content Details */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Content Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Source
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {content.source}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Content Type
              </Typography>
              <Chip
                label={content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {content.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    size="small"
                    label={tag}
                    variant="outlined"
                  />
                ))}
              </Box>

              {content.url && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Content URL
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ 
                      wordBreak: 'break-all',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => window.open(content.url, '_blank')}
                  >
                    {content.url}
                  </Typography>
                </>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Action Buttons */}
      {showActions && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleReject}
            startIcon={<ThumbDownIcon />}
          >
            Reject Content
          </Button>
          {content.safetyScore < 0.8 && (
            <Button
              variant="outlined"
              color="warning"
              onClick={handleRequestReview}
              startIcon={<WarningIcon />}
            >
              Request Review
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleApprove}
            startIcon={<ThumbUpIcon />}
          >
            Approve Content
          </Button>
        </Box>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Content</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this content:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              'Inappropriate for child\'s age',
              'Content quality concerns',
              'Safety concerns',
              'Not relevant to learning objectives',
              'Technical issues',
              'Other'
            ].map((reason) => (
              <Button
                key={reason}
                variant={rejectReason === reason ? 'contained' : 'outlined'}
                onClick={() => setRejectReason(reason)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {reason}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReject}
            color="error"
            variant="contained"
            disabled={!rejectReason}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentPreview;