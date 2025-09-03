# Component Documentation

This document provides comprehensive documentation for the core components used in the AI Study Planner application. The components are built using Material UI v5 and follow a consistent design system.

## Table of Contents

1. [Layout Components](#layout-components)
2. [Form Components](#form-components)
3. [Data Display Components](#data-display-components)
4. [Navigation Components](#navigation-components)
5. [Accessibility Components](#accessibility-components)

## Layout Components

### AppLayout

The `AppLayout` component serves as the main layout container for all pages in the application. It provides a consistent structure with header, main content area, and footer.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | required | The content to render within the layout |
| maxWidth | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| false | 'lg' | Maximum width of the content container |
| disablePadding | boolean | false | Whether to disable padding around the content |
| hideFooter | boolean | false | Whether to hide the footer |

#### Usage

```tsx
import AppLayout from '../components/layout/AppLayout';

const MyPage = () => {
  return (
    <AppLayout>
      <h1>My Page Content</h1>
      <p>This is my page content.</p>
    </AppLayout>
  );
};
```

#### Accessibility Features

- Wraps content in a `ScreenReaderProvider` for screen reader announcements
- Uses semantic HTML structure with `<main>` element for content
- Maintains proper heading hierarchy

### ParentDashboardLayout

The `ParentDashboardLayout` component extends the `AppLayout` with specific styling and structure for parent dashboard pages. It includes breadcrumb navigation and a title section.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | required | The content to render within the layout |
| title | string | required | The page title |
| breadcrumbs | Array<{ label: string; path?: string }> | [] | Breadcrumb navigation items |
| actions | React.ReactNode | undefined | Optional action buttons to display in the header |

#### Usage

```tsx
import ParentDashboardLayout from '../components/layout/ParentDashboardLayout';

const AnalyticsPage = () => {
  return (
    <ParentDashboardLayout
      title="Analytics Dashboard"
      breadcrumbs={[{ label: 'Analytics', path: '/analytics' }]}
      actions={<Button variant="contained">Export Data</Button>}
    >
      <AnalyticsContent />
    </ParentDashboardLayout>
  );
};
```

#### Accessibility Features

- Implements proper breadcrumb navigation with ARIA attributes
- Supports keyboard navigation between breadcrumb items
- Uses proper heading hierarchy with `<h1>` for the page title

### ChildDashboardLayout

The `ChildDashboardLayout` component provides a child-friendly layout with engaging visual elements and simplified navigation.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | required | The content to render within the layout |
| title | string | required | The page title |
| showHelp | boolean | true | Whether to show the help button |
| onHelpClick | () => void | undefined | Callback when the help button is clicked |
| actions | React.ReactNode | undefined | Optional action buttons to display in the header |

#### Usage

```tsx
import ChildDashboardLayout from '../components/layout/ChildDashboardLayout';

const ChildHomePage = () => {
  const handleHelpClick = () => {
    // Open help assistant
    openHelpAssistant();
  };

  return (
    <ChildDashboardLayout
      title="My Learning Dashboard"
      onHelpClick={handleHelpClick}
    >
      <LearningActivities />
    </ChildDashboardLayout>
  );
};
```

#### Accessibility Features

- Uses high contrast colors for better visibility
- Implements keyboard navigation between navigation buttons
- Announces help assistant opening to screen readers
- Uses proper heading hierarchy with `<h1>` for the page title

### AppHeader

The `AppHeader` component provides the main navigation header for the application. It includes the application logo, navigation links, theme toggle, and user menu.

#### Features

- Responsive design that adapts to mobile and desktop views
- User authentication state awareness
- Theme toggle button
- User menu with profile and logout options
- Mobile navigation drawer

#### Usage

The `AppHeader` is automatically included in the `AppLayout` component and doesn't need to be used directly in most cases.

#### Accessibility Features

- Implements keyboard navigation between navigation items
- Supports keyboard shortcuts for common actions
- Announces menu state changes to screen readers
- Uses proper ARIA attributes for menus and buttons

### AppFooter

The `AppFooter` component provides a consistent footer for the application with links to resources and legal information.

#### Features

- Responsive layout that adapts to different screen sizes
- Links to help resources and legal documents
- Copyright information
- Text size adjustment controls

#### Usage

The `AppFooter` is automatically included in the `AppLayout` component and doesn't need to be used directly in most cases.

#### Accessibility Features

- Implements keyboard navigation between footer links
- Groups links with proper headings and ARIA attributes
- Includes text size adjustment controls for accessibility

## Form Components

### TextSizeAdjuster

The `TextSizeAdjuster` component allows users to adjust the text size for better readability.

#### Features

- Three text size options: normal, large, and larger
- Visual indicators for each size option
- Tooltips for better understanding
- Persistent preference storage

#### Usage

```tsx
import TextSizeAdjuster from '../components/layout/TextSizeAdjuster';

const SettingsPage = () => {
  return (
    <div>
      <h2>Accessibility Settings</h2>
      <TextSizeAdjuster />
    </div>
  );
};
```

#### Accessibility Features

- Clear visual indicators for each size option
- Tooltips for better understanding
- Announces text size changes to screen readers
- Keyboard accessible controls

## Data Display Components

Data display components should follow these guidelines:

### Cards

Cards should use the Material UI `Card` component with consistent styling:

```tsx
<Card
  sx={{
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[3],
    },
  }}
>
  <CardHeader title="Card Title" />
  <CardContent>
    <Typography variant="body1">Card content goes here.</Typography>
  </CardContent>
  <CardActions>
    <Button size="small">Action</Button>
  </CardActions>
</Card>
```

### Tables

Tables should use the Material UI `Table` component with consistent styling:

```tsx
<TableContainer component={Paper}>
  <Table aria-label="Data Table">
    <TableHead>
      <TableRow>
        <TableCell>Header 1</TableCell>
        <TableCell>Header 2</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Data 1</TableCell>
        <TableCell>Data 2</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

### Charts

Charts should use consistent styling and include proper accessibility features:

```tsx
<Box
  sx={{
    height: 300,
    p: 2,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
  }}
  aria-label="Chart showing data over time"
  role="img"
>
  {/* Chart component goes here */}
  <Typography variant="srOnly">
    Chart description for screen readers with key insights
  </Typography>
</Box>
```

## Navigation Components

### Breadcrumbs

Breadcrumbs should use the Material UI `Breadcrumbs` component with consistent styling:

```tsx
<Breadcrumbs aria-label="breadcrumb navigation" separator="›">
  <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
    Dashboard
  </Link>
  <Link component={RouterLink} to="/analytics" underline="hover" color="inherit">
    Analytics
  </Link>
  <Typography color="text.primary">Current Page</Typography>
</Breadcrumbs>
```

### Navigation Menus

Navigation menus should use consistent styling and include proper accessibility features:

```tsx
<List role="menu" aria-label="Navigation Menu">
  <ListItem disablePadding>
    <ListItemButton
      component={RouterLink}
      to="/dashboard"
      role="menuitem"
      aria-current={window.location.pathname === '/dashboard' ? 'page' : undefined}
    >
      <ListItemIcon>
        <Dashboard />
      </ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItemButton>
  </ListItem>
</List>
```

## Accessibility Components

### ScreenReaderAnnouncement

The `ScreenReaderAnnouncement` component provides visually hidden announcements for screen readers.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | required | The message to announce |
| assertive | boolean | false | Whether to use assertive announcement (for critical updates) |

#### Usage

```tsx
import { ScreenReaderAnnouncement } from '../utils/screenReaderAnnouncements';

const MyComponent = () => {
  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      {actionCompleted && (
        <ScreenReaderAnnouncement message="Action completed successfully" />
      )}
    </div>
  );
};
```

### useScreenReader Hook

The `useScreenReader` hook provides functions to announce messages to screen readers.

#### Returns

| Name | Type | Description |
|------|------|-------------|
| announce | (message: string) => void | Function to announce a message politely (for non-critical updates) |
| announceAssertive | (message: string) => void | Function to announce a message assertively (for critical updates) |

#### Usage

```tsx
import { useScreenReader } from '../utils/screenReaderAnnouncements';

const MyComponent = () => {
  const { announce, announceAssertive } = useScreenReader();

  const handleAction = () => {
    // Perform action
    performAction();
    
    // Announce to screen readers
    announce('Action completed successfully');
  };

  const handleCriticalAction = () => {
    // Perform critical action
    performCriticalAction();
    
    // Announce assertively to screen readers
    announceAssertive('Warning: Critical action performed');
  };

  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      <button onClick={handleCriticalAction}>Perform Critical Action</button>
    </div>
  );
};
```

### Keyboard Navigation Utilities

The keyboard navigation utilities provide functions to handle keyboard navigation for accessibility.

#### KeyCodes

Constants for common keyboard keys:

```typescript
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};
```

#### KeyboardShortcuts

Constants for common keyboard shortcuts:

```typescript
export const KeyboardShortcuts = {
  TOGGLE_THEME: { key: 'D', ctrlKey: true }, // Ctrl+D to toggle dark/light mode
  OPEN_MENU: { key: 'M', ctrlKey: true }, // Ctrl+M to open menu
  CLOSE_DIALOG: { key: KeyCodes.ESCAPE }, // Escape to close dialogs
  NAVIGATE_HOME: { key: 'H', altKey: true }, // Alt+H to navigate home
  HELP: { key: '?', shiftKey: true }, // Shift+? for help
};
```

#### matchesShortcut

Function to check if a keyboard event matches a keyboard shortcut:

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  if (matchesShortcut(event, KeyboardShortcuts.TOGGLE_THEME)) {
    event.preventDefault();
    toggleTheme();
  }
};
```

#### handleKeyboardNavigation

Function to handle keyboard navigation for a group of items:

```typescript
const handleKeyDown = (event: React.KeyboardEvent) => {
  handleKeyboardNavigation(
    event,
    currentIndex,
    items.length,
    setCurrentIndex,
    true // vertical navigation
  );
};
```

#### useFocusTrap

Hook to create a focus trap that keeps focus within a container:

```typescript
const MyDialog = () => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { activate } = useFocusTrap(dialogRef);
  
  useEffect(() => {
    const { deactivate } = activate();
    return deactivate;
  }, []);
  
  return (
    <div ref={dialogRef}>
      <button>Close</button>
      <input type="text" />
      <button>Submit</button>
    </div>
  );
};
```

#### useGlobalShortcuts

Hook to register global keyboard shortcuts:

```typescript
const MyApp = () => {
  useGlobalShortcuts({
    'ctrl+d': () => toggleTheme(),
    'alt+h': () => navigate('/'),
    'shift+?': () => openHelp(),
  });
  
  return <div>My App</div>;
};
```

## Best Practices

When creating new components or modifying existing ones, follow these best practices:

1. **Consistency**: Use the theme's colors, typography, and spacing consistently.
2. **Accessibility**: Ensure all components are accessible with proper ARIA attributes and keyboard navigation.
3. **Responsiveness**: Design components to work well on all screen sizes.
4. **Performance**: Optimize components for performance by avoiding unnecessary re-renders.
5. **Reusability**: Create components that can be reused across the application.
6. **Documentation**: Document component props and usage examples.
7. **Testing**: Write tests for components to ensure they work as expected.

## Component Development Workflow

1. **Design**: Start with a clear design that follows the application's design system.
2. **Implementation**: Implement the component using Material UI components and the theme.
3. **Accessibility**: Ensure the component is accessible with proper ARIA attributes and keyboard navigation.
4. **Testing**: Test the component with different screen sizes and assistive technologies.
5. **Documentation**: Document the component's props and usage examples.
6. **Review**: Have the component reviewed by other developers.
7. **Integration**: Integrate the component into the application.

## Conclusion

This component documentation provides a comprehensive guide to the components used in the AI Study Planner application. By following these guidelines, developers can create consistent, accessible, and visually appealing components that enhance the user experience.