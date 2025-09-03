describe('Parent Login Responsive Tests', () => {
  beforeEach(() => {
    // Visit the parent login page
    cy.visit('/login');
    
    // Wait for page to load
    cy.contains('Welcome back').should('be.visible');
  });
  
  it('should display responsive login form', () => {
    // Test responsive behavior of login form
    cy.testResponsive(() => {
      // Login form should always be visible
      cy.get('.login-form').should('be.visible');
      
      // Check form layout changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, form should take full width
        cy.get('.login-form').should('have.css', 'width', '100%');
      } else {
        // On larger screens, form should be centered
        cy.get('.login-form').should('have.css', 'max-width');
      }
    });
  });
  
  it('should display responsive form fields', () => {
    // Test responsive behavior of form fields
    cy.testResponsive(() => {
      // Form fields should always be visible
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      
      // Check form field layout changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, form fields might have larger touch targets
        cy.get('input[name="email"]').should('have.css', 'height', '48px');
        cy.get('input[name="password"]').should('have.css', 'height', '48px');
      } else {
        // On larger screens, form fields might be standard size
        cy.get('input[name="email"]').should('have.css', 'height', '40px');
        cy.get('input[name="password"]').should('have.css', 'height', '40px');
      }
    });
  });
  
  it('should display responsive layout with optional side image', () => {
    // Test responsive behavior of login page layout
    cy.testResponsive(() => {
      // Login container should always be visible
      cy.get('.login-container').should('be.visible');
      
      // Check layout changes
      if (Cypress.viewportWidth < 1024) {
        // On mobile and tablet, side image might be hidden
        cy.get('.login-image').should('not.be.visible');
      } else {
        // On desktop, side image should be visible
        cy.get('.login-image').should('be.visible');
      }
    });
  });
  
  it('should test touch interactions on mobile', () => {
    // Test touch interactions
    cy.viewport(375, 667); // Mobile viewport
    
    // Test email input touch interaction
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="email"]').touch('tap');
    cy.get('input[name="email"]').should('have.focus');
    
    // Test password input touch interaction
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="password"]').touch('tap');
    cy.get('input[name="password"]').should('have.focus');
    
    // Test login button touch interaction
    cy.testTouchInteraction('button[type="submit"]');
  });
  
  it('should verify breakpoint behavior for specific elements', () => {
    // Verify visibility of elements at different breakpoints
    cy.verifyBreakpointVisibility('.login-title', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('.login-image', {
      mobile: false,
      tablet: false,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('.forgot-password-link', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
  });
  
  it('should test form submission on different devices', () => {
    // Test form submission on different viewport sizes
    cy.testResponsive(() => {
      // Fill in the form
      cy.get('input[name="email"]').clear().type('test@example.com');
      cy.get('input[name="password"]').clear().type('password123');
      
      // Mock the API response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'user-123',
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
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Verify redirection
      cy.url().should('include', '/dashboard');
    });
  });
});