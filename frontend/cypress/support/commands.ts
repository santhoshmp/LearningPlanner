// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Declare global Cypress namespace to add custom commands
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login as a parent user
     * @example cy.loginAsParent('test@example.com', 'password123')
     */
    loginAsParent(email: string, password: string): Chainable<Element>;
    
    /**
     * Custom command to login as a child user
     * @example cy.loginAsChild('username', '123456')
     */
    loginAsChild(username: string, pin: string): Chainable<Element>;
    
    /**
     * Custom command to test responsive behavior at different viewport sizes
     * @example cy.testResponsive(() => {
     *   cy.get('.navbar').should('be.visible');
     * })
     */
    testResponsive(testFn: () => void): Chainable<Element>;
    
    /**
     * Custom command to test touch interactions
     * @example cy.testTouchInteraction('.button')
     */
    testTouchInteraction(selector: string): Chainable<Element>;
    
    /**
     * Custom command to verify element visibility at different breakpoints
     * @example cy.verifyBreakpointVisibility('.mobile-menu', { mobile: true, tablet: true, desktop: false })
     */
    verifyBreakpointVisibility(
      selector: string, 
      visibility: { mobile?: boolean; tablet?: boolean; desktop?: boolean }
    ): Chainable<Element>;
  }
}

// Parent login command
Cypress.Commands.add('loginAsParent', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Child login command
Cypress.Commands.add('loginAsChild', (username, pin) => {
  cy.visit('/child-login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="pin"]').type(pin);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/child-dashboard');
});

// Define standard viewport sizes
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

// Responsive testing command
Cypress.Commands.add('testResponsive', (testFn) => {
  // Test on mobile viewport
  cy.viewport(viewports.mobile.width, viewports.mobile.height);
  cy.log('Testing on mobile viewport');
  testFn();
  
  // Test on tablet viewport
  cy.viewport(viewports.tablet.width, viewports.tablet.height);
  cy.log('Testing on tablet viewport');
  testFn();
  
  // Test on desktop viewport
  cy.viewport(viewports.desktop.width, viewports.desktop.height);
  cy.log('Testing on desktop viewport');
  testFn();
  
  // Test on large desktop viewport
  cy.viewport(viewports.largeDesktop.width, viewports.largeDesktop.height);
  cy.log('Testing on large desktop viewport');
  testFn();
});

// Touch interaction testing command
Cypress.Commands.add('testTouchInteraction', (selector) => {
  // Switch to mobile viewport
  cy.viewport(viewports.mobile.width, viewports.mobile.height);
  
  // Test tap interaction
  cy.get(selector)
    .should('be.visible')
    .touch('tap')
    .should('have.class', 'active');
  
  // Test swipe interaction if applicable
  cy.get('body')
    .then($body => {
      if ($body.find('.swipeable').length > 0) {
        cy.get('.swipeable')
          .should('be.visible')
          .touch('swipeleft')
          .wait(500);
      }
    });
});

// Breakpoint visibility testing command
Cypress.Commands.add('verifyBreakpointVisibility', (selector, visibility) => {
  // Check mobile visibility
  if (visibility.mobile !== undefined) {
    cy.viewport(viewports.mobile.width, viewports.mobile.height);
    cy.get(selector).should(visibility.mobile ? 'be.visible' : 'not.be.visible');
  }
  
  // Check tablet visibility
  if (visibility.tablet !== undefined) {
    cy.viewport(viewports.tablet.width, viewports.tablet.height);
    cy.get(selector).should(visibility.tablet ? 'be.visible' : 'not.be.visible');
  }
  
  // Check desktop visibility
  if (visibility.desktop !== undefined) {
    cy.viewport(viewports.desktop.width, viewports.desktop.height);
    cy.get(selector).should(visibility.desktop ? 'be.visible' : 'not.be.visible');
  }
});