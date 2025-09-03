describe('Child Interface Accessibility', () => {
  let childCredentials: { username: string; pin: string };

  before(() => {
    childCredentials = {
      username: 'a11ytest',
      pin: '9999'
    };

    cy.task('createTestChild', childCredentials);
  });

  after(() => {
    cy.task('cleanupTestChild', childCredentials.username);
  });

  beforeEach(() => {
    cy.childLogin(childCredentials.username, childCredentials.pin);
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should meet color contrast requirements', () => {
      cy.visit('/child/dashboard');

      // Check text contrast ratios
      cy.get('[data-testid="welcome-message"]')
        .should('have.css', 'color')
        .then((color) => {
          cy.get('[data-testid="welcome-message"]')
            .should('have.css', 'background-color')
            .then((bgColor) => {
              // Calculate contrast ratio (simplified check)
              expect(color).to.not.equal(bgColor);
            });
        });

      // Check button contrast
      cy.get('[data-testid="study-plan-card"]').first()
        .should('have.css', 'color')
        .and('not.equal', 'rgb(255, 255, 255)'); // Should not be white on white

      // Use axe-core for comprehensive contrast checking
      cy.injectAxe();
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/child/dashboard');

      // Check heading structure
      cy.get('h1').should('have.length', 1);
      cy.get('h1').should('contain', 'Dashboard');

      cy.get('h2').should('have.length.at.least', 2);
      cy.get('h2').first().should('contain', 'Study Plans');

      // No skipped heading levels
      cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
        const headingLevels = Array.from($headings).map(h => 
          parseInt(h.tagName.charAt(1))
        );
        
        for (let i = 1; i < headingLevels.length; i++) {
          expect(headingLevels[i] - headingLevels[i-1]).to.be.at.most(1);
        }
      });
    });

    it('should have proper focus management', () => {
      cy.visit('/child/dashboard');

      // Skip link should be first focusable element
      cy.get('body').tab();
      cy.focused().should('contain', 'Skip to main content');

      // Focus should be visible
      cy.focused().should('have.css', 'outline-width').and('not.equal', '0px');

      // Tab order should be logical
      const expectedTabOrder = [
        'skip-link',
        'dashboard-nav',
        'study-plans-nav',
        'badges-nav',
        'settings-nav',
        'study-plan-card'
      ];

      expectedTabOrder.forEach((testId, index) => {
        if (index > 0) cy.focused().tab();
        cy.focused().should('have.attr', 'data-testid', testId);
      });
    });

    it('should have appropriate ARIA labels and roles', () => {
      cy.visit('/child/dashboard');

      // Main landmarks
      cy.get('[role="main"]').should('exist');
      cy.get('[role="navigation"]').should('exist');
      cy.get('[role="banner"]').should('exist');

      // Interactive elements should have accessible names
      cy.get('[data-testid="study-plan-card"]').each(($card) => {
        cy.wrap($card).should('have.attr', 'aria-label');
      });

      // Progress bars should have proper ARIA
      cy.get('[role="progressbar"]').each(($progress) => {
        cy.wrap($progress)
          .should('have.attr', 'aria-valuenow')
          .and('have.attr', 'aria-valuemax')
          .and('have.attr', 'aria-label');
      });

      // Buttons should have accessible names
      cy.get('button').each(($button) => {
        cy.wrap($button).then(($btn) => {
          const hasAriaLabel = $btn.attr('aria-label');
          const hasText = $btn.text().trim();
          const hasAriaLabelledBy = $btn.attr('aria-labelledby');
          
          expect(hasAriaLabel || hasText || hasAriaLabelledBy).to.exist;
        });
      });
    });

    it('should support screen reader navigation', () => {
      cy.visit('/child/dashboard');

      // Check for screen reader only content
      cy.get('.sr-only').should('exist');
      cy.get('[data-testid="sr-instructions"]')
        .should('contain', 'Use arrow keys to navigate between study plans');

      // Live regions for dynamic content
      cy.get('[aria-live="polite"]').should('exist');
      cy.get('[aria-live="assertive"]').should('exist');

      // Proper form labels
      cy.visit('/child/settings');
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
    });
  });

  describe('Child-Specific Accessibility Features', () => {
    it('should have large touch targets for children', () => {
      cy.visit('/child/dashboard');

      // Minimum 44px touch targets
      cy.get('[data-testid="study-plan-card"]')
        .should('have.css', 'min-height', '44px')
        .and('have.css', 'min-width', '44px');

      cy.get('[data-testid="badge-display"]')
        .should('have.css', 'min-height', '44px');

      cy.get('button').each(($button) => {
        cy.wrap($button)
          .invoke('outerHeight').should('be.at.least', 44);
        cy.wrap($button)
          .invoke('outerWidth').should('be.at.least', 44);
      });
    });

    it('should use child-appropriate language and instructions', () => {
      cy.visit('/child/dashboard');

      // Simple, encouraging language
      cy.get('[data-testid="welcome-message"]')
        .should('contain.oneOf', [
          'Welcome back!',
          'Ready to learn?',
          'Let\'s have fun learning!'
        ]);

      // Clear instructions
      cy.get('[data-testid="instructions"]')
        .should('not.contain.oneOf', [
          'utilize',
          'implement',
          'configure'
        ]); // Avoid complex words

      // Positive, encouraging tone
      cy.get('[data-testid="encouragement"]')
        .should('contain.oneOf', [
          'Great job!',
          'You\'re doing awesome!',
          'Keep it up!'
        ]);
    });

    it('should provide visual feedback for all interactions', () => {
      cy.visit('/child/dashboard');

      // Hover states
      cy.get('[data-testid="study-plan-card"]').first()
        .trigger('mouseover')
        .should('have.css', 'transform')
        .and('not.equal', 'none');

      // Click feedback
      cy.get('[data-testid="study-plan-card"]').first()
        .trigger('mousedown')
        .should('have.css', 'transform')
        .and('include', 'scale');

      // Loading states
      cy.intercept('GET', '/api/child/*/dashboard', { delay: 2000 });
      cy.visit('/child/dashboard');
      
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="loading-message"]')
        .should('contain', 'Loading your awesome dashboard...');
    });

    it('should handle errors in child-friendly way', () => {
      // Simulate network error
      cy.intercept('GET', '/api/child/*/dashboard', { forceNetworkError: true });
      cy.visit('/child/dashboard');

      // Child-friendly error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Oops!')
        .and('not.contain', 'Error 500')
        .and('not.contain', 'Network failure');

      // Friendly error icon
      cy.get('[data-testid="error-icon"]')
        .should('be.visible')
        .and('contain.oneOf', ['😅', '🤔', '😊']);

      // Simple recovery options
      cy.get('[data-testid="try-again-button"]')
        .should('be.visible')
        .and('contain', 'Try Again');

      cy.get('[data-testid="get-help-button"]')
        .should('be.visible')
        .and('contain', 'Get Help');
    });
  });

  describe('Keyboard Navigation for Children', () => {
    it('should support simplified keyboard shortcuts', () => {
      cy.visit('/child/dashboard');

      // Space bar should activate buttons (easier than Enter for children)
      cy.get('[data-testid="study-plan-card"]').first().focus();
      cy.focused().type(' ');
      cy.url().should('include', '/child/study-plan/');

      cy.visit('/child/dashboard');

      // Arrow keys for navigation
      cy.get('[data-testid="study-plan-card"]').first().focus();
      cy.focused().type('{rightarrow}');
      cy.focused().should('have.attr', 'data-testid', 'study-plan-card');

      // Escape to go back/cancel
      cy.get('[data-testid="help-button"]').click();
      cy.get('[data-testid="help-modal"]').should('be.visible');
      cy.focused().type('{esc}');
      cy.get('[data-testid="help-modal"]').should('not.exist');
    });

    it('should have clear focus indicators', () => {
      cy.visit('/child/dashboard');

      cy.get('[data-testid="study-plan-card"]').first().focus();
      
      // Focus should be highly visible
      cy.focused()
        .should('have.css', 'outline-width')
        .and('not.equal', '0px');

      cy.focused()
        .should('have.css', 'outline-color')
        .and('not.equal', 'transparent');

      // Focus should be thick enough for children to see
      cy.focused()
        .should('have.css', 'outline-width')
        .then((width) => {
          expect(parseInt(width)).to.be.at.least(2);
        });
    });

    it('should trap focus in modals', () => {
      cy.visit('/child/dashboard');
      cy.get('[data-testid="help-button"]').click();

      cy.get('[data-testid="help-modal"]').should('be.visible');

      // Focus should be trapped within modal
      cy.get('[data-testid="help-modal"] button').first().focus();
      
      // Tab through all focusable elements in modal
      cy.focused().tab();
      cy.focused().should('be.within', '[data-testid="help-modal"]');

      // Shift+Tab should also stay within modal
      cy.focused().tab({ shift: true });
      cy.focused().should('be.within', '[data-testid="help-modal"]');
    });
  });

  describe('Visual Accessibility', () => {
    it('should work with high contrast mode', () => {
      // Simulate high contrast mode
      cy.visit('/child/dashboard', {
        onBeforeLoad: (win) => {
          win.matchMedia = cy.stub().returns({
            matches: true,
            addListener: () => {},
            removeListener: () => {}
          });
        }
      });

      // Check that high contrast styles are applied
      cy.get('body').should('have.class', 'high-contrast');
      
      // Borders should be more prominent
      cy.get('[data-testid="study-plan-card"]')
        .should('have.css', 'border-width')
        .and('not.equal', '0px');
    });

    it('should support reduced motion preferences', () => {
      cy.visit('/child/dashboard', {
        onBeforeLoad: (win) => {
          Object.defineProperty(win, 'matchMedia', {
            writable: true,
            value: cy.stub().returns({
              matches: true, // prefers-reduced-motion: reduce
              addListener: () => {},
              removeListener: () => {}
            })
          });
        }
      });

      // Animations should be reduced or disabled
      cy.get('[data-testid="badge-animation"]')
        .should('have.css', 'animation-duration', '0s');

      cy.get('[data-testid="loading-spinner"]')
        .should('not.have.class', 'animate-spin');
    });

    it('should scale properly with zoom', () => {
      cy.visit('/child/dashboard');

      // Test 200% zoom
      cy.viewport(800, 600); // Simulate zoomed viewport
      
      // Content should still be accessible
      cy.get('[data-testid="study-plan-card"]').should('be.visible');
      cy.get('[data-testid="welcome-message"]').should('be.visible');

      // No horizontal scrolling should be needed
      cy.get('body').should('have.css', 'overflow-x', 'hidden');
    });
  });

  describe('Audio and Media Accessibility', () => {
    it('should provide captions for educational videos', () => {
      cy.visit('/child/study-plan/test-plan/activity/video-activity');

      cy.get('[data-testid="video-player"]').should('be.visible');
      
      // Captions button should be available
      cy.get('[data-testid="captions-button"]').should('be.visible');
      cy.get('[data-testid="captions-button"]').click();

      // Captions should appear
      cy.get('[data-testid="video-captions"]').should('be.visible');
      
      // Captions should be readable
      cy.get('[data-testid="video-captions"]')
        .should('have.css', 'background-color')
        .and('not.equal', 'transparent');
    });

    it('should have audio descriptions for visual content', () => {
      cy.visit('/child/study-plan/test-plan/activity/visual-activity');

      // Audio description button
      cy.get('[data-testid="audio-description"]').should('be.visible');
      cy.get('[data-testid="audio-description"]').click();

      // Audio description should play
      cy.get('[data-testid="audio-player"]')
        .should('have.prop', 'paused', false);
    });

    it('should respect sound preferences', () => {
      // Disable sound in settings
      cy.visit('/child/settings');
      cy.get('[data-testid="sound-toggle"]').click();

      // Navigate to activity
      cy.visit('/child/study-plan/test-plan/activity/test-activity');

      // Sound effects should not play
      cy.get('[data-testid="success-sound"]').should('not.exist');
      
      // Visual feedback should be enhanced when sound is off
      cy.get('[data-testid="visual-success-indicator"]')
        .should('be.visible')
        .and('have.class', 'enhanced-visual');
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should provide clear navigation breadcrumbs', () => {
      cy.visit('/child/study-plan/test-plan/activity/test-activity');

      cy.get('[data-testid="breadcrumbs"]').should('be.visible');
      cy.get('[data-testid="breadcrumbs"]').within(() => {
        cy.get('[data-testid="breadcrumb-home"]').should('contain', 'Home');
        cy.get('[data-testid="breadcrumb-plan"]').should('contain', 'Math Adventures');
        cy.get('[data-testid="breadcrumb-activity"]').should('contain', 'Addition Practice');
      });

      // Breadcrumbs should be clickable
      cy.get('[data-testid="breadcrumb-home"]').click();
      cy.url().should('include', '/child/dashboard');
    });

    it('should show progress indicators throughout activities', () => {
      cy.visit('/child/study-plan/test-plan/activity/test-activity');

      // Overall progress
      cy.get('[data-testid="overall-progress"]').should('be.visible');
      cy.get('[data-testid="progress-text"]')
        .should('match', /Question \d+ of \d+/);

      // Visual progress bar
      cy.get('[data-testid="progress-bar"]')
        .should('have.attr', 'aria-valuenow')
        .and('not.equal', '0');

      // Time remaining (if applicable)
      cy.get('[data-testid="time-remaining"]').should('be.visible');
    });

    it('should provide consistent help and support', () => {
      cy.visit('/child/dashboard');

      // Help should be available on every page
      cy.get('[data-testid="help-button"]').should('be.visible');

      cy.visit('/child/study-plan/test-plan');
      cy.get('[data-testid="help-button"]').should('be.visible');

      cy.visit('/child/badges');
      cy.get('[data-testid="help-button"]').should('be.visible');

      // Help content should be contextual
      cy.get('[data-testid="help-button"]').click();
      cy.get('[data-testid="help-content"]')
        .should('contain', 'badges')
        .and('contain', 'collection');
    });

    it('should use consistent design patterns', () => {
      // Check button styles are consistent
      const checkButtonConsistency = (page: string) => {
        cy.visit(page);
        cy.get('[data-testid="primary-button"]').should('have.class', 'btn-primary');
        cy.get('[data-testid="secondary-button"]').should('have.class', 'btn-secondary');
      };

      checkButtonConsistency('/child/dashboard');
      checkButtonConsistency('/child/badges');
      checkButtonConsistency('/child/settings');

      // Check navigation is consistent
      const checkNavConsistency = (page: string) => {
        cy.visit(page);
        cy.get('[data-testid="main-nav"]').should('be.visible');
        cy.get('[data-testid="dashboard-nav"]').should('be.visible');
        cy.get('[data-testid="badges-nav"]').should('be.visible');
      };

      checkNavConsistency('/child/dashboard');
      checkNavConsistency('/child/badges');
    });
  });

  describe('Comprehensive Accessibility Testing', () => {
    it('should pass automated accessibility tests on all child pages', () => {
      const childPages = [
        '/child/dashboard',
        '/child/badges',
        '/child/progress',
        '/child/settings'
      ];

      childPages.forEach((page) => {
        cy.visit(page);
        cy.injectAxe();
        
        // Run comprehensive accessibility check
        cy.checkA11y(null, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa']
          }
        });
      });
    });

    it('should be usable with assistive technologies', () => {
      cy.visit('/child/dashboard');

      // Test with simulated screen reader
      cy.get('[data-testid="study-plan-card"]').first()
        .should('have.attr', 'role', 'button')
        .and('have.attr', 'aria-label')
        .and('have.attr', 'tabindex', '0');

      // Test with voice control simulation
      cy.get('[data-testid="study-plan-card"]')
        .should('have.attr', 'data-voice-command')
        .and('contain', 'click');
    });
  });
});