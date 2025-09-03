import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { toHaveNoViolations } from 'jest-axe';

// Add custom jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock import.meta for Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3001'
      }
    }
  }
});

// Mock window.queryClient for secure logout tests
Object.defineProperty(window, 'queryClient', {
  value: {
    clear: jest.fn()
  }
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  value: jest.fn(() => true),
  writable: true
});