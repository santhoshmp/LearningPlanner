import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Shield as ShieldIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Psychology as PsychologyIcon,
  Language as LanguageIcon,
  Violence as ViolenceIcon,
  Explicit as ExplicitIcon,
} from '@mui/icons-material';

interface SafetyMetrics {
  overallScore: number;
  ageAppropriate: boolean;
  contentCategories: {
    educational: number;
    violence: number;
    language: number;
    mature: number;
    scary: number;
  };
  aiConfidence: number;
  humanReviewed: boolean;
  parentalFlags: string[];
  lastReviewed: string;
}

interface ContentSafetyRatingProps {
  contentId: string;
  contentTitle: string;
  safetyRating: 'safe' | 'review_needed' | 'blocked';
  safetyMetrics?: SafetyMetrics;
  childAge: number;
  showDetails?: boolean;
  onRatingUpdate?: (newRating: string) => void;
  onReportContent?: () => void;
  parentalControlsEnabled?: boolean;
}

const ContentSafetyRating: React.FC<ContentSafetyRatingProps> = ({
  contentId,
  contentTitle,
  safetyRating,
  safetyMetrics,
  childAge,
  showDetails = false,
  onRatingUpdate,
  onReportContent,
  parentalControlsEnabled = true,
}) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

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

  const getSafetyIcon = (rating: string) => {
    switch (rating) {
      case 'safe':
        return <CheckCircleIcon color="success" />;
      case 'review_needed':
        return <WarningIcon color="warning" />;
      case 'blocked':
        return <BlockIcon color="error" />;
      default:
        return <SecurityIcon />;
    }
  };

  const getSafetyLabel = (rating: string) => {
    switch (rating) {
      case 'safe':
        return 'Safe for Children';
      case 'review_needed':
        return 'Parental Review Needed';
      case 'blocked':
        return 'Content Blocked';
      default:
        return 'Unknown';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'educational':
        return <PsychologyIcon color="primary" />;
      case 'violence':
        return <ViolenceIcon color="error" />;
      case 'language':
        return <LanguageIcon color="warning" />;
      case 'mature':
        return <ExplicitIcon color="error" />;
      case 'scary':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'educational':
        return 'Educational Value';
      case 'violence':
        return 'Violence/Aggression';
      case 'language':
        return 'Language Concerns';
      case 'mature':
        return 'Mature Content';
      case 'scary':
        return 'Scary/Intense Content';
      default:
        return category;
    }
  };

  const getCategoryColor = (score: number) => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    return 'success';
  };

  const getOverallRiskLevel = (score: number) => {
    if (score >= 0.9) return { level: 'Very Safe', color: 'success' };
    if (score >= 0.7) return { level: 'Generally Safe', color: 'success' };
    if (score >= 0.5) return { level: 'Moderate Risk', color: 'warning' };
    if (score >= 0.3) return { level: 'High Risk', color: 'error' };
    return { level: 'Very High Risk', color: 'error' };
  };

  const isAgeAppropriate = () => {
    if (!safetyMetrics) return true;
    return safetyMetrics.ageAppropriate;
  };

  const hasParentalFlags = () => {
    return safetyMetrics?.parentalFlags && safetyMetrics.parentalFlags.length > 0;
  };

  const renderCompactRating = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={getSafetyLabel(safetyRating)}>
        <Chip
          size="small"
          icon={getSafetyIcon(safetyRating)}
          label={safetyRating === 'safe' ? 'Safe' : safetyRating === 'review_needed' ? 'Review' : 'Blocked'}
          color={getSafetyColor(safetyRating) as any}
          variant={safetyRating === 'blocked' ? 'filled' : 'outlined'}
        />
      </Tooltip>
      
      {!isAgeAppropriate() && (
        <Tooltip title={`Not recommended for age ${childAge}`}>
          <Chip
            size="small"
            icon={<WarningIcon />}
            label="Age"
            color="warning"
            variant="outlined"
          />
        </Tooltip>
      )}
      
      {hasParentalFlags() && (
        <Tooltip title="Parental attention required">
          <Badge badgeContent={safetyMetrics?.parentalFlags.length} color="error">
            <Chip
              size="small"
              icon={<ReportIcon />}
              label="Flags"
              color="error"
              variant="outlined"
            />
          </Badge>
        </Tooltip>
      )}
      
      {showDetails && (
        <IconButton
          size="small"
          onClick={() => setShowDetailsDialog(true)}
        >
          <VisibilityIcon />
        </IconButton>
      )}
    </Box>
  );

  const renderDetailedRating = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getSafetyIcon(safetyRating)}
            <Box>
              <Typography variant="h6">
                Content Safety Rating
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getSafetyLabel(safetyRating)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {safetyMetrics && (
              <Chip
                label={`${Math.round(safetyMetrics.overallScore * 100)}% Safe`}
                color={getSafetyColor(safetyRating) as any}
                variant="filled"
              />
            )}
            <IconButton
              size="small"
              onClick={() => setShowDetailsDialog(true)}
            >
              <InfoIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Age Appropriateness */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isAgeAppropriate() ? (
              <CheckCircleIcon color="success" />
            ) : (
              <WarningIcon color="warning" />
            )}
            <Typography variant="subtitle2">
              Age Appropriateness (Age {childAge})
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {isAgeAppropriate()
              ? 'This content is appropriate for the child\'s age group'
              : 'This content may not be suitable for the child\'s age group'
            }
          </Typography>
        </Box>

        {/* Parental Flags */}
        {hasParentalFlags() && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ReportIcon color="error" />
              <Typography variant="subtitle2">
                Parental Attention Required
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {safetyMetrics?.parentalFlags.map((flag, index) => (
                <Chip
                  key={index}
                  size="small"
                  label={flag}
                  color="error"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => setShowDetailsDialog(true)}
          >
            View Details
          </Button>
          {onReportContent && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<ReportIcon />}
              onClick={() => setShowReportDialog(true)}
            >
              Report Content
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      {showDetails ? renderDetailedRating() : renderCompactRating()}

      {/* Safety Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon />
          Safety Analysis: {contentTitle}
        </DialogTitle>
        <DialogContent>
          {safetyMetrics ? (
            <Box>
              {/* Overall Safety Score */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Overall Safety Assessment
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Safety Score
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(safetyMetrics.overallScore * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={safetyMetrics.overallScore * 100}
                      color={getSafetyColor(safetyRating) as any}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Chip
                    label={getOverallRiskLevel(safetyMetrics.overallScore).level}
                    color={getOverallRiskLevel(safetyMetrics.overallScore).color as any}
                  />
                </Box>
              </Box>

              {/* Content Categories Analysis */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Content Analysis
                </Typography>
                <List>
                  {Object.entries(safetyMetrics.contentCategories).map(([category, score]) => (
                    <ListItem key={category} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getCategoryIcon(category)}
                      </ListItemIcon>
                      <ListItemText
                        primary={getCategoryLabel(category)}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={score * 100}
                              color={getCategoryColor(score) as any}
                              sx={{ flex: 1, height: 4, borderRadius: 2 }}
                            />
                            <Typography variant="caption">
                              {Math.round(score * 100)}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Review Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Review Information
                </Typography>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <PsychologyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="AI Analysis Confidence"
                      secondary={`${Math.round(safetyMetrics.aiConfidence * 100)}% confidence in automated analysis`}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {safetyMetrics.humanReviewed ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <WarningIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Human Review Status"
                      secondary={
                        safetyMetrics.humanReviewed
                          ? 'This content has been reviewed by human moderators'
                          : 'This content has only been analyzed by AI systems'
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Reviewed"
                      secondary={new Date(safetyMetrics.lastReviewed).toLocaleDateString()}
                    />
                  </ListItem>
                </List>
              </Box>

              {/* Age Appropriateness Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Age Appropriateness
                </Typography>
                <Alert
                  severity={isAgeAppropriate() ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  {isAgeAppropriate()
                    ? `This content is considered appropriate for children aged ${childAge} and similar age groups.`
                    : `This content may not be suitable for children aged ${childAge}. Parental guidance is recommended.`
                  }
                </Alert>
              </Box>

              {/* Parental Flags */}
              {hasParentalFlags() && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Parental Attention Required
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This content has been flagged for parental review due to the following concerns:
                  </Alert>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {safetyMetrics.parentalFlags.map((flag, index) => (
                      <Chip
                        key={index}
                        label={flag}
                        color="warning"
                        variant="outlined"
                        icon={<WarningIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">
              Detailed safety metrics are not available for this content.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          {onReportContent && (
            <Button
              color="error"
              startIcon={<ReportIcon />}
              onClick={() => {
                setShowDetailsDialog(false);
                setShowReportDialog(true);
              }}
            >
              Report Content
            </Button>
          )}
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Content Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Content Issue</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Help us improve content safety by reporting issues with "{contentTitle}".
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your report will be reviewed by our content moderation team and appropriate action will be taken.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onReportContent?.();
              setShowReportDialog(false);
            }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContentSafetyRating;