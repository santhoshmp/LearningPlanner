describe('Usability Test Runner', () => {
  beforeEach(() => {
    cy.visit('/testing/usability');
  });

  it('should start a parent usability test session', () => {
    // Mock user type as parent
    cy.window().then((win) => {
      win.localStorage.setItem('userType', 'parent');
    });

    cy.get('[data-testid="start-test-button"]').click();
    
    // Should show first scenario
    cy.contains('Create Child Profile').should('be.visible');
    cy.contains('Expected Outcome').should('be.visible');
    
    // Complete scenario successfully
    cy.get('[data-testid="complete-success-button"]').click();
    
    // Should open feedback dialog
    cy.get('[data-testid="feedback-dialog"]').should('be.visible');
    
    // Rate the scenario
    cy.get('[data-testid="scenario-rating"]').within(() => {
      cy.get('[data-value="4"]').click();
    });
    
    // Add feedback
    cy.get('[data-testid="feedback-text"]').type('The interface was intuitive and easy to navigate.');
    
    // Submit feedback
    cy.get('[data-testid="submit-feedback-button"]').click();
    
    // Should move to next scenario or complete test
    cy.get('[data-testid="test-progress"]').should('contain', 'Scenario 2');
  });

  it('should handle child usability test for different age groups', () => {
    // Test for young child (5-8 years)
    cy.window().then((win) => {
      win.localStorage.setItem('userType', 'child');
      win.localStorage.setItem('childAge', '7');
    });

    cy.get('[data-testid="start-test-button"]').click();
    
    // Should show age-appropriate scenarios
    cy.contains('Login with PIN').should('be.visible');
    cy.contains('Complete Simple Activity').should('be.visible');
    
    // Complete first scenario
    cy.get('[data-testid="complete-success-button"]').click();
    
    // Provide feedback
    cy.get('[data-testid="scenario-rating"]').within(() => {
      cy.get('[data-value="5"]').click();
    });
    
    cy.get('[data-testid="submit-feedback-button"]').click();
  });

  it('should track performance metrics during testing', () => {
    cy.intercept('POST', '/api/user-testing/feedback', { success: true }).as('submitFeedback');
    
    cy.get('[data-testid="start-test-button"]').click();
    
    // Simulate completing a scenario
    cy.get('[data-testid="complete-success-button"]').click();
    
    // Fill out feedback
    cy.get('[data-testid="scenario-rating"]').within(() => {
      cy.get('[data-value="3"]').click();
    });
    
    cy.get('[data-testid="feedback-text"]').type('Some performance issues noticed.');
    
    // Select struggles
    cy.get('[data-testid="struggle-loading-time"]').check();
    cy.get('[data-testid="struggle-interface"]').check();
    
    cy.get('[data-testid="submit-feedback-button"]').click();
    
    // Verify feedback was submitted with correct data
    cy.wait('@submitFeedback').then((interception) => {
      expect(interception.request.body).to.include({
        rating: 3,
        feedback: 'Some performance issues noticed.',
        category: 'usability'
      });
      expect(interception.request.body.struggledTasks).to.include('Loading time was too slow');
    });
  });

  it('should handle test completion and generate summary', () => {
    // Mock a completed test session
    cy.window().then((win) => {
      win.localStorage.setItem('uat_session', JSON.stringify({
        sessionId: 'test-session-123',
        userType: 'parent',
        startTime: new Date().toISOString(),
        tasks: ['parent_create_profile', 'parent_monitor_progress']
      }));
    });

    cy.visit('/testing/results');
    
    // Should display test results
    cy.get('[data-testid="test-summary"]').should('be.visible');
    cy.get('[data-testid="completion-rate"]').should('contain', '%');
    cy.get('[data-testid="average-rating"]').should('be.visible');
    
    // Should show recommendations
    cy.get('[data-testid="recommendations"]').should('be.visible');
    cy.contains('Performance Recommendations').should('be.visible');
  });

  it('should validate accessibility during testing', () => {
    cy.injectAxe();
    
    cy.get('[data-testid="start-test-button"]').click();
    
    // Check accessibility of test interface
    cy.checkA11y('[data-testid="test-scenario"]', {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true }
      }
    });
    
    // Complete scenario and check feedback dialog accessibility
    cy.get('[data-testid="complete-success-button"]').click();
    
    cy.checkA11y('[data-testid="feedback-dialog"]', {
      rules: {
        'aria-labels': { enabled: true },
        'form-labels': { enabled: true }
      }
    });
  });

  it('should handle offline testing scenarios', () => {
    // Start test online
    cy.get('[data-testid="start-test-button"]').click();
    
    // Simulate going offline
    cy.window().then((win) => {
      win.navigator.onLine = false;
      win.dispatchEvent(new Event('offline'));
    });
    
    // Complete scenario while offline
    cy.get('[data-testid="complete-success-button"]').click();
    
    // Should store feedback locally
    cy.window().then((win) => {
      const offlineFeedback = JSON.parse(win.localStorage.getItem('offline_feedback') || '[]');
      expect(offlineFeedback).to.have.length.greaterThan(0);
    });
    
    // Simulate coming back online
    cy.window().then((win) => {
      win.navigator.onLine = true;
      win.dispatchEvent(new Event('online'));
    });
    
    // Should sync offline feedback
    cy.get('[data-testid="sync-status"]').should('contain', 'Synced');
  });
});