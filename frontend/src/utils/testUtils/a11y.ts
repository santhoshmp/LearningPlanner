import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactElement } from 'react';
import { render } from '@testing-library/react';

// Add custom jest matchers
expect.extend(toHaveNoViolations);

/**
 * Test component for accessibility violations
 * @param ui - React component to test
 * @param options - Additional options for axe
 * @returns Promise that resolves when testing is complete
 */
export async function testA11y(
  ui: ReactElement,
  options?: Parameters<typeof axe>[1]
) {
  const container = render(ui).container;
  const results = await axe(container, options);
  expect(results).toHaveNoViolations();
  return results;
}

/**
 * Default axe options for common tests
 */
export const defaultAxeOptions = {
  rules: {
    // Add specific rule configurations here if needed
    'color-contrast': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
  },
};