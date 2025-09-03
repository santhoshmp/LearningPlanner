import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  Code,
  Email,
  Schedule,
  Delete,
  Edit,
  Visibility,
  GetApp,
  Settings,
  CalendarToday,
  Person,
} from '@mui/icons-material';
// Using native date input for now - can be upgraded to MUI DatePicker later
import { analyticsService } from '../../services/analyticsService';
import { ChildProfile } from '../../types/child';
import { TimeFrame, ExportOptions } from '../../types/analytics';

interface ExportReportsProps {
  childId?: string;
  timeFrame: TimeFrame;
  children: ChildProfile[];
}

interface ScheduledReport {
  id: string;
  childId: string;
  childName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'csv';
  email: string;
  sections: string[];
  nextRun: string;
  isActive: boolean;
}

const ExportReports: React.FC<ExportReportsProps> = ({ 
  childId, 
  timeFrame, 
  children 
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    dateRange: timeFrame,
    sections: ['overview', 'progress', 'insights'],
    childIds: childId ? [childId] : []
  });

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    // Sample data - in real app this would come from API
    {
      id: '1',
      childId: childId || '',
      childName: children.find(c => c.id === childId)?.name || 'Unknown',
      frequency: 'weekly',
      format: 'pdf',
      email: 'parent@example.com',
      sections: ['overview', 'progress', 'insights'],
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [scheduleForm, setScheduleForm] = useState({
    childId: childId || '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    format: 'pdf' as 'pdf' | 'csv',
    email: '',
    sections: ['overview', 'progress', 'insights']
  });

  const availableSections = [
    { id: 'overview', label: 'Overview & Summary', description: 'Key metrics and performance summary' },
    { id: 'progress', label: 'Progress Tracking', description: 'Detailed progress charts and trends' },
    { id: 'insights', label: 'Learning Insights', description: 'AI-generated insights and recommendations' },
    { id: 'mastery', label: 'Mastery Analysis', description: 'Subject mastery levels and competencies' },
    { id: 'engagement', label: 'Engagement Patterns', description: 'Study habits and engagement metrics' },
    { id: 'velocity', label: 'Learning Velocity', description: 'Learning pace and improvement trends' },
    { id: 'alerts', label: 'Alerts & Notifications', description: 'Important alerts and milestones' }
  ];

  const handleExportOptionChange = (field: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSectionToggle = (sectionId: string) => {
    const currentSections = exportOptions.sections;
    const newSections = currentSections.includes(sectionId)
      ? currentSections.filter(s => s !== sectionId)
      : [...currentSections, sectionId];
    
    handleExportOptionChange('sections', newSections);
  };

  const handleChildToggle = (childId: string) => {
    const currentChildren = exportOptions.childIds;
    const newChildren = currentChildren.includes(childId)
      ? currentChildren.filter(c => c !== childId)
      : [...currentChildren, childId];
    
    handleExportOptionChange('childIds', newChildren);
  };

  const handleExport = async () => {
    if (exportOptions.childIds.length === 0) {
      setExportError('Please select at least one child');
      return;
    }

    if (exportOptions.sections.length === 0) {
      setExportError('Please select at least one section to include');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const blob = await analyticsService.exportAnalyticsData(exportOptions);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `analytics-report-${exportOptions.dateRange.start}-to-${exportOptions.dateRange.end}.${exportOptions.format}`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(`Report exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleReport = async () => {
    if (!scheduleForm.childId || !scheduleForm.email) {
      return;
    }

    try {
      const result = await analyticsService.scheduleReport(scheduleForm.childId, {
        frequency: scheduleForm.frequency,
        format: scheduleForm.format,
        email: scheduleForm.email,
        sections: scheduleForm.sections
      });

      const newReport: ScheduledReport = {
        id: result.scheduleId,
        childId: scheduleForm.childId,
        childName: children.find(c => c.id === scheduleForm.childId)?.name || 'Unknown',
        frequency: scheduleForm.frequency,
        format: scheduleForm.format,
        email: scheduleForm.email,
        sections: scheduleForm.sections,
        nextRun: new Date(Date.now() + getFrequencyMs(scheduleForm.frequency)).toISOString(),
        isActive: true
      };

      setScheduledReports(prev => [...prev, newReport]);
      setScheduleDialogOpen(false);
      setActiveStep(0);
      
      // Reset form
      setScheduleForm({
        childId: childId || '',
        frequency: 'weekly',
        format: 'pdf',
        email: '',
        sections: ['overview', 'progress', 'insights']
      });
    } catch (error) {
      console.error('Failed to schedule report:', error);
    }
  };

  const getFrequencyMs = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PictureAsPdf />;
      case 'csv': return <TableChart />;
      case 'json': return <Code />;
      default: return <Download />;
    }
  };

  const steps = ['Select Options', 'Choose Sections', 'Schedule Settings'];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Export Options */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Export Analytics Report"
              subheader="Generate and download detailed analytics reports"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Export Format</InputLabel>
                    <Select
                      value={exportOptions.format}
                      label="Export Format"
                      onChange={(e) => handleExportOptionChange('format', e.target.value)}
                    >
                      <MenuItem value="pdf">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PictureAsPdf sx={{ mr: 1 }} />
                          PDF Report
                        </Box>
                      </MenuItem>
                      <MenuItem value="csv">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TableChart sx={{ mr: 1 }} />
                          CSV Data
                        </Box>
                      </MenuItem>
                      <MenuItem value="json">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Code sx={{ mr: 1 }} />
                          JSON Data
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Children
                  </Typography>
                  <FormGroup>
                    {children.map(child => (
                      <FormControlLabel
                        key={child.id}
                        control={
                          <Checkbox
                            checked={exportOptions.childIds.includes(child.id)}
                            onChange={() => handleChildToggle(child.id)}
                          />
                        }
                        label={child.name}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Report Sections
                  </Typography>
                  <FormGroup>
                    {availableSections.map(section => (
                      <FormControlLabel
                        key={section.id}
                        control={
                          <Checkbox
                            checked={exportOptions.sections.includes(section.id)}
                            onChange={() => handleSectionToggle(section.id)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{section.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {section.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </Grid>

                {exportOptions.format === 'pdf' && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includeCharts}
                          onChange={(e) => handleExportOptionChange('includeCharts', e.target.checked)}
                        />
                      }
                      label="Include Charts and Visualizations"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => {
                        handleExportOptionChange('dateRange', {
                          ...exportOptions.dateRange,
                          start: e.target.value
                        });
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => {
                        handleExportOptionChange('dateRange', {
                          ...exportOptions.dateRange,
                          end: e.target.value
                        });
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              {exportError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {exportError}
                </Alert>
              )}

              {exportSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {exportSuccess}
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isExporting ? <CircularProgress size={20} /> : <Download />}
                  onClick={handleExport}
                  disabled={isExporting}
                  fullWidth
                >
                  {isExporting ? 'Exporting...' : 'Export Report'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Reports */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Scheduled Reports"
              subheader="Automate regular report generation and delivery"
              action={
                <Button
                  variant="outlined"
                  startIcon={<Schedule />}
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  Schedule Report
                </Button>
              }
            />
            <CardContent>
              {scheduledReports.length === 0 ? (
                <Alert severity="info">
                  No scheduled reports yet. Create your first automated report to receive regular updates.
                </Alert>
              ) : (
                <List>
                  {scheduledReports.map((report, index) => (
                    <React.Fragment key={report.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getFormatIcon(report.format)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {report.childName} - {report.frequency} {report.format.toUpperCase()}
                              </Typography>
                              <Chip 
                                label={report.isActive ? 'Active' : 'Paused'}
                                size="small"
                                color={report.isActive ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Email: {report.email}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Next run: {new Date(report.nextRun).toLocaleDateString()}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {report.sections.map(section => (
                                  <Chip 
                                    key={section}
                                    label={availableSections.find(s => s.id === section)?.label || section}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                          <IconButton size="small">
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < scheduledReports.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Schedule Report Dialog */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Schedule Automated Report</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Child</InputLabel>
                  <Select
                    value={scheduleForm.childId}
                    label="Child"
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, childId: e.target.value }))}
                  >
                    {children.map(child => (
                      <MenuItem key={child.id} value={child.id}>
                        {child.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={scheduleForm.frequency}
                    label="Frequency"
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, frequency: e.target.value as any }))}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={scheduleForm.format}
                    label="Format"
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, format: e.target.value as any }))}
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={scheduleForm.email}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, email: e.target.value }))}
                  helperText="Reports will be sent to this email address"
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Select sections to include in the scheduled report:
              </Typography>
              <FormGroup>
                {availableSections.map(section => (
                  <FormControlLabel
                    key={section.id}
                    control={
                      <Checkbox
                        checked={scheduleForm.sections.includes(section.id)}
                        onChange={(e) => {
                          const newSections = e.target.checked
                            ? [...scheduleForm.sections, section.id]
                            : scheduleForm.sections.filter(s => s !== section.id);
                          setScheduleForm(prev => ({ ...prev, sections: newSections }));
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{section.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {section.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {activeStep === 2 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Review Schedule Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Child:</Typography>
                  <Typography variant="body1">
                    {children.find(c => c.id === scheduleForm.childId)?.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Frequency:</Typography>
                  <Typography variant="body1">{scheduleForm.frequency}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Format:</Typography>
                  <Typography variant="body1">{scheduleForm.format.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body1">{scheduleForm.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Sections:</Typography>
                  <Box sx={{ mt: 1 }}>
                    {scheduleForm.sections.map(sectionId => (
                      <Chip 
                        key={sectionId}
                        label={availableSections.find(s => s.id === sectionId)?.label}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={() => setActiveStep(prev => prev + 1)}
              disabled={
                (activeStep === 0 && (!scheduleForm.childId || !scheduleForm.email)) ||
                (activeStep === 1 && scheduleForm.sections.length === 0)
              }
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleScheduleReport}
              startIcon={<Schedule />}
            >
              Schedule Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExportReports;