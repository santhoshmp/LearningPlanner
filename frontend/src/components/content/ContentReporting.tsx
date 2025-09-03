import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Report as ReportIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Feedback as FeedbackIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ContentReportingProps {
  contentId: string;
  contentTitle: string;
  contentType: 'video' | 'article' | 'interactive';
  childId?: string;
  parentId?: string;
  open: boolean;
  onClose: () => void;
  onReportSubmitted?: (reportId: string) => void;
}

interface ReportData {
  category: string;
  subcategories: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  contactInfo?: string;
  anonymous: boolean;
}

const ContentReporting: React.FC<ContentReportingProps> = ({
  contentId,
  contentTitle,
  contentType,
  childId,
  parentId,
  open,
  onClose,
  onReportSubmitted,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportData, setReportData] = useState<ReportData>({
    category: '',
    subcategories: [],
    description: '',
    severity: 'medium',
    evidence: '',
    contactInfo: '',
    anonymous: false,
  });

  const steps = ['Report Category', 'Details', 'Review & Submit'];

  const reportCategories = [
    {
      id: 'inappropriate_content',
      label: 'Inappropriate Content',
      description: 'Content not suitable for children',
      subcategories: [
        'Violence or aggression',
        'Sexual content',
        'Inappropriate language',
        'Scary or disturbing content',
        'Adult themes',
      ],
    },
    {
      id: 'safety_concerns',
      label: 'Safety Concerns',
      description: 'Content that may pose safety risks',
      subcategories: [
        'Dangerous activities',
        'Self-harm content',
        'Substance abuse',
        'Cyberbullying',
        'Privacy violations',
      ],
    },
    {
      id: 'misinformation',
      label: 'Misinformation',
      description: 'False or misleading information',
      subcategories: [
        'False facts',
        'Conspiracy theories',
        'Medical misinformation',
        'Historical inaccuracies',
        'Pseudoscience',
      ],
    },
    {
      id: 'technical_issues',
      label: 'Technical Issues',
      description: 'Problems with content functionality',
      subcategories: [
        'Broken links',
        'Audio/video problems',
        'Loading issues',
        'Interactive elements not working',
        'Accessibility problems',
      ],
    },
    {
      id: 'copyright',
      label: 'Copyright Issues',
      description: 'Unauthorized use of copyrighted material',
      subcategories: [
        'Unauthorized music',
        'Copyrighted images',
        'Plagiarized text',
        'Trademark violations',
      ],
    },
    {
      id: 'other',
      label: 'Other',
      description: 'Other concerns not listed above',
      subcategories: [
        'Quality issues',
        'Spam or irrelevant content',
        'Duplicate content',
        'Other concerns',
      ],
    },
  ];

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (data: ReportData) => {
      const response = await fetch('/api/content/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          contentId,
          childId,
          parentId,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Report submitted successfully');
      onReportSubmitted?.(data.reportId);
      handleClose();
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setReportData({
      category: '',
      subcategories: [],
      description: '',
      severity: 'medium',
      evidence: '',
      contactInfo: '',
      anonymous: false,
    });
    onClose();
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCategoryChange = (category: string) => {
    setReportData(prev => ({
      ...prev,
      category,
      subcategories: [], // Reset subcategories when category changes
    }));
  };

  const handleSubcategoryChange = (subcategory: string, checked: boolean) => {
    setReportData(prev => ({
      ...prev,
      subcategories: checked
        ? [...prev.subcategories, subcategory]
        : prev.subcategories.filter(s => s !== subcategory),
    }));
  };

  const handleSubmit = () => {
    submitReportMutation.mutate(reportData);
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 0:
        return reportData.category !== '';
      case 1:
        return reportData.description.trim() !== '';
      case 2:
        return true;
      default:
        return false;
    }
  };

  const selectedCategory = reportCategories.find(cat => cat.id === reportData.category);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              What type of issue are you reporting?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select the category that best describes your concern about "{contentTitle}".
            </Typography>
            
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={reportData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {reportCategories.map((category) => (
                  <Card
                    key={category.id}
                    sx={{
                      mb: 1,
                      border: reportData.category === category.id ? 2 : 1,
                      borderColor: reportData.category === category.id ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <FormControlLabel
                        value={category.id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {category.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {category.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Provide details about the issue
            </Typography>
            
            {selectedCategory && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Specific concerns (select all that apply):
                </Typography>
                <FormGroup>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <FormControlLabel
                      key={subcategory}
                      control={
                        <Checkbox
                          checked={reportData.subcategories.includes(subcategory)}
                          onChange={(e) => handleSubcategoryChange(subcategory, e.target.checked)}
                        />
                      }
                      label={subcategory}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Describe the issue"
              placeholder="Please provide specific details about what you found concerning..."
              value={reportData.description}
              onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
              required
              sx={{ mb: 3 }}
            />

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">How severe is this issue?</FormLabel>
              <RadioGroup
                row
                value={reportData.severity}
                onChange={(e) => setReportData(prev => ({ ...prev, severity: e.target.value as any }))}
              >
                <FormControlLabel value="low" control={<Radio />} label="Low" />
                <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                <FormControlLabel value="high" control={<Radio />} label="High" />
                <FormControlLabel value="critical" control={<Radio />} label="Critical" />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Additional evidence (optional)"
              placeholder="Any additional information, timestamps, or evidence..."
              value={reportData.evidence}
              onChange={(e) => setReportData(prev => ({ ...prev, evidence: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={reportData.anonymous}
                  onChange={(e) => setReportData(prev => ({ ...prev, anonymous: e.target.checked }))}
                />
              }
              label="Submit this report anonymously"
            />

            {!reportData.anonymous && (
              <TextField
                fullWidth
                label="Contact information (optional)"
                placeholder="Email or phone number for follow-up"
                value={reportData.contactInfo}
                onChange={(e) => setReportData(prev => ({ ...prev, contactInfo: e.target.value }))}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Review your report
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your report before submitting. Our content moderation team will investigate this issue.
            </Alert>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Report Summary
                </Typography>
                
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Content"
                      secondary={`${contentTitle} (${contentType})`}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <ReportIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Category"
                      secondary={selectedCategory?.label}
                    />
                  </ListItem>
                  
                  {reportData.subcategories.length > 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Specific Concerns"
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {reportData.subcategories.map((sub, index) => (
                              <Chip
                                key={index}
                                size="small"
                                label={sub}
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Severity"
                      secondary={
                        <Chip
                          size="small"
                          label={reportData.severity.toUpperCase()}
                          color={
                            reportData.severity === 'critical' ? 'error' :
                            reportData.severity === 'high' ? 'warning' :
                            reportData.severity === 'medium' ? 'info' : 'default'
                          }
                        />
                      }
                    />
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Description:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {reportData.description}
                </Typography>
                
                {reportData.evidence && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Additional Evidence:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {reportData.evidence}
                    </Typography>
                  </>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  Report will be submitted {reportData.anonymous ? 'anonymously' : 'with your contact information'}
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="warning">
              <Typography variant="body2">
                False reports may result in account restrictions. Please ensure your report is accurate and made in good faith.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportIcon />
        Report Content Issue
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceedFromStep(activeStep)}
            endIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={submitReportMutation.isPending}
            startIcon={<SendIcon />}
          >
            Submit Report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContentReporting;