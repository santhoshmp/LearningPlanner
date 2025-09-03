# Accessibility Testing Procedures

This document outlines the procedures for testing the accessibility of the AI Study Planner application.

## Automated Testing

### 1. Jest-Axe Integration Tests

We use jest-axe to automatically test components for accessibility violations during unit testing.

#### Running Accessibility Tests

```bash
# Run all tests including accessibility tests
npm test

# Run only accessibility tests
npm test -- -t "accessibility"
```

### 2. Storybook Accessibility Add-on

The Storybook Accessibility add-on (a11y) helps identify and fix accessibility issues during component development.

#### Using the a11y Add-on

1. Start Storybook:
   ```bash
   npm run storybook
   ```

2. In the Storybook UI, select the "Accessibility" tab in the add-on panel to see accessibility checks for each component.

## Manual Testing Procedures

### 1. Keyboard Navigation Testing

#### Testing Procedure:

1. Start from the landing page and navigate through the entire application using only the keyboard.
2. Verify that:
   - All interactive elements can be reached using Tab key
   - Focus indicators are clearly visible
   - Enter/Space keys activate focused elements
   - Escape key closes dialogs and modals
   - Arrow keys work for navigation where appropriate

#### Key Areas to Test:

- Navigation menus
- Form inputs and submission
- Modal dialogs
- Interactive components (tabs, accordions, etc.)
- Custom components like the PIN input in child login

### 2. Screen Reader Testing

#### Testing Procedure:

1. Test with at least one screen reader (VoiceOver on macOS, NVDA on Windows, or TalkBack on Android).
2. Navigate through key user flows and verify that:
   - All content is announced correctly
   - Form fields have proper labels
   - Images have appropriate alt text
   - Dynamic content changes are announced
   - Error messages are properly announced

#### Key Areas to Test:

- Authentication flows (parent and child)
- Dashboard navigation
- Study plan creation and review
- Activity completion and feedback
- Error states and notifications

### 3. Color Contrast and Visual Testing

#### Testing Procedure:

1. Use browser developer tools to simulate different types of color vision deficiencies.
2. Verify that:
   - Text has sufficient contrast against backgrounds
   - Color is not the only means of conveying information
   - UI is usable in high contrast mode
   - Content is readable at different zoom levels (up to 200%)

#### Key Areas to Test:

- Text content across both parent and child interfaces
- Form validation indicators
- Charts and data visualizations
- Progress indicators
- Interactive elements (buttons, links, etc.)

### 4. Testing with Assistive Technologies

#### Testing Procedure:

1. Test with different assistive technologies:
   - Screen magnifiers
   - Voice control software
   - Alternative input devices

2. Verify that all key user flows can be completed using these technologies.

## Reporting and Documentation

### Accessibility Test Report Template

For each testing session, document:

1. **Test Date**: When the test was conducted
2. **Tester**: Who conducted the test
3. **Environment**: Browser, screen reader, or other tools used
4. **Areas Tested**: Which parts of the application were tested
5. **Issues Found**: Description of accessibility issues discovered
   - Severity (Critical, Major, Minor)
   - WCAG Success Criterion violated
   - Steps to reproduce
   - Screenshots or recordings if applicable
6. **Recommendations**: Suggested fixes for each issue

### Issue Prioritization

Prioritize accessibility issues based on:

1. **Impact**: How severely it affects users with disabilities
2. **Frequency**: How often users will encounter the issue
3. **Scope**: How many pages or components are affected
4. **Complexity**: How difficult it is to fix

## Accessibility Compliance Checklist

Use this checklist to verify compliance with WCAG 2.1 AA standards:

### Perceivable

- [ ] Text alternatives for non-text content
- [ ] Captions and alternatives for multimedia
- [ ] Content can be presented in different ways
- [ ] Content is easy to see and hear

### Operable

- [ ] All functionality is available from a keyboard
- [ ] Users have enough time to read and use content
- [ ] Content does not cause seizures or physical reactions
- [ ] Users can easily navigate and find content

### Understandable

- [ ] Text is readable and understandable
- [ ] Content appears and operates in predictable ways
- [ ] Users are helped to avoid and correct mistakes

### Robust

- [ ] Content is compatible with current and future user tools

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [Screen Reader Keyboard Shortcuts](https://dequeuniversity.com/screenreaders/)