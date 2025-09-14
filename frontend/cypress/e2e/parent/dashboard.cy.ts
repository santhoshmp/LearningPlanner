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
    
    // Wait for dashboard to load and verify new header structure
    cy.contains('Study Plan Pro').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });
  
  it('should display responsive navigation with new header structure', () => {
    // Test the new header structure with tabs
    cy.get('[role="tablist"]').should('be.visible');
    
    // Verify all tabs are present
    cy.get('[role="tab"]').should('have.length', 3);
    cy.contains('[role="tab"]', 'Dashboard').should('be.visible');
    cy.contains('[role="tab"]', 'Study Plans').should('be.visible');
    cy.contains('[role="tab"]', 'Reports').should('be.visible');
    
    // Test responsive behavior of header
    cy.testResponsive(() => {
      // Header should always be visible
      cy.contains('Study Plan Pro').should('be.visible');
      
      // User action buttons should be visible
      cy.contains('Make a copy').should('be.visible');
      cy.contains('Share').should('be.visible');
      
      // Icon buttons should be present
      cy.get('[aria-label="User Profile"]').should('be.visible');
      cy.get('[aria-label="Log Out"]').should('be.visible');
      
      if (Cypress.viewportWidth < 768) {
        // On mobile, tabs might stack or scroll
        cy.get('[role="tablist"]').should('be.visible');
      } else {
        // On desktop, all tabs should be visible in a row
        cy.get('[role="tablist"]').should('be.visible');
        cy.get('[role="tab"]').should('have.length', 3);
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
    // Verify visibility of new header elements at different breakpoints
    cy.verifyBreakpointVisibility('[aria-label="User Profile"]', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('[aria-label="Log Out"]', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('[role="tablist"]', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
    
    // Test tab functionality
    cy.contains('[role="tab"]', 'Study Plans').click();
    cy.contains('Safety & Security Monitoring').should('be.visible');
    
    cy.contains('[role="tab"]', 'Reports').click();
    cy.contains('Detailed Learning Analytics').should('be.visible');
    
    cy.contains('[role="tab"]', 'Dashboard').click();
    cy.get('[data-testid="parent-progress-dashboard"]').should('be.visible');
  });
  
  it('should test new user action buttons', () => {
    // Test Make a copy button
    cy.contains('Make a copy').should('be.visible').click();
    
    // Test Share button
    cy.contains('Share').should('be.visible').click();
    
    // Test Profile icon button
    cy.get('[aria-label="User Profile"]').should('be.visible').click();
    
    // Test Logout icon button
    cy.get('[aria-label="Log Out"]').should('be.visible').click();
  });
  
  it('should verify tooltip functionality', () => {
    // Test tooltips on icon buttons
    cy.get('[aria-label="User Profile"]').trigger('mouseover');
    cy.contains('User Profile').should('be.visible');
    
    cy.get('[aria-label="Log Out"]').trigger('mouseover');
    cy.contains('Log Out').should('be.visible');
    
    // Test tooltip on Make a copy button
    cy.contains('Make a copy').trigger('mouseover');
    cy.contains('Make a copy').should('be.visible');
  });
});