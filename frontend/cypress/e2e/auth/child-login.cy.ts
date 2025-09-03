describe('Child Authentication End-to-End Tests', () => {
  let testChild: any;
  let testParent: any;

  before(() => {
    // Create test data
    cy.task('createTestData').then((data: any) => {
      testChild = data.child;
      testParent = data.parent;
    });
  });

  after(() => {
    // Clean up test data
    cy.task('cleanupTestData');
  });

  beforeEach(() => {
    // Clear any existing session data
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Visit the child login page
    cy.visit('/child-login');
    
    // Wait for page to load
    cy.contains('Welcome to Study Adventure').should('be.visible');
  });
  
  it('should display responsive login form', () => {
    // Test responsive behavior of login form
    cy.testResponsive(() => {
      // Login form should always be visible
      cy.get('.child-login-form').should('be.visible');
      
      // Check form layout changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, form should be centered and take most of the width
        cy.get('.child-login-form').then($form => {
          const formWidth = $form.width();
          expect(formWidth).to.be.greaterThan(Cypress.viewportWidth * 0.8);
        });
      } else {
        // On larger screens, form should be centered but not full width
        cy.get('.child-login-form').then($form => {
          const formWidth = $form.width();
          expect(formWidth).to.be.lessThan(Cypress.viewportWidth * 0.8);
        });
      }
    });
  });
  
  it('should display responsive PIN input', () => {
    // Test responsive behavior of PIN input
    cy.testResponsive(() => {
      // PIN input should always be visible
      cy.get('input[name="pin"]').should('be.visible');
      
      // Check PIN input size changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, PIN input might be larger for touch
        cy.get('input[name="pin"]').should('have.css', 'font-size', '16px');
      } else {
        // On larger screens, PIN input might be standard size
        cy.get('input[name="pin"]').should('exist');
      }
    });
  });
  
  it('should display responsive animations', () => {
    // Test responsive behavior of animations
    cy.testResponsive(() => {
      // Animation elements should be visible
      cy.get('.login-animation').should('be.visible');
      
      // Check animation size changes
      if (Cypress.viewportWidth < 768) {
        // On mobile, animations might be smaller or simplified
        cy.get('.login-animation').should('have.css', 'transform-origin', 'center');
      } else {
        // On larger screens, animations might be more elaborate
        cy.get('.login-animation').should('exist');
      }
    });
  });
  
  it('should test touch interactions on mobile', () => {
    // Test touch interactions
    cy.viewport(375, 667); // Mobile viewport
    
    // Test username input touch interaction
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="username"]').touch('tap');
    cy.get('input[name="username"]').should('have.focus');
    
    // Test PIN input touch interaction
    cy.get('input[name="pin"]').should('be.visible');
    cy.get('input[name="pin"]').touch('tap');
    cy.get('input[name="pin"]').should('have.focus');
    
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
    
    cy.verifyBreakpointVisibility('.login-animation', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
    
    cy.verifyBreakpointVisibility('.help-text', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
  });
  
  describe('Complete Child Authentication Flow', () => {
    it('should complete full login flow and access dashboard', () => {
      // Fill in valid credentials
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to child dashboard
      cy.url().should('include', '/child-dashboard');
      
      // Verify child dashboard loads correctly
      cy.contains('Welcome back').should('be.visible');
      cy.contains(testChild.name).should('be.visible');
      
      // Verify session data is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
        expect(win.localStorage.getItem('refreshToken')).to.exist;
        expect(win.localStorage.getItem('userRole')).to.equal('child');
        
        const user = JSON.parse(win.localStorage.getItem('user') || '{}');
        expect(user.role).to.equal('CHILD');
        expect(user.username).to.equal(testChild.username);
      });
    });

    it('should handle invalid credentials gracefully', () => {
      // Fill in invalid credentials
      cy.get('input[name="username"]').type('invaliduser');
      cy.get('input[name="pin"]').type('0000');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains('Invalid username or PIN').should('be.visible');
      
      // Should remain on login page
      cy.url().should('include', '/child-login');
      
      // Should not have session data
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('userRole')).to.be.null;
      });
    });

    it('should handle network errors during login', () => {
      // Mock network error
      cy.intercept('POST', '/api/auth/child/login-legacy', {
        forceNetworkError: true
      });
      
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      
      // Should show network error message
      cy.contains('having trouble connecting').should('be.visible');
      cy.contains('Try again').should('be.visible');
    });

    it('should show loading state during authentication', () => {
      // Mock slow response
      cy.intercept('POST', '/api/auth/child/login-legacy', (req) => {
        req.reply((res) => {
          res.delay(2000);
          res.send({
            statusCode: 200,
            body: {
              success: true,
              user: testChild,
              accessToken: 'test-token',
              refreshToken: 'test-refresh-token'
            }
          });
        });
      });
      
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      
      // Should show loading state
      cy.get('button[type="submit"]').should('be.disabled');
      cy.contains('Logging in').should('be.visible');
    });
  });

  describe('Session Persistence', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should persist session across page refresh', () => {
      // Refresh the page
      cy.reload();
      
      // Should remain on dashboard
      cy.url().should('include', '/child-dashboard');
      cy.contains('Welcome back').should('be.visible');
      
      // Session data should still exist
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
        expect(win.localStorage.getItem('userRole')).to.equal('child');
      });
    });

    it('should persist session across browser restart', () => {
      // Simulate browser restart by clearing memory but keeping localStorage
      cy.window().then((win) => {
        const sessionData = {
          accessToken: win.localStorage.getItem('accessToken'),
          refreshToken: win.localStorage.getItem('refreshToken'),
          user: win.localStorage.getItem('user'),
          userRole: win.localStorage.getItem('userRole')
        };
        
        // Visit a different page to clear memory
        cy.visit('/');
        
        // Manually restore session data (simulating browser restart)
        win.localStorage.setItem('accessToken', sessionData.accessToken!);
        win.localStorage.setItem('refreshToken', sessionData.refreshToken!);
        win.localStorage.setItem('user', sessionData.user!);
        win.localStorage.setItem('userRole', sessionData.userRole!);
      });
      
      // Visit child dashboard
      cy.visit('/child-dashboard');
      
      // Should load dashboard without requiring login
      cy.contains('Welcome back').should('be.visible');
    });

    it('should handle corrupted session data', () => {
      // Corrupt session data
      cy.window().then((win) => {
        win.localStorage.setItem('user', 'invalid-json');
      });
      
      // Refresh page
      cy.reload();
      
      // Should redirect to login due to corrupted data
      cy.url().should('include', '/child-login');
      
      // Should show appropriate message
      cy.contains('Please log in again').should('be.visible');
    });
  });

  describe('Token Refresh', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should automatically refresh expired tokens', () => {
      // Mock token refresh endpoint
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          success: true,
          user: testChild,
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 1200
        }
      });
      
      // Mock API call that triggers token refresh
      cy.intercept('GET', '/api/child/profile', (req) => {
        // First call returns 401 (expired token)
        if (!req.headers['x-retry']) {
          req.reply({
            statusCode: 401,
            body: { error: 'Token expired' }
          });
        } else {
          // Second call (after refresh) succeeds
          req.reply({
            statusCode: 200,
            body: { profile: testChild }
          });
        }
      });
      
      // Trigger an API call that would cause token refresh
      cy.visit('/child-profile');
      
      // Should successfully load profile page after token refresh
      cy.contains('Profile').should('be.visible');
      
      // Verify new tokens were stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.equal('new-access-token');
        expect(win.localStorage.getItem('refreshToken')).to.equal('new-refresh-token');
      });
    });

    it('should redirect to login when refresh token is invalid', () => {
      // Mock failed token refresh
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 401,
        body: { error: 'Invalid refresh token' }
      });
      
      // Mock API call that triggers token refresh
      cy.intercept('GET', '/api/child/profile', {
        statusCode: 401,
        body: { error: 'Token expired' }
      });
      
      // Trigger an API call
      cy.visit('/child-profile');
      
      // Should redirect to child login
      cy.url().should('include', '/child-login');
      
      // Should show appropriate message
      cy.contains('Please log in again').should('be.visible');
      
      // Session data should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('refreshToken')).to.be.null;
      });
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should logout successfully and clear session', () => {
      // Click logout button
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to child login
      cy.url().should('include', '/child-login');
      
      // Should show logout success message
      cy.contains('logged out successfully').should('be.visible');
      
      // Session data should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('refreshToken')).to.be.null;
        expect(win.localStorage.getItem('user')).to.be.null;
        expect(win.localStorage.getItem('userRole')).to.be.null;
      });
    });

    it('should prevent access to protected routes after logout', () => {
      // Logout
      cy.get('[data-testid="logout-button"]').click();
      cy.url().should('include', '/child-login');
      
      // Try to access protected route
      cy.visit('/child-dashboard');
      
      // Should redirect back to login
      cy.url().should('include', '/child-login');
    });
  });

  describe('Route Protection', () => {
    it('should redirect unauthenticated users to login', () => {
      // Try to access protected route without authentication
      cy.visit('/child-dashboard');
      
      // Should redirect to child login
      cy.url().should('include', '/child-login');
    });

    it('should redirect authenticated child users to dashboard from root', () => {
      // Login first
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      
      // Visit root path
      cy.visit('/');
      
      // Should redirect to child dashboard
      cy.url().should('include', '/child-dashboard');
    });

    it('should prevent child users from accessing parent routes', () => {
      // Login as child
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      
      // Try to access parent route
      cy.visit('/dashboard');
      
      // Should redirect to child dashboard
      cy.url().should('include', '/child-dashboard');
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should work correctly on ${name} viewport`, () => {
        cy.viewport(width, height);
        
        // Form should be visible and functional
        cy.get('input[name="username"]').should('be.visible').type(testChild.username);
        cy.get('input[name="pin"]').should('be.visible').type(testChild.pin);
        cy.get('button[type="submit"]').should('be.visible').click();
        
        // Should successfully login
        cy.url().should('include', '/child-dashboard');
        cy.contains('Welcome back').should('be.visible');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'username');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'pin');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
      
      // Fill form using keyboard
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      
      // Submit using Enter key
      cy.get('input[name="pin"]').type('{enter}');
      
      // Should successfully login
      cy.url().should('include', '/child-dashboard');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.get('input[name="username"]').should('have.attr', 'aria-label');
      cy.get('input[name="pin"]').should('have.attr', 'aria-label');
      cy.get('button[type="submit"]').should('have.attr', 'aria-label');
      
      // Form should have proper role
      cy.get('form').should('have.attr', 'role', 'form');
    });

    it('should announce errors to screen readers', () => {
      // Submit invalid form
      cy.get('input[name="username"]').type('invalid');
      cy.get('input[name="pin"]').type('0000');
      cy.get('button[type="submit"]').click();
      
      // Error should have proper ARIA attributes
      cy.get('[role="alert"]').should('be.visible');
      cy.get('[aria-live="polite"]').should('contain', 'Invalid username or PIN');
    });
  });
});