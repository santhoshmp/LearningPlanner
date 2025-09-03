describe('Parent Dashboard Responsive Tests', () => {
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
    
    // Mock API calls for dashboard data
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
    
    cy.intercept('GET', '/api/analytics/summary', {
      statusCode: 200,
      body: {
        totalActivitiesCompleted: 45,
        averageScore: 85,
        timeSpent: 1200,
        subjectPerformance: [
          { subject: 'Math', score: 90 },
          { subject: 'Science', score: 85 },
          { subject: 'Reading', score: 80 },
        ],
      },
    });
    
    // Visit the dashboard
    cy.visit('/dashboard');
    
    // Wait for dashboard to load
    cy.contains('Dashboard').should('be.visible');
  });
  
  it('should display responsive navigation', () => {
    // Test responsive behavior of navigation
    cy.testResponsive(() => {
      // On mobile, the hamburger menu should be visible
      if (Cypress.viewportWidth < 768) {
        cy.get('.mobile-menu-button').should('be.visible');
        cy.get('.desktop-nav').should('not.be.visible');
        
        // Open mobile menu
        cy.get('.mobile-menu-button').click();
        cy.get('.mobile-nav').should('be.visible');
        
        // Close mobile menu
        cy.get('.close-menu-button').click();
        cy.get('.mobile-nav').should('not.be.visible');
      } else {
        // On desktop, the full navigation should be visible
        cy.get('.desktop-nav').should('be.visible');
        cy.get('.mobile-menu-button').should('not.exist');
      }
    });
  });
  
  it('should display responsive dashboard layout', () => {
    // Test responsive behavior of dashboard layout
    cy.testResponsive(() => {
      // Dashboard should always be visible
      cy.get('.dashboard-container').should('be.visible');
      
      // Check grid layout changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, cards should stack vertically
        cy.get('.dashboard-card').should('have.css', 'grid-column', 'span 12');
      } else if (Cypress.viewportWidth < 1280) {
        // On tablet, cards should be in a 2-column grid
        cy.get('.dashboard-card').first().should('have.css', 'grid-column', 'span 6');
      } else {
        // On desktop, cards should be in a 3 or 4-column grid
        cy.get('.dashboard-card').first().should('have.css', 'grid-column', 'span 3');
      }
    });
  });
  
  it('should display responsive charts and data visualizations', () => {
    // Test responsive behavior of charts
    cy.testResponsive(() => {
      // Charts should always be visible
      cy.get('.chart-container').should('be.visible');
      
      // Chart dimensions should adapt to viewport
      cy.get('.chart-container').then($chart => {
        const chartWidth = $chart.width();
        
        if (Cypress.viewportWidth < 768) {
          // On mobile, chart should be nearly full viewport width
          expect(chartWidth).to.be.lessThan(Cypress.viewportWidth);
          expect(chartWidth).to.be.greaterThan(Cypress.viewportWidth * 0.8);
        } else {
          // On larger screens, chart should not exceed its container
          expect(chartWidth).to.be.lessThan(Cypress.viewportWidth);
        }
      });
    });
  });
  
  it('should test touch interactions on mobile', () => {
    // Test touch interactions
    cy.viewport(375, 667); // Mobile viewport
    
    // Test card touch interaction
    cy.testTouchInteraction('.dashboard-card');
    
    // Test button touch interaction
    cy.testTouchInteraction('.action-button');
  });
  
  it('should verify breakpoint behavior for specific elements', () => {
    // Verify visibility of elements at different breakpoints
    cy.verifyBreakpointVisibility('.mobile-menu-button', {
      mobile: true,
      tablet: true,
      desktop: false,
    });
    
    cy.verifyBreakpointVisibility('.desktop-nav', {
      mobile: false,
      tablet: false,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('.dashboard-summary', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
  });
});