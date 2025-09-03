# Component Documentation

## Overview

This document provides detailed documentation for all standardized components in the AI Study Planner application. Each component is designed to work seamlessly with both parent and child themes while maintaining accessibility and consistency.

## Common Components

### StandardButton

A versatile button component that adapts to the current theme and provides consistent styling and behavior.

#### Props

```typescript
interface StandardButtonProps {
  loading?: boolean;           // Show loading spinner
  loadingText?: string;        // Custom loading text
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;         // Make button full width
  icon?: React.ReactNode;      // Icon to display
  iconPosition?: 'start' | 'end'; // Icon position
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  animation?: boolean;         // Enable hover animations
  disabled?: boolean;          // Disable button
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;   // Button content
}
```

#### Usage Examples

```tsx
// Basic button
<StandardButton onClick={handleClick}>
  Click Me
</StandardButton>

// Loading state
<StandardButton loading loadingText="Saving...">
  Save Changes
</StandardButton>

// With icon
<StandardButton 
  icon={<SaveIcon />} 
  iconPosition="start"
  variant="contained"
  color="primary"
>
  Save Document
</StandardButton>

// Different variants
<StandardButton variant="outlined" color="secondary">
  Cancel
</StandardButton>

<StandardButton variant="text" color="error">
  Delete
</StandardButton>
```

#### Theme Adaptations

- **Parent Theme**: Professional appearance with subtle hover effects
- **Child Theme**: Rounded corners, playful animations, and larger touch targets

### LoadingState

A flexible loading component with multiple animation types and display variants.

#### Props

```typescript
interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'small' | 'medium' | 'large';
  message?: string;            // Loading message
  fullHeight?: boolean;        // Use full screen height
  variant?: 'card' | 'inline' | 'overlay';
  children?: React.ReactNode;  // Content to overlay
}
```

#### Usage Examples

```tsx
// Basic spinner
<LoadingState message="Loading content..." />

// Skeleton loader for cards
<LoadingState type="skeleton" variant="card" />

// Overlay loading
<LoadingState type="dots" variant="overlay" message="Processing...">
  <YourContent />
</LoadingState>

// Different types
<LoadingState type="pulse" message="Please wait..." />
<LoadingState type="dots" size="large" />
```

#### Animation Types

- **Spinner**: Circular progress indicator
- **Skeleton**: Placeholder blocks that mimic content structure
- **Pulse**: Subtle pulsing animation
- **Dots**: Bouncing dots animation

### ErrorState

A comprehensive error display component with multiple variants and customizable actions.

#### Props

```typescript
interface ErrorStateProps {
  type?: 'error' | 'warning' | 'info';
  title?: string;              // Error title
  message: string;             // Error message (required)
  details?: string;            // Additional details
  onRetry?: () => void;        // Retry callback
  onDismiss?: () => void;      // Dismiss callback
  retryLabel?: string;         // Custom retry button text
  dismissible?: boolean;       // Show dismiss button
  variant?: 'card' | 'inline' | 'banner';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;      // Custom icon
  actions?: React.ReactNode;   // Custom action buttons
}
```

#### Usage Examples

```tsx
// Basic error
<ErrorState
  type="error"
  title="Connection Failed"
  message="Unable to connect to the server."
  onRetry={handleRetry}
/>

// Warning banner
<ErrorState
  type="warning"
  variant="banner"
  message="Your session will expire soon."
  dismissible
  onDismiss={handleDismiss}
/>

// With custom actions
<ErrorState
  type="error"
  title="Upload Failed"
  message="The file could not be uploaded."
  onRetry={handleRetry}
  actions={
    <Button onClick={handleContactSupport}>
      Contact Support
    </Button>
  }
/>
```

### GradeSelector

A specialized dropdown for selecting grade levels with age range support.

#### Props

```typescript
interface GradeSelectorProps {
  value: string;               // Selected grade
  onChange: (grade: string) => void;
  label?: string;              // Field label
  required?: boolean;          // Required field
  disabled?: boolean;          // Disable selector
  error?: boolean;             // Error state
  helperText?: string;         // Helper text
  fullWidth?: boolean;         // Full width
  size?: 'small' | 'medium';   // Size variant
  showAgeRange?: boolean;      // Show age ranges
  filterByAge?: number;        // Filter by specific age
  variant?: 'outlined' | 'filled' | 'standard';
}
```

