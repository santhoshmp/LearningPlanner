# ParentDashboardPage Test Suite

This directory contains comprehensive tests for the `ParentDashboardPage` component, covering functionality, accessibility, and visual regression testing.

## Test Files Overview

### 1. `ParentDashboardPage.test.tsx`
**Main functional test suite**
- Component rendering and structure
- Tab navigation functionality
- User interaction testing (buttons, tooltips)
- Keyboard navigation
- ARIA attributes and accessibility compliance
- Theme integration
- Responsive behavior
- State management

**Key Test Areas:**
- Header structure with logo and navigation
- Tab switching between Dashboard, Study Plans, and Reports
- User action buttons (Make a copy, Share, Profile, Logout)
- Tooltip functionality
- Accessibility attributes (ARIA labels, roles, etc.)
- Material-UI component integration

### 2. `ParentDashboardPage.accessibility.test.tsx`
**Dedicated accessibility test suite**
- WCAG 2.1 AA compliance testing using jest-axe
- Keyboard navigation patterns
- Screen reader compatibility
- Color contrast validation
- Focus management
- Semantic HTML structure
- ARIA implementation

**Key Test Areas:**
- Automated accessibility violation detection
- Proper heading hierarchy
- Tab navigation accessibility
- Interactive element labeling
- Color contrast compliance
- Keyboard accessibility
- Screen reader support

### 3. `ParentDashboardPage.visual.test.tsx`
**Visual regression test suite**
- Snapshot testing for consistent UI rendering
- Theme variation testing
- Responsive layout validation
- Cross-browser consistency
- High contrast mode support
- Reduced motion preferences

**Key Test Areas:**
- Default theme rendering
- Custom theme variations
- Mobile/tablet/desktop layouts
- Header and navigation consistency
- User action button appearance
- Loading states
- Accessibility preference modes

## Running the Tests

### Run All Tests
```bash
npm test ParentDashboardPage
```

### Run Specific Test Suites
```bash
# Functional tests only
npm test ParentDashboardPage.test.tsx

# Accessibility tests only
npm test ParentDashboardPage.accessibility.test.tsx

# Visual regression tests only
npm test ParentDashboardPage.visual.test.tsx
```

### Run Tests in Watch Mode
```bash
npm test ParentDashboardPage -- --watch
```

### Generate Coverage Report
```bash
npm test ParentDashboardPage -- --coverage
```

## Test Dependencies

### Required Packages
- `@testing-library/react` - Component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `jest-axe` - Accessibility testing
- `@tanstack/react-query` - Query client mocking
- `@mui/material` - Material-UI components
- `react-router-dom` - Routing context

### Mock Components
All child components are mocked to isolate testing:
- `ParentProgressDashboard`
- `ParentalMonitoringDashboard`
- `EnhancedAnalyticsDashboard`

## Test Coverage Goals

The test suite aims for:
- **Functional Coverage**: 100% of user interactions and component states
- **Accessibility Coverage**: WCAG 2.1 AA compliance
- **Visual Coverage**: All major UI states and responsive breakpoints
- **Edge Cases**: Error states, loading states, empty states

## Integration with CI/CD

These tests are integrated into the CI/CD pipeline:
- Run on every pull request
- Block deployment if accessibility violations are found
- Generate visual regression reports
- Provide coverage metrics

## Maintenance Notes

### When to Update Tests
- When adding new UI elements or interactions
- When changing accessibility patterns
- When modifying responsive behavior
- When updating Material-UI theme

### Test Data Management
- Use consistent mock data across test files
- Update snapshots when intentional UI changes are made
- Maintain accessibility test coverage as features evolve

## Related Documentation
- [Accessibility Testing Procedures](../../../docs/accessibility-testing-procedures.md)
- [Visual Regression Testing](../../../docs/visual-regression-testing.md)
- [Component Documentation](../../../docs/ComponentDocumentation.md)