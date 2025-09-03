import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  ScreenReaderAnnouncement, 
  useScreenReaderAnnouncement,
  ScreenReaderProvider,
  useScreenReader
} from '../screenReaderAnnouncements';

describe('Screen Reader Announcements', () => {
  describe('ScreenReaderAnnouncement', () => {
    it('should render a visually hidden announcement', () => {
      render(<ScreenReaderAnnouncement message="Test announcement" />);
      
      const announcement = screen.getByText('Test announcement');
      expect(announcement).toBeInTheDocument();
      expect(announcement.parentElement).toHaveAttribute('role', 'status');
      expect(announcement.parentElement).toHaveAttribute('aria-live', 'polite');
    });
    
    it('should render an assertive announcement when specified', () => {
      render(<ScreenReaderAnnouncement message="Important announcement" assertive />);
      
      const announcement = screen.getByText('Important announcement');
      expect(announcement.parentElement).toHaveAttribute('aria-live', 'assertive');
    });
  });
  
  describe('useScreenReaderAnnouncement', () => {
    // Create a test component that uses the hook
    const TestComponent = () => {
      const { announce, announceAssertive, Announcer } = useScreenReaderAnnouncement();
      
      return (
        <div>
          <Announcer />
          <button onClick={() => announce('Polite announcement')}>
            Announce Polite
          </button>
          <button onClick={() => announceAssertive('Assertive announcement')}>
            Announce Assertive
          </button>
        </div>
      );
    };
    
    it('should render the component with announcer', () => {
      render(<TestComponent />);
      
      expect(screen.getByText('Announce Polite')).toBeInTheDocument();
      expect(screen.getByText('Announce Assertive')).toBeInTheDocument();
    });
  });
  
  describe('ScreenReaderProvider and useScreenReader', () => {
    // Create a test component that uses the context
    const TestConsumer = () => {
      const { announce, announceAssertive } = useScreenReader();
      
      return (
        <div>
          <button onClick={() => announce('Context announcement')}>
            Context Announce
          </button>
          <button onClick={() => announceAssertive('Context assertive')}>
            Context Assertive
          </button>
        </div>
      );
    };
    
    const TestApp = () => (
      <ScreenReaderProvider>
        <TestConsumer />
      </ScreenReaderProvider>
    );
    
    it('should provide screen reader context to consumers', () => {
      render(<TestApp />);
      
      expect(screen.getByText('Context Announce')).toBeInTheDocument();
      expect(screen.getByText('Context Assertive')).toBeInTheDocument();
    });
    
    it('should throw error when used outside provider', () => {
      // Suppress console errors for this test
      const originalError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useScreenReader must be used within a ScreenReaderProvider');
      
      // Restore console.error
      console.error = originalError;
    });
  });
});