#### Usage Examples

```tsx
// Basic grade selector
<GradeSelector
  value={selectedGrade}
  onChange={setSelectedGrade}
  label="Select Grade Level"
/>

// With age ranges
<GradeSelector
  value={selectedGrade}
  onChange={setSelectedGrade}
  showAgeRange
  required
/>

// Filtered by age
<GradeSelector
  value={selectedGrade}
  onChange={setSelectedGrade}
  filterByAge={8}
  helperText="Grades appropriate for 8-year-olds"
/>
```

### SubjectSelector

A specialized dropdown for selecting subjects with visual indicators.

#### Props

```typescript
interface SubjectSelectorProps {
  value: string;               // Selected subject(s)
  onChange: (subjectId: string) => void;
  grade?: string;              // Filter by grade
  label?: string;              // Field label
  required?: boolean;          // Required field
  disabled?: boolean;          // Disable selector
  error?: boolean;             // Error state
  helperText?: string;         // Helper text
  fullWidth?: boolean;         // Full width
  size?: 'small' | 'medium';   // Size variant
  showIcons?: boolean;         // Show subject icons
  showColors?: boolean;        // Show color indicators
  showCategory?: boolean;      // Show subject categories
  coreOnly?: boolean;          // Show only core subjects
  variant?: 'outlined' | 'filled' | 'standard';
  multiple?: boolean;          // Multiple selection
}
```

#### Usage Examples

```tsx
// Basic subject selector
<SubjectSelector
  value={selectedSubject}
  onChange={setSelectedSubject}
  grade={selectedGrade}
/>

// With visual indicators
<SubjectSelector
  value={selectedSubject}
  onChange={setSelectedSubject}
  showIcons
  showColors
  showCategory
/>

// Core subjects only
<SubjectSelector
  value={selectedSubject}
  onChange={setSelectedSubject}
  coreOnly
  required
/>

// Multiple selection
<SubjectSelector
  value={selectedSubjects}
  onChange={setSelectedSubjects}
  multiple
  helperText="Select one or more subjects"
/>
```

## Form Components

### Input Fields

All form inputs should use the standardized Material-UI components with theme-aware styling:

```tsx
import { TextField } from '@mui/material';
import { useTheme } from '../theme/ThemeContext';
import { getFocusClasses } from '../utils/themeHelpers';

const { userRole } = useTheme();

<TextField
  label="Name"
  value={name}
  onChange={handleNameChange}
  className={getFocusClasses(userRole)}
  fullWidth
  required
/>
```

### Form Validation

Use consistent validation patterns with proper accessibility:

```tsx
import { announceFormValidation } from '../utils/accessibilityHelpers';

const handleValidation = (fieldName: string, value: string) => {
  const isValid = validateField(value);
  const errorMessage = isValid ? undefined : 'This field is required';
  
  announceFormValidation(fieldName, isValid, errorMessage);
  
  return { isValid, errorMessage };
};
```

## Layout Components

### Cards

Use the standardized card classes for consistent appearance:

```tsx
import { getCardClasses, getBorderRadius } from '../utils/themeHelpers';
import { useTheme } from '../theme/ThemeContext';

const { userRole } = useTheme();

<div className={combineClasses(
  getCardClasses(userRole),
  "bg-white dark:bg-gray-800",
  getBorderRadius(userRole, 'md'),
  "p-4 shadow-md"
)}>
  Card content
</div>
```

### Responsive Layouts

Use consistent breakpoints and spacing:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id} className="responsive-padding">
      {item.content}
    </div>
  ))}
</div>
```

## Navigation Components

### Breadcrumbs

```tsx
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

<Breadcrumbs separator={<NavigateNext fontSize="small" />}>
  <Link href="/" color="inherit">
    Home
  </Link>
  <Link href="/dashboard" color="inherit">
    Dashboard
  </Link>
  <Typography color="text.primary">
    Current Page
  </Typography>
</Breadcrumbs>
```

### Navigation Menus

Use consistent focus management and keyboard navigation:

```tsx
import { useFocusManagement } from '../utils/accessibilityHelpers';

