// Child module test configuration and utilities

export const childTestConfig = {
  // Test data
  testChildren: {
    primary: {
      username: 'testchild',
      pin: '1234',
      firstName: 'Test',
      lastName: 'Child',
      age: 8,
      grade: '3rd Grade'
    },
    secondary: {
      username: 'childtwo',
      pin: '5678',
      firstName: 'Second',
      lastName: 'Child',
      age: 10,
      grade: '5th Grade'
    },
    accessibility: {
      username: 'a11ychild',
      pin: '9999',
      firstName: 'Accessible',
      lastName: 'Child',
      age: 7,
      grade: '2nd Grade'
    }
  },

  // Test study plans and activities
  testStudyPlans: [
    {
      id: 'math-adventures',
      title: 'Math Adventures',
      description: 'Fun math activities for kids',
      activities: [
        {
          id: 'addition-basics',
          title: 'Addition Basics',
          type: 'EXERCISE',
          estimatedDuration: 15
        },
        {
          id: 'subtraction-fun',
          title: 'Subtraction Fun',
          type: 'EXERCISE',
          estimatedDuration: 20
        }
      ]
    },
    {
      id: 'reading-journey',
      title: 'Reading Journey',
      description: 'Exciting reading adventures',
      activities: [
        {
          id: 'phonics-practice',
          title: 'Phonics Practice',
          type: 'READING',
          estimatedDuration: 25
        }
      ]
    }
  ],

  // Test badges
  testBadges: [
    {
      id: 'first-steps',
      name: 'First Steps',
      description: 'Complete your first activity',
      icon: '🌟',
      category: 'achievement',
      rarity: 'common',
      criteria: {
        type: 'activity_completion',
        target: 1
      }
    },
    {
      id: 'math-star',
      name: 'Math Star',
      description: 'Complete 5 math activities',
      icon: '⭐',
      category: 'math',
      rarity: 'rare',
      criteria: {
        type: 'subject_completion',
        subject: 'math',
        target: 5
      }
    },
    {
      id: 'learning-streak',
      name: 'Learning Streak',
      description: 'Learn for 3 days in a row',
      icon: '🔥',
      category: 'streak',
      rarity: 'epic',
      criteria: {
        type: 'daily_streak',
        target: 3
      }
    },
    {
      id: 'perfect-score',
      name: 'Perfect Score',
      description: 'Get 100% on any activity',
      icon: '💯',
      category: 'achievement',
      rarity: 'rare',
      criteria: {
        type: 'perfect_score',
        target: 1
      }
    }
  ],

  // Accessibility test selectors
  a11ySelectors: {
    landmarks: [
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]'
    ],
    interactive: [
      'button',
      '[role="button"]',
      'input',
      'select',
      'textarea',
      '[tabindex="0"]'
    ],
    progressBars: '[role="progressbar"]',
    headings: 'h1, h2, h3, h4, h5, h6',
    liveRegions: '[aria-live]'
  },

  // Child theme validation
  themeValidation: {
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      success: '#45B7D1',
      warning: '#FFA726',
      error: '#EF5350'
    },
    fonts: {
      minSize: 16,
      maxSize: 24,
      family: 'Comic Neue, cursive'
    },
    spacing: {
      minTouchTarget: 44,
      borderRadius: 8
    }
  },

  // Error messages for children
  childErrorMessages: {
    login: {
      invalidCredentials: 'Oops! Let\'s try that again',
      accountLocked: 'Account temporarily locked',
      networkError: 'Let\'s check your internet connection'
    },
    activity: {
      loadError: 'This activity needs a little break',
      saveError: 'We\'re having trouble saving your progress',
      completionError: 'Something went wrong with completing this activity'
    },
    general: {
      unexpectedError: 'Oops! Something went wrong',
      sessionExpired: 'Time for a break! Please log in again'
    }
  },

  // Performance thresholds for child interface
  performance: {
    pageLoadTime: 3000, // 3 seconds max
    animationDuration: 500, // 0.5 seconds max
    apiResponseTime: 2000 // 2 seconds max
  },

  // Test timeouts
  timeouts: {
    pageLoad: 10000,
    apiCall: 5000,
    animation: 2000,
    userInteraction: 1000
  }
};

