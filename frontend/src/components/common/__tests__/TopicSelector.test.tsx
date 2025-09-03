import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import TopicSelector from '../TopicSelector';
import { masterDataService } from '../../../services/masterDataService';

// Mock the master data service
jest.mock('../../../services/masterDataService');
const mockMasterDataService = masterDataService as jest.Mocked<typeof masterDataService>;

const mockTheme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

const mockTopics = [
  {
    id: 'topic-1',
    name: 'addition',
    displayName: 'Basic Addition',
    description: 'Learn to add numbers',
    gradeId: 'grade-3',
    subjectId: 'subject-math',
    difficulty: 'beginner',
    estimatedHours: 2,
    prerequisites: [],
    learningObjectives: ['Add single digits', 'Add double digits'],
    skills: ['arithmetic', 'number-sense'],
    sortOrder: 1,
    isActive: true,
    grade: { grade: '3' },
    subject: { name: 'math' },
    resources: []
  },
  {
    id: 'topic-2',
    name: 'subtraction',
    displayName: 'Basic Subtraction',
    description: 'Learn to subtract numbers',
    gradeId: 'grade-3',
    subjectId: 'subject-math',
    difficulty: 'beginner',
    estimatedHours: 2,
    prerequisites: ['addition'],
    learningObjectives: ['Subtract single digits', 'Subtract double digits'],
    skills: ['arithmetic', 'number-sense'],
    sortOrder: 2,
    isActive: true,
    grade: { grade: '3' },
    subject: { name: 'math' },
    resources: []
  },
  {
    id: 'topic-3',
    name: 'multiplication',
    displayName: 'Multiplication Tables',
    description: 'Learn multiplication tables',
    gradeId: 'grade-3',
    subjectId: 'subject-math',
    difficulty: 'intermediate',
    estimatedHours: 4,
    prerequisites: ['addition'],
    learningObjectives: ['Memorize times tables', 'Understand multiplication concept'],
    skills: ['arithmetic', 'memorization', 'pattern-recognition'],
    sortOrder: 3,
    isActive: true,
    grade: { grade: '3' },
    subject: { name: 'math' },
    resources: []
  },
  {
    id: 'topic-4',
    name: 'division',
    displayName: 'Basic Division',
    description: 'Learn division concepts',
    gradeId: 'grade-3',
    subjectId: 'subject-math',
    difficulty: 'advanced',
    estimatedHours: 3,
    prerequisites: ['multiplication'],
    learningObjectives: ['Understand division as inverse of multiplication'],
    skills: ['arithmetic', 'logical-thinking'],
    sortOrder: 4,
    isActive: true,
    grade: { grade: '3' },
    subject: { name: 'math' },
    resources: []
  }
];

