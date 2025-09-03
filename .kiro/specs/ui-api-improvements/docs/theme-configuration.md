# Theme Configuration Documentation

This document provides a comprehensive guide to the theming system used in the AI Study Planner application. The application uses Material UI v5 with a centralized theme configuration to ensure consistency across both parent and child interfaces.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Theme Customization](#theme-customization)
5. [Accessibility Features](#accessibility-features)

## Color Palette

The application uses two distinct color palettes: one for the parent interface and one for the child interface. Both palettes are designed to meet WCAG AA accessibility standards for color contrast.

### Parent Interface Colors

The parent interface uses a professional color scheme with blue as the primary color and green as the secondary color.

#### Light Mode

| Color Purpose | Hex Code | Usage |
|---------------|----------|-------|
| Primary       | #1d4ed8  | Main actions, buttons, links |
| Primary Light | #3b82f6  | Hover states, secondary elements |
| Primary Dark  | #1e40af  | Active states, emphasis |
| Secondary     | #047857  | Alternative actions, success states |
| Secondary Light | #10b981 | Hover states for secondary actions |
| Secondary Dark | #065f46 | Active states for secondary actions |
| Background    | #f9fafb  | Page background |
| Paper         | #ffffff  | Card and surface backgrounds |
| Text Primary  | #111827  | Main text content |
| Text Secondary | #374151 | Secondary text, labels |
| Error         | #b91c1c  | Error messages, destructive actions |
| Warning       | #b45309  | Warning messages, caution states |
| Info          | #1d4ed8  | Informational messages (same as primary) |
| Success       | #047857  | Success messages (same as secondary) |

#### Dark Mode

| Color Purpose | Hex Code | Usage |
|---------------|----------|-------|
| Primary       | #1d4ed8  | Main actions, buttons, links |
| Primary Light | #3b82f6  | Hover states, secondary elements |
| Primary Dark  | #1e40af  | Active states, emphasis |
| Secondary     | #047857  | Alternative actions, success states |
| Secondary Light | #10b981 | Hover states for secondary actions |
| Secondary Dark | #065f46 | Active states for secondary actions |
| Background    | #111827  | Page background |
| Paper         | #1f2937  | Card and surface backgrounds |
| Text Primary  | #f9fafb  | Main text content |
| Text Secondary | #d1d5db | Secondary text, labels |
| Error         | #b91c1c  | Error messages, destructive actions |
| Warning       | #b45309  | Warning messages, caution states |
| Info          | #1d4ed8  | Informational messages (same as primary) |
| Success       | #047857  | Success messages (same as secondary) |

### Child Interface Colors

The child interface uses an engaging, age-appropriate color scheme with purple as the primary color and amber as the secondary color.

#### Light Mode

| Color Purpose | Hex Code | Usage |
|---------------|----------|-------|
| Primary       | #7c3aed  | Main actions, buttons, links |
| Primary Light | #8b5cf6  | Hover states, secondary elements |
| Primary Dark  | #6d28d9  | Active states, emphasis |
| Secondary     | #b45309  | Alternative actions, highlights |
| Secondary Light | #f59e0b | Hover states for secondary actions |
| Secondary Dark | #92400e | Active states for secondary actions |
| Background    | #f5f3ff  | Page background (light purple) |
| Paper         | #ffffff  | Card and surface backgrounds |
| Text Primary  | #1f2937  | Main text content |
| Text Secondary | #374151 | Secondary text, labels |
| Error         | #b91c1c  | Error messages, destructive actions |
| Warning       | #b45309  | Warning messages, caution states |
| Info          | #1d4ed8  | Informational messages |
| Success       | #047857  | Success messages |

#### Dark Mode

| Color Purpose | Hex Code | Usage |
|---------------|----------|-------|
| Primary       | #7c3aed  | Main actions, buttons, links |
| Primary Light | #8b5cf6  | Hover states, secondary elements |
| Primary Dark  | #6d28d9  | Active states, emphasis |
| Secondary     | #b45309  | Alternative actions, highlights |
| Secondary Light | #f59e0b | Hover states for secondary actions |
| Secondary Dark | #92400e | Active states for secondary actions |
| Background    | #2e1065  | Page background (dark purple) |
| Paper         | #4c1d95  | Card and surface backgrounds |
| Text Primary  | #f9fafb  | Main text content |
| Text Secondary | #e5e7eb | Secondary text, labels |
| Error         | #b91c1c  | Error messages, destructive actions |
| Warning       | #b45309  | Warning messages, caution states |
| Info          | #1d4ed8  | Informational messages |
| Success       | #047857  | Success messages |

### Color Usage Guidelines

1. **Primary Color**: Use for main actions, navigation elements, and interactive components that should draw attention.
2. **Secondary Color**: Use for alternative actions, success states, and to create visual hierarchy.
3. **Background Colors**: Use for page backgrounds and to create depth with paper surfaces.
4. **Text Colors**: Ensure proper contrast with background colors (WCAG AA compliant).
5. **Semantic Colors**: Use error, warning, info, and success colors consistently for their respective states.

## Typography

The application uses different font families for parent and child interfaces to create appropriate experiences for each user type.

### Parent Interface Typography

The parent interface uses the Inter font family, which is a professional, highly readable sans-serif font.

| Typography Variant | Font Size | Font Weight | Line Height | Letter Spacing | Usage |
|-------------------|-----------|-------------|-------------|----------------|-------|
| h1                | 2.5rem    | 700         | 1.2         | -0.01em        | Main page headings |
| h2                | 2rem      | 600         | 1.3         | -0.005em       | Section headings |
| h3                | 1.75rem   | 600         | 1.3         | normal         | Subsection headings |
| h4                | 1.5rem    | 600         | 1.35        | normal         | Card headings |
| h5                | 1.25rem   | 600         | 1.4         | normal         | Minor headings |
| h6                | 1rem      | 600         | 1.4         | normal         | Small headings |
| subtitle1         | 1rem      | 500         | 1.5         | normal         | Emphasized body text |
| subtitle2         | 0.875rem  | 500         | 1.5         | normal         | Secondary emphasized text |
| body1            | 1rem      | 400         | 1.6         | 0.00938em      | Main body text |
| body2            | 0.875rem  | 400         | 1.6         | 0.00938em      | Secondary body text |
| button           | varies    | 600         | normal      | 0.02em         | Button text |

### Child Interface Typography

The child interface uses the Quicksand font family, which is a friendly, readable font with rounded terminals that appeals to children while maintaining readability.

| Typography Variant | Font Size | Font Weight | Line Height | Letter Spacing | Usage |
|-------------------|-----------|-------------|-------------|----------------|-------|
| h1                | 2.5rem    | 700         | 1.2         | 0.01em         | Main page headings |
| h2                | 2rem      | 700         | 1.3         | 0.01em         | Section headings |
| h3                | 1.75rem   | 600         | 1.3         | normal         | Subsection headings |
| h4                | 1.5rem    | 600         | 1.35        | normal         | Card headings |
| h5                | 1.25rem   | 600         | 1.4         | normal         | Minor headings |
| h6                | 1.125rem  | 600         | 1.4         | normal         | Small headings |
| subtitle1         | 1rem      | 500         | 1.5         | normal         | Emphasized body text |
| subtitle2         | 0.875rem  | 500         | 1.5         | normal         | Secondary emphasized text |
| body1            | 1.1rem    | 400         | 1.6         | 0.00938em      | Main body text (slightly larger) |
| body2            | 0.95rem   | 400         | 1.6         | 0.00938em      | Secondary body text (slightly larger) |
| button           | varies    | 600         | normal      | 0.02em         | Button text |

### Typography Usage Guidelines

1. **Consistency**: Use typography variants consistently across the application.
2. **Hierarchy**: Maintain a clear visual hierarchy with heading levels.
3. **Readability**: Ensure text is readable by maintaining proper line height and font size.
4. **Responsive Typography**: The application uses responsive font sizes that adjust based on screen size.

### Text Size Accessibility

The application supports three text size options for improved accessibility:

| Size Option | Base Font Size | Usage |
|-------------|---------------|-------|
| Normal      | 16px          | Default size for most users |
| Large       | 18px          | 12.5% larger for users who need slightly larger text |
| Larger      | 20px          | 25% larger for users who need significantly larger text |

Users can toggle between these sizes using the TextSizeAdjuster component, which persists their preference.

## Spacing System

The application uses Material UI's spacing system, which is based on an 8px grid. This creates consistent spacing throughout the interface.

### Spacing Scale

The spacing function can be used with different multipliers to create consistent spacing:

| Multiplier | Value | Usage |
|------------|-------|-------|
| 0.5        | 4px   | Very tight spacing, used for compact elements |
| 1          | 8px   | Default spacing unit, used for related elements |
| 2          | 16px  | Standard spacing between elements |
| 3          | 24px  | Medium spacing, used between groups of elements |
| 4          | 32px  | Large spacing, used between major sections |
| 5          | 40px  | Extra large spacing, used for significant separation |
| 6          | 48px  | Used for major layout divisions |
| 8          | 64px  | Used for very large separations |
| 10         | 80px  | Used for extreme separations |
| 12         | 96px  | Maximum spacing value |

### Spacing Usage Guidelines

1. **Consistency**: Use the spacing system consistently to create rhythm in the interface.
2. **Nesting**: Use smaller spacing values for related elements and larger values for unrelated elements.
3. **Responsive Spacing**: Adjust spacing based on screen size using the theme's breakpoints.
4. **Implementation**: Use the theme's spacing function in MUI's `sx` prop: `sx={{ mt: 2, px: 3 }}`.

## Theme Customization

The application uses a centralized theme provider that allows for customization and switching between themes.

### Theme Structure

The theme is structured according to Material UI's theme specification with additional properties:

```typescript
interface AppTheme extends MuiTheme {
  name: 'parent' | 'child';
}

type ThemeMode = 'light' | 'dark';
type UserRole = 'parent' | 'child';
type TextSize = 'normal' | 'large' | 'larger';
```

### Theme Context

The application provides a theme context that exposes the following:

```typescript
interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  userRole: UserRole;
  textSize: TextSize;
  toggleThemeMode: () => void;
  setUserRole: (role: UserRole) => void;
  setTextSize: (size: TextSize) => void;
}
```

### Theme Customization Guidelines

1. **Component Overrides**: Use the `components` property in the theme to override component styles.
2. **Theme Extension**: Extend the theme with additional properties as needed.
3. **Theme Switching**: Use the theme context to switch between parent and child themes.
4. **Dark Mode**: Support both light and dark modes for all themes.
5. **Persistence**: Theme preferences are persisted in localStorage.

### Example: Component Override

```typescript
// Example of overriding the Button component in the theme
components: {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
}
```

## Accessibility Features

The theme includes several accessibility features to ensure the application is usable by all users.

### Color Contrast

All color combinations in both themes are designed to meet WCAG AA contrast requirements:
- Text on backgrounds has a minimum contrast ratio of 4.5:1
- Large text has a minimum contrast ratio of 3:1
- UI components and graphical objects have a minimum contrast ratio of 3:1

### Focus Indicators

Both themes include enhanced focus indicators for keyboard navigation:

```typescript
// Parent theme focus styles
MuiButtonBase: {
  styleOverrides: {
    root: {
      '&.Mui-focusVisible': {
        outline: '2px solid',
        outlineColor: mode === 'light' ? '#1d4ed8' : '#60a5fa',
        outlineOffset: '2px',
      },
    },
  },
}

// Child theme focus styles (more prominent)
MuiButtonBase: {
  styleOverrides: {
    root: {
      '&.Mui-focusVisible': {
        outline: '3px solid',
        outlineColor: mode === 'light' ? '#7c3aed' : '#a78bfa',
        outlineOffset: '3px',
      },
    },
  },
}
```

### Text Resizing

The application supports text resizing through the TextSizeAdjuster component, which applies CSS classes to adjust the base font size:

```css
.text-size-normal {
  font-size: 16px; /* Base font size */
}

.text-size-large {
  font-size: 18px; /* 12.5% larger */
}

.text-size-larger {
  font-size: 20px; /* 25% larger */
}
```

### Screen Reader Support

The theme includes considerations for screen readers:
- Proper semantic HTML structure
- ARIA attributes for interactive components
- Announcements for dynamic content changes (like theme mode changes)
- Focus management for modal dialogs and popovers

## Conclusion

This theme configuration provides a consistent, accessible, and visually appealing foundation for the AI Study Planner application. By following these guidelines, developers can maintain design consistency while creating new components and features.