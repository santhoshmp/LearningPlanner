// Child-specific Cypress commands for testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as a child user
       */
      childLogin(username: string, pin: string): Chainable<void>;
      
      /**
       * Complete an activity with optional parameters
       */
      completeActivity(options?: {
        score?: number;
        useHelp?: boolean;
        timeSpent?: number;
      }): Chainable<void>;
      
      /**
       * Complete multiple activities
       */
      completeActivities(count: number): Chainable<void>;
      
      /**
       * Check child-friendly error message
       */
      checkChildError(expectedMessage: string): Chainable<void>;
      
      /**
       * Verify child theme is applied
       */
      checkChildTheme(): Chainable<void>;
      
      /**
       * Check accessibility for child interface
       */
      checkChildA11y(): Chainable<void>;
      
      /**
       * Simulate badge earning
       */
      earnBadge(badgeId: string): Chainable<void>;
      
      /**
       * Check learning streak display
       */
      checkLearningStreak(expectedCount: number): Chainable<void>;
      
      /**
       * Navigate using child-friendly breadcrumbs
       */
      navigateWithBreadcrumbs(path: string[]): Chainable<void>;
      
      /**
       * Test keyboard navigation for child interface
       */
      testChildKeyboardNav(): Chainable<void>;
      
      /**
       * Check progress visualization
       */
      checkProgressVisualization(expectedProgress: number): Chainable<void>;
    }
  }
}

// Child login command
Cypress.Commands.add('childLogin', (username: string, pin: string) => {
  cy.visit('/child/login');
  
  // Wait for login form to be ready
  cy.get('[data-testid="child-login-form"]').should('be.visible');
  
  // Enter credentials
  cy.get('[data-testid="username-input"]').clear().type(username);
  cy.get('[data-testid="pin-input"]').clear().type(pin);
  
  // Submit form
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('include', '/child/dashboard');
  cy.get('[data-testid="welcome-message"]').should('be.visible');
  
  // Store auth token for API requests
  cy.window().then((win) => {
    const token = win.localStorage.getItem('childAuthToken');
    if (token) {
      cy.wrap(token).as('childAuthToken');
    }
  });
});

// Complete activity command
Cypress.Commands.add('completeActivity', (options = {}) => {
  const { score = 85, useHelp = false, timeSpent = 600 } = options;
  
  // Ensure we're on an activity page
  cy.url().should('include', '/activity/');
  cy.get('[data-testid="activity-player"]').should('be.visible');
  
  // Use help if requested
  if (useHelp) {
    cy.get('[data-testid="help-button"]').click();
    cy.get('[data-testid="hint-button"]').click();
    cy.get('[data-testid="close-help"]').click();
  }
  
  // Simulate activity completion based on activity type
  cy.get('[data-testid="activity-content"]').then(($content) => {
    if ($content.find('[data-testid="answer-option"]').length > 0) {
      // Multiple choice activity
      const questionCount = $content.find('[data-testid="question"]').length || 4;
      
      for (let i = 0; i < questionCount; i++) {
        cy.get('[data-testid="answer-option"]').first().click();
        cy.get('[data-testid="submit-answer"]').click();
        cy.wait(500); // Brief pause between questions
      }
    } else if ($content.find('[data-testid="drag-item"]').length > 0) {
      // Drag and drop activity
      cy.get('[data-testid="drag-item"]').each(($item, index) => {
        cy.wrap($item).drag(`[data-testid="drop-zone-${index}"]`);
      });
      cy.get('[data-testid="submit-activity"]').click();
    } else {
      // Generic activity completion
      cy.get('[data-testid="complete-activity"]').click();
    }
  });
  
  // Wait for completion celebration
  cy.get('[data-testid="completion-celebration"]', { timeout: 10000 })
    .should('be.visible');
  
  // Check if badge was earned
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="badge-earned-modal"]').length > 0) {
      cy.get('[data-testid="continue-button"]').click();
    }
  });
  
  // Continue to next activity or return to study plan
  cy.get('[data-testid="continue-learning"]').click();
});

// Complete multiple activities command
Cypress.Commands.add('completeActivities', (count: number) => {
  for (let i = 0; i < count; i++) {
    // Navigate to next available activity
    cy.visit('/child/dashboard');
    cy.get('[data-testid="study-plan-card"]').first().click();
    cy.get('[data-testid="activity-card"]').eq(i).click();
    
    // Complete the activity
    cy.completeActivity();
    
    // Brief pause between activities
    cy.wait(1000);
  }
});

// Check child-friendly error message
Cypress.Commands.add('checkChildError', (expectedMessage: string) => {
  cy.get('[data-testid="error-message"]').should('be.visible');
  cy.get('[data-testid="error-message"]').should('contain', expectedMessage);
  
  // Should have child-friendly error icon
  cy.get('[data-testid="error-icon"]').should('be.visible');
  cy.get('[data-testid="error-icon"]').should('contain.oneOf', ['😅', '🤔', '😊']);
  
  // Should not contain technical error details
  cy.get('[data-testid="error-message"]').should('not.contain', 'Error 500');
  cy.get('[data-testid="error-message"]').should('not.contain', 'Stack trace');
  cy.get('[data-testid="error-message"]').should('not.contain', 'undefined');
});

