import React, { useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';

interface ContentSafetyData {
  safetyRating: 'safe' | 'review_needed' | 'blocked';
  safetyScore: number; // 0-1
  ageAppropriate: {
    min: number;
    max: number;
  };
  flaggedContent?: string[];
  parentalApprovalRequired: boolean;
  lastReviewed?: Date;
  reviewedBy?: 'ai' | 'human' | 'community';
}

interface ContentSafetyIndicatorProps {
  safetyData: ContentSafetyData;
  childAge: number;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'chip' | 'badge' | 'detailed';
  onClick?: () => void;
}

const ContentSafetyIndicator: React.FC<ContentSafetyIndicatorProps> = ({
  safetyData,
  childAge,
  showDetails = false,
  size = 'medium',
  variant = 'chip',
  onClick,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getSafetyColor = (rating: string, score: number) => {
    if (rating === 'blocked') return 'error';
    if (rating === 'review_needed') return 'warning';
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'info';
    return 'warning';
  };

  const getSafetyIcon = (rating: string, score: number) => {
    if (rating === 'blocked') return <ErrorIcon />;
    if (rating === 'review_needed') return <WarningIcon />;
    if (score >= 0.9) return <CheckCircleIcon />;
    if (score >= 0.7) return <SecurityIcon />;
    return <WarningIcon />;
  };

  const getSafetyLabel = (rating: string, score: number) => {
    if (rating === 'blocked') return 'Blocked';
    if (rating === 'review_needed') return 'Needs Review';
    if (score >= 0.9) return 'Very Safe';
    if (score >= 0.8) return 'Safe';
    if (score >= 0.7) return 'Mostly Safe';
    return 'Caution';
  };

  const isAgeAppropriate = childAge >= safetyData.ageAppropriate.min && 
                          childAge <= safetyData.ageAppropriate.max;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (showDetails) {
      setDetailsOpen(true);
    }
  };

  const renderChipVariant = () => (
    <Chip
      size={size === 'large' ? 'medium' : 'small'}
      icon={getSafetyIcon(safetyData.safetyRating, safetyData.safetyScore)}
      label={getSafetyLabel(safetyData.safetyRating, safetyData.safetyScore)}
      color={getSafetyColor(safetyData.safetyRating, safetyData.safetyScore) as any}
      onClick={showDetails ? handleClick : undefined}
      sx={{ 
        cursor: showDetails ? 'pointer' : 'default',
        '&:hover': showDetails ? { opacity: 0.8 } : {}
      }}
    />
  );

  const renderBadgeVariant = () => (
    <Box
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: `${getSafetyColor(safetyData.safetyRating, safetyData.safetyScore)}.light`,
        color: `${getSafetyColor(safetyData.safetyRating, safetyData.safetyScore)}.dark`,
        cursor: showDetails ? 'pointer' : 'default',
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        '&:hover': showDetails ? { opacity: 0.8 } : {}
      }}
    >
      {getSafetyIcon(safetyData.safetyRating, safetyData.safetyScore)}
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {Math.round(safetyData.safetyScore * 100)}% Safe
      </Typography>
    </Box>
  );

  const renderDetailedVariant = () => (
    <Box
      onClick={handleClick}
      sx={{
        p: 2,
        border: 1,
        borderColor: `${getSafetyColor(safetyData.safetyRating, safetyData.safetyScore)}.main`,
        borderRadius: 2,
        bgcolor: `${getSafetyColor(safetyData.safetyRating, safetyData.safetyScore)}.light`,
        cursor: showDetails ? 'pointer' : 'default',
        '&:hover': showDetails ? { opacity: 0.9 } : {}
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {getSafetyIcon(safetyData.safetyRating, safetyData.safetyScore)}
        <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
          {getSafetyLabel(safetyData.safetyRating, safetyData.safetyScore)}
        </Typography>
      </Box>
      
      <Grid container spacing={1}>
        <Grid xs={6}>
          <Typography variant="caption" color="text.secondary">
            Safety Score
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {Math.round(safetyData.safetyScore * 100)}%
          </Typography>
        </Grid>
        <Grid xs={6}>
          <Typography variant="caption" color="text.secondary">
            Age Range
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {safetyData.ageAppropriate.min}-{safetyData.ageAppropriate.max}
          </Typography>
        </Grid>
      </Grid>

      {!isAgeAppropriate && (
        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
          <Typography variant="caption">
            Not recommended for age {childAge}
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const renderIndicator = () => {
    switch (variant) {
      case 'badge':
        return renderBadgeVariant();
      case 'detailed':
        return renderDetailedVariant();
      default:
        return renderChipVariant();
    }
  };

  return (
    <>
      {renderIndicator()}

      {/* Safety Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Content Safety Information
        </DialogTitle>
        
        <DialogContent>
          {/* Overall Safety Status */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Safety Assessment
            </Typography>
            
            <Grid container spacing={2}>
              <Grid xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {getSafetyIcon(safetyData.safetyRating, safetyData.safetyScore)}
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {Math.round(safetyData.safetyScore * 100)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Safety Score
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <VisibilityIcon color={isAgeAppropriate ? 'success' : 'warning'} />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {safetyData.ageAppropriate.min}-{safetyData.ageAppropriate.max}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Age Range
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <ShieldIcon color={safetyData.parentalApprovalRequired ? 'warning' : 'success'} />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {safetyData.parentalApprovalRequired ? 'Required' : 'Not Required'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Parental Approval
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Age Appropriateness */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Age Appropriateness
            </Typography>
            
            {isAgeAppropriate ? (
              <Alert severity="success">
                <Typography variant="body2">
                  This content is appropriate for a {childAge}-year-old child.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning">
                <Typography variant="body2">
                  This content is recommended for ages {safetyData.ageAppropriate.min} to {safetyData.ageAppropriate.max}. 
                  Your child is {childAge} years old.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Flagged Content */}
          {safetyData.flaggedContent && safetyData.flaggedContent.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Content Concerns
              </Typography>
              
              <List dense>
                {safetyData.flaggedContent.map((flag, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={flag} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Review Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Review Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Reviewed By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <VerifiedIcon 
                    sx={{ 
                      mr: 1, 
                      fontSize: 16,
                      color: safetyData.reviewedBy === 'human' ? 'success.main' : 'info.main'
                    }} 
                  />
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {safetyData.reviewedBy || 'AI System'}
                  </Typography>
                </Box>
              </Grid>
              
              {safetyData.lastReviewed && (
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Reviewed
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {safetyData.lastReviewed.toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Safety Guidelines */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Safety Guidelines
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Our content safety system uses AI and human reviewers to ensure age-appropriate, 
              educational content. Parents can always review and approve content before their 
              children access it.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContentSafetyIndicator;