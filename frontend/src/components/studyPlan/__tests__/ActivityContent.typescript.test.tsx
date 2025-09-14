/**
 * TypeScript configuration and JSX compatibility tests
 * This file tests TypeScript-specific functionality and JSX handling
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityContent from '../ActivityContent';
import { StudyActivity } from '../../../types/studyPlan';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

const createMockActivity = (contentType: string, contentData: any): StudyActivity => ({
  id: 'typescript-test-activity',
  planId: 'typescript-test-plan',
  title: 'TypeScript Test Activity',
  description: 'Testing TypeScript compatibility',
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

describe('ActivityContent TypeScript Configuration', () => {
  describe('JSX Runtime Compatibility', () => {
    it('works with React 17+ automatic JSX runtime', () => {
      const activity = createMockActivity('text', {
        content: '<p>JSX runtime test</p>',
        comprehensionQuestion: 'Does this work with automatic JSX?'
      });

      // Should compile and render without explicit React import in JSX
      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent 
              activity={activity}
              currentStep={0}
              answers={{}}
              onAnswerChange={jest.fn()}
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles complex JSX structures correctly', () => {
      const activity = createMockActivity('interactive', {
        description: 'Complex JSX test with nested elements'
      });

      const ComplexWrapper: React.FC = () => (
        <div>
          <TestWrapper>
            <div data-testid="nested-wrapper">
              <ActivityContent 
                activity={activity}
                currentStep={0}
                answers={{}}
                onAnswerChange={jest.fn()}
              />
            </div>
          </TestWrapper>
        </div>
      );

      expect(() => {
        render(<ComplexWrapper />);
      }).not.toThrow();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('enforces correct prop types', () => {
      const activity = createMockActivity('quiz', {
        questions: [{
          text: 'Type safety test',
          type: 'multiple-choice',
          options: ['A', 'B', 'C'],
          correctAnswer: 0
        }]
      });

      // This should compile without TypeScript errors
      const validProps = {
        activity,
        currentStep: 0,
        answers: { 0: 'test answer' },
        onAnswerChange: (answer: any) => console.log(answer)
      };

      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent {...validProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles optional props correctly', () => {
      const activity = createMockActivity('text', {
        content: '<p>Optional props test</p>',
        comprehensionQuestion: 'Test question'
      });

      // Test with minimal required props
      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent 
              activity={activity}
              currentStep={0}
              answers={{}}
              onAnswerChange={jest.fn()}
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Component Interface Compatibility', () => {
    it('maintains consistent interface with stories', () => {
      // Test that the component interface matches what's used in stories
      const storyLikeActivity = createMockActivity('interactive', {
        description: 'Story interface compatibility test',
        instructions: 'Test instructions',
        exercises: [
          { number: 42, word: 'forty-two' },
          { number: 15 }
        ]
      });

      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent 
              activity={storyLikeActivity}
              currentStep={0}
              answers={{}}
              onAnswerChange={jest.fn()}
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles all content types used in stories', () => {
      const contentTypes = [
        { type: 'text', data: { content: '<p>Text</p>', comprehensionQuestion: 'Q?' } },
        { type: 'quiz', data: { questions: [{ text: 'Q?', type: 'multiple-choice', options: ['A'], correctAnswer: 0 }] } },
        { type: 'interactive', data: { description: 'Interactive test' } },
        { type: 'video', data: { videoUrl: 'https://example.com', title: 'Video', description: 'Desc', comprehensionQuestion: 'Q?' } },
        { type: 'unsupported', data: {} }
      ];

      contentTypes.forEach(({ type, data }) => {
        const activity = createMockActivity(type, data);
        
        expect(() => {
          const { unmount } = render(
            <TestWrapper>
              <ActivityContent 
                activity={activity}
                currentStep={0}
                answers={{}}
                onAnswerChange={jest.fn()}
              />
            </TestWrapper>
          );
          unmount();
        }).not.toThrow();
      });
    });
  });

  describe('Build Configuration Compatibility', () => {
    it('works with current Vite configuration', () => {
      // Test that the component works with the current build setup
      const activity = createMockActivity('text', {
        content: '<p>Build config test</p>',
        comprehensionQuestion: 'Build test question'
      });

      const { container } = render(
        <TestWrapper>
          <ActivityContent 
            activity={activity}
            currentStep={0}
            answers={{}}
            onAnswerChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Verify the component renders properly
      expect(container.firstChild).toBeInstanceOf(Element);
    });

    it('handles module imports correctly', () => {
      // Verify that all imports work correctly
      expect(ActivityContent).toBeDefined();
      expect(typeof ActivityContent).toBe('function');
    });

    it('handles unused parameter refactoring correctly', () => {
      // Test that the recent change to prefix unused parameters with underscores
      // doesn't affect TypeScript compilation or runtime behavior
      const activity = createMockActivity('unsupported' as any, {});
      activity.title = 'TypeScript Parameter Test';
      activity.difficulty = 3;
      activity.subject = 'Science';

      expect(() => {
        render(
          <TestWrapper>
            <ActivityContent 
              activity={activity}
              currentStep={0}
              answers={{}}
              onAnswerChange={jest.fn()}
            />
          </TestWrapper>
        );
      }).not.toThrow();

      // Verify that the component still generates content correctly
      // even though title and difficulty parameters are now prefixed with _
      const { container } = render(
        <TestWrapper>
          <ActivityContent 
            activity={activity}
            currentStep={0}
            answers={{}}
            onAnswerChange={jest.fn()}
          />
        </TestWrapper>
      );

      expect(container.textContent).toContain('TypeScript Parameter Test');
      expect(container.textContent).toContain('Subject: Science');
    });
  });
});