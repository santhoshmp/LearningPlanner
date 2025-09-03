/**
 * Accessibility styles for use throughout the application
 */

/**
 * Style for visually hidden elements that remain accessible to screen readers
 */
export const visuallyHiddenStyle = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute' as const,
  whiteSpace: 'nowrap' as const,
  width: '1px'
};