// Check child theme is applied
Cypress.Commands.add('checkChildTheme', () => {
  // Check body has child theme class
  cy.get('body').should('have.class', 'child-theme');
  
  // Check for bright, child-friendly colors
  cy.get('[data-testid="main-container"]')
    .should('have.css', 'background-color')
    .and('not.equal', 'rgb(255, 255, 255)'); // Should not be plain white
  
  // Check for large, child-friendly fonts
  cy.get('[data-testid="welcome-message"]')
    .should('have.css', 'font-size')
    .then((fontSize) => {
      expect(parseInt(fontSize)).to.be.at.least(18); // Minimum 18px font
    });
  
  // Check for rounded corners (child-friendly design)
  cy.get('[data-testid="study-plan-card"]')
    .should('have.css', 'border-radius')
    .and('not.equal', '0px');
});

// Check accessibility for child interface
Cypress.Commands.add('checkChildA11y', () => {
  // Inject axe-core
  cy.injectAxe();
  
  // Run accessibility check with child-specific rules
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      'aria-labels': { enabled: true }
    }
  });
  
  // Check for large touch targets (44px minimum)
  cy.get('button, [role="button"]').each(($button) => {
    cy.wrap($button).invoke('outerHeight').should('be.at.least', 44);
    cy.wrap($button).invoke('outerWidth').should('be.at.least', 44);
  });
  
  // Check for proper focus indicators
  cy.get('button').first().focus();
  cy.focused()
    .should('have.css', 'outline-width')
    .and('not.equal', '0px');
});

// Simulate badge earning
Cypress.Commands.add('earnBadge', (badgeId: string) => {
  // Make API call to award badge
  cy.request('POST', `/api/child/badges/award`, {
    badgeId: badgeId,
    childId: 'test-child'
  });
  
  // Refresh page to see badge
  cy.reload();
  
  // Check for badge earned modal
  cy.get('[data-testid="badge-earned-modal"]', { timeout: 5000 })
    .should('be.visible');
  
  // Close modal
  cy.get('[data-testid="continue-button"]').click();
});

// Check learning streak display
Cypress.Commands.add('checkLearningStreak', (expectedCount: number) => {
  cy.get('[data-testid="learning-streak-display"]').should('be.visible');
  cy.get('[data-testid="streak-count"]').should('contain', expectedCount.toString());
  
  if (expectedCount > 0) {
    cy.get('[data-testid="streak-fire-icon"]').should('be.visible');
    cy.get('[data-testid="streak-fire-icon"]').should('contain', '🔥');
  }
  
  // Check for encouraging message
  cy.get('[data-testid="streak-message"]').should('be.visible');
  cy.get('[data-testid="streak-message"]').should('contain.oneOf', [
    'Keep it up!',
    'You\'re on fire!',
    'Amazing streak!'
  ]);
});

// Navigate using breadcrumbs
Cypress.Commands.add('navigateWithBreadcrumbs', (path: string[]) => {
  cy.get('[data-testid="breadcrumbs"]').should('be.visible');
  
  path.forEach((breadcrumb, index) => {
    if (index === path.length - 1) {
      // Last breadcrumb should be current page (not clickable)
      cy.get('[data-testid="breadcrumbs"]').should('contain', breadcrumb);
    } else {
      // Click on breadcrumb to navigate
      cy.get('[data-testid="breadcrumbs"]')
        .contains(breadcrumb)
        .click();
      
      // Wait for navigation
      cy.url().should('include', breadcrumb.toLowerCase());
    }
  });
});

// Test keyboard navigation for child interface
Cypress.Commands.add('testChildKeyboardNav', () => {
  // Start from first focusable element
  cy.get('body').tab();
  
  // Should be able to navigate through main elements
  const expectedElements = [
    'dashboard-nav',
    'study-plans-nav',
    'badges-nav',
    'settings-nav'
  ];
  
  expectedElements.forEach((testId, index) => {
    if (index > 0) cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', testId);
  });
  
  // Test Enter key activation
  cy.focused().type('{enter}');
  
  // Test Escape key (should work in modals)
  cy.get('body').type('{esc}');
});

// Check progress visualization
Cypress.Commands.add('checkProgressVisualization', (expectedProgress: number) => {
  cy.get('[data-testid="progress-visualization"]').should('be.visible');
  
  // Check progress percentage
  cy.get('[data-testid="progress-percentage"]')
    .should('contain', `${expectedProgress}%`);
  
  // Check progress bar
  cy.get('[data-testid="progress-bar"]')
    .should('have.attr', 'aria-valuenow', expectedProgress.toString());
  
  // Check for appropriate encouragement message
  if (expectedProgress >= 80) {
    cy.get('[data-testid="encouragement"]')
      .should('contain.oneOf', ['Almost done!', 'You\'re so close!']);
  } else if (expectedProgress >= 50) {
    cy.get('[data-testid="encouragement"]')
      .should('contain.oneOf', ['Great job!', 'Keep going!']);
  } else {
    cy.get('[data-testid="encouragement"]')
      .should('contain.oneOf', ['You\'re getting started!', 'Keep learning!']);
  }
});

export {};