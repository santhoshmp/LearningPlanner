describe('Study Plan Creation Responsive Tests', () => {
  beforeEach(() => {
    // Mock the authentication to bypass login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARENT',
        },
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 3600,
      },
    });
    
    // Mock API calls for children data
    cy.intercept('GET', '/api/children', {
      statusCode: 200,
      body: [
        {
          id: 'child-1',
          name: 'Child One',
          username: 'child1',
          age: 8,
        },
        {
          id: 'child-2',
          name: 'Child Two',
          username: 'child2',
          age: 10,
        },
      ],
    });
    
    // Mock API call for subjects
    cy.intercept('GET', '/api/subjects', {
      statusCode: 200,
      body: [
        { id: 'math', name: 'Mathematics' },
        { id: 'science', name: 'Science' },
        { id: 'reading', name: 'Reading' },
        { id: 'writing', name: 'Writing' },
      ],
    });
    
    // Visit the study plan creation page
    cy.visit('/create-study-plan');
    
    // Wait for page to load
    cy.contains('Create Study Plan').should('be.visible');
  });
  
  it('should display responsive form layout', () => {
    // Test responsive behavior of form layout
    cy.testResponsive(() => {
      // Form should always be visible
      cy.get('.study-plan-form').should('be.visible');
      
      // Check form layout changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, form fields should stack vertically
        cy.get('.form-field').should('have.css', 'flex-direction', 'column');
      } else {
        // On larger screens, form might have a different layout
        cy.get('.form-field').should('exist');
      }
    });
  });
  
  it('should display responsive subject selection', () => {
    // Test responsive behavior of subject selection
    cy.testResponsive(() => {
      // Subject selection should always be visible
      cy.get('.subject-selection').should('be.visible');
      
      // Check subject selection layout changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, subjects might be in a dropdown or stacked
        cy.get('.subject-dropdown').then($dropdown => {
          if ($dropdown.length > 0) {
            cy.wrap($dropdown).should('be.visible');
          } else {
            cy.get('.subject-list').should('have.css', 'flex-direction', 'column');
          }
        });
      } else {
        // On larger screens, subjects might be in a grid or horizontal list
        cy.get('.subject-grid, .subject-list').then($subjectList => {
          if ($subjectList.hasClass('subject-grid')) {
            cy.wrap($subjectList).should('have.css', 'display', 'grid');
          } else {
            cy.wrap($subjectList).should('have.css', 'flex-direction', 'row');
          }
        });
      }
    });
  });
  
  it('should display responsive AI assistant integration', () => {
    // Test responsive behavior of AI assistant
    cy.testResponsive(() => {
      // AI assistant button should always be visible
      cy.get('.ai-assistant-button').should('be.visible');
      
      // Click AI assistant button
      cy.get('.ai-assistant-button').click();
      
      // AI assistant panel should appear
      cy.get('.ai-assistant-panel').should('be.visible');
      
      // Check AI assistant panel layout
      if (Cypress.viewportWidth < 768) {
        // On mobile, AI assistant might be full screen
        cy.get('.ai-assistant-panel').should('have.css', 'position', 'fixed');
        cy.get('.ai-assistant-panel').should('have.css', 'width', '100%');
      } else {
        // On larger screens, AI assistant might be a sidebar
        cy.get('.ai-assistant-panel').should('have.css', 'position', 'absolute');
      }
      
      // Close AI assistant panel
      cy.get('.close-assistant-button').click();
      cy.get('.ai-assistant-panel').should('not.be.visible');
    });
  });
  
  it('should test touch interactions on mobile', () => {
    // Test touch interactions
    cy.viewport(375, 667); // Mobile viewport
    
    // Test form field touch interaction
    cy.testTouchInteraction('.form-field');
    
    // Test subject selection touch interaction
    cy.testTouchInteraction('.subject-item');
    
    // Test button touch interaction
    cy.testTouchInteraction('.submit-button');
  });
  
  it('should verify breakpoint behavior for specific elements', () => {
    // Verify visibility of elements at different breakpoints
    cy.verifyBreakpointVisibility('.mobile-stepper', {
      mobile: true,
      tablet: false,
      desktop: false,
    });
    
    cy.verifyBreakpointVisibility('.desktop-stepper', {
      mobile: false,
      tablet: true,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('.form-container', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
  });
});