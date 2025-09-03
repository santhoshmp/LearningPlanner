describe('Child Authentication Complete End-to-End Validation', () => {
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
    cy.clearSessionStorage();
  });

  describe('Complete Child Login Flow from Form to Dashboard', () => {
    it('should complete full login journey with all UI interactions', () => {
      // Visit child login page
      cy.visit('/child-login');
      cy.contains('Welcome to Study Adventure').should('be.visible');

      // Verify initial form state
      cy.get('input[name="username"]').should('be.visible').and('be.empty');
      cy.get('input[name="pin"]').should('be.visible').and('be.empty');
      cy.get('button[type="submit"]').should('be.visible').and('contain', 'Login');

      // Fill in credentials with realistic user interaction
      cy.get('input[name="username"]').click().type(testChild.username, { delay: 100 });
      cy.get('input[name="pin"]').click().type(testChild.pin, { delay: 100 });

      // Verify form validation feedback
      cy.get('input[name="username"]').should('have.value', testChild.username);
      cy.get('input[name="pin"]').should('have.value', testChild.pin);

      // Submit form and verify loading state
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').should('be.disabled');
      cy.contains('Logging in').should('be.visible');

      // Verify successful redirect to dashboard
      cy.url().should('include', '/child-dashboard', { timeout: 10000 });
      
      // Verify dashboard loads completely
      cy.contains('Welcome back').should('be.visible');
      cy.contains(testChild.name).should('be.visible');
      
      // Verify navigation elements are present
      cy.get('[data-testid="child-nav"]').should('be.visible');
      cy.get('[data-testid="logout-button"]').should('be.visible');
      
      // Verify child-specific content is loaded
      cy.get('[data-testid="study-activities"]').should('be.visible');
      cy.get('[data-testid="progress-summary"]').should('be.visible');

      // Verify session data is properly stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
        expect(win.localStorage.getItem('refreshToken')).to.exist;
        expect(win.localStorage.getItem('userRole')).to.equal('child');
        
        const user = JSON.parse(win.localStorage.getItem('user') || '{}');
        expect(user.role).to.equal('CHILD');
        expect(user.username).to.equal(testChild.username);
        expect(user.id).to.equal(testChild.id);
      });
    });

    it('should handle login errors gracefully with proper user feedback', () => {
      cy.visit('/child-login');

      // Test invalid username
      cy.get('input[name="username"]').type('invaliduser');
      cy.get('input[name="pin"]').type('1234');
      cy.get('button[type="submit"]').click();

      // Verify error display
      cy.get('[role="alert"]').should('be.visible');
      cy.contains('Oops! Your username or PIN doesn\'t match').should('be.visible');
      cy.contains('Try again').should('be.visible');

      // Verify form remains accessible
      cy.get('input[name="username"]').should('not.be.disabled');
      cy.get('input[name="pin"]').should('not.be.disabled');
      cy.get('button[type="submit"]').should('not.be.disabled');

      // Clear and test invalid PIN
      cy.get('input[name="username"]').clear().type(testChild.username);
      cy.get('input[name="pin"]').clear().type('0000');
      cy.get('button[type="submit"]').click();

      // Verify error persists with different message
      cy.get('[role="alert"]').should('be.visible');
      cy.contains('doesn\'t match').should('be.visible');
    });

    it('should handle network errors with retry functionality', () => {
      // Mock network error
      cy.intercept('POST', '/api/auth/child/login-legacy', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();

      cy.wait('@networkError');

      // Verify network error message
      cy.contains('We\'re having trouble connecting').should('be.visible');
      cy.contains('Check your internet and try again').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Test retry functionality
      cy.intercept('POST', '/api/auth/child/login-legacy', {
        statusCode: 200,
        body: {
          success: true,
          user: testChild,
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token'
        }
      }).as('successfulLogin');

      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@successfulLogin');

      // Should redirect to dashboard after retry
      cy.url().should('include', '/child-dashboard');
    });
  });

  describe('Session Persistence Across Page Refreshes and Browser Restarts', () => {
    beforeEach(() => {
      // Login first
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should persist session across multiple page refreshes', () => {
      // First refresh
      cy.reload();
      cy.url().should('include', '/child-dashboard');
      cy.contains('Welcome back').should('be.visible');

      // Verify session data persists
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
        expect(win.localStorage.getItem('userRole')).to.equal('child');
      });

      // Second refresh
      cy.reload();
      cy.url().should('include', '/child-dashboard');
      cy.contains(testChild.name).should('be.visible');

      // Third refresh with navigation
      cy.visit('/child-profile');
      cy.contains('Profile').should('be.visible');
      cy.reload();
      cy.url().should('include', '/child-profile');
    });

    it('should persist session across browser restart simulation', () => {
      // Store session data
      cy.window().then((win) => {
        const sessionData = {
          accessToken: win.localStorage.getItem('accessToken'),
          refreshToken: win.localStorage.getItem('refreshToken'),
          user: win.localStorage.getItem('user'),
          userRole: win.localStorage.getItem('userRole')
        };

        // Clear browser memory (simulate restart)
        cy.clearCookies();
        cy.visit('about:blank');
        
        // Wait a moment to simulate browser restart
        cy.wait(1000);

        // Restore session data (simulating browser restart with localStorage persistence)
        cy.visit('/').then(() => {
          win.localStorage.setItem('accessToken', sessionData.accessToken!);
          win.localStorage.setItem('refreshToken', sessionData.refreshToken!);
          win.localStorage.setItem('user', sessionData.user!);
          win.localStorage.setItem('userRole', sessionData.userRole!);
        });
      });

      // Navigate to child dashboard
      cy.visit('/child-dashboard');
      
      // Should load without requiring login
      cy.contains('Welcome back').should('be.visible');
      cy.contains(testChild.name).should('be.visible');

      // Verify all child functionality works
      cy.get('[data-testid="study-activities"]').should('be.visible');
      cy.get('[data-testid="progress-summary"]').should('be.visible');
    });

    it('should handle corrupted session data gracefully', () => {
      // Corrupt different pieces of session data
      cy.window().then((win) => {
        win.localStorage.setItem('user', 'invalid-json');
      });

      cy.reload();
      cy.url().should('include', '/child-login');
      cy.contains('Please log in again').should('be.visible');

      // Test with corrupted token
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');

      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', 'corrupted-token');
      });

      cy.reload();
      cy.url().should('include', '/child-login');
    });

    it('should maintain session across different child routes', () => {
      const childRoutes = [
        '/child-dashboard',
        '/child-profile',
        '/child-activities',
        '/child-progress'
      ];

      childRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', route);
        
        // Verify user remains authenticated
        cy.window().then((win) => {
          expect(win.localStorage.getItem('userRole')).to.equal('child');
        });

        // Refresh on each route
        cy.reload();
        cy.url().should('include', route);
      });
    });
  });

  describe('Automatic Token Refresh During Active Child Sessions', () => {
    beforeEach(() => {
      // Login first
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should automatically refresh tokens when they expire during API calls', () => {
      // Mock token refresh sequence
      let callCount = 0;
      cy.intercept('GET', '/api/child/profile', (req) => {
        callCount++;
        if (callCount === 1) {
          // First call returns 401 (expired token)
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
      }).as('profileCall');

      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          success: true,
          user: testChild,
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 1200
        }
      }).as('tokenRefresh');

      // Navigate to profile page (triggers API call)
      cy.visit('/child-profile');

      // Wait for token refresh to complete
      cy.wait('@tokenRefresh');
      cy.wait('@profileCall');

      // Verify profile page loads successfully
      cy.contains('Profile').should('be.visible');
      cy.contains(testChild.name).should('be.visible');

      // Verify new tokens were stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.equal('new-access-token');
        expect(win.localStorage.getItem('refreshToken')).to.equal('new-refresh-token');
      });
    });

    it('should handle token refresh failures by redirecting to login', () => {
      // Mock failed token refresh
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 401,
        body: { error: 'Invalid refresh token' }
      }).as('failedRefresh');

      cy.intercept('GET', '/api/child/activities', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('expiredTokenCall');

      // Navigate to activities page
      cy.visit('/child-activities');

      cy.wait('@expiredTokenCall');
      cy.wait('@failedRefresh');

      // Should redirect to child login
      cy.url().should('include', '/child-login');
      cy.contains('Please log in again').should('be.visible');

      // Session data should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('refreshToken')).to.be.null;
      });
    });

    it('should handle multiple concurrent API calls during token refresh', () => {
      let refreshCount = 0;
      
      // Mock multiple API endpoints that return 401 initially
      cy.intercept('GET', '/api/child/profile', (req) => {
        req.reply({ statusCode: 401, body: { error: 'Token expired' } });
      });
      
      cy.intercept('GET', '/api/child/activities', (req) => {
        req.reply({ statusCode: 401, body: { error: 'Token expired' } });
      });
      
      cy.intercept('GET', '/api/child/progress', (req) => {
        req.reply({ statusCode: 401, body: { error: 'Token expired' } });
      });

      cy.intercept('POST', '/api/auth/refresh', (req) => {
        refreshCount++;
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            user: testChild,
            accessToken: `new-token-${refreshCount}`,
            refreshToken: `new-refresh-${refreshCount}`,
            expiresIn: 1200
          }
        });
      }).as('tokenRefresh');

      // Trigger multiple API calls simultaneously
      cy.window().then((win) => {
        // Simulate multiple components making API calls
        fetch('/api/child/profile', {
          headers: { Authorization: `Bearer ${win.localStorage.getItem('accessToken')}` }
        });
        fetch('/api/child/activities', {
          headers: { Authorization: `Bearer ${win.localStorage.getItem('accessToken')}` }
        });
        fetch('/api/child/progress', {
          headers: { Authorization: `Bearer ${win.localStorage.getItem('accessToken')}` }
        });
      });

      // Should only refresh token once despite multiple calls
      cy.wait('@tokenRefresh');
      cy.wait(2000); // Wait to ensure no additional refresh calls

      cy.then(() => {
        expect(refreshCount).to.equal(1);
      });
    });

    it('should maintain user activity during background token refresh', () => {
      // Mock slow token refresh
      cy.intercept('POST', '/api/auth/refresh', (req) => {
        req.reply((res) => {
          res.delay(2000); // 2 second delay
          res.send({
            statusCode: 200,
            body: {
              success: true,
              user: testChild,
              accessToken: 'refreshed-token',
              refreshToken: 'refreshed-refresh-token',
              expiresIn: 1200
            }
          });
        });
      }).as('slowRefresh');

      cy.intercept('GET', '/api/child/activities', (req) => {
        req.reply({ statusCode: 401, body: { error: 'Token expired' } });
      }).as('expiredCall');

      // Navigate to activities page
      cy.visit('/child-activities');

      // User should be able to interact with UI during refresh
      cy.get('[data-testid="child-nav"]').should('be.visible');
      cy.get('[data-testid="logout-button"]').should('be.visible');

      // Wait for refresh to complete
      cy.wait('@slowRefresh');

      // Page should load successfully after refresh
      cy.contains('Activities').should('be.visible');
    });
  });

  describe('Proper Logout and Session Cleanup', () => {
    beforeEach(() => {
      // Login first
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should perform complete logout with session cleanup', () => {
      // Verify user is logged in
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
        expect(win.localStorage.getItem('refreshToken')).to.exist;
        expect(win.localStorage.getItem('user')).to.exist;
        expect(win.localStorage.getItem('userRole')).to.equal('child');
      });

      // Mock logout API call
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: { success: true, message: 'Logged out successfully' }
      }).as('logoutCall');

      // Click logout button
      cy.get('[data-testid="logout-button"]').click();

      // Wait for logout API call
      cy.wait('@logoutCall');

      // Should redirect to child login
      cy.url().should('include', '/child-login');

      // Should show logout success message
      cy.contains('logged out successfully').should('be.visible');

      // All session data should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('refreshToken')).to.be.null;
        expect(win.localStorage.getItem('user')).to.be.null;
        expect(win.localStorage.getItem('userRole')).to.be.null;
        expect(win.localStorage.getItem('sessionId')).to.be.null;
      });

      // Session storage should also be cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.length).to.equal(0);
      });
    });

    it('should prevent access to protected routes after logout', () => {
      // Logout
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: { success: true, message: 'Logged out successfully' }
      });

      cy.get('[data-testid="logout-button"]').click();
      cy.url().should('include', '/child-login');

      // Try to access various protected child routes
      const protectedRoutes = [
        '/child-dashboard',
        '/child-profile',
        '/child-activities',
        '/child-progress'
      ];

      protectedRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', '/child-login');
        cy.contains('Please log in').should('be.visible');
      });
    });

    it('should handle logout errors gracefully', () => {
      // Mock logout API error
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('logoutError');

      cy.get('[data-testid="logout-button"]').click();
      cy.wait('@logoutError');

      // Should still clear local session data even if API fails
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
        expect(win.localStorage.getItem('refreshToken')).to.be.null;
      });

      // Should redirect to login
      cy.url().should('include', '/child-login');
    });

    it('should handle automatic logout on session expiry', () => {
      // Mock session validation that returns expired
      cy.intercept('GET', '/api/auth/validate', {
        statusCode: 401,
        body: { valid: false, error: 'Session expired' }
      }).as('sessionExpired');

      // Mock any API call that would trigger session validation
      cy.intercept('GET', '/api/child/profile', {
        statusCode: 401,
        body: { error: 'Session expired' }
      }).as('apiCall');

      // Navigate to profile (triggers session validation)
      cy.visit('/child-profile');

      cy.wait('@apiCall');

      // Should automatically logout and redirect
      cy.url().should('include', '/child-login');
      cy.contains('Your learning time is up').should('be.visible');

      // Session should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
      });
    });
  });

  describe('Parent-Child Authentication Isolation', () => {
    it('should maintain separate authentication contexts for parent and child', () => {
      // First, login as child
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');

      // Store child session data
      cy.window().then((win) => {
        const childSession = {
          accessToken: win.localStorage.getItem('accessToken'),
          refreshToken: win.localStorage.getItem('refreshToken'),
          user: win.localStorage.getItem('user'),
          userRole: win.localStorage.getItem('userRole')
        };

        expect(childSession.userRole).to.equal('child');

        // Clear session and login as parent
        cy.clearLocalStorage();
        cy.visit('/login');

        cy.get('input[name="email"]').type(testParent.email);
        cy.get('input[name="password"]').type(testParent.password);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');

        // Verify parent session is different
        cy.window().then((parentWin) => {
          expect(parentWin.localStorage.getItem('userRole')).to.equal('parent');
          expect(parentWin.localStorage.getItem('accessToken')).to.not.equal(childSession.accessToken);
          
          const parentUser = JSON.parse(parentWin.localStorage.getItem('user') || '{}');
          expect(parentUser.role).to.equal('PARENT');
          expect(parentUser.email).to.equal(testParent.email);
        });
      });
    });

    it('should prevent child users from accessing parent routes', () => {
      // Login as child
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');

      // Try to access parent-only routes
      const parentRoutes = [
        '/dashboard',
        '/parent-settings',
        '/child-management',
        '/analytics'
      ];

      parentRoutes.forEach((route) => {
        cy.visit(route);
        // Should redirect to child dashboard
        cy.url().should('include', '/child-dashboard');
        cy.contains('Welcome back').should('be.visible');
      });
    });

    it('should prevent parent users from accessing child routes', () => {
      // Login as parent
      cy.visit('/login');
      cy.get('input[name="email"]').type(testParent.email);
      cy.get('input[name="password"]').type(testParent.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');

      // Try to access child-only routes
      const childRoutes = [
        '/child-dashboard',
        '/child-profile',
        '/child-activities',
        '/child-progress'
      ];

      childRoutes.forEach((route) => {
        cy.visit(route);
        // Should redirect to parent dashboard
        cy.url().should('include', '/dashboard');
        cy.contains('Dashboard').should('be.visible');
      });
    });

    it('should handle authentication failures with correct redirects', () => {
      // Test child authentication failure redirects to child login
      cy.visit('/child-dashboard');
      cy.url().should('include', '/child-login');

      // Test parent authentication failure redirects to parent login
      cy.visit('/dashboard');
      cy.url().should('include', '/login');

      // Test path-based redirect logic
      cy.visit('/child-profile');
      cy.url().should('include', '/child-login');

      cy.visit('/parent-settings');
      cy.url().should('include', '/login');
    });

    it('should maintain role-based UI differences', () => {
      // Login as child and verify child UI
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');

      // Verify child-specific UI elements
      cy.get('[data-testid="child-nav"]').should('be.visible');
      cy.get('[data-testid="fun-animations"]').should('be.visible');
      cy.get('[data-testid="child-theme"]').should('exist');

      // Logout and login as parent
      cy.get('[data-testid="logout-button"]').click();
      cy.visit('/login');
      cy.get('input[name="email"]').type(testParent.email);
      cy.get('input[name="password"]').type(testParent.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');

      // Verify parent-specific UI elements
      cy.get('[data-testid="parent-nav"]').should('be.visible');
      cy.get('[data-testid="analytics-panel"]').should('be.visible');
      cy.get('[data-testid="parent-theme"]').should('exist');

      // Verify child elements are not present
      cy.get('[data-testid="fun-animations"]').should('not.exist');
      cy.get('[data-testid="child-theme"]').should('not.exist');
    });
  });

  describe('Cross-Browser and Device Compatibility', () => {
    const testScenarios = [
      { name: 'Desktop Chrome', userAgent: 'Chrome/91.0.4472.124' },
      { name: 'Mobile Safari', userAgent: 'Safari/14.1.1' },
      { name: 'Tablet Firefox', userAgent: 'Firefox/89.0' }
    ];

    testScenarios.forEach(({ name, userAgent }) => {
      it(`should work correctly on ${name}`, () => {
        cy.visit('/child-login', {
          onBeforeLoad: (win) => {
            Object.defineProperty(win.navigator, 'userAgent', {
              value: userAgent
            });
          }
        });

        // Complete login flow
        cy.get('input[name="username"]').type(testChild.username);
        cy.get('input[name="pin"]').type(testChild.pin);
        cy.get('button[type="submit"]').click();

        // Verify success
        cy.url().should('include', '/child-dashboard');
        cy.contains('Welcome back').should('be.visible');

        // Test session persistence
        cy.reload();
        cy.url().should('include', '/child-dashboard');

        // Test logout
        cy.get('[data-testid="logout-button"]').click();
        cy.url().should('include', '/child-login');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid login/logout cycles', () => {
      const cycles = 3;
      
      for (let i = 0; i < cycles; i++) {
        // Login
        cy.visit('/child-login');
        cy.get('input[name="username"]').type(testChild.username);
        cy.get('input[name="pin"]').type(testChild.pin);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/child-dashboard');

        // Logout
        cy.get('[data-testid="logout-button"]').click();
        cy.url().should('include', '/child-login');
      }

      // Final login should still work
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');
    });

    it('should handle multiple simultaneous sessions gracefully', () => {
      // This test simulates multiple browser tabs/windows
      cy.visit('/child-login');
      cy.get('input[name="username"]').type(testChild.username);
      cy.get('input[name="pin"]').type(testChild.pin);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/child-dashboard');

      // Store session data
      cy.window().then((win) => {
        const sessionData = {
          accessToken: win.localStorage.getItem('accessToken'),
          refreshToken: win.localStorage.getItem('refreshToken'),
          user: win.localStorage.getItem('user'),
          userRole: win.localStorage.getItem('userRole')
        };

        // Simulate second tab login
        cy.visit('/child-login');
        cy.get('input[name="username"]').type(testChild.username);
        cy.get('input[name="pin"]').type(testChild.pin);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/child-dashboard');

        // Both sessions should work
        cy.window().then((secondWin) => {
          expect(secondWin.localStorage.getItem('accessToken')).to.exist;
          expect(secondWin.localStorage.getItem('userRole')).to.equal('child');
        });
      });
    });
  });
});