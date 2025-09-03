# AI Study Planner Design System

## Introduction

The AI Study Planner Design System provides a comprehensive framework for creating consistent, accessible, and visually appealing user interfaces. This document serves as the definitive guide to the design system, consolidating all design principles, component guidelines, and best practices.

## Core Principles

Our design system is built on four core principles:

1. **Consistency**: Create a cohesive experience across all interfaces through consistent patterns, components, and styling.
2. **Accessibility**: Ensure the application is usable by everyone, regardless of abilities or disabilities.
3. **Responsiveness**: Design interfaces that work well on all devices and screen sizes.
4. **Performance**: Optimize the user experience through efficient code and assets.

## Design Language

### Visual Identity

The AI Study Planner application features two distinct visual identities:

1. **Parent Interface**: Professional, focused, and efficient with a blue and green color scheme.
2. **Child Interface**: Engaging, playful, and age-appropriate with a purple and amber color scheme.

Both interfaces share common design elements to maintain brand consistency while addressing the specific needs of each user group.

### Color System

#### Parent Interface Colors

| Color Purpose | Light Mode | Dark Mode | Usage |
|---------------|------------|-----------|-------|
| Primary       | #1d4ed8    | #1d4ed8   | Main actions, buttons, links |
| Secondary     | #047857    | #047857   | Alternative actions, success states |
| Background    | #f9fafb    | #111827   | Page background |
| Paper         | #ffffff    | #1f2937   | Card and surface backgrounds |
| Text Primary  | #111827    | #f9fafb   | Main text content |
| Text Secondary| #374151    | #d1d5db   | Secondary text, labels |

#### Child Interface Colors

| Color Purpose | Light Mode | Dark Mode | Usage |
|---------------|------------|-----------|-------|
| Primary       | #7c3aed    | #7c3aed   | Main actions, buttons, links |
| Secondary     | #b45309    | #b45309   | Alternative actions, highlights |
| Background    | #f5f3ff    | #2e1065   | Page background |
| Paper         | #ffffff    | #4c1d95   | Card and surface backgrounds |
| Text Primary  | #1f2937    | #f9fafb   | Main text content |
| Text Secondary| #374151    | #e5e7eb   | Secondary text, labels |

#### Semantic Colors

| Color Purpose | Hex Code | Usage |
|---------------|----------|-------|
| Error         | #b91c1c  | Error messages, destructive actions |
| Warning       | #b45309  | Warning messages, caution states |
| Info          | #1d4ed8  | Informational messages |
| Success       | #047857  | Success messages, completion states |

### Typography

#### Parent Interface Typography

- **Font Family**: "Inter", "Roboto", "Helvetica", "Arial", sans-serif
- **Base Font Size**: 16px (1rem)

| Typography Variant | Font Size | Font Weight | Line Height | Usage |
|-------------------|-----------|-------------|-------------|-------|
| h1                | 2.5rem    | 700         | 1.2         | Main page headings |
| h2                | 2rem      | 600         | 1.3         | Section headings |
| h3                | 1.75rem   | 600         | 1.3         | Subsection headings |
| h4                | 1.5rem    | 600         | 1.35        | Card headings |
| h5                | 1.25rem   | 600         | 1.4         | Minor headings |
| h6                | 1rem      | 600         | 1.4         | Small headings |
| body1            | 1rem      | 400         | 1.6         | Main body text |
| body2            | 0.875rem  | 400         | 1.6         | Secondary body text |

#### Child Interface Typography

- **Font Family**: "Quicksand", "Roboto", "Helvetica", "Arial", sans-serif
- **Base Font Size**: 16px (1rem)

| Typography Variant | Font Size | Font Weight | Line Height | Usage |
|-------------------|-----------|-------------|-------------|-------|
| h1                | 2.5rem    | 700         | 1.2         | Main page headings |
| h2                | 2rem      | 700         | 1.3         | Section headings |
| h3                | 1.75rem   | 600         | 1.3         | Subsection headings |
| h4                | 1.5rem    | 600         | 1.35        | Card headings |
| h5                | 1.25rem   | 600         | 1.4         | Minor headings |
| h6                | 1.125rem  | 600         | 1.4         | Small headings |
| body1            | 1.1rem    | 400         | 1.6         | Main body text |
| body2            | 0.95rem   | 400         | 1.6         | Secondary body text |

