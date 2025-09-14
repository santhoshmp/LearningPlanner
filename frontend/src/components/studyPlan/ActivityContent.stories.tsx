import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityContent from './ActivityContent';
import { StudyActivity } from '../../types/studyPlan';

const theme = createTheme();

const meta: Meta<typeof ActivityContent> = {
  title: 'StudyPlan/ActivityContent',
  component: ActivityContent,
  decorators: [
    (Story: React.ComponentType) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'ActivityContent component renders different types of learning content including text, quizzes, interactive activities, videos, and static study plan resources for unsupported content types.',
      },
    },
  },
  argTypes: {
    currentStep: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Current step in the activity',
    },
    answers: {
      control: 'object',
      description: 'Object containing answers for each step',
    },
    onAnswerChange: {
      action: 'answer changed',
      description: 'Callback when user provides an answer',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityContent>;

// Helper function to create mock activities
const createMockActivity = (contentType: string, contentData: any): StudyActivity => ({
  id: 'story-activity',
  planId: 'story-plan',
  title: 'Sample Learning Activity',
  description: 'This is a sample activity for demonstration purposes',
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

export const TextContent: Story = {
  args: {
    activity: createMockActivity('text', {
      content: `
        <h1>Introduction to Fractions</h1>
        <p>A fraction represents a part of a whole. It consists of two numbers:</p>
        <ul>
          <li><strong>Numerator</strong> - the top number, shows how many parts we have</li>
          <li><strong>Denominator</strong> - the bottom number, shows how many equal parts the whole is divided into</li>
        </ul>
        <p>For example, in the fraction 3/4:</p>
        <ul>
          <li>3 is the numerator (we have 3 parts)</li>
          <li>4 is the denominator (the whole is divided into 4 equal parts)</li>
        </ul>
      `,
      comprehensionQuestion: 'In your own words, explain what a fraction represents and give an example.'
    }),
    currentStep: 0,
    answers: {},
  },
};

export const MultipleChoiceQuiz: Story = {
  args: {
    activity: createMockActivity('quiz', {
      questions: [
        {
          text: 'What is 1/2 + 1/4?',
          type: 'multiple-choice',
          options: ['1/6', '2/6', '3/4', '1/8'],
          correctAnswer: 2,
          image: null
        }
      ]
    }),
    currentStep: 0,
    answers: {},
  },
};

export const TrueFalseQuiz: Story = {
  args: {
    activity: createMockActivity('quiz', {
      questions: [
        {
          text: 'The fraction 1/2 is equivalent to 0.5',
          type: 'true-false',
          correctAnswer: true
        }
      ]
    }),
    currentStep: 0,
    answers: {},
  },
};

export const ShortAnswerQuiz: Story = {
  args: {
    activity: createMockActivity('quiz', {
      questions: [
        {
          text: 'Explain how to add fractions with different denominators.',
          type: 'short-answer'
        }
      ]
    }),
    currentStep: 0,
    answers: {},
  },
};

export const InteractiveActivity: Story = {
  args: {
    activity: createMockActivity('interactive', {
      description: 'Use the virtual fraction manipulatives to explore how fractions work. Drag and drop pieces to create different fractions and see how they compare.'
    }),
    currentStep: 0,
    answers: {},
  },
};

export const InteractiveActivityWithInstructions: Story = {
  args: {
    activity: createMockActivity('interactive', {
      description: 'Practice number recognition and word forms with this interactive exercise.',
      instructions: 'Look at each number below and practice saying it out loud. Then try to write the word form of each number.'
    }),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive activity with custom instructions that guide the student through the exercise.',
      },
    },
  },
};

export const InteractiveActivityWithExercises: Story = {
  args: {
    activity: createMockActivity('interactive', {
      description: 'Practice number recognition and word forms with these interactive exercises.',
      instructions: 'Complete each exercise by identifying the number and its word form.',
      exercises: [
        { number: 42, word: 'forty-two' },
        { number: 15, word: 'fifteen' },
        { number: 73, word: 'seventy-three' },
        { word: 'example-word' },
        { number: 100 }
      ]
    }),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive activity with structured exercises showing numbers and their word forms. Demonstrates how exercises are displayed with visual number cards.',
      },
    },
  },
};

export const InteractiveActivityFallback: Story = {
  args: {
    activity: createMockActivity('interactive', null),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'When interactive content data is missing or incomplete, the component falls back to rendering static study plan resources.',
      },
    },
  },
};

export const InteractiveActivityWithoutDescription: Story = {
  args: {
    activity: createMockActivity('interactive', {
      instructions: 'Some instructions but no description'
    }),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive activity without a description falls back to static resources, even if other data is present.',
      },
    },
  },
};

export const VideoContent: Story = {
  args: {
    activity: createMockActivity('video', {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Understanding Fractions',
      description: 'This video explains the basics of fractions with visual examples and real-world applications.',
      comprehensionQuestion: 'What are three real-world examples of fractions that you use in daily life?'
    }),
    currentStep: 0,
    answers: {},
  },
};

// New story for the static resources (default case)
export const StaticResourcesMath: Story = {
  args: {
    activity: createMockActivity('unsupported-type', {}),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'When an unsupported content type is encountered, the component renders static study plan resources with educational content based on the activity subject. This example shows mathematics content.',
      },
    },
  },
};

export const StaticResourcesScience: Story = {
  args: {
    activity: {
      ...createMockActivity('unsupported-type', {}),
      title: 'Introduction to Science Concepts',
      subject: 'Science'
    },
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Static resources for science activities include concepts about living vs non-living things, simple machines, and nature observation exercises.',
      },
    },
  },
};

export const StaticResourcesEnglish: Story = {
  args: {
    activity: {
      ...createMockActivity('unsupported-type', {}),
      title: 'English Reading and Writing',
      subject: 'English'
    },
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Static resources for English activities focus on reading comprehension, vocabulary building, and writing skills.',
      },
    },
  },
};

export const StaticResourcesGeneral: Story = {
  args: {
    activity: {
      ...createMockActivity('unsupported-type', {}),
      title: 'General Learning Activity',
      subject: 'General Studies'
    },
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'For activities that don\'t match specific subjects, general learning strategies and study skills are provided.',
      },
    },
  },
};

export const WithExistingAnswers: Story = {
  args: {
    activity: createMockActivity('text', {
      content: '<h1>Sample Content</h1><p>This is sample content with an existing answer.</p>',
      comprehensionQuestion: 'What did you learn from this content?'
    }),
    currentStep: 0,
    answers: {
      0: 'I learned about the importance of understanding the content before proceeding to the next step.'
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component displays existing answers when provided.',
      },
    },
  },
};

export const QuizWithImage: Story = {
  args: {
    activity: createMockActivity('quiz', {
      questions: [
        {
          text: 'What shape is shown in the image?',
          type: 'multiple-choice',
          options: ['Circle', 'Square', 'Triangle', 'Rectangle'],
          correctAnswer: 1,
          image: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Square'
        }
      ]
    }),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Quiz questions can include images to provide visual context for the question.',
      },
    },
  },
};

export const CompletionButtonDemo: Story = {
  args: {
    activity: createMockActivity('interactive', {
      description: 'This story demonstrates the completion button functionality that was fixed. The button should display "Mark as Complete ✓" and be fully functional.'
    }),
    currentStep: 0,
    answers: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the completion button functionality after the bug fix. The button should have proper text formatting, styling, and click handlers.',
      },
    },
  },
};