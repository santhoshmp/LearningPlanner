import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  KeyCodes, 
  KeyboardShortcuts, 
  matchesShortcut, 
  handleKeyboardNavigation,
  useFocusTrap
} from '../keyboardNavigation';

describe('Keyboard Navigation Utilities', () => {
  describe('matchesShortcut', () => {
    it('should match a simple key shortcut', () => {
      const event = { key: 'A' } as React.KeyboardEvent;
      const shortcut = { key: 'A' };
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should match a key with modifier keys', () => {
      const event = { 
        key: 'D', 
        ctrlKey: true,
        altKey: false,
        shiftKey: false
      } as React.KeyboardEvent;
      const shortcut = { key: 'D', ctrlKey: true };
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match when modifiers are different', () => {
      const event = { 
        key: 'D', 
        ctrlKey: false,
        altKey: true,
        shiftKey: false
      } as React.KeyboardEvent;
      const shortcut = { key: 'D', ctrlKey: true };
      expect(matchesShortcut(event, shortcut)).toBe(false);
    });
  });

  describe('handleKeyboardNavigation', () => {
    it('should navigate to next item with arrow down', () => {
      const onIndexChange = jest.fn();
      const event = { 
        key: KeyCodes.ARROW_DOWN,
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent;
      
      handleKeyboardNavigation(event, 0, 3, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('should navigate to previous item with arrow up', () => {
      const onIndexChange = jest.fn();
      const event = { 
        key: KeyCodes.ARROW_UP,
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent;
      
      handleKeyboardNavigation(event, 1, 3, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it('should wrap around to last item when navigating up from first item', () => {
      const onIndexChange = jest.fn();
      const event = { 
        key: KeyCodes.ARROW_UP,
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent;
      
      handleKeyboardNavigation(event, 0, 3, onIndexChange);
      
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it('should navigate to first item with Home key', () => {
      const onIndexChange = jest.fn();
      const event = { 
        key: KeyCodes.HOME,
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent;
      
      handleKeyboardNavigation(event, 2, 3, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it('should navigate to last item with End key', () => {
      const onIndexChange = jest.fn();
      const event = { 
        key: KeyCodes.END,
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent;
      
      handleKeyboardNavigation(event, 0, 3, onIndexChange);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });
  });

  describe('useFocusTrap', () => {
    // Create a simple component that uses the focus trap
    const TestComponent = () => {
      const containerRef = React.useRef<HTMLDivElement>(null);
      const { activate } = useFocusTrap(containerRef);
      
      React.useEffect(() => {
        const { deactivate } = activate();
        return deactivate;
      }, []);
      
      return (
        <div ref={containerRef}>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </div>
      );
    };
    
    it('should render the component with focus trap', () => {
      render(<TestComponent />);
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });
});