describe('TopicSelector', () => {
  const mockOnTopicsChange = jest.fn();
  const defaultProps = {
    grade: '3',
    subjectId: 'subject-math',
    selectedTopics: [],
    onTopicsChange: mockOnTopicsChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMasterDataService.getTopicsBySubject.mockResolvedValue(mockTopics);
  });

  describe('Basic Functionality', () => {
    it('renders with default props', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      expect(screen.getByText('Select Topics')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockMasterDataService.getTopicsBySubject).toHaveBeenCalledWith('3', 'subject-math');
      });
    });

    it('displays loading state initially', () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      expect(screen.getByText('Loading topics...')).toBeInTheDocument();
    });

    it('displays topics after loading', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Addition')).toBeInTheDocument();
        expect(screen.getByText('Basic Subtraction')).toBeInTheDocument();
        expect(screen.getByText('Multiplication Tables')).toBeInTheDocument();
        expect(screen.getByText('Basic Division')).toBeInTheDocument();
      });
    });

    it('shows topic selection count', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('0/4 selected')).toBeInTheDocument();
      });
    });

    it('calls onTopicsChange when topic is selected', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Addition')).toBeInTheDocument();
      });

      const additionCheckbox = screen.getByRole('checkbox', { name: /Basic Addition/ });
      await user.click(additionCheckbox);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['topic-1']);
    });

    it('displays selected topics correctly', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          selectedTopics={['topic-1', 'topic-2']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2/4 selected')).toBeInTheDocument();
      });

      // Check that the checkboxes are checked
      const additionCheckbox = screen.getByRole('checkbox', { name: /Basic Addition/ });
      const subtractionCheckbox = screen.getByRole('checkbox', { name: /Basic Subtraction/ });
      
      expect(additionCheckbox).toBeChecked();
      expect(subtractionCheckbox).toBeChecked();
    });
  });

  describe('Topic Information Display', () => {
    it('shows difficulty levels by default', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('🟢 beginner')).toBeInTheDocument();
        expect(screen.getByText('🟡 intermediate')).toBeInTheDocument();
        expect(screen.getByText('🔴 advanced')).toBeInTheDocument();
      });
    });

    it('shows estimated hours by default', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2h')).toBeInTheDocument();
        expect(screen.getByText('4h')).toBeInTheDocument();
        expect(screen.getByText('3h')).toBeInTheDocument();
      });
    });

    it('hides difficulty when showDifficulty is false', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} showDifficulty={false} />
      );

      await waitFor(() => {
        expect(screen.queryByText('🟢 beginner')).not.toBeInTheDocument();
        expect(screen.queryByText('🟡 intermediate')).not.toBeInTheDocument();
      });
    });

    it('hides estimated hours when showEstimatedHours is false', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} showEstimatedHours={false} />
      );

      await waitFor(() => {
        expect(screen.queryByText('2h')).not.toBeInTheDocument();
        expect(screen.queryByText('4h')).not.toBeInTheDocument();
      });
    });

    it('shows learning objectives', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add single digits')).toBeInTheDocument();
        expect(screen.getByText('Add double digits')).toBeInTheDocument();
      });
    });

    it('shows skills', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('arithmetic')).toBeInTheDocument();
        expect(screen.getByText('number-sense')).toBeInTheDocument();
      });
    });

    it('truncates long lists with +more indicator', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        // Multiplication has 3 skills, should show +more
        expect(screen.getByText('+1 more')).toBeInTheDocument();
      });
    });
  });

  describe('Prerequisites Display', () => {
    it('shows prerequisites when showPrerequisites is true', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} showPrerequisites={true} />
      );

      await waitFor(() => {
        // Should show info icons for topics with prerequisites
        const infoIcons = screen.getAllByTestId('InfoIcon');
        expect(infoIcons.length).toBeGreaterThan(0);
      });
    });

    it('shows prerequisite tooltip on hover', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TopicSelector {...defaultProps} showPrerequisites={true} />
      );

      await waitFor(() => {
        const infoIcon = screen.getAllByTestId('InfoIcon')[0];
        expect(infoIcon).toBeInTheDocument();
      });

      // Hover over info icon
      const infoIcon = screen.getAllByTestId('InfoIcon')[0];
      await user.hover(infoIcon);

      await waitFor(() => {
        expect(screen.getByText(/Prerequisites:/)).toBeInTheDocument();
      });
    });
  });

  describe('Group by Difficulty', () => {
    it('groups topics by difficulty when groupByDifficulty is true', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} groupByDifficulty={true} />
      );

      await waitFor(() => {
        expect(screen.getByText('🟢 Beginner Topics')).toBeInTheDocument();
        expect(screen.getByText('🟡 Intermediate Topics')).toBeInTheDocument();
        expect(screen.getByText('🔴 Advanced Topics')).toBeInTheDocument();
      });
    });

    it('shows progress bars for each difficulty group', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          groupByDifficulty={true}
          selectedTopics={['topic-1']} // Select one beginner topic
        />
      );

      await waitFor(() => {
        // Should show selection count for beginner group
        expect(screen.getByText('1/2 selected')).toBeInTheDocument();
      });
    });

    it('allows expanding/collapsing difficulty groups', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TopicSelector {...defaultProps} groupByDifficulty={true} />
      );

      await waitFor(() => {
        const expandButton = screen.getAllByTestId('ExpandMoreIcon')[0];
        expect(expandButton).toBeInTheDocument();
      });

      // Click to collapse
      const expandButton = screen.getAllByTestId('ExpandMoreIcon')[0];
      await user.click(expandButton);

      // Topics in that group should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Basic Addition')).not.toBeInTheDocument();
      });
    });
  });

  describe('Selection Limits', () => {
    it('enforces maximum selection limit', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TopicSelector {...defaultProps} maxSelections={2} />
      );

      await waitFor(() => {
        expect(screen.getByText('Max: 2')).toBeInTheDocument();
      });

      // Select two topics
      const additionCheckbox = screen.getByRole('checkbox', { name: /Basic Addition/ });
      const subtractionCheckbox = screen.getByRole('checkbox', { name: /Basic Subtraction/ });
      
      await user.click(additionCheckbox);
      await user.click(subtractionCheckbox);

      // Third topic should be disabled
      const multiplicationCheckbox = screen.getByRole('checkbox', { name: /Multiplication Tables/ });
      expect(multiplicationCheckbox).toBeDisabled();
    });

    it('shows max selections indicator', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} maxSelections={3} />
      );

      await waitFor(() => {
        expect(screen.getByText('Max: 3')).toBeInTheDocument();
      });
    });
  });

  describe('Select All Functionality', () => {
    it('shows select all button when allowSelectAll is true', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} allowSelectAll={true} />
      );

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });
    });

    it('selects all topics when select all is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TopicSelector {...defaultProps} allowSelectAll={true} />
      );

      await waitFor(() => {
        const selectAllButton = screen.getByText('Select All');
        expect(selectAllButton).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await user.click(selectAllButton);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['topic-1', 'topic-2', 'topic-3', 'topic-4']);
    });

    it('changes to deselect all when all topics are selected', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          allowSelectAll={true}
          selectedTopics={['topic-1', 'topic-2', 'topic-3', 'topic-4']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Deselect All')).toBeInTheDocument();
      });
    });

    it('shows clear selection button when some topics are selected', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          allowSelectAll={true}
          selectedTopics={['topic-1', 'topic-2']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Clear Selection')).toBeInTheDocument();
      });
    });

    it('respects max selections when selecting all', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          allowSelectAll={true}
          maxSelections={2}
        />
      );

      await waitFor(() => {
        const selectAllButton = screen.getByText('Select All');
        expect(selectAllButton).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await user.click(selectAllButton);

      // Should only select up to the limit
      expect(mockOnTopicsChange).toHaveBeenCalledWith(['topic-1', 'topic-2']);
    });
  });

  describe('Selected Topics Summary', () => {
    it('shows selected topics summary when topics are selected', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          selectedTopics={['topic-1', 'topic-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Selected Topics (2)')).toBeInTheDocument();
        expect(screen.getByText('Basic Addition')).toBeInTheDocument();
        expect(screen.getByText('Multiplication Tables')).toBeInTheDocument();
      });
    });

    it('allows removing topics from summary', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          selectedTopics={['topic-1', 'topic-3']}
        />
      );

      await waitFor(() => {
        const removeButtons = screen.getAllByTestId('CancelIcon');
        expect(removeButtons.length).toBe(2);
      });

      // Click remove button for first topic
      const removeButton = screen.getAllByTestId('CancelIcon')[0];
      await user.click(removeButton);

      expect(mockOnTopicsChange).toHaveBeenCalledWith(['topic-3']);
    });
  });

  describe('Empty States and Error Handling', () => {
    it('shows info message when grade or subject is not provided', () => {
      renderWithTheme(
        <TopicSelector 
          grade=""
          subjectId=""
          selectedTopics={[]}
          onTopicsChange={mockOnTopicsChange}
        />
      );

      expect(screen.getByText('Please select a grade and subject to view available topics.')).toBeInTheDocument();
    });

    it('shows warning when no topics are available', async () => {
      mockMasterDataService.getTopicsBySubject.mockResolvedValue([]);

      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No topics available for the selected grade and subject.')).toBeInTheDocument();
      });
    });

    it('displays error message when API call fails', async () => {
      mockMasterDataService.getTopicsBySubject.mockRejectedValue(new Error('API Error'));

      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load topics. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables all interactions when disabled prop is true', async () => {
      renderWithTheme(
        <TopicSelector {...defaultProps} disabled={true} />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeDisabled();
        });
      });

      // Select all button should also be disabled
      const selectAllButton = screen.getByText('Select All');
      expect(selectAllButton).toBeDisabled();
    });
  });

  describe('Progress Visualization', () => {
    it('shows progress bar for overall selection', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          selectedTopics={['topic-1', 'topic-2']}
        />
      );

      await waitFor(() => {
        // Should show progress bar with 50% progress (2/4 topics)
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for checkboxes', async () => {
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        const additionCheckbox = screen.getByRole('checkbox', { name: /Basic Addition/ });
        expect(additionCheckbox).toHaveAttribute('aria-describedby');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        const firstCheckbox = screen.getByRole('checkbox', { name: /Basic Addition/ });
        expect(firstCheckbox).toBeInTheDocument();
      });

      // Tab to first checkbox
      await user.tab();
      const firstCheckbox = screen.getByRole('checkbox', { name: /Basic Addition/ });
      expect(firstCheckbox).toHaveFocus();

      // Space to select
      await user.keyboard(' ');
      expect(mockOnTopicsChange).toHaveBeenCalledWith(['topic-1']);
    });

    it('provides proper progress bar labels', async () => {
      renderWithTheme(
        <TopicSelector 
          {...defaultProps} 
          selectedTopics={['topic-1']}
        />
      );

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '25');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('Performance', () => {
    it('does not refetch topics when unrelated props change', async () => {
      const { rerender } = renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(mockMasterDataService.getTopicsBySubject).toHaveBeenCalledTimes(1);
      });

      // Change unrelated prop
      rerender(
        <ThemeProvider theme={mockTheme}>
          <TopicSelector {...defaultProps} showDifficulty={false} />
        </ThemeProvider>
      );

      // Should not call API again
      expect(mockMasterDataService.getTopicsBySubject).toHaveBeenCalledTimes(1);
    });

    it('refetches topics when grade or subject changes', async () => {
      const { rerender } = renderWithTheme(<TopicSelector {...defaultProps} />);

      await waitFor(() => {
        expect(mockMasterDataService.getTopicsBySubject).toHaveBeenCalledWith('3', 'subject-math');
      });

      // Change grade
      rerender(
        <ThemeProvider theme={mockTheme}>
          <TopicSelector {...defaultProps} grade="4" />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(mockMasterDataService.getTopicsBySubject).toHaveBeenCalledWith('4', 'subject-math');
      });
    });
  });
});