const NavigationMenu = () => {
  const { setFocus, trapFocus } = useFocusManagement();
  
  // Implementation with proper focus management
};
```

## Data Display Components

### Tables

Use responsive tables with proper accessibility:

```tsx
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

<TableContainer>
  <Table aria-label="Data table">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id}>
          <TableCell>{row.name}</TableCell>
          <TableCell>
            <span className={getStatusClasses(row.status)}>
              {formatActivityStatus(row.status)}
            </span>
          </TableCell>
          <TableCell>
            <StandardButton size="small" onClick={() => handleEdit(row.id)}>
              Edit
            </StandardButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Charts

Use consistent colors and responsive design:

```tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useSubjectColor } from '../utils/themeHelpers';

const SubjectChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="subject" />
      <YAxis />
      <Tooltip />
      <Bar 
        dataKey="score" 
        fill={(entry) => useSubjectColor(entry.subject)}
      />
    </BarChart>
  </ResponsiveContainer>
);
```

## Feedback Components

### Alerts

Use the standardized alert system:

```tsx
import { Alert, AlertTitle } from '@mui/material';

<Alert severity="success" className="animate-slide-up">
  <AlertTitle>Success</AlertTitle>
  Your changes have been saved successfully.
</Alert>
```

### Snackbars

Implement consistent toast notifications:

```tsx
import { Snackbar, Alert } from '@mui/material';
import { announceToScreenReader } from '../utils/accessibilityHelpers';

const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  // Show snackbar
  setSnackbar({ open: true, message, type });
  
  // Announce to screen readers
  announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');
};
```

## Accessibility Guidelines

### Focus Management

Always provide proper focus management:

```tsx
import { useFocusManagement } from '../utils/accessibilityHelpers';

const Modal = ({ open, onClose }) => {
  const { setFocus, trapFocus } = useFocusManagement();
  
  useEffect(() => {
    if (open) {
      const cleanup = trapFocus(modalRef.current);
      return cleanup;
    }
  }, [open]);
};
```

### Screen Reader Support

Provide appropriate announcements:

```tsx
import { announceToScreenReader } from '../utils/accessibilityHelpers';

const handleDataLoad = () => {
  setLoading(true);
  announceToScreenReader('Loading data...', 'polite');
  
  fetchData().then(() => {
    setLoading(false);
    announceToScreenReader('Data loaded successfully', 'polite');
  });
};
```

### Keyboard Navigation

Implement proper keyboard support:

```tsx
import { handleKeyboardNavigation } from '../utils/accessibilityHelpers';

const handleKeyDown = (event: KeyboardEvent) => {
  handleKeyboardNavigation(event, {
    onEnter: handleSelect,
    onEscape: handleClose,
    onArrowUp: handlePrevious,
    onArrowDown: handleNext,
  });
};
```

## Performance Considerations

### Lazy Loading

Use React.lazy for code splitting:

```tsx
import { lazy, Suspense } from 'react';
import { LoadingState } from '../components/common';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingState message="Loading component..." />}>
  <HeavyComponent />
</Suspense>
```

### Memoization

Use React.memo for expensive components:

```tsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Expensive rendering logic
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.data.id === nextProps.data.id;
});
```

## Testing Guidelines

### Component Testing

Test components with both themes:

```tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeContext';
import StandardButton from './StandardButton';

describe('StandardButton', () => {
  it('renders correctly in parent theme', () => {
    render(
      <ThemeProvider initialRole="parent">
        <StandardButton>Test Button</StandardButton>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('renders correctly in child theme', () => {
    render(
      <ThemeProvider initialRole="child">
        <StandardButton>Test Button</StandardButton>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Accessibility Testing

Include accessibility tests:

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<YourComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Migration Checklist

When updating existing components to use the standardized system:

- [ ] Import theme context: `import { useTheme } from '../theme/ThemeContext'`
- [ ] Replace hardcoded colors with theme helpers
- [ ] Use standardized spacing and border radius utilities
- [ ] Add proper accessibility attributes
- [ ] Include loading and error states
- [ ] Test with both parent and child themes
- [ ] Verify keyboard navigation works
- [ ] Check screen reader compatibility
- [ ] Test responsive behavior
- [ ] Update any related tests

## Resources

- [Material-UI Component API](https://mui.com/material-ui/api/)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs/utility-first)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)