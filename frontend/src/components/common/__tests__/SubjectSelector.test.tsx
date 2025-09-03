import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import SubjectSelector from '../SubjectSelector';
import { masterDataService } from '../../../services/masterDataService';
import { ThemeContext } from '../../../theme/ThemeContext';

// Mock the master data service
jest.mock('../../../services/masterDataService');
const mockMasterDataService = masterDataService as jest.Mocked<typeof masterDataService>;

// Mock theme helpers
jest.mock('../../../utils/themeHelpers', () => ({
  combineClasses: jest.fn((classes) => classes),
  getLoadingClasses: jest.fn(() => 'loading-class'),
  getFocusClasses: jest.fn(() => 'focus-class'),
  useSubjectColor: jest.fn((subjectId) => {
    const colors: Record<string, string> = {
      'subject-1': '#2196F3',
      'subject-2': '#4CAF50',
      'subject-3': '#FF9800'
    };
    return colors[subjectId] || '#9E9E9E';
  }),
  getSubjectClasses: jest.fn(() => 'subject-class')
}));

const mockTheme = createTheme();

const mockThemeContextValue = {
  userRole: 'parent' as const,
  theme: mockTheme,
  toggleTheme: jest.fn(),
  isDarkMode: false
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <ThemeContext.Provider value={mockThemeContextValue}>
        {component}
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};

const mockSubjects = [
  {
    id: 'subject-1',
    name: 'math',
    displayName: 'Mathematics',
    description: 'Mathematical concepts',
    icon: '🔢',
    color: '#2196F3',
    category: 'core',
    isCore: true,
    sortOrder: 1,
    gradeSubjects: []
  },
  {
    id: 'subject-2',
    name: 'science',
    displayName: 'Science',
    description: 'Scientific concepts',
    icon: '🔬',
    color: '#4CAF50',
    category: 'core',
    isCore: true,
    sortOrder: 2,
    gradeSubjects: []
  },
  {
    id: 'subject-3',
    name: 'art',
    displayName: 'Art',
    description: 'Creative arts',
    icon: '🎨',
    color: '#FF9800',
    category: 'elective',
    isCore: false,
    sortOrder: 3,
    gradeSubjects: []
  }
];

describe('SubjectSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMasterDataService.getAllSubjects.mockResolvedValue(mockSubjects);
    mockMasterDataService.getSubjectsByGrade.mockResolvedValue(mockSubjects.slice(0, 2)); // Only core subjects for grade
  });

  describe('Basic Functionality', () => {
    it('renders with default props', async () => {
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockMasterDataService.getAllSubjects).toHaveBeenCalled();
      });
    });

    it('displays loading state initially', () => {
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading subjects...')).toBeInTheDocument();
    });

    it('displays subjects after loading', async () => {
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Open the select dropdown
      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
        expect(screen.getByText('Art')).toBeInTheDocument();
      });
    });

    it('calls onChange when subject is selected', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Open dropdown and select subject
      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      const mathOption = screen.getByText('Mathematics');
      await user.click(mathOption);

      expect(mockOnChange).toHaveBeenCalledWith('subject-1');
    });

    it('displays selected value correctly', async () => {
      renderWithTheme(
        <SubjectSelector value="subject-1" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // The selected value should be displayed
      expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
    });
  });

  describe('Grade Filtering', () => {
    it('fetches subjects by grade when grade prop is provided', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          grade="3"
        />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getSubjectsByGrade).toHaveBeenCalledWith('3');
      });
    });

    it('shows grade-specific subjects', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          grade="3"
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
        // Art should not be available for this grade
        expect(screen.queryByText('Art')).not.toBeInTheDocument();
      });
    });
  });

  describe('Core Subjects Filtering', () => {
    it('shows only core subjects when coreOnly is true', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          coreOnly={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
        // Art should be filtered out as it's not core
        expect(screen.queryByText('Art')).not.toBeInTheDocument();
      });
    });
  });

  describe('Visual Elements', () => {
    it('shows subject icons when showIcons is true', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          showIcons={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        // Icons should be present in the dropdown options
        expect(screen.getByText('🔢')).toBeInTheDocument();
        expect(screen.getByText('🔬')).toBeInTheDocument();
        expect(screen.getByText('🎨')).toBeInTheDocument();
      });
    });

    it('hides subject icons when showIcons is false', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          showIcons={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        // Icons should not be present
        expect(screen.queryByText('🔢')).not.toBeInTheDocument();
        expect(screen.queryByText('🔬')).not.toBeInTheDocument();
      });
    });

    it('shows core subject chips', async () => {
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        const coreChips = screen.getAllByText('Core');
        expect(coreChips.length).toBe(2); // Math and Science are core
      });
    });

    it('shows subject categories when showCategory is true', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          showCategory={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getAllByText('core').length).toBeGreaterThan(0);
        expect(screen.getByText('elective')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Selection', () => {
    it('handles multiple selection mode', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          multiple={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      // Select multiple subjects
      const mathOption = screen.getByText('Mathematics');
      await user.click(mathOption);

      const scienceOption = screen.getByText('Science');
      await user.click(scienceOption);

      expect(mockOnChange).toHaveBeenCalledWith('subject-1,subject-2');
    });

    it('displays multiple selection count', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="subject-1,subject-2" 
          onChange={mockOnChange} 
          multiple={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('2 subjects selected')).toBeInTheDocument();
    });

    it('shows helper text for multiple selections', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="subject-1,subject-2" 
          onChange={mockOnChange} 
          multiple={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2 subject(s) selected')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockMasterDataService.getAllSubjects.mockRejectedValue(new Error('API Error'));

      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load subjects. Please try again.')).toBeInTheDocument();
      });
    });

    it('disables select when error occurs', async () => {
      mockMasterDataService.getAllSubjects.mockRejectedValue(new Error('API Error'));

      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        const selectButton = screen.getByRole('combobox');
        expect(selectButton).toBeDisabled();
      });
    });
  });

  describe('Empty States', () => {
    it('shows no subjects message when no subjects available', async () => {
      mockMasterDataService.getAllSubjects.mockResolvedValue([]);

      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('No subjects available')).toBeInTheDocument();
      });
    });

    it('shows grade-specific no subjects message', async () => {
      mockMasterDataService.getSubjectsByGrade.mockResolvedValue([]);

      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          grade="12"
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('No subjects available for 12')).toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('applies custom label', () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          label="Choose Subject"
        />
      );

      expect(screen.getByLabelText('Choose Subject')).toBeInTheDocument();
    });

    it('shows required indicator when required is true', () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          required={true}
        />
      );

      const formControl = screen.getByLabelText('Subject').closest('.MuiFormControl-root');
      expect(formControl).toHaveClass('Mui-required');
    });

    it('disables select when disabled prop is true', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          disabled={true}
        />
      );

      await waitFor(() => {
        const selectButton = screen.getByRole('combobox');
        expect(selectButton).toBeDisabled();
      });
    });

    it('shows error state when error prop is true', () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          error={true}
        />
      );

      const formControl = screen.getByLabelText('Subject').closest('.MuiFormControl-root');
      expect(formControl).toHaveClass('Mui-error');
    });

    it('displays helper text', () => {
      renderWithTheme(
        <SubjectSelector 
          value="" 
          onChange={mockOnChange} 
          helperText="Select your favorite subject"
        />
      );

      expect(screen.getByText('Select your favorite subject')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-labelledby');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      
      // Focus the select
      await user.tab();
      expect(select).toHaveFocus();

      // Open with Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('provides proper labels for multiple selection', async () => {
      renderWithTheme(
        <SubjectSelector 
          value="subject-1,subject-2" 
          onChange={mockOnChange} 
          multiple={true}
        />
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Performance', () => {
    it('does not refetch data when unrelated props change', async () => {
      const { rerender } = renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getAllSubjects).toHaveBeenCalledTimes(1);
      });

      // Change unrelated prop
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <SubjectSelector value="" onChange={mockOnChange} label="New Label" />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      // Should not call API again
      expect(mockMasterDataService.getAllSubjects).toHaveBeenCalledTimes(1);
    });

    it('refetches data when grade changes', async () => {
      const { rerender } = renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} grade="3" />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getSubjectsByGrade).toHaveBeenCalledWith('3');
      });

      // Change grade
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <SubjectSelector value="" onChange={mockOnChange} grade="5" />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(mockMasterDataService.getSubjectsByGrade).toHaveBeenCalledWith('5');
      });
    });

    it('refetches data when coreOnly changes', async () => {
      const { rerender } = renderWithTheme(
        <SubjectSelector value="" onChange={mockOnChange} coreOnly={false} />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getAllSubjects).toHaveBeenCalledTimes(1);
      });

      // Change coreOnly
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <SubjectSelector value="" onChange={mockOnChange} coreOnly={true} />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(mockMasterDataService.getAllSubjects).toHaveBeenCalledTimes(2);
      });
    });
  });
});