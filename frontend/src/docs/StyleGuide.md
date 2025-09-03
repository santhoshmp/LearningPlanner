# AI Study Planner - Component Style Guide

## Overview

This style guide provides comprehensive documentation for the standardized component system used throughout the AI Study Planner application. It ensures consistency, accessibility, and maintainability across all user interfaces.

## Design Principles

### 1. Consistency
- All components follow standardized patterns for styling, behavior, and interaction
- Color schemes, typography, and spacing are consistent across the application
- Both parent and child themes maintain their unique characteristics while sharing core patterns

### 2. Accessibility
- WCAG 2.1 AA compliance is maintained throughout
- Proper focus management and keyboard navigation
- Screen reader support with appropriate ARIA attributes
- High contrast and reduced motion support

### 3. Responsiveness
- Mobile-first design approach
- Consistent breakpoints across all components
- Adaptive layouts that work on all screen sizes

### 4. User Experience
- Clear visual hierarchy and intuitive interactions
- Appropriate feedback for all user actions
- Loading states and error handling for all components

## Theme System

### Color Palette

#### Parent Theme (Professional)
- **Primary**: Blue (#3b82f6) - Used for primary actions and navigation
- **Secondary**: Green (#10b981) - Used for success states and secondary actions
- **Background**: Light gray (#f8fafc) / Dark slate (#0f172a)

#### Child Theme (Engaging)
- **Primary**: Purple (#8b5cf6) - Used for primary actions and navigation
- **Secondary**: Orange (#f59e0b) - Used for energy and enthusiasm
- **Background**: Light purple (#fef7ff) / Dark purple (#0f0a1a)

#### Subject Colors
- **Mathematics**: Blue (#3b82f6)
- **Science**: Green (#10b981)
- **English**: Purple (#8b5cf6)
- **Social Studies**: Amber (#f59e0b)
- **Art**: Pink (#ec4899)
- **Music**: Cyan (#06b6d4)
- **Physical Education**: Red (#ef4444)
- **Technology**: Indigo (#6366f1)
- **Foreign Language**: Lime (#84cc16)
- **Health**: Teal (#14b8a6)

#### Proficiency Colors
- **Beginner**: Red (#ef4444)
- **Developing**: Amber (#f59e0b)
- **Proficient**: Green (#10b981)
- **Advanced**: Blue (#3b82f6)
- **Expert**: Purple (#8b5cf6)

#### Status Colors
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)
- **Pending**: Gray (#64748b)

### Typography

#### Font Families
- **Parent Theme**: Inter (Professional, clean)
- **Child Theme**: Quicksand (Friendly, readable)

#### Scale
- **H1**: 2.5rem, 700 weight, 1.2 line-height
- **H2**: 2rem, 600 weight, 1.3 line-height
- **H3**: 1.75rem, 600 weight, 1.3 line-height
- **H4**: 1.5rem, 600 weight, 1.35 line-height
- **H5**: 1.25rem, 600 weight, 1.4 line-height
- **H6**: 1rem, 600 weight, 1.4 line-height
- **Body1**: 1rem (1.1rem for child), 1.6 line-height
- **Body2**: 0.875rem (0.95rem for child), 1.6 line-height

### Spacing System

- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **XXL**: 48px

### Border Radius

#### Parent Theme
- **Small**: 4px
- **Medium**: 8px
- **Large**: 12px

#### Child Theme
- **Small**: 8px
- **Medium**: 12px
- **Large**: 16px

## Component Library

### Buttons

#### Standard Button
```tsx
import { StandardButton } from '../components/common';

// Basic usage
<StandardButton>Click me</StandardButton>

// With loading state
<StandardButton loading loadingText="Saving...">
  Save Changes
</StandardButton>

// With icon
<StandardButton icon={<SaveIcon />} iconPosition="start">
  Save
</StandardButton>

// Different variants
<StandardButton variant="contained" color="primary">Primary</StandardButton>
<StandardButton variant="outlined" color="secondary">Secondary</StandardButton>
<StandardButton variant="text" color="error">Delete</StandardButton>
```

#### Props
- `loading?: boolean` - Shows loading spinner
- `loadingText?: string` - Text to show when loading
- `size?: 'small' | 'medium' | 'large'` - Button size
- `icon?: React.ReactNode` - Icon to display
- `iconPosition?: 'start' | 'end'` - Icon position
- `animation?: boolean` - Enable hover animations (default: true)

### Cards

#### Usage
```tsx
import { getCardClasses, getBorderRadius } from '../utils/themeHelpers';

<div className={combineClasses(
  getCardClasses(userRole),
  "bg-white dark:bg-gray-800",
  getBorderRadius(userRole, 'md'),
  "p-4"
)}>
  Card content
</div>
```

#### Variants
- **Standard**: Clean, professional appearance for parent theme
- **Child**: Rounded, playful appearance with hover animations

### Form Components

#### Grade Selector
```tsx
import { GradeSelector } from '../components/common';

<GradeSelector
  value={selectedGrade}
  onChange={setSelectedGrade}
  label="Select Grade"
  showAgeRange={true}
  required={true}
/>
```

#### Subject Selector
```tsx
import { SubjectSelector } from '../components/common';

<SubjectSelector
  value={selectedSubject}
  onChange={setSelectedSubject}
  grade={selectedGrade}
  showIcons={true}
  showColors={true}
  coreOnly={false}
/>
```

### Loading States

#### Loading Component
```tsx
import { LoadingState } from '../components/common';

// Spinner with message
<LoadingState 
  type="spinner" 
  message="Loading content..." 
  size="medium" 
/>

// Skeleton loader
<LoadingState 
  type="skeleton" 
  variant="card" 
/>

// Overlay loading
<LoadingState 
  type="dots" 
  variant="overlay" 
  message="Processing..."
>
  <YourContent />
</LoadingState>
```

### Error States

#### Error Component
```tsx
import { ErrorState } from '../components/common';

// Basic error
<ErrorState
  type="error"
  title="Something went wrong"
  message="We couldn't load the data. Please try again."
  onRetry={handleRetry}
/>

// Warning banner
<ErrorState
  type="warning"
  variant="banner"
  message="Your session will expire soon."
  dismissible={true}
  onDismiss={handleDismiss}
/>
```

## Utility Classes

### Theme Helpers

```tsx
import {
  useSubjectColor,
  useProficiencyColor,
  useStatusColor,
  getCardClasses,
  getButtonClasses,
  combineClasses
} from '../utils/themeHelpers';

// Get colors
const mathColor = useSubjectColor('mathematics');
const proficiencyColor = useProficiencyColor('advanced');
const statusColor = useStatusColor('completed');

// Get component classes
const cardClasses = getCardClasses(userRole);
const buttonClasses = getButtonClasses(userRole);

// Combine classes safely
const combinedClasses = combineClasses(
  'base-class',
  condition && 'conditional-class',
  null, // ignored
  'another-class'
);
```

### CSS Utility Classes

#### Subject Colors
```css
.subject-mathematics { color: #3b82f6; }
.bg-subject-mathematics { background-color: #3b82f6; }
```

#### Proficiency Colors
```css
.proficiency-advanced { color: #3b82f6; }
.bg-proficiency-advanced { background-color: #3b82f6; }
```

#### Status Colors
```css
.status-success { color: #10b981; }
.bg-status-success { background-color: #10b981; }
```

#### Spacing
```css
.spacing-xs { margin: 4px; }
.padding-md { padding: 16px; }
```

#### Cards
```css
.card-standard { /* Parent theme card styles */ }
.card-child { /* Child theme card styles */ }
```

#### Buttons
```css
.btn-standard { /* Parent theme button styles */ }
.btn-child { /* Child theme button styles */ }
```

## Accessibility Guidelines

### Focus Management
- All interactive elements must have visible focus indicators
- Focus should be trapped within modals and dialogs
- Skip links should be provided for main content areas

### Screen Reader Support
- Use semantic HTML elements
- Provide appropriate ARIA labels and descriptions
- Announce important state changes

### Keyboard Navigation
- All functionality must be accessible via keyboard
- Use standard keyboard shortcuts where appropriate
- Provide clear navigation paths

### Color and Contrast
- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information
- Support high contrast mode

## Animation Guidelines

### Timing
- **Fast**: 150ms for micro-interactions
- **Standard**: 300ms for most transitions
- **Slow**: 500ms for complex animations

### Easing
- **Ease-out**: For entering elements
- **Ease-in**: For exiting elements
- **Ease-in-out**: For state changes

### Reduced Motion
- Respect `prefers-reduced-motion` setting
- Provide alternative feedback for users who prefer reduced motion

## Responsive Design

### Breakpoints
- **XS**: 0px (mobile)
- **SM**: 600px (tablet)
- **MD**: 900px (small desktop)
- **LG**: 1200px (desktop)
- **XL**: 1536px (large desktop)

### Layout Patterns
- Mobile-first approach
- Flexible grid systems
- Consistent spacing across breakpoints

## Best Practices

### Component Development
1. Use the standardized theme system
2. Implement proper accessibility features
3. Include loading and error states
4. Test across different screen sizes
5. Follow the established naming conventions

### Styling
1. Use utility classes when possible
2. Leverage theme helpers for consistency
3. Maintain proper contrast ratios
4. Test with different text sizes

### Performance
1. Use CSS-in-JS sparingly
2. Leverage Tailwind's utility classes
3. Optimize animations for performance
4. Consider bundle size impact

## Testing

### Visual Testing
- Test components in both light and dark modes
- Verify appearance in both parent and child themes
- Check responsive behavior across breakpoints

### Accessibility Testing
- Use automated tools (axe-core)
- Test with keyboard navigation
- Verify screen reader compatibility
- Check color contrast ratios

### Cross-browser Testing
- Test in major browsers (Chrome, Firefox, Safari, Edge)
- Verify mobile browser compatibility
- Check for consistent behavior

## Migration Guide

### Updating Existing Components
1. Import theme helpers: `import { useTheme } from '../theme/ThemeContext'`
2. Replace hardcoded colors with theme colors
3. Use standardized spacing and border radius
4. Add proper accessibility attributes
5. Include loading and error states

### Example Migration
```tsx
// Before
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>

// After
<StandardButton variant="contained" color="primary">
  Click me
</StandardButton>
```

## Resources

### Tools
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Internal Files
- `frontend/src/theme/standardizedTheme.ts` - Theme configuration
- `frontend/src/utils/themeHelpers.ts` - Utility functions
- `frontend/src/styles/globals.css` - Global styles
- `frontend/src/utils/accessibilityHelpers.ts` - Accessibility utilities