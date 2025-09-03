import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import GradeSelector from '../GradeSelector';
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
  useSubjectColor: jest.fn(() => '#2196F3'),
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

const mockGrades = [
  {
    id: 'grade-1',
    grade: 'K',
    displayName: 'Kindergarten',
    ageMin: 5,
    ageMax: 6,
    ageTypical: 5,
    educationalLevel: 'elementary',
    sortOrder: 0,
    isActive: true,
    subjects: []
  },
  {
    id: 'grade-2',
    grade: '1',
    displayName: 'Grade 1',
    ageMin: 6,
    ageMax: 7,
    ageTypical: 6,
    educationalLevel: 'elementary',
    sortOrder: 1,
    isActive: true,
    subjects: []
  },
  {
    id: 'grade-3',
    grade: '3',
    displayName: 'Grade 3',
    ageMin: 8,
    ageMax: 9,
    ageTypical: 8,
    educationalLevel: 'elementary',
    sortOrder: 3,
    isActive: true,
    subjects: []
  }
];

describe('GradeSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMasterDataService.getAllGrades.mockResolvedValue(mockGrades);
    mockMasterDataService.getGradeByAge.mockResolvedValue(mockGrades[2]);
  });

  describe('Basic Functionality', () => {
    it('renders with default props', async () => {
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      expect(screen.getByLabelText('Grade Level')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockMasterDataService.getAllGrades).toHaveBeenCalled();
      });
    });

    it('displays loading state initially', () => {
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading grade levels...')).toBeInTheDocument();
    });

    it('displays grades after loading', async () => {
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Open the select dropdown
      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Kindergarten')).toBeInTheDocument();
        expect(screen.getByText('Grade 1')).toBeInTheDocument();
        expect(screen.getByText('Grade 3')).toBeInTheDocument();
      });
    });

    it('calls onChange when grade is selected', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Open dropdown and select grade
      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      const kindergartenOption = screen.getByText('Kindergarten');
      await user.click(kindergartenOption);

      expect(mockOnChange).toHaveBeenCalledWith('K');
    });

    it('displays selected value correctly', async () => {
      renderWithTheme(
        <GradeSelector value="K" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // The selected value should be displayed
      expect(screen.getByDisplayValue('K')).toBeInTheDocument();
    });
  });

  describe('Age Range Display', () => {
    it('shows age ranges when showAgeRange is true', async () => {
      renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          showAgeRange={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Kindergarten (Ages 5-6)')).toBeInTheDocument();
        expect(screen.getByText('Grade 1 (Ages 6-7)')).toBeInTheDocument();
      });
    });

    it('shows typical age in helper text when grade is selected', async () => {
      renderWithTheme(
        <GradeSelector 
          value="K" 
          onChange={mockOnChange} 
          showAgeRange={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Typical age: 5 years')).toBeInTheDocument();
      });
    });
  });

  describe('Age Filtering', () => {
    it('filters grades by age when filterByAge is provided', async () => {
      renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          filterByAge={8}
        />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getGradeByAge).toHaveBeenCalledWith(8);
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Grade 3')).toBeInTheDocument();
        expect(screen.queryByText('Kindergarten')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when no grade matches age', async () => {
      mockMasterDataService.getGradeByAge.mockResolvedValue(null);

      renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          filterByAge={25}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        expect(screen.getByText('No grades available')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockMasterDataService.getAllGrades.mockRejectedValue(new Error('API Error'));

      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load grade levels. Please try again.')).toBeInTheDocument();
      });
    });

    it('disables select when error occurs', async () => {
      mockMasterDataService.getAllGrades.mockRejectedValue(new Error('API Error'));

      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        const selectButton = screen.getByRole('combobox');
        expect(selectButton).toBeDisabled();
      });
    });
  });

  describe('Props Handling', () => {
    it('applies custom label', () => {
      renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          label="Custom Grade Label"
        />
      );

      expect(screen.getByLabelText('Custom Grade Label')).toBeInTheDocument();
    });

    it('shows required indicator when required is true', () => {
      renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          required={true}
        />
      );

      const formControl = screen.getByLabelText('Grade Level').closest('.MuiFormControl-root');
      expect(formControl).toHaveClass('Mui-required');
    });

    it('disables select when disabled prop is true', async () => {
      renderWithTheme(
        <GradeSelector 
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
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          error={true}
        />
      );

      const formControl = screen.getByLabelText('Grade Level').closest('.MuiFormControl-root');
      expect(formControl).toHaveClass('Mui-error');
    });

    it('displays helper text', () => {
      renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          helperText="Select your grade level"
        />
      );

      expect(screen.getByText('Select your grade level')).toBeInTheDocument();
    });

    it('applies different sizes', () => {
      const { rerender } = renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          size="small"
        />
      );

      let formControl = screen.getByLabelText('Grade Level').closest('.MuiFormControl-root');
      expect(formControl).toHaveClass('MuiFormControl-sizeSmall');

      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <GradeSelector 
              value="" 
              onChange={mockOnChange} 
              size="medium"
            />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      formControl = screen.getByLabelText('Grade Level').closest('.MuiFormControl-root');
      expect(formControl).not.toHaveClass('MuiFormControl-sizeSmall');
    });

    it('applies different variants', () => {
      const { rerender } = renderWithTheme(
        <GradeSelector 
          value="" 
          onChange={mockOnChange} 
          variant="filled"
        />
      );

      let select = screen.getByLabelText('Grade Level');
      expect(select.closest('.MuiInputBase-root')).toHaveClass('MuiFilledInput-root');

      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <GradeSelector 
              value="" 
              onChange={mockOnChange} 
              variant="standard"
            />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      select = screen.getByLabelText('Grade Level');
      expect(select.closest('.MuiInputBase-root')).toHaveClass('MuiInput-root');
    });
  });

  describe('Educational Level Display', () => {
    it('shows educational level chips in dropdown options', async () => {
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      await waitFor(() => {
        const elementaryChips = screen.getAllByText('elementary');
        expect(elementaryChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-labelledby');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
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
  });

  describe('Performance', () => {
    it('does not refetch data when props change but dependencies remain same', async () => {
      const { rerender } = renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getAllGrades).toHaveBeenCalledTimes(1);
      });

      // Change unrelated prop
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <GradeSelector value="" onChange={mockOnChange} label="New Label" />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      // Should not call API again
      expect(mockMasterDataService.getAllGrades).toHaveBeenCalledTimes(1);
    });

    it('refetches data when filterByAge changes', async () => {
      const { rerender } = renderWithTheme(
        <GradeSelector value="" onChange={mockOnChange} filterByAge={8} />
      );

      await waitFor(() => {
        expect(mockMasterDataService.getGradeByAge).toHaveBeenCalledWith(8);
      });

      // Change filterByAge
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <GradeSelector value="" onChange={mockOnChange} filterByAge={10} />
          </ThemeContext.Provider>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(mockMasterDataService.getGradeByAge).toHaveBeenCalledWith(10);
      });
    });
  });
});