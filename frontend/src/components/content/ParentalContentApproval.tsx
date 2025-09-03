import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Tabs,
  Tab,
  Badge,
  Grid,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Visibility as ViewIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Block as BlockIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  Extension as ExtensionIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ContentSafetyRating from './ContentSafetyRating';

interface PendingContent {
  id: string;
  contentId: string;
  childId: string;
  childName: string;
  contentType: 'video' | 'article' | 'interactive';
  title: string;
  description: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration: number;
  safetyRating: 'safe' | 'review_needed' | 'blocked';
  safetyMetrics?: any;
  requestedAt: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  parentResponse?: {
    decision: string;
    reason: string;
    respondedAt: string;
  };
}

interface ParentalContentApprovalProps {
  parentId: string;
  onContentApprove?: (contentId: string) => void;
  onContentReject?: (contentId: string, reason: string) => void;
  onContentBlock?: (contentId: string, reason: string) => void;
}

const ParentalContentApproval: React.FC<ParentalContentApprovalProps> = ({
  parentId,
  onContentApprove,
  onContentReject,
  onContentBlock,
}) => {
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState<'approve' | 'reject' | 'block'>('approve');
  const [responseReason, setResponseReason] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch pending approvals
  const { data: approvalsData, isLoading, error } = useQuery({
    queryKey: ['parental-approvals', parentId, activeTab, filterBy, sortBy],
    queryFn: async () => {
      const status = activeTab === 0 ? 'pending' : activeTab === 1 ? 'approved' : activeTab === 2 ? 'rejected' : 'blocked';
      const params = new URLSearchParams({
        parentId,
        status,
        filter: filterBy,
        sort: sortBy,
      });

      const response = await fetch(`/api/content/parental-approvals?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approval requests');
      }

      return response.json();
    },
  });

  // Respond to approval request mutation
  const respondMutation = useMutation({
    mutationFn: async ({ 
      contentId, 
      decision, 
      reason 
    }: { 
      contentId: string; 
      decision: 'approve' | 'reject' | 'block'; 
      reason: string; 
    }) => {
      const response = await fetch(`/api/content/parental-approvals/${contentId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          parentId,
          decision,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to respond to approval request');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parental-approvals'] });
      
      const actionMap = {
        approve: 'approved',
        reject: 'rejected',
        block: 'blocked',
      };
      
      toast.success(`Content ${actionMap[variables.decision]} successfully`);
      
      // Call appropriate callback
      switch (variables.decision) {
        case 'approve':
          onContentApprove?.(variables.contentId);
          break;
        case 'reject':
          onContentReject?.(variables.contentId, variables.reason);
          break;
        case 'block':
          onContentBlock?.(variables.contentId, variables.reason);
          break;
      }
      
      setShowResponseDialog(false);
      setShowDetailsDialog(false);
      setSelectedContent(null);
      setResponseReason('');
    },
    onError: () => {
      toast.error('Failed to respond to approval request');
    },
  });

  const handleViewContent = (content: PendingContent) => {
    setSelectedContent(content);
    setShowDetailsDialog(true);
  };

  const handleRespond = (content: PendingContent, type: 'approve' | 'reject' | 'block') => {
    setSelectedContent(content);
    setResponseType(type);
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = () => {
    if (selectedContent) {
      respondMutation.mutate({
        contentId: selectedContent.contentId,
        decision: responseType,
        reason: responseReason,
      });
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
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'rejected':
        return <RejectedIcon color="error" />;
      case 'blocked':
        return <BlockIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
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

  const renderContentCard = (content: PendingContent) => (
    <Card key={content.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Content Thumbnail/Icon */}
          <Box
            sx={{
              width: 120,
              height: 80,
              borderRadius: 1,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: content.thumbnailUrl ? `url(${content.thumbnailUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            {!content.thumbnailUrl && getContentIcon(content.contentType)}
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {formatDuration(content.duration, content.contentType)}
            </Box>
          </Box>

          {/* Content Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                  {content.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Requested by {content.childName}
                </Typography>
              </Box>
              
              <Chip
                size="small"
                icon={getStatusIcon(content.status)}
                label={content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                color={getStatusColor(content.status) as any}
              />
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {content.description}
            </Typography>

            {/* Safety Rating */}
            <Box sx={{ mb: 2 }}>
              <ContentSafetyRating
                contentId={content.contentId}
                contentTitle={content.title}
                safetyRating={content.safetyRating}
                safetyMetrics={content.safetyMetrics}
                childAge={10} // This should come from child profile
                showDetails={false}
              />
            </Box>

            {/* Request Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                Requested {new Date(content.requestedAt).toLocaleDateString()}
              </Typography>
              {content.reason && (
                <Typography variant="caption" color="text.secondary">
                  Reason: {content.reason}
                </Typography>
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={() => handleViewContent(content)}
              >
                View Details
              </Button>
              
              {content.status === 'pending' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() => handleRespond(content, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={() => handleRespond(content, 'reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<BlockIcon />}
                    onClick={() => handleRespond(content, 'block')}
                  >
                    Block
                  </Button>
                </>
              )}
            </Box>

            {/* Parent Response */}
            {content.parentResponse && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Your response ({new Date(content.parentResponse.respondedAt).toLocaleDateString()}):
                </Typography>
                <Typography variant="body2">
                  {content.parentResponse.reason || `Content ${content.parentResponse.decision}`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load approval requests. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          Content Approval Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve content requested by your children
        </Typography>
      </Box>

      {/* Filters and Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterBy}
            label="Filter"
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <MenuItem value="all">All Children</MenuItem>
            <MenuItem value="high_priority">High Priority</MenuItem>
            <MenuItem value="safety_concerns">Safety Concerns</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort</InputLabel>
          <Select
            value={sortBy}
            label="Sort"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Status Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab
          label={
            <Badge
              badgeContent={approvalsData?.stats?.pending || 0}
              color="warning"
              max={99}
            >
              Pending
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={approvalsData?.stats?.approved || 0}
              color="success"
              max={99}
            >
              Approved
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={approvalsData?.stats?.rejected || 0}
              color="error"
              max={99}
            >
              Rejected
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={approvalsData?.stats?.blocked || 0}
              color="error"
              max={99}
            >
              Blocked
            </Badge>
          }
        />
      </Tabs>

      {/* Content List */}
      {isLoading ? (
        <Box>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={120} height={80} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" height={24} width="60%" />
                    <Skeleton variant="text" height={20} width="40%" />
                    <Skeleton variant="text" height={16} width="80%" />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Skeleton variant="rectangular" width={80} height={32} />
                      <Skeleton variant="rectangular" width={80} height={32} />
                      <Skeleton variant="rectangular" width={80} height={32} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : !approvalsData?.requests?.length ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PendingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No approval requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 0
              ? 'No pending approval requests at this time'
              : `No ${activeTab === 1 ? 'approved' : activeTab === 2 ? 'rejected' : 'blocked'} content`
            }
          </Typography>
        </Box>
      ) : (
        <Box>
          {approvalsData.requests.map((content: PendingContent) => renderContentCard(content))}
        </Box>
      )}

      {/* Content Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Content Review: {selectedContent?.title}
        </DialogTitle>
        <DialogContent>
          {selectedContent && (
            <Box>
              {/* Content Safety Analysis */}
              <ContentSafetyRating
                contentId={selectedContent.contentId}
                contentTitle={selectedContent.title}
                safetyRating={selectedContent.safetyRating}
                safetyMetrics={selectedContent.safetyMetrics}
                childAge={10} // This should come from child profile
                showDetails={true}
              />
              
              {/* Request Information */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Request Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Requested by
                      </Typography>
                      <Typography variant="body1">
                        {selectedContent.childName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Request Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedContent.requestedAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Reason for Request
                      </Typography>
                      <Typography variant="body1">
                        {selectedContent.reason || 'No specific reason provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedContent?.status === 'pending' && (
            <>
              <Button
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => handleRespond(selectedContent, 'block')}
              >
                Block
              </Button>
              <Button
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleRespond(selectedContent, 'reject')}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => handleRespond(selectedContent, 'approve')}
              >
                Approve
              </Button>
            </>
          )}
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog
        open={showResponseDialog}
        onClose={() => setShowResponseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {responseType === 'approve' ? 'Approve' : responseType === 'reject' ? 'Reject' : 'Block'} Content
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {responseType === 'approve'
              ? 'Approve this content for your child to access?'
              : responseType === 'reject'
              ? 'Reject this content request? Your child will be notified.'
              : 'Block this content permanently? It will not be available for future requests.'
            }
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={`Reason for ${responseType === 'approve' ? 'approval' : responseType === 'reject' ? 'rejection' : 'blocking'} (optional)`}
            value={responseReason}
            onChange={(e) => setResponseReason(e.target.value)}
            placeholder={
              responseType === 'approve'
                ? 'e.g., Educational content appropriate for age'
                : responseType === 'reject'
                ? 'e.g., Not suitable for current age'
                : 'e.g., Contains inappropriate content'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResponseDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={responseType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitResponse}
            disabled={respondMutation.isPending}
          >
            {responseType === 'approve' ? 'Approve' : responseType === 'reject' ? 'Reject' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentalContentApproval;