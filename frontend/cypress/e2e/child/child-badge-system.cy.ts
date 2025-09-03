describe('Child Badge System E2E', () => {
  let childCredentials: { username: string; pin: string };

  before(() => {
    childCredentials = {
      username: 'badgetest',
      pin: '5678'
    };

    cy.task('createTestChild', childCredentials);
  });

  after(() => {
    cy.task('cleanupTestChild', childCredentials.username);
  });

  beforeEach(() => {
    cy.childLogin(childCredentials.username, childCredentials.pin);
  });

  describe('Badge Earning Flow', () => {
    it('should earn first activity badge with celebration', () => {
      // Complete first activity to earn "First Steps" badge
      cy.visit('/child/dashboard');
      
      cy.get('[data-testid="study-plan-card"]').first().click();
      cy.get('[data-testid="activity-card"]').first().click();

      // Complete the activity
      cy.completeActivity();

      // Badge earned modal should appear
      cy.get('[data-testid="badge-earned-modal"]', { timeout: 10000 })
        .should('be.visible');

      cy.get('[data-testid="badge-earned-modal"]').within(() => {
        // Celebration elements
        cy.get('[data-testid="confetti-animation"]').should('be.visible');
        cy.get('[data-testid="celebration-sound"]').should('exist');
        
        // Badge details
        cy.get('[data-testid="badge-icon"]').should('contain', '🌟');
        cy.get('[data-testid="badge-name"]').should('contain', 'First Steps');
        cy.get('[data-testid="badge-description"]')
          .should('contain', 'Complete your first activity');
        
        // Celebration message
        cy.get('[data-testid="celebration-title"]')
          .should('contain', 'Congratulations!');
        cy.get('[data-testid="celebration-message"]')
          .should('contain', 'You earned your first badge!');
        
        // Continue button
        cy.get('[data-testid="continue-button"]')
          .should('be.visible')
          .and('contain', 'Continue Learning!');
      });

      // Click continue to close modal
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="badge-earned-modal"]').should('not.exist');

      // Verify badge appears in dashboard
      cy.visit('/child/dashboard');
      cy.get('[data-testid="badges-section"]').within(() => {
        cy.get('[data-testid="badge-display"]')
          .should('contain', 'First Steps')
          .and('be.visible');
      });
    });

    it('should earn streak badge after consecutive days', () => {
      // Simulate learning for 3 consecutive days
      cy.task('simulateConsecutiveDays', {
        childId: 'badgetest',
        days: 3
      });

      cy.visit('/child/dashboard');

      // Complete an activity to trigger streak check
      cy.get('[data-testid="study-plan-card"]').first().click();
      cy.get('[data-testid="activity-card"]').eq(1).click();
      cy.completeActivity();

      // Should earn "Learning Streak" badge
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      cy.get('[data-testid="badge-name"]').should('contain', 'Learning Streak');
      cy.get('[data-testid="badge-icon"]').should('contain', '🔥');
    });

    it('should earn subject mastery badge', () => {
      // Complete multiple math activities
      cy.visit('/child/dashboard');
      
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="study-plan-card"]')
          .contains('Math Adventures').click();
        
        cy.get('[data-testid="activity-card"]').eq(i).click();
        cy.completeActivity({ score: 90 }); // High score
        
        cy.visit('/child/dashboard');
      }

      // Should earn "Math Star" badge
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      cy.get('[data-testid="badge-name"]').should('contain', 'Math Star');
      cy.get('[data-testid="badge-icon"]').should('contain', '⭐');
    });

    it('should earn perfect score badge', () => {
      cy.visit('/child/dashboard');
      cy.get('[data-testid="study-plan-card"]').first().click();
      cy.get('[data-testid="activity-card"]').first().click();

      // Complete activity with perfect score
      cy.completeActivity({ score: 100 });

      // Should earn "Perfect Score" badge
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      cy.get('[data-testid="badge-name"]').should('contain', 'Perfect Score');
      cy.get('[data-testid="badge-icon"]').should('contain', '💯');
    });

    it('should earn help-free badge', () => {
      cy.visit('/child/dashboard');
      cy.get('[data-testid="study-plan-card"]').first().click();
      cy.get('[data-testid="activity-card"]').first().click();

      // Complete activity without using help
      cy.completeActivity({ useHelp: false });

      // Should earn "Independent Learner" badge
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      cy.get('[data-testid="badge-name"]').should('contain', 'Independent Learner');
      cy.get('[data-testid="badge-icon"]').should('contain', '🎯');
    });
  });

  describe('Badge Collection Interface', () => {
    beforeEach(() => {
      // Ensure child has some badges
      cy.task('grantTestBadges', childCredentials.username);
    });

    it('should display badge collection with proper organization', () => {
      cy.visit('/child/badges');

      // Main badge collection interface
      cy.get('[data-testid="badge-collection"]').should('be.visible');
      cy.get('[data-testid="collection-title"]')
        .should('contain', 'Your Badge Collection');

      // Tabs for different views
      cy.get('[data-testid="earned-tab"]').should('be.visible');
      cy.get('[data-testid="in-progress-tab"]').should('be.visible');
      cy.get('[data-testid="all-badges-tab"]').should('be.visible');

      // Badge grid
      cy.get('[data-testid="badge-grid"]').should('be.visible');
      cy.get('[data-testid="badge-card"]').should('have.length.at.least', 1);
    });

    it('should filter badges by category', () => {
      cy.visit('/child/badges');

      // Category filter buttons
      cy.get('[data-testid="category-filters"]').should('be.visible');
      cy.get('[data-testid="filter-all"]').should('be.visible');
      cy.get('[data-testid="filter-math"]').should('be.visible');
      cy.get('[data-testid="filter-reading"]').should('be.visible');
      cy.get('[data-testid="filter-science"]').should('be.visible');

      // Test math filter
      cy.get('[data-testid="filter-math"]').click();
      cy.get('[data-testid="badge-card"]').each(($badge) => {
        cy.wrap($badge).should('have.attr', 'data-category', 'math');
      });

      // Test reading filter
      cy.get('[data-testid="filter-reading"]').click();
      cy.get('[data-testid="badge-card"]').each(($badge) => {
        cy.wrap($badge).should('have.attr', 'data-category', 'reading');
      });

      // Clear filter
      cy.get('[data-testid="filter-all"]').click();
      cy.get('[data-testid="badge-card"]').should('have.length.at.least', 2);
    });

    it('should show badge progress for unearned badges', () => {
      cy.visit('/child/badges');
      cy.get('[data-testid="in-progress-tab"]').click();

      cy.get('[data-testid="badge-progress-card"]').first().within(() => {
        // Progress elements
        cy.get('[data-testid="badge-icon"]').should('be.visible');
        cy.get('[data-testid="badge-name"]').should('be.visible');
        cy.get('[data-testid="badge-description"]').should('be.visible');
        
        // Progress bar
        cy.get('[data-testid="progress-bar"]').should('be.visible');
        cy.get('[data-testid="progress-text"]').should('match', /\d+ \/ \d+/);
        cy.get('[data-testid="progress-percentage"]').should('be.visible');
        
        // Encouragement message
        cy.get('[data-testid="encouragement"]')
          .should('be.visible')
          .and('contain.oneOf', [
            'Keep going!',
            'You\'re almost there!',
            'You can do it!'
          ]);
      });
    });

    it('should display badge rarity indicators', () => {
      cy.visit('/child/badges');

      cy.get('[data-testid="badge-card"]').each(($badge) => {
        cy.wrap($badge).within(() => {
          cy.get('[data-testid="rarity-indicator"]').should('be.visible');
          cy.get('[data-testid="rarity-indicator"]')
            .should('have.class')
            .and('match', /rarity-(common|rare|epic|legendary)/);
        });
      });

      // Test rarity colors
      cy.get('[data-testid="rarity-common"]')
        .should('have.css', 'border-color')
        .and('include', 'gray');
      
      cy.get('[data-testid="rarity-rare"]')
        .should('have.css', 'border-color')
        .and('include', 'blue');
    });

    it('should show badge details on click', () => {
      cy.visit('/child/badges');

      cy.get('[data-testid="badge-card"]').first().click();

      // Badge detail modal
      cy.get('[data-testid="badge-detail-modal"]').should('be.visible');
      
      cy.get('[data-testid="badge-detail-modal"]').within(() => {
        cy.get('[data-testid="large-badge-icon"]').should('be.visible');
        cy.get('[data-testid="badge-name"]').should('be.visible');
        cy.get('[data-testid="badge-description"]').should('be.visible');
        cy.get('[data-testid="earned-date"]').should('be.visible');
        cy.get('[data-testid="badge-story"]').should('be.visible');
        
        // Close button
        cy.get('[data-testid="close-modal"]').should('be.visible');
      });

      // Close modal
      cy.get('[data-testid="close-modal"]').click();
      cy.get('[data-testid="badge-detail-modal"]').should('not.exist');
    });
  });

  describe('Badge Progress Tracking', () => {
    it('should show real-time progress updates', () => {
      cy.visit('/child/badges');
      cy.get('[data-testid="in-progress-tab"]').click();

      // Find a badge in progress
      cy.get('[data-testid="badge-progress-card"]')
        .contains('Reading Champion').within(() => {
          cy.get('[data-testid="progress-text"]')
            .should('contain', '2 / 5'); // Initial progress
        });

      // Complete a reading activity
      cy.visit('/child/dashboard');
      cy.get('[data-testid="study-plan-card"]')
        .contains('Reading Fun').click();
      cy.get('[data-testid="activity-card"]').first().click();
      cy.completeActivity();

      // Return to badges and check updated progress
      cy.visit('/child/badges');
      cy.get('[data-testid="in-progress-tab"]').click();

      cy.get('[data-testid="badge-progress-card"]')
        .contains('Reading Champion').within(() => {
          cy.get('[data-testid="progress-text"]')
            .should('contain', '3 / 5'); // Updated progress
        });
    });

    it('should show next milestone information', () => {
      cy.visit('/child/badges');
      cy.get('[data-testid="in-progress-tab"]').click();

      cy.get('[data-testid="badge-progress-card"]').first().within(() => {
        cy.get('[data-testid="next-milestone"]').should('be.visible');
        cy.get('[data-testid="milestone-text"]')
          .should('match', /\d+ more to go!/);
        
        // Estimated time to completion
        cy.get('[data-testid="estimated-time"]')
          .should('be.visible')
          .and('contain.oneOf', [
            'About 1 day left',
            'About 2 days left',
            'Keep practicing!'
          ]);
      });
    });
  });

  describe('Badge Celebration Animations', () => {
    it('should play different animations for different badge rarities', () => {
      // Earn common badge
      cy.completeActivity();
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      cy.get('[data-testid="confetti-animation"]')
        .should('have.class', 'common-celebration');

      cy.get('[data-testid="continue-button"]').click();

      // Earn rare badge (simulate)
      cy.task('awardBadge', {
        childId: childCredentials.username,
        badgeId: 'rare-badge-1',
        rarity: 'rare'
      });

      cy.visit('/child/dashboard');
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      cy.get('[data-testid="fireworks-animation"]')
        .should('have.class', 'rare-celebration');
    });

    it('should play celebration sound effects', () => {
      cy.completeActivity();
      
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');
      
      // Check that audio element exists and plays
      cy.get('[data-testid="celebration-audio"]').should('exist');
      cy.window().its('HTMLAudioElement.prototype.play').should('have.been.called');
    });

    it('should respect sound settings', () => {
      // Disable sound in settings
      cy.visit('/child/settings');
      cy.get('[data-testid="sound-toggle"]').click();

      // Earn badge
      cy.completeActivity();
      cy.get('[data-testid="badge-earned-modal"]').should('be.visible');

      // Sound should not play
      cy.get('[data-testid="celebration-audio"]').should('not.exist');
    });
  });

  describe('Badge Sharing and Social Features', () => {
    it('should allow sharing badge achievements', () => {
      cy.visit('/child/badges');
      
      cy.get('[data-testid="badge-card"]').first().within(() => {
        cy.get('[data-testid="share-badge"]').click();
      });

      cy.get('[data-testid="share-modal"]').should('be.visible');
      
      cy.get('[data-testid="share-modal"]').within(() => {
        cy.get('[data-testid="share-with-parent"]').should('be.visible');
        cy.get('[data-testid="share-with-family"]').should('be.visible');
        cy.get('[data-testid="print-certificate"]').should('be.visible');
      });

      // Test sharing with parent
      cy.get('[data-testid="share-with-parent"]').click();
      cy.get('[data-testid="share-success"]')
        .should('contain', 'Shared with your parent!');
    });

    it('should generate printable certificates', () => {
      cy.visit('/child/badges');
      
      cy.get('[data-testid="badge-card"]').first().click();
      cy.get('[data-testid="print-certificate"]').click();

      // Certificate modal should open
      cy.get('[data-testid="certificate-modal"]').should('be.visible');
      
      cy.get('[data-testid="certificate-preview"]').within(() => {
        cy.get('[data-testid="child-name"]').should('contain', 'Test Child');
        cy.get('[data-testid="badge-name"]').should('be.visible');
        cy.get('[data-testid="earned-date"]').should('be.visible');
        cy.get('[data-testid="certificate-border"]').should('be.visible');
      });

      cy.get('[data-testid="print-button"]').should('be.visible');
      cy.get('[data-testid="download-pdf"]').should('be.visible');
    });
  });

  describe('Badge System Accessibility', () => {
    it('should be fully keyboard navigable', () => {
      cy.visit('/child/badges');

      // Tab through badge collection
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'earned-tab');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'in-progress-tab');

      // Navigate to badge grid
      cy.get('[data-testid="badge-grid"]').focus();
      cy.focused().type('{rightarrow}');
      cy.focused().should('have.attr', 'data-testid').and('include', 'badge-card');

      // Open badge detail with Enter
      cy.focused().type('{enter}');
      cy.get('[data-testid="badge-detail-modal"]').should('be.visible');

      // Close with Escape
      cy.focused().type('{esc}');
      cy.get('[data-testid="badge-detail-modal"]').should('not.exist');
    });

    it('should have proper ARIA labels and descriptions', () => {
      cy.visit('/child/badges');

      // Check main landmarks
      cy.get('[data-testid="badge-collection"]')
        .should('have.attr', 'role', 'main')
        .and('have.attr', 'aria-label', 'Badge Collection');

      // Check badge cards
      cy.get('[data-testid="badge-card"]').first().within(() => {
        cy.get('[data-testid="badge-icon"]')
          .should('have.attr', 'aria-hidden', 'true');
        
        cy.root().should('have.attr', 'aria-label')
          .and('include', 'badge');
        
        cy.root().should('have.attr', 'aria-describedby');
      });

      // Check progress bars
      cy.get('[data-testid="in-progress-tab"]').click();
      cy.get('[data-testid="progress-bar"]').first()
        .should('have.attr', 'role', 'progressbar')
        .and('have.attr', 'aria-valuenow')
        .and('have.attr', 'aria-valuemax');
    });

    it('should announce badge earnings to screen readers', () => {
      cy.completeActivity();

      // Check for screen reader announcement
      cy.get('[data-testid="sr-announcement"]')
        .should('contain', 'Congratulations! You earned the')
        .and('have.attr', 'aria-live', 'polite');

      // Badge modal should have proper focus management
      cy.get('[data-testid="badge-earned-modal"]')
        .should('have.attr', 'role', 'dialog')
        .and('have.attr', 'aria-labelledby')
        .and('have.attr', 'aria-describedby');

      // Continue button should have focus
      cy.get('[data-testid="continue-button"]').should('have.focus');
    });
  });
});