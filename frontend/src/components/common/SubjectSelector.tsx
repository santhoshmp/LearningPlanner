import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  FormHelperText,
  Box,
  Chip,
  Avatar,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { masterDataService, MasterDataSubject } from '../../services/masterDataService';
import { useTheme } from '../../theme/ThemeContext';
import { 
  combineClasses, 
  getLoadingClasses, 
  getFocusClasses, 
  useSubjectColor,
  getSubjectClasses 
} from '../../utils/themeHelpers';

interface SubjectSelectorProps {
  value: string;
  onChange: (subjectId: string) => void;
  grade?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  showIcons?: boolean;
  showColors?: boolean;
  showCategory?: boolean;
  coreOnly?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  multiple?: boolean;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  value,
  onChange,
  grade,
  label = 'Subject',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  showIcons = true,
  showColors = true,
  showCategory = false,
  coreOnly = false,
  variant = 'outlined',
  multiple = false
}) => {
  const [subjects, setSubjects] = useState<MasterDataSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { userRole } = useTheme();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        let subjectData: MasterDataSubject[];
        
        if (grade) {
          // Get subjects for specific grade
          subjectData = await masterDataService.getSubjectsByGrade(grade);
        } else {
          // Get all subjects
          subjectData = await masterDataService.getAllSubjects();
        }
        
        // Filter by core subjects if requested
        if (coreOnly) {
          subjectData = subjectData.filter(subject => subject.isCore);
        }
        
        setSubjects(subjectData);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setApiError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [grade, coreOnly]);

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    const selectedValue = event.target.value;
    if (multiple) {
      // Handle multiple selection
      onChange(Array.isArray(selectedValue) ? selectedValue.join(',') : selectedValue);
    } else {
      onChange(Array.isArray(selectedValue) ? selectedValue[0] : selectedValue);
    }
  };

  const getSubjectIcon = (subject: MasterDataSubject) => {
    if (!showIcons || !subject.icon) return null;
    
    const subjectColor = useSubjectColor(subject.id);
    
    return (
      <Avatar
        sx={{
          width: 24,
          height: 24,
          bgcolor: showColors ? subjectColor : 'primary.main',
          fontSize: '0.75rem'
        }}
        className="transition-all duration-200 hover:scale-110"
      >
        {subject.icon}
      </Avatar>
    );
  };

  const getSelectedSubjects = () => {
    if (multiple) {
      const selectedIds = value.split(',').filter(Boolean);
      return subjects.filter(subject => selectedIds.includes(subject.id));
    }
    return subjects.filter(subject => subject.id === value);
  };

  const renderValue = (selected: string | string[]) => {
    if (multiple) {
      const selectedIds = Array.isArray(selected) ? selected : selected.split(',').filter(Boolean);
      const selectedSubjects = subjects.filter(subject => selectedIds.includes(subject.id));
      
      if (selectedSubjects.length === 0) return '';
      if (selectedSubjects.length === 1) return selectedSubjects[0].displayName;
      return `${selectedSubjects.length} subjects selected`;
    }
    
    const subject = subjects.find(s => s.id === selected);
    return subject ? subject.displayName : '';
  };

  if (loading) {
    return (
      <FormControl 
        fullWidth={fullWidth} 
        size={size} 
        variant={variant}
        className={combineClasses(getLoadingClasses('pulse'))}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          value={multiple ? [] : ""}
          label={label}
          disabled
          multiple={multiple}
          className={getFocusClasses(userRole)}
          endAdornment={
            <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
              <CircularProgress size={20} />
            </Box>
          }
        >
          <MenuItem value="">Loading...</MenuItem>
        </Select>
        {helperText && <FormHelperText>Loading subjects...</FormHelperText>}
      </FormControl>
    );
  }

  if (apiError) {
    return (
      <Box>
        <FormControl fullWidth={fullWidth} size={size} variant={variant} error>
          <InputLabel>{label}</InputLabel>
          <Select
            value={multiple ? [] : ""}
            label={label}
            disabled
            multiple={multiple}
          >
            <MenuItem value="">Error loading subjects</MenuItem>
          </Select>
          <FormHelperText>
            <Alert severity="error" sx={{ mt: 1 }}>
              {apiError}
            </Alert>
          </FormHelperText>
        </FormControl>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in">
      <FormControl 
        fullWidth={fullWidth} 
        size={size} 
        variant={variant}
        required={required}
        disabled={disabled}
        error={error}
      >
        <InputLabel id={`subject-selector-label-${Math.random()}`}>
          {label}
        </InputLabel>
        <Select
          labelId={`subject-selector-label-${Math.random()}`}
          value={multiple ? (value ? value.split(',').filter(Boolean) : []) : value}
          label={label}
          onChange={handleChange}
          disabled={disabled}
          multiple={multiple}
          renderValue={multiple ? renderValue : undefined}
          className={getFocusClasses(userRole)}
        >
          {subjects.length === 0 ? (
            <MenuItem value="" disabled>
              {grade ? `No subjects available for ${grade}` : 'No subjects available'}
            </MenuItem>
          ) : (
            subjects.map((subject) => (
              <MenuItem 
                key={subject.id} 
                value={subject.id}
                className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  {showIcons && (
                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                      {getSubjectIcon(subject)}
                    </ListItemIcon>
                  )}
                  <ListItemText 
                    primary={subject.displayName}
                    secondary={showCategory ? subject.category : undefined}
                  />
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                    {subject.isCore && (
                      <Chip 
                        label="Core" 
                        size="small" 
                        variant="outlined"
                        color="primary"
                        className="animate-scale-in"
                      />
                    )}
                    {showColors && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: useSubjectColor(subject.id),
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                        className="transition-all duration-200 hover:scale-125"
                      />
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
        {(helperText || (multiple && value)) && (
          <FormHelperText className="animate-slide-up">
            {helperText}
            {multiple && value && (
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                {getSelectedSubjects().length} subject(s) selected
              </Box>
            )}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default SubjectSelector;