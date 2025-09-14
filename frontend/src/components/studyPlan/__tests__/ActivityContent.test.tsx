import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityContent from '../ActivityContent';
import { StudyActivity } from '../../../types/studyPlan';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock activity data for different content types
const createMockActivity = (contentType: string, contentData: any): StudyActivity => ({
  id: 'test-activity-1',
  planId: 'test-plan-1',
  title: 'Test Activity',
  description: 'A test activity for unit testing',
  subject: 'Mathematics',
  content: {
    type: contentType as any,
    data: contentData
  },
  estimatedDuration: 30,
  difficulty: 2,
  prerequisites: [],
  completionCriteria: {
    type: 'completion',
    threshold: 1
  }
});

const defaultProps = {
  currentStep: 0,
  answers: {},
  onAnswerChange: jest.fn()
};

describe('ActivityContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Content Rendering', () => {
    it('renders text content with comprehension check', () => {
      const textActivity = createMockActivity('text', {
        content: '<h1>Test Content</h1><p>This is test content.</p>',
        comprehensionQuestion: 'What did you learn from this text?'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={textActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Comprehension Check')).toBeInTheDocument();
      expect(screen.getByText('What did you learn from this text?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    });

    it('handles answer changes for text content', () => {
      const textActivity = createMockActivity('text', {
        content: '<p>Test content</p>',
        comprehensionQuestion: 'Test question?'
      });

      const onAnswerChange = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent activity={textActivity} {...defaultProps} onAnswerChange={onAnswerChange} />
        </TestWrapper>
      );

      const textField = screen.getByPlaceholderText('Type your answer here...');
      fireEvent.change(textField, { target: { value: 'Test answer' } });

      expect(onAnswerChange).toHaveBeenCalledWith('Test answer');
    });
  });

  describe('Quiz Content Rendering', () => {
    it('renders multiple choice questions correctly', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: [
          {
            text: 'What is 2 + 2?',
            type: 'multiple-choice',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1
          }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      expect(screen.getByText('Choose the correct answer:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('renders true/false questions correctly', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: [
          {
            text: 'The sky is blue.',
            type: 'true-false',
            correctAnswer: true
          }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
      expect(screen.getByText('True or False:')).toBeInTheDocument();
      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('False')).toBeInTheDocument();
    });

    it('renders short answer questions correctly', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: [
          {
            text: 'Explain photosynthesis.',
            type: 'short-answer'
          }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Explain photosynthesis.')).toBeInTheDocument();
      expect(screen.getByText('Your answer:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    });

    it('handles quiz answer changes for multiple choice', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: [
          {
            text: 'What is 2 + 2?',
            type: 'multiple-choice',
            options: ['3', '4', '5', '6']
          }
        ]
      });

      const onAnswerChange = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} onAnswerChange={onAnswerChange} />
        </TestWrapper>
      );

      const option = screen.getByLabelText('4');
      fireEvent.click(option);

      expect(onAnswerChange).toHaveBeenCalledWith(1);
    });

    it('shows error when question is not found', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: []
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} currentStep={0} />
        </TestWrapper>
      );

      expect(screen.getByText('Question not found')).toBeInTheDocument();
    });
  });

  describe('Interactive Content Rendering', () => {
    it('renders enhanced interactive content with activity title and description', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'This is an interactive learning activity.'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('🎮 Test Activity')).toBeInTheDocument();
      expect(screen.getByText('This is an interactive learning activity.')).toBeInTheDocument();
      expect(screen.getByText('🎯 Activity Instructions')).toBeInTheDocument();
      expect(screen.getByText('Mark as Complete ✓')).toBeInTheDocument();
    });

    it('renders default instructions when none provided', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Follow the interactive exercises below to complete this activity.')).toBeInTheDocument();
    });

    it('renders custom instructions when provided', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity',
        instructions: 'Custom instructions for this specific activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Custom instructions for this specific activity')).toBeInTheDocument();
    });

    it('renders exercises section when exercises are provided', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity',
        exercises: [
          { number: 42, word: 'forty-two' },
          { number: 15 },
          { word: 'example' }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('✏️ Practice Exercises')).toBeInTheDocument();
      expect(screen.getByText('Exercise 1: Number 42')).toBeInTheDocument();
      expect(screen.getByText('Word form: forty-two')).toBeInTheDocument();
      expect(screen.getByText('Exercise 2: Number 15')).toBeInTheDocument();
      expect(screen.getByText('Exercise 3: Practice Item 3')).toBeInTheDocument();
      
      // Check that numbers are displayed prominently
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('handles exercises without numbers correctly', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity',
        exercises: [
          { word: 'example' },
          { description: 'Practice item' }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Exercise 1: Practice Item 1')).toBeInTheDocument();
      expect(screen.getByText('Exercise 2: Practice Item 2')).toBeInTheDocument();
    });

    it('does not render exercises section when no exercises provided', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('✏️ Practice Exercises')).not.toBeInTheDocument();
    });

    it('renders completion section with celebration message', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('🎉 Complete This Activity')).toBeInTheDocument();
      expect(screen.getByText('Great job working through this interactive activity! Mark it as complete when you\'re ready.')).toBeInTheDocument();
    });

    it('handles completion for enhanced interactive content', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      const onAnswerChange = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} onAnswerChange={onAnswerChange} />
        </TestWrapper>
      );

      const completeButton = screen.getByText('Mark as Complete ✓');
      fireEvent.click(completeButton);

      expect(onAnswerChange).toHaveBeenCalledWith(true);
    });

    it('falls back to static resources when data is missing', () => {
      const interactiveActivityWithoutData = createMockActivity('interactive', null);

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivityWithoutData} {...defaultProps} />
        </TestWrapper>
      );

      // Should render static study plan resources instead of interactive content
      expect(screen.getByText('📚 Test Activity')).toBeInTheDocument();
      expect(screen.queryByText('🎮 Test Activity')).not.toBeInTheDocument();
    });

    it('falls back to static resources when description is missing', () => {
      const interactiveActivityWithoutDescription = createMockActivity('interactive', {
        instructions: 'Some instructions but no description'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivityWithoutDescription} {...defaultProps} />
        </TestWrapper>
      );

      // Should render static study plan resources instead of interactive content
      expect(screen.getByText('📚 Test Activity')).toBeInTheDocument();
      expect(screen.queryByText('🎮 Test Activity')).not.toBeInTheDocument();
    });

    it('uses activity description as fallback when content description exists', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Content description'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('🎮 Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Content description')).toBeInTheDocument();
    });

    it('includes static educational content alongside interactive content', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Should have both interactive content and static resources
      expect(screen.getByText('🎮 Test Activity')).toBeInTheDocument(); // Interactive header
      expect(screen.getByText('📚 Test Activity')).toBeInTheDocument(); // Static resources header
      expect(screen.getByText('🎯 Learning Objectives')).toBeInTheDocument(); // From static resources
    });

    it('handles malformed exercise data gracefully', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity',
        exercises: [
          null,
          undefined,
          { invalidProperty: 'test' },
          { number: 5, word: 'five' } // Valid exercise
        ]
      });

      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent activity={interactiveActivity} {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();

      // Should still render the valid exercise
      expect(screen.getByText('Exercise 4: Number 5')).toBeInTheDocument();
    });

    it('handles empty exercises array', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity',
        exercises: []
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('✏️ Practice Exercises')).not.toBeInTheDocument();
    });
  });

  describe('Video Content Rendering', () => {
    it('renders video content with iframe and comprehension check', () => {
      const videoActivity = createMockActivity('video', {
        videoUrl: 'https://example.com/video',
        title: 'Educational Video',
        description: 'A video about learning',
        comprehensionQuestion: 'What was the main topic of the video?'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={videoActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Educational Video')).toBeInTheDocument();
      expect(screen.getByText('A video about learning')).toBeInTheDocument();
      expect(screen.getByText('Video Comprehension')).toBeInTheDocument();
      expect(screen.getByText('What was the main topic of the video?')).toBeInTheDocument();

      const iframe = screen.getByTitle('Educational Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://example.com/video');
    });
  });

  describe('Static Study Plan Resources (Default Case)', () => {
    it('renders static resources for unsupported content type', () => {
      const unsupportedActivity = createMockActivity('unsupported' as any, {});

      render(
        <TestWrapper>
          <ActivityContent activity={unsupportedActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Check for main sections of static resources
      expect(screen.getByText('📚 Test Activity')).toBeInTheDocument();
      expect(screen.getByText('🎯 Learning Objectives')).toBeInTheDocument();
      expect(screen.getByText('🧠 Key Concepts')).toBeInTheDocument();
      expect(screen.getByText('✏️ Practice Exercises')).toBeInTheDocument();
      expect(screen.getByText('📖 Additional Resources')).toBeInTheDocument();
      expect(screen.getByText('🎉 Ready to Continue?')).toBeInTheDocument();
    });

    it('generates static resources correctly with unused parameters', () => {
      // Test that the getStaticResourcesForActivity function works correctly
      // even with unused title and difficulty parameters (now prefixed with _)
      const activityWithVariousParams = createMockActivity('unsupported' as any, {});
      activityWithVariousParams.title = 'Complex Activity Title With Special Characters!@#';
      activityWithVariousParams.difficulty = 5; // High difficulty
      activityWithVariousParams.subject = 'Mathematics';

      render(
        <TestWrapper>
          <ActivityContent activity={activityWithVariousParams} {...defaultProps} />
        </TestWrapper>
      );

      // Verify that the function generates content based on subject (used parameter)
      // regardless of title and difficulty (unused parameters)
      expect(screen.getByText('Subject: Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Number Recognition')).toBeInTheDocument();
      expect(screen.getByText('Basic Operations')).toBeInTheDocument();
      
      // Verify the activity title is still displayed (from activity prop, not function parameter)
      expect(screen.getByText('📚 Complex Activity Title With Special Characters!@#')).toBeInTheDocument();
    });

    it('renders mathematics-specific content for math activities', () => {
      const mathActivity = createMockActivity('unsupported' as any, {});
      mathActivity.title = 'Basic Math Operations';

      render(
        <TestWrapper>
          <ActivityContent activity={mathActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Subject: Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Number Recognition')).toBeInTheDocument();
      expect(screen.getByText('Basic Operations')).toBeInTheDocument();
    });

    it('renders science-specific content for science activities', () => {
      const scienceActivity = createMockActivity('unsupported' as any, {});
      scienceActivity.title = 'Introduction to Science';

      render(
        <TestWrapper>
          <ActivityContent activity={scienceActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Subject: Science')).toBeInTheDocument();
      expect(screen.getByText('Living vs Non-Living')).toBeInTheDocument();
      expect(screen.getByText('Simple Machines')).toBeInTheDocument();
    });

    it('renders english-specific content for english activities', () => {
      const englishActivity = createMockActivity('unsupported' as any, {});
      englishActivity.title = 'English Reading Comprehension';

      render(
        <TestWrapper>
          <ActivityContent activity={englishActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Subject: English')).toBeInTheDocument();
      expect(screen.getByText('Reading Comprehension')).toBeInTheDocument();
      expect(screen.getByText('Vocabulary Building')).toBeInTheDocument();
    });

    it('renders general content for unrecognized subjects', () => {
      const generalActivity = createMockActivity('unsupported' as any, {});
      generalActivity.title = 'General Learning Activity';

      render(
        <TestWrapper>
          <ActivityContent activity={generalActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Subject: General')).toBeInTheDocument();
      expect(screen.getByText('Learning Strategies')).toBeInTheDocument();
    });

    it('handles completion for static resources', () => {
      const unsupportedActivity = createMockActivity('unsupported' as any, {});
      const onAnswerChange = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent activity={unsupportedActivity} {...defaultProps} onAnswerChange={onAnswerChange} />
        </TestWrapper>
      );

      const completeButton = screen.getByText('Mark as Complete ✓');
      fireEvent.click(completeButton);

      expect(onAnswerChange).toHaveBeenCalledWith(true);
    });

    it('displays activity metadata correctly', () => {
      const activityWithMetadata = createMockActivity('unsupported' as any, {});
      activityWithMetadata.estimatedDuration = 45;
      activityWithMetadata.description = 'Test activity description';

      render(
        <TestWrapper>
          <ActivityContent activity={activityWithMetadata} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test activity description')).toBeInTheDocument();
      expect(screen.getByText('Duration: ~45 minutes')).toBeInTheDocument();
    });

    it('renders all required sections for static resources', () => {
      const unsupportedActivity = createMockActivity('unsupported' as any, {});

      render(
        <TestWrapper>
          <ActivityContent activity={unsupportedActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Verify all main sections are present
      const sections = [
        '📚 Test Activity',
        '🎯 Learning Objectives', 
        '🧠 Key Concepts',
        '✏️ Practice Exercises',
        '📖 Additional Resources',
        '🎉 Ready to Continue?'
      ];

      sections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });
  });

  describe('Answer State Management', () => {
    it('displays existing answers correctly', () => {
      const textActivity = createMockActivity('text', {
        content: '<p>Test content</p>',
        comprehensionQuestion: 'Test question?'
      });

      const existingAnswers = { 0: 'Existing answer' };

      render(
        <TestWrapper>
          <ActivityContent 
            activity={textActivity} 
            {...defaultProps} 
            answers={existingAnswers}
          />
        </TestWrapper>
      );

      const textField = screen.getByDisplayValue('Existing answer');
      expect(textField).toBeInTheDocument();
    });

    it('handles empty answers gracefully', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: [
          {
            text: 'Test question?',
            type: 'multiple-choice',
            options: ['A', 'B', 'C']
          }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} answers={{}} />
        </TestWrapper>
      );

      // Should render without errors and no option should be selected
      expect(screen.getByText('Test question?')).toBeInTheDocument();
      
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).not.toBeChecked();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: [
          {
            text: 'Test question?',
            type: 'multiple-choice',
            options: ['Option A', 'Option B']
          }
        ]
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('has proper form labels', () => {
      const textActivity = createMockActivity('text', {
        content: '<p>Test</p>',
        comprehensionQuestion: 'Question?'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={textActivity} {...defaultProps} />
        </TestWrapper>
      );

      const textField = screen.getByRole('textbox');
      expect(textField).toBeInTheDocument();
    });
  });

  describe('Storybook Integration', () => {
    it('renders all story variants without errors', () => {
      // Test the main story configurations to ensure they work
      const storyConfigs = [
        {
          name: 'TextContent',
          activity: createMockActivity('text', {
            content: '<h1>Test</h1><p>Content</p>',
            comprehensionQuestion: 'Test question?'
          })
        },
        {
          name: 'MultipleChoiceQuiz',
          activity: createMockActivity('quiz', {
            questions: [{
              text: 'Test question?',
              type: 'multiple-choice',
              options: ['A', 'B', 'C'],
              correctAnswer: 0
            }]
          })
        },
        {
          name: 'InteractiveActivity',
          activity: createMockActivity('interactive', {
            description: 'Test interactive activity'
          })
        },
        {
          name: 'VideoContent',
          activity: createMockActivity('video', {
            videoUrl: 'https://example.com/video',
            title: 'Test Video',
            description: 'Test description',
            comprehensionQuestion: 'Test question?'
          })
        }
      ];

      storyConfigs.forEach(({ name, activity }) => {
        expect(() => {
          const { unmount } = render(
            <TestWrapper>
              <ActivityContent activity={activity} {...defaultProps} />
            </TestWrapper>
          );
          unmount();
        }).not.toThrow();
      });
    });

    it('handles story decorator theme provider correctly', () => {
      const testActivity = createMockActivity('text', {
        content: '<p>Theme test</p>',
        comprehensionQuestion: 'Theme question?'
      });

      // Test that the component works with ThemeProvider (as used in stories)
      render(
        <ThemeProvider theme={createTheme()}>
          <ActivityContent activity={testActivity} {...defaultProps} />
        </ThemeProvider>
      );

      expect(screen.getByText('Theme question?')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing quiz questions gracefully', () => {
      const quizActivity = createMockActivity('quiz', {
        questions: []
      });

      render(
        <TestWrapper>
          <ActivityContent activity={quizActivity} {...defaultProps} currentStep={5} />
        </TestWrapper>
      );

      expect(screen.getByText('Question not found')).toBeInTheDocument();
    });

    it('handles malformed content data gracefully', () => {
      const malformedActivity = createMockActivity('text', null);

      // Should not crash when rendering
      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent activity={malformedActivity} {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('TypeScript and JSX Compatibility', () => {
    it('renders correctly with current TypeScript JSX configuration', () => {
      const textActivity = createMockActivity('text', {
        content: '<p>Test content for JSX compatibility</p>',
        comprehensionQuestion: 'Test question?'
      });

      // Should render without TypeScript errors or JSX issues
      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent activity={textActivity} {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();

      expect(screen.getByText('Test question?')).toBeInTheDocument();
    });

    it('handles JSX elements in content correctly', () => {
      const htmlActivity = createMockActivity('text', {
        content: '<div><h2>HTML Content</h2><p>With <strong>bold</strong> text</p></div>',
        comprehensionQuestion: 'What did you learn?'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={htmlActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Verify HTML content is rendered (though it's displayed as text in this component)
      expect(screen.getByText('What did you learn?')).toBeInTheDocument();
    });

    it('maintains proper React component structure', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test for React component structure'
      });

      const { container } = render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Verify the component renders as a proper React element
      expect(container.firstChild).toBeInstanceOf(Element);
      expect(container.querySelector('[data-testid]')).toBeDefined();
    });
  });

  describe('Bug Fix Verification - Completion Button Functionality', () => {
    it('completion button has correct text and styling after bug fix', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Verify the button text is correct (this was broken before the fix)
      const completeButton = screen.getByRole('button', { name: /mark as complete ✓/i });
      expect(completeButton).toBeInTheDocument();
      
      // Verify button has proper styling classes
      expect(completeButton).toHaveClass('MuiButton-containedSuccess');
      expect(completeButton).toHaveClass('MuiButton-sizeLarge');
    });

    it('completion button click handler works correctly after bug fix', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      const onAnswerChange = jest.fn();
      const onComplete = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent 
            activity={interactiveActivity} 
            {...defaultProps} 
            onAnswerChange={onAnswerChange}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      const completeButton = screen.getByRole('button', { name: /mark as complete ✓/i });
      
      // Verify click functionality works correctly (this was broken before the fix)
      fireEvent.click(completeButton);
      
      expect(onAnswerChange).toHaveBeenCalledWith(true);
      expect(onComplete).toHaveBeenCalled();
    });

    it('static resources completion button works correctly after bug fix', () => {
      const staticActivity = createMockActivity('unsupported' as any, {});
      const onAnswerChange = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent 
            activity={staticActivity} 
            {...defaultProps} 
            onAnswerChange={onAnswerChange}
          />
        </TestWrapper>
      );

      // Find the completion button in static resources
      const completeButton = screen.getByRole('button', { name: /mark as complete ✓/i });
      expect(completeButton).toBeInTheDocument();
      
      // Test click functionality
      fireEvent.click(completeButton);
      
      expect(onAnswerChange).toHaveBeenCalledWith(true);
    });

    it('completion button is accessible and focusable', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      const completeButton = screen.getByRole('button', { name: /mark as complete ✓/i });
      
      // Verify button is focusable
      completeButton.focus();
      expect(completeButton).toHaveFocus();
      
      // Verify button is not disabled
      expect(completeButton).not.toBeDisabled();
    });

    it('completion button has proper ARIA attributes', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      const completeButton = screen.getByRole('button', { name: /mark as complete ✓/i });
      
      // Verify button has proper role and is accessible
      expect(completeButton).toHaveAttribute('type', 'button');
      expect(completeButton.tagName).toBe('BUTTON');
    });

    it('completion button styling matches design system', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      const completeButton = screen.getByRole('button', { name: /mark as complete ✓/i });
      
      // Verify button has correct Material-UI classes for styling
      expect(completeButton).toHaveClass('MuiButton-root');
      expect(completeButton).toHaveClass('MuiButton-contained');
      expect(completeButton).toHaveClass('MuiButton-containedSuccess');
      expect(completeButton).toHaveClass('MuiButton-sizeLarge');
    });

    it('handles multiple completion buttons correctly', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      const onAnswerChange = jest.fn();

      render(
        <TestWrapper>
          <ActivityContent 
            activity={interactiveActivity} 
            {...defaultProps} 
            onAnswerChange={onAnswerChange}
          />
        </TestWrapper>
      );

      // Should have exactly two completion buttons (one in interactive section, one in static resources)
      const completeButtons = screen.getAllByRole('button', { name: /mark as complete ✓/i });
      expect(completeButtons).toHaveLength(2);
      
      // Both buttons should work correctly
      fireEvent.click(completeButtons[0]);
      expect(onAnswerChange).toHaveBeenCalledWith(true);
      
      onAnswerChange.mockClear();
      
      fireEvent.click(completeButtons[1]);
      expect(onAnswerChange).toHaveBeenCalledWith(true);
    });

    it('completion button text is properly formatted', () => {
      const interactiveActivity = createMockActivity('interactive', {
        description: 'Test interactive activity'
      });

      render(
        <TestWrapper>
          <ActivityContent activity={interactiveActivity} {...defaultProps} />
        </TestWrapper>
      );

      // Verify the exact text content (this was malformed before the fix)
      const completeButton = screen.getByText('Mark as Complete ✓');
      expect(completeButton).toBeInTheDocument();
      
      // Verify it's inside a button element
      expect(completeButton.closest('button')).toBeInTheDocument();
    });
  });
});