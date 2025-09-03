describe('Child Complete Learning Journey', () => {
  let childCredentials: { username: string; pin: string };
  let parentCredentials: { email: string; password: string };

  before(() => {
    // Set up test data
    childCredentials = {
      username: 'testchild',
      pin: '1234'
    };

    parentCredentials = {
      email: 'parent@test.com',
      password: 'password123'
    };

    // Create test child and parent via API
    cy.task('createTestData', {
      parent: parentCredentials,
      child: childCredentials
    });
  });

  after(() => {
    // Clean up test data
    cy.task('cleanupTestData');
  });

  describe('Child Login Journey', () => {
    it('should complete full login flow with security logging', () => {
      cy.visit('/child/login');

      // Verify child-friendly login interface
      cy.get('[data-testid="child-login-form"]').should('be.visible');
      cy.get('[data-testid="child-login-title"]').should('contain', 'Welcome Back!');
      cy.get('[data-testid="username-input"]').should('have.attr', 'placeholder', 'Your username');
      cy.get('[data-testid="pin-input"]').should('have.attr', 'type', 'password');

      // Test child-friendly error handling
      cy.get('[data-testid="username-input"]').type('wronguser');
      cy.get('[data-testid="pin-input"]').type('1234');
      cy.get('[data-testid="login-button"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Oops! Let\'s try that again');

      // Successful login
      cy.get('[data-testid="username-input"]').clear().type(childCredentials.username);
      cy.get('[data-testid="pin-input"]').clear().type(childCredentials.pin);
      cy.get('[data-testid="login-button"]').click();

      // Verify redirect to dashboard
      cy.url().should('include', '/child/dashboard');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome back');
    });

    it('should handle session timeout gracefully', () => {
      // Login first
      cy.childLogin(childCredentials.username, childCredentials.pin);

      // Simulate session timeout by manipulating session storage
      cy.window().then((win) => {
        win.localStorage.setItem('childSessionExpiry', String(Date.now() - 1000));
      });

      // Navigate to trigger session check
      cy.visit('/child/dashboard');

      // Should redirect to login with child-friendly message
      cy.url().should('include', '/child/login');
      cy.get('[data-testid="session-timeout-message"]')
        .should('contain', 'Time for a break! Please log in again');
    });

    it('should detect and handle suspicious activity', () => {
      cy.visit('/child/login');

      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="username-input"]').clear().type(childCredentials.username);
        cy.get('[data-testid="pin-input"]').clear().type('wrongpin');
        cy.get('[data-testid="login-button"]').click();
        cy.wait(1000);
      }

      // Fourth attempt should show lockout message
      cy.get('[data-testid="username-input"]').clear().type(childCredentials.username);
      cy.get('[data-testid="pin-input"]').clear().type('wrongpin');
      cy.get('[data-testid="login-button"]').click();

      cy.get('[data-testid="account-locked-message"]')
        .should('be.visible')
        .and('contain', 'Account temporarily locked');
      
      cy.get('[data-testid="parent-contact-message"]')
        .should('contain', 'Please ask your parent for help');
    });
  });

  describe('Child Dashboard Experience', () => {
    beforeEach(() => {
      cy.childLogin(childCredentials.username, childCredentials.pin);
    });

    it('should display personalized dashboard with all key elements', () => {
      cy.visit('/child/dashboard');

      // Verify main dashboard elements
      cy.get('[data-testid="child-avatar"]').should('be.visible');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Test Child');
      cy.get('[data-testid="learning-streak"]').should('be.visible');
      cy.get('[data-testid="daily-goals"]').should('be.visible');
      cy.get('[data-testid="study-plans-section"]').should('be.visible');
      cy.get('[data-testid="badges-section"]').should('be.visible');

      // Verify child-friendly theme
      cy.get('body').should('have.class', 'child-theme');
      cy.get('[data-testid="dashboard-container"]')
        .should('have.css', 'background-color')
        .and('match', /rgb\(.*\)/); // Should have colorful background
    });

    it('should show real-time progress updates', () => {
      cy.visit('/child/dashboard');

      // Initial progress state
      cy.get('[data-testid="progress-summary"]')
        .should('contain', '0 activities completed');

      // Simulate completing an activity (via API call)
      cy.request('POST', '/api/child/activity/test-activity-1/complete', {
        score: 85,
        timeSpent: 600
      });

      // Progress should update in real-time
      cy.get('[data-testid="progress-summary"]', { timeout: 10000 })
        .should('contain', '1 activity completed');

      // Learning streak should update
      cy.get('[data-testid="learning-streak"]')
        .should('contain', '1 day streak');
    });

    it('should display study plans with visual progress indicators', () => {
      cy.visit('/child/dashboard');

      cy.get('[data-testid="study-plans-section"]').within(() => {
        // Should show study plan cards
        cy.get('[data-testid="study-plan-card"]').should('have.length.at.least', 1);
        
        // Each card should have progress indicator
        cy.get('[data-testid="study-plan-card"]').first().within(() => {
          cy.get('[data-testid="progress-bar"]').should('be.visible');
          cy.get('[data-testid="progress-percentage"]').should('be.visible');
          cy.get('[data-testid="activities-count"]').should('be.visible');
        });
      });
    });

    it('should show learning streak with animations', () => {
      cy.visit('/child/dashboard');

      cy.get('[data-testid="learning-streak"]').within(() => {
        cy.get('[data-testid="streak-count"]').should('be.visible');
        cy.get('[data-testid="streak-fire-icon"]').should('be.visible');
        cy.get('[data-testid="streak-message"]').should('contain', 'Keep it up!');
      });

      // Test streak animation on hover
      cy.get('[data-testid="learning-streak"]').trigger('mouseover');
      cy.get('[data-testid="streak-animation"]').should('have.class', 'animate-bounce');
    });
  });

  describe('Activity Completion Journey', () => {
    beforeEach(() => {
      cy.childLogin(childCredentials.username, childCredentials.pin);
    });

    it('should complete full activity with progress tracking', () => {
      cy.visit('/child/dashboard');

      // Click on first study plan
      cy.get('[data-testid="study-plan-card"]').first().click();

      // Should navigate to study plan view
      cy.url().should('include', '/child/study-plan/');
      
      // Click on first activity
      cy.get('[data-testid="activity-card"]').first().click();

      // Activity player should load
      cy.get('[data-testid="activity-player"]').should('be.visible');
      cy.get('[data-testid="activity-title"]').should('be.visible');
      cy.get('[data-testid="progress-indicator"]').should('be.visible');

      // Simulate activity interaction
      cy.get('[data-testid="activity-content"]').within(() => {
        // Interact with activity elements (depends on activity type)
        cy.get('[data-testid="answer-option"]').first().click();
        cy.get('[data-testid="submit-answer"]').click();
      });

      // Progress should update
      cy.get('[data-testid="progress-indicator"]')
        .should('contain', '25%'); // Assuming 4 questions

      // Complete remaining questions
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="answer-option"]').first().click();
        cy.get('[data-testid="submit-answer"]').click();
        cy.wait(1000);
      }

      // Activity completion should trigger celebration
      cy.get('[data-testid="completion-celebration"]').should('be.visible');
      cy.get('[data-testid="confetti-animation"]').should('be.visible');
      cy.get('[data-testid="completion-message"]')
        .should('contain', 'Great job!');

      // Score should be displayed
      cy.get('[data-testid="activity-score"]').should('be.visible');
      cy.get('[data-testid="time-spent"]').should('be.visible');
    });

    it('should handle help requests during activities', () => {
      cy.visit('/child/study-plan/test-plan-1/activity/test-activity-1');

      // Help button should be visible
      cy.get('[data-testid="help-button"]').should('be.visible');
      cy.get('[data-testid="help-button"]').click();

      // Help modal should appear
      cy.get('[data-testid="help-modal"]').should('be.visible');
      cy.get('[data-testid="help-content"]').should('contain', 'Need help?');

      // Should offer child-appropriate help options
      cy.get('[data-testid="hint-button"]').should('be.visible');
      cy.get('[data-testid="explanation-button"]').should('be.visible');
      cy.get('[data-testid="ask-parent-button"]').should('be.visible');

      // Test hint functionality
      cy.get('[data-testid="hint-button"]').click();
      cy.get('[data-testid="hint-content"]').should('be.visible');

      // Close help modal
      cy.get('[data-testid="close-help"]').click();
      cy.get('[data-testid="help-modal"]').should('not.exist');
    });

    it('should save progress when pausing activity', () => {
      cy.visit('/child/study-plan/test-plan-1/activity/test-activity-1');

      // Make some progress
      cy.get('[data-testid="answer-option"]').first().click();
      cy.get('[data-testid="submit-answer"]').click();

      // Pause activity
      cy.get('[data-testid="pause-button"]').click();

      // Confirmation dialog should appear
      cy.get('[data-testid="pause-confirmation"]').should('be.visible');
      cy.get('[data-testid="confirm-pause"]').click();

      // Should return to study plan view
      cy.url().should('include', '/child/study-plan/');

      // Activity should show as in progress
      cy.get('[data-testid="activity-card"]').first().within(() => {
        cy.get('[data-testid="progress-indicator"]').should('contain', '25%');
        cy.get('[data-testid="resume-button"]').should('be.visible');
      });

      // Resume activity
      cy.get('[data-testid="resume-button"]').click();

      // Should return to activity with saved progress
      cy.get('[data-testid="progress-indicator"]').should('contain', '25%');
    });
  });

  describe('Badge System Journey', () => {
    beforeEach(() => {
      cy.childLogin(childCredentials.username, childCredentials.pin);
    });

    it('should earn and display badges with celebrations', () => {
      // Complete activities to earn a badge
      cy.completeActivities(5); // Custom command to complete multiple activities

      // Badge earned modal should appear
      cy.get('[data-testid="badge-earned-modal"]', { timeout: 10000 })
        .should('be.visible');

      cy.get('[data-testid="badge-celebration"]').within(() => {
        cy.get('[data-testid="confetti-animation"]').should('be.visible');
        cy.get('[data-testid="badge-icon"]').should('be.visible');
        cy.get('[data-testid="badge-name"]').should('contain', 'Activity Star');
        cy.get('[data-testid="celebration-message"]')
          .should('contain', 'Congratulations!');
      });

      // Continue button should close modal
      cy.get('[data-testid="continue-learning"]').click();
      cy.get('[data-testid="badge-earned-modal"]').should('not.exist');

      // Badge should appear in dashboard
      cy.visit('/child/dashboard');
      cy.get('[data-testid="badges-section"]').within(() => {
        cy.get('[data-testid="badge-display"]').should('contain', 'Activity Star');
      });
    });

    it('should show badge collection with progress indicators', () => {
      cy.visit('/child/badges');

      // Badge collection should be organized
      cy.get('[data-testid="badge-collection"]').should('be.visible');
      
      // Tabs for earned vs in-progress badges
      cy.get('[data-testid="earned-badges-tab"]').should('be.visible');
      cy.get('[data-testid="progress-badges-tab"]').should('be.visible');

      // Switch to progress tab
      cy.get('[data-testid="progress-badges-tab"]').click();

      // Should show badges in progress
      cy.get('[data-testid="badge-progress-card"]').should('have.length.at.least', 1);
      
      cy.get('[data-testid="badge-progress-card"]').first().within(() => {
        cy.get('[data-testid="progress-bar"]').should('be.visible');
        cy.get('[data-testid="progress-text"]').should('match', /\d+ \/ \d+/);
        cy.get('[data-testid="badge-description"]').should('be.visible');
      });
    });

    it('should filter badges by category', () => {
      cy.visit('/child/badges');

      // Category filters should be available
      cy.get('[data-testid="category-filter"]').should('be.visible');
      
      // Test math category filter
      cy.get('[data-testid="filter-math"]').click();
      
      // Only math badges should be visible
      cy.get('[data-testid="badge-display"]').each(($badge) => {
        cy.wrap($badge).should('have.attr', 'data-category', 'math');
      });

      // Clear filter
      cy.get('[data-testid="clear-filters"]').click();
      cy.get('[data-testid="badge-display"]').should('have.length.at.least', 1);
    });
  });

  describe('Learning Analytics for Children', () => {
    beforeEach(() => {
      cy.childLogin(childCredentials.username, childCredentials.pin);
      // Create some learning data
      cy.task('createLearningData', { childId: 'test-child-1' });
    });

    it('should display child-friendly learning statistics', () => {
      cy.visit('/child/progress');

      // Weekly progress chart
      cy.get('[data-testid="weekly-progress-chart"]').should('be.visible');
      cy.get('[data-testid="chart-title"]').should('contain', 'Your Learning This Week');

      // Subject mastery radar
      cy.get('[data-testid="subject-mastery-radar"]').should('be.visible');
      cy.get('[data-testid="radar-legend"]').should('be.visible');

      // Learning time tracker
      cy.get('[data-testid="learning-time-tracker"]').should('be.visible');
      cy.get('[data-testid="time-spent-today"]').should('be.visible');

      // Streak display with animations
      cy.get('[data-testid="streak-display"]').should('be.visible');
      cy.get('[data-testid="streak-fire-animation"]').should('be.visible');
    });

    it('should show encouraging messages for progress', () => {
      cy.visit('/child/progress');

      // Should show positive reinforcement
      cy.get('[data-testid="encouragement-message"]')
        .should('be.visible')
        .and('contain.oneOf', [
          'You\'re doing great!',
          'Keep up the awesome work!',
          'You\'re a learning superstar!'
        ]);

      // Achievement highlights
      cy.get('[data-testid="recent-achievements"]').should('be.visible');
      cy.get('[data-testid="next-goal"]').should('be.visible');
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      cy.childLogin(childCredentials.username, childCredentials.pin);
    });

    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/child/*/dashboard', { forceNetworkError: true });

      cy.visit('/child/dashboard');

      // Should show child-friendly error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Hmm, let\'s check your internet connection');

      cy.get('[data-testid="error-icon"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Test retry functionality
      cy.intercept('GET', '/api/child/*/dashboard', { fixture: 'child-dashboard.json' });
      cy.get('[data-testid="retry-button"]').click();

      // Should recover and show dashboard
      cy.get('[data-testid="welcome-message"]').should('be.visible');
    });

    it('should provide help options when child is stuck', () => {
      cy.visit('/child/study-plan/test-plan-1/activity/test-activity-1');

      // Simulate multiple wrong answers
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="answer-option"]').last().click(); // Wrong answer
        cy.get('[data-testid="submit-answer"]').click();
        cy.wait(1000);
      }

      // Should offer additional help
      cy.get('[data-testid="struggling-help"]').should('be.visible');
      cy.get('[data-testid="struggling-message"]')
        .should('contain', 'This seems tricky! Would you like some help?');

      cy.get('[data-testid="get-hint"]').should('be.visible');
      cy.get('[data-testid="ask-parent"]').should('be.visible');
      cy.get('[data-testid="try-easier"]').should('be.visible');
    });

    it('should handle session expiry during activity', () => {
      cy.visit('/child/study-plan/test-plan-1/activity/test-activity-1');

      // Make some progress
      cy.get('[data-testid="answer-option"]').first().click();
      cy.get('[data-testid="submit-answer"]').click();

      // Simulate session expiry
      cy.window().then((win) => {
        win.localStorage.removeItem('childAuthToken');
      });

      // Try to submit another answer
      cy.get('[data-testid="answer-option"]').first().click();
      cy.get('[data-testid="submit-answer"]').click();

      // Should show session expired message and save progress
      cy.get('[data-testid="session-expired-modal"]').should('be.visible');
      cy.get('[data-testid="progress-saved-message"]')
        .should('contain', 'Don\'t worry, your progress is saved!');

      cy.get('[data-testid="login-again-button"]').click();

      // Should redirect to login
      cy.url().should('include', '/child/login');
    });
  });

  describe('Accessibility and Usability', () => {
    beforeEach(() => {
      cy.childLogin(childCredentials.username, childCredentials.pin);
    });

    it('should support keyboard navigation throughout the interface', () => {
      cy.visit('/child/dashboard');

      // Tab through main navigation elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'dashboard-link');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'study-plans-link');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'badges-link');

      // Test Enter key activation
      cy.focused().type('{enter}');
      cy.url().should('include', '/child/badges');
    });

    it('should have proper ARIA labels and screen reader support', () => {
      cy.visit('/child/dashboard');

      // Check main landmarks
      cy.get('[role="main"]').should('exist');
      cy.get('[role="navigation"]').should('exist');

      // Check ARIA labels
      cy.get('[data-testid="study-plans-section"]')
        .should('have.attr', 'aria-label', 'Your Study Plans');

      cy.get('[data-testid="badges-section"]')
        .should('have.attr', 'aria-label', 'Your Badges');

      // Check button labels
      cy.get('[data-testid="help-button"]')
        .should('have.attr', 'aria-label', 'Get help with this activity');
    });

    it('should work well on touch devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/child/dashboard');

      // Touch targets should be large enough
      cy.get('[data-testid="study-plan-card"]').should('have.css', 'min-height', '44px');
      cy.get('[data-testid="badge-display"]').should('have.css', 'min-height', '44px');

      // Test touch interactions
      cy.get('[data-testid="study-plan-card"]').first().trigger('touchstart');
      cy.get('[data-testid="study-plan-card"]').first().trigger('touchend');

      // Should navigate on touch
      cy.url().should('include', '/child/study-plan/');
    });
  });
});