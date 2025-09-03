import React, { useState, useEffect, useCallback } from 'react';
import { visuallyHiddenStyle } from './a11yStyles';

/**
 * Component for visually hidden announcements for screen readers
 */
export const ScreenReaderAnnouncement: React.FC<{
  message: string;
  assertive?: boolean;
}> = ({ message, assertive = false }) => {
  return (
    <div
      style={visuallyHiddenStyle}
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {message}
    </div>
  );
};

/**
 * Hook for managing screen reader announcements
 * @returns Functions to announce messages to screen readers
 */
export const useScreenReaderAnnouncement = () => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  // Clear messages after they've been announced
  useEffect(() => {
    if (politeMessage) {
      const timer = setTimeout(() => setPoliteMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [politeMessage]);

  useEffect(() => {
    if (assertiveMessage) {
      const timer = setTimeout(() => setAssertiveMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [assertiveMessage]);

  // Function to announce a message politely (for non-critical updates)
  const announce = useCallback((message: string) => {
    setPoliteMessage(message);
  }, []);

  // Function to announce a message assertively (for critical updates)
  const announceAssertive = useCallback((message: string) => {
    setAssertiveMessage(message);
  }, []);

  // Component to render the announcements
  const Announcer = useCallback(() => {
    return (
      <>
        {politeMessage && (
          <ScreenReaderAnnouncement message={politeMessage} />
        )}
        {assertiveMessage && (
          <ScreenReaderAnnouncement message={assertiveMessage} assertive />
        )}
      </>
    );
  }, [politeMessage, assertiveMessage]);

  return { announce, announceAssertive, Announcer };
};

/**
 * Context for screen reader announcements
 */
const ScreenReaderContext = React.createContext<{
  announce: (message: string) => void;
  announceAssertive: (message: string) => void;
} | null>(null);

/**
 * Provider component for screen reader announcements
 */
export const ScreenReaderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { announce, announceAssertive, Announcer } = useScreenReaderAnnouncement();

  return (
    <ScreenReaderContext.Provider value={{ announce, announceAssertive }}>
      <Announcer />
      {children}
    </ScreenReaderContext.Provider>
  );
};

/**
 * Hook to use screen reader announcements
 */
export const useScreenReader = () => {
  const context = React.useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within a ScreenReaderProvider');
  }
  return context;
};