### Spacing System

The spacing system is based on an 8px grid, with the following scale:

| Multiplier | Value | Usage |
|------------|-------|-------|
| 0.5        | 4px   | Very tight spacing |
| 1          | 8px   | Default spacing unit |
| 2          | 16px  | Standard spacing between elements |
| 3          | 24px  | Medium spacing |
| 4          | 32px  | Large spacing |
| 5          | 40px  | Extra large spacing |
| 6+         | 48px+ | Major layout divisions |

### Elevation and Shadows

The elevation system uses shadows to create a sense of depth and hierarchy:

| Elevation | Shadow | Usage |
|-----------|--------|-------|
| 0         | none   | Flat elements |
| 1         | 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24) | Subtle elevation |
| 2         | 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12) | Cards, buttons |
| 3         | 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10) | Dialogs, popovers |
| 4         | 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) | Modals |
| 5         | 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22) | Maximum elevation |

## Component Library

### Layout Components

#### AppLayout

The base layout component that provides a consistent structure for all pages.

```tsx
<AppLayout>
  <YourContent />
</AppLayout>
```

#### ParentDashboardLayout

A specialized layout for parent dashboard pages with breadcrumb navigation.

```tsx
<ParentDashboardLayout
  title="Dashboard"
  breadcrumbs={[{ label: 'Dashboard' }]}
>
  <DashboardContent />
</ParentDashboardLayout>
```

#### ChildDashboardLayout

A specialized layout for child interface pages with engaging visual elements.

```tsx
<ChildDashboardLayout
  title="My Learning"
  showHelp={true}
  onHelpClick={handleHelpClick}
>
  <LearningContent />
</ChildDashboardLayout>
```

### Navigation Components

#### AppHeader

The main navigation header with responsive behavior.

```tsx
<AppHeader
  title="AI Study Planner"
  showUserMenu={true}
/>
```

#### AppFooter

The consistent footer component with links and accessibility controls.

```tsx
<AppFooter
  showTextSizeControls={true}
/>
```

#### Breadcrumbs

Navigation breadcrumbs for parent interface.

```tsx
<Breadcrumbs
  items={[
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Performance Report' }
  ]}
/>
```

### Form Components

#### StandardForm

A consistent form component with validation and accessibility features.

```tsx
<StandardForm
  onSubmit={handleSubmit}
  submitLabel="Save Changes"
  cancelLabel="Cancel"
  onCancel={handleCancel}
>
  <TextField
    label="Name"
    name="name"
    required
  />
  {/* Other form fields */}
</StandardForm>
```

#### FormField

A wrapper for form inputs with consistent styling and error handling.

```tsx
<FormField
  label="Email Address"
  error={errors.email}
  required
>
  <TextField
    name="email"
    type="email"
    fullWidth
  />
</FormField>
```

### Data Display Components

#### DataCard

A card component for displaying data with consistent styling.

```tsx
<DataCard
  title="Performance Summary"
  subtitle="Last 30 days"
  action={<Button>View Details</Button>}
>
  <PerformanceChart data={performanceData} />
</DataCard>
```

#### DataTable

A responsive table component for displaying tabular data.

```tsx
<DataTable
  columns={[
    { field: 'name', headerName: 'Name' },
    { field: 'score', headerName: 'Score' },
    { field: 'date', headerName: 'Date' }
  ]}
  data={userData}
  pagination
/>
```

### Feedback Components

#### AlertMessage

A component for displaying alert messages with different severity levels.

```tsx
<AlertMessage
  severity="success"
  title="Success"
  message="Your changes have been saved."
  onClose={handleClose}
/>
```

#### ProgressIndicator

A component for displaying progress with different variants.

```tsx
<ProgressIndicator
  variant="linear"
  value={75}
  label="75% Complete"
/>
```

### Accessibility Components

#### TextSizeAdjuster

A component for adjusting text size for better readability.

```tsx
<TextSizeAdjuster />
```

#### ScreenReaderAnnouncement

A component for announcing messages to screen readers.

```tsx
<ScreenReaderAnnouncement
  message="Your changes have been saved."
  assertive={true}
/>
```

## Usage Guidelines

### Theme Context

The application provides a theme context that can be used to access the current theme and related functions:

