/**
 * Keyboard navigation utilities for accessibility
 */

// Key codes for common keyboard shortcuts
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

// Common keyboard shortcuts for the application
export const KeyboardShortcuts = {
  TOGGLE_THEME: { key: 'D', ctrlKey: true }, // Ctrl+D to toggle dark/light mode
  OPEN_MENU: { key: 'M', ctrlKey: true }, // Ctrl+M to open menu
  CLOSE_DIALOG: { key: KeyCodes.ESCAPE }, // Escape to close dialogs
  NAVIGATE_HOME: { key: 'H', altKey: true }, // Alt+H to navigate home
  HELP: { key: '?', shiftKey: true }, // Shift+? for help
};

/**
 * Check if a keyboard event matches a keyboard shortcut
 * @param event - The keyboard event
 * @param shortcut - The keyboard shortcut to check against
 * @returns Whether the event matches the shortcut
 */
export const matchesShortcut = (
  event: React.KeyboardEvent | KeyboardEvent,
  shortcut: { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }
): boolean => {
  return (
    event.key === shortcut.key &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.altKey === !!shortcut.altKey &&
    !!event.shiftKey === !!shortcut.shiftKey
  );
};

/**
 * Handle keyboard navigation for a group of items
 * @param event - The keyboard event
 * @param currentIndex - The current focused index
 * @param itemCount - The total number of items
 * @param onIndexChange - Callback when the index changes
 * @param vertical - Whether navigation is vertical (default) or horizontal
 */
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  onIndexChange: (index: number) => void,
  vertical = true
): void => {
  const upKey = vertical ? KeyCodes.ARROW_UP : KeyCodes.ARROW_LEFT;
  const downKey = vertical ? KeyCodes.ARROW_DOWN : KeyCodes.ARROW_RIGHT;

  switch (event.key) {
    case upKey:
      event.preventDefault();
      onIndexChange((currentIndex - 1 + itemCount) % itemCount);
      break;
    case downKey:
      event.preventDefault();
      onIndexChange((currentIndex + 1) % itemCount);
      break;
    case KeyCodes.HOME:
      event.preventDefault();
      onIndexChange(0);
      break;
    case KeyCodes.END:
      event.preventDefault();
      onIndexChange(itemCount - 1);
      break;
    default:
      break;
  }
};

/**
 * Create a focus trap that keeps focus within a container
 * @param containerRef - Reference to the container element
 * @returns Functions to activate and deactivate the focus trap
 */
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  const activate = () => {
    // Store the element that had focus before activating the trap
    const previouslyFocused = document.activeElement as HTMLElement;
    
    // Find all focusable elements within the container
    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];
    
    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }
    
    // Handle tab key to cycle through focusable elements
    const handleTabKey = (e: KeyboardEvent) => {
      if (!containerRef.current || !focusableElements?.length) return;
      
      if (e.key === KeyCodes.TAB) {
        if (e.shiftKey) {
          // If shift+tab and focus is on first element, move to last element
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // If tab and focus is on last element, move to first element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleTabKey);
    
    // Return function to deactivate trap
    return {
      deactivate: () => {
        document.removeEventListener('keydown', handleTabKey);
        if (previouslyFocused && 'focus' in previouslyFocused) {
          previouslyFocused.focus();
        }
      }
    };
  };
  
  return { activate };
};

/**
 * Hook to register global keyboard shortcuts
 * @param shortcuts - Map of shortcut keys to handler functions
 */
export const useGlobalShortcuts = (
  shortcuts: Record<string, (event: KeyboardEvent) => void>
) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      Object.entries(shortcuts).forEach(([shortcutKey, handler]) => {
        const [key, ...modifiers] = shortcutKey.split('+');
        
        const ctrlKey = modifiers.includes('ctrl');
        const altKey = modifiers.includes('alt');
        const shiftKey = modifiers.includes('shift');
        
        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrlKey &&
          event.altKey === altKey &&
          event.shiftKey === shiftKey
        ) {
          event.preventDefault();
          handler(event);
        }
      });
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};