// Utility functions for child testing
export const childTestUtils = {
  // Generate random child data
  generateChildData: () => ({
    username: `testchild${Math.random().toString(36).substr(2, 9)}`,
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    firstName: 'Test',
    lastName: 'Child',
    age: Math.floor(5 + Math.random() * 13), // Age 5-18
    grade: `${Math.floor(1 + Math.random() * 12)}th Grade`
  }),

  // Validate child-friendly text
  isChildFriendlyText: (text: string): boolean => {
    const complexWords = [
      'utilize', 'implement', 'configure', 'initialize',
      'authenticate', 'authorization', 'parameter',
      'algorithm', 'optimization', 'synchronization'
    ];
    
    return !complexWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
  },

  // Check if color has sufficient contrast
  hasGoodContrast: (foreground: string, background: string): boolean => {
    // Simplified contrast check - in real implementation,
    // you'd use a proper contrast ratio calculation
    return foreground !== background;
  },

  // Validate touch target size
  isValidTouchTarget: (width: number, height: number): boolean => {
    return width >= 44 && height >= 44;
  },

  // Generate progress data for testing
  generateProgressData: (completionPercentage: number) => ({
    totalActivities: 20,
    completedActivities: Math.floor(20 * (completionPercentage / 100)),
    inProgressActivities: Math.floor(Math.random() * 3),
    averageScore: Math.floor(70 + Math.random() * 30),
    timeSpent: Math.floor(300 + Math.random() * 1800), // 5-35 minutes
    subjectProgress: [
      {
        subject: 'Math',
        completed: Math.floor(10 * (completionPercentage / 100)),
        total: 10,
        averageScore: Math.floor(75 + Math.random() * 25)
      },
      {
        subject: 'Reading',
        completed: Math.floor(6 * (completionPercentage / 100)),
        total: 6,
        averageScore: Math.floor(80 + Math.random() * 20)
      }
    ]
  }),

  // Create mock learning streak data
  generateStreakData: (currentStreak: number) => ({
    current: currentStreak,
    longest: Math.max(currentStreak, Math.floor(currentStreak * 1.5)),
    type: 'daily',
    lastActivityDate: new Date(),
    milestones: Array.from({ length: Math.floor(currentStreak / 5) }, (_, i) => ({
      count: (i + 1) * 5,
      achievedAt: new Date(Date.now() - (currentStreak - (i + 1) * 5) * 24 * 60 * 60 * 1000)
    }))
  })
};

// Custom assertions for child interface testing
export const childAssertions = {
  // Assert element is child-friendly
  shouldBeChildFriendly: (element: Cypress.Chainable) => {
    element.should('be.visible');
    element.should('have.css', 'border-radius').and('not.equal', '0px');
    element.invoke('outerHeight').should('be.at.least', 44);
    element.invoke('outerWidth').should('be.at.least', 44);
  },

  // Assert text is appropriate for children
  shouldHaveChildFriendlyText: (element: Cypress.Chainable) => {
    element.invoke('text').then((text) => {
      expect(childTestUtils.isChildFriendlyText(text)).to.be.true;
    });
  },

  // Assert proper focus management
  shouldHaveProperFocus: (element: Cypress.Chainable) => {
    element.should('have.focus');
    element.should('have.css', 'outline-width').and('not.equal', '0px');
    element.should('have.css', 'outline-color').and('not.equal', 'transparent');
  },

  // Assert animation is child-appropriate
  shouldHaveChildAnimation: (element: Cypress.Chainable) => {
    element.should('have.css', 'animation-duration').then((duration) => {
      const durationMs = parseFloat(duration) * 1000;
      expect(durationMs).to.be.at.most(childTestConfig.performance.animationDuration);
    });
  }
};

// Test data setup and cleanup
export const childTestSetup = {
  // Create test child and related data
  createTestChild: (childData = childTestConfig.testChildren.primary) => {
    return cy.task('createTestChild', childData);
  },

  // Create test study plans and activities
  createTestStudyPlans: () => {
    return cy.task('createTestStudyPlans', childTestConfig.testStudyPlans);
  },

  // Create test badges
  createTestBadges: () => {
    return cy.task('createTestBadges', childTestConfig.testBadges);
  },

  // Clean up all test data
  cleanupTestData: () => {
    return cy.task('cleanupChildTestData');
  },

  // Set up complete test environment
  setupChildTestEnvironment: () => {
    cy.task('setupChildTestEnvironment', {
      children: childTestConfig.testChildren,
      studyPlans: childTestConfig.testStudyPlans,
      badges: childTestConfig.testBadges
    });
  }
};

export default childTestConfig;