```tsx
import { useTheme } from '../../theme/ThemeContext';

const MyComponent = () => {
  const { theme, themeMode, userRole, toggleThemeMode } = useTheme();
  
  return (
    <div style={{ color: theme.palette.primary.main }}>
      <button onClick={toggleThemeMode}>
        Toggle Theme
      </button>
    </div>
  );
};
```

### Responsive Design

Follow these guidelines for responsive design:

1. **Mobile-First Approach**: Start with mobile layouts and enhance for larger screens.
2. **Breakpoints**: Use the theme's breakpoints for consistent responsive behavior.
3. **Flexible Layouts**: Use percentage-based widths and flexbox/grid for layouts.
4. **Touch Targets**: Ensure interactive elements are at least 44x44px on touch devices.

```tsx
<Box
  sx={{
    width: '100%',
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    gap: { xs: 2, md: 3 },
  }}
>
  {/* Content */}
</Box>
```

### Accessibility Best Practices

1. **Semantic HTML**: Use appropriate HTML elements for their intended purpose.
2. **ARIA Attributes**: Use ARIA attributes only when necessary.
3. **Keyboard Navigation**: Ensure all interactive elements can be accessed and used with a keyboard.
4. **Focus Management**: Provide visible focus indicators and manage focus for dynamic content.
5. **Screen Reader Support**: Ensure content is accessible to screen readers.

```tsx
<button
  aria-label="Close dialog"
  onClick={handleClose}
  className="focus-visible-outline"
>
  <CloseIcon />
</button>
```

### Performance Optimization

1. **Code Splitting**: Use dynamic imports for route-based code splitting.
2. **Tree Shaking**: Import components directly from their source for better tree shaking.
3. **Lazy Loading**: Use lazy loading for non-critical components.
4. **Image Optimization**: Optimize images and use appropriate formats.

```tsx
// Good: Specific imports for better tree shaking
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// Bad: Importing from the root package
import { Button, TextField } from '@mui/material';
```

## Implementation Guidelines

### Component Development Workflow

1. **Design**: Start with a clear design that follows the design system.
2. **Implementation**: Implement the component using Material UI and the theme.
3. **Accessibility**: Ensure the component is accessible.
4. **Testing**: Test the component with different screen sizes and assistive technologies.
5. **Documentation**: Document the component's props and usage examples.
6. **Review**: Have the component reviewed by other developers.

### Code Standards

1. **TypeScript**: Use TypeScript for type safety.
2. **Props Interface**: Define clear prop interfaces for components.
3. **Default Props**: Provide sensible default props.
4. **Component Structure**: Follow a consistent component structure.

```tsx
interface ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  children,
  onClick,
  disabled = false,
}) => {
  // Component implementation
};
```

### Testing Requirements

1. **Unit Tests**: Write unit tests for component logic.
2. **Accessibility Tests**: Test components for accessibility violations.
3. **Visual Regression Tests**: Use Storybook and Chromatic for visual testing.
4. **Responsive Tests**: Test components on different screen sizes.

## Tools and Resources

### Development Tools

- **Material UI**: Component library based on Material Design
- **Emotion**: CSS-in-JS library for styling
- **Storybook**: Tool for developing and documenting components
- **Jest**: Testing framework for unit tests
- **Testing Library**: Library for testing React components
- **Cypress**: End-to-end testing framework
- **Chromatic**: Visual regression testing tool

### Accessibility Tools

- **axe-core**: Accessibility testing library
- **jest-axe**: Jest integration for axe-core
- **Storybook a11y addon**: Accessibility testing in Storybook
- **WAVE**: Web accessibility evaluation tool
- **Screen readers**: VoiceOver, NVDA, JAWS

### Design Resources

- **Material Design Guidelines**: https://material.io/design
- **WCAG 2.1 Guidelines**: https://www.w3.org/TR/WCAG21/
- **A11Y Project Checklist**: https://www.a11yproject.com/checklist/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

## Conclusion

This design system documentation provides a comprehensive guide to creating consistent, accessible, and visually appealing interfaces for the AI Study Planner application. By following these guidelines, developers can ensure that the application maintains a high level of quality and user experience.

The design system is a living document that will evolve as the application grows and changes. Regular reviews and updates will ensure that it remains relevant and useful for the development team.