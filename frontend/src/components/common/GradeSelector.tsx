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
  Chip
} from '@mui/material';
import { masterDataService, MasterDataGradeLevel } from '../../services/masterDataService';
import { useTheme } from '../../theme/ThemeContext';
import { combineClasses, getLoadingClasses, getFocusClasses } from '../../utils/themeHelpers';

interface GradeSelectorProps {
  value: string;
  onChange: (grade: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  showAgeRange?: boolean;
  filterByAge?: number;
  variant?: 'outlined' | 'filled' | 'standard';
}

const GradeSelector: React.FC<GradeSelectorProps> = ({
  value,
  onChange,
  label = 'Grade Level',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  showAgeRange = false,
  filterByAge,
  variant = 'outlined'
}) => {
  const [grades, setGrades] = useState<MasterDataGradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { userRole } = useTheme();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        let gradeData: MasterDataGradeLevel[];
        
        if (filterByAge) {
          // If filtering by age, get the appropriate grade
          const gradeByAge = await masterDataService.getGradeByAge(filterByAge);
          gradeData = gradeByAge ? [gradeByAge] : [];
        } else {
          // Get all grades
          gradeData = await masterDataService.getAllGrades();
        }
        
        setGrades(gradeData);
      } catch (error) {
        console.error('Error fetching grades:', error);
        setApiError('Failed to load grade levels. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [filterByAge]);

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  const getGradeDisplayName = (grade: MasterDataGradeLevel) => {
    if (showAgeRange) {
      return `${grade.displayName} (Ages ${grade.ageMin}-${grade.ageMax})`;
    }
    return grade.displayName;
  };

  const getSelectedGrade = () => {
    return grades.find(grade => grade.grade === value);
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
          value=""
          label={label}
          disabled
          className={getFocusClasses(userRole)}
          endAdornment={
            <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
              <CircularProgress size={20} />
            </Box>
          }
        >
          <MenuItem value="">Loading...</MenuItem>
        </Select>
        {helperText && <FormHelperText>Loading grade levels...</FormHelperText>}
      </FormControl>
    );
  }

  if (apiError) {
    return (
      <Box>
        <FormControl 
          fullWidth={fullWidth} 
          size={size} 
          variant={variant} 
          error
          className="animate-fade-in"
        >
          <InputLabel>{label}</InputLabel>
          <Select
            value=""
            label={label}
            disabled
            className={getFocusClasses(userRole)}
          >
            <MenuItem value="">Error loading grades</MenuItem>
          </Select>
          <FormHelperText>
            <Alert 
              severity="error" 
              sx={{ mt: 1 }}
              className="animate-slide-up"
            >
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
        <InputLabel id={`grade-selector-label-${Math.random()}`}>
          {label}
        </InputLabel>
        <Select
          labelId={`grade-selector-label-${Math.random()}`}
          value={value}
          label={label}
          onChange={handleChange}
          disabled={disabled}
          className={getFocusClasses(userRole)}
        >
          {grades.length === 0 ? (
            <MenuItem value="" disabled>
              No grades available
            </MenuItem>
          ) : (
            grades.map((grade) => (
              <MenuItem 
                key={grade.id} 
                value={grade.grade}
                className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <span>{getGradeDisplayName(grade)}</span>
                  {grade.educationalLevel && (
                    <Chip 
                      label={grade.educationalLevel} 
                      size="small" 
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                      className="animate-scale-in"
                    />
                  )}
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
        {(helperText || (showAgeRange && value)) && (
          <FormHelperText className="animate-slide-up">
            {helperText}
            {showAgeRange && value && getSelectedGrade() && (
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                Typical age: {getSelectedGrade()?.ageTypical} years
              </Box>
            )}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default GradeSelector;