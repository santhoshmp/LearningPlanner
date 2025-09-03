import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ChildFriendlyErrorComponent, { ChildFriendlyError } from '../ChildFriendlyError';

const theme = createTheme();

const mockError: ChildFriendlyError = {
  title: 'Test Error Title 🔧',
  message: 'This is a test error message for children.',
  icon: '🔧',
  severity: 'error',
  actionButton: {
    text: 'Try Again',
    action: 'retry'
  },
  parentNotification: false,
  recoveryOptions: [
    { id: 'retry', text: 'Try Again', action: 'retry', icon: '🔄' },
    { id: 'help', text: 'Get Help', action: 'request_help', icon: '🆘' },
    { id: 'home', text: 'Go Home', action: 'go_home', icon: '🏠' }
  ]
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ChildFriendlyErrorComponent', () => {
  const mockOnAction = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render error title and message', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Test Error Title 🔧')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message for children.')).toBeInTheDocument();
    expect(screen.getByText('🔧')).toBeInTheDocument();
  });

  it('should render primary action button', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    const actionButton = screen.getByRole('button', { name: /try again/i });
    expect(actionButton).toBeInTheDocument();
  });

  it('should call onAction when primary button is clicked', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    const actionButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(actionButton);

    expect(mockOnAction).toHaveBeenCalledWith('retry');
  });

  it('should call onDismiss when close button is clicked', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // Close icon button
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should show parent notification chip when parentNotification is true', () => {
    const errorWithNotification = {
      ...mockError,
      parentNotification: true
    };

    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={errorWithNotification}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('👨‍👩‍👧‍👦 Parent will be notified')).toBeInTheDocument();
  });

  it('should not show parent notification chip when parentNotification is false', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('👨‍👩‍👧‍👦 Parent will be notified')).not.toBeInTheDocument();
  });

  it('should show recovery options when More Options is clicked', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    // Initially, additional recovery options should not be visible
    expect(screen.queryByText('Get Help')).not.toBeInTheDocument();
    expect(screen.queryByText('Go Home')).not.toBeInTheDocument();

    // Click More Options
    const moreOptionsButton = screen.getByRole('button', { name: /more options/i });
    fireEvent.click(moreOptionsButton);

    // Now additional recovery options should be visible
    expect(screen.getByText('Get Help')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('should call onAction when recovery option is clicked', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    // Expand recovery options
    const moreOptionsButton = screen.getByRole('button', { name: /more options/i });
    fireEvent.click(moreOptionsButton);

    // Click on a recovery option
    const helpButton = screen.getByRole('button', { name: /get help/i });
    fireEvent.click(helpButton);

    expect(mockOnAction).toHaveBeenCalledWith('request_help');
  });

  it('should auto-hide for info severity when autoHide is true', async () => {
    const infoError = {
      ...mockError,
      severity: 'info' as const
    };

    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={infoError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
        autoHide={true}
        autoHideDelay={1000}
      />
    );

    expect(screen.getByText('Test Error Title 🔧')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('should not auto-hide for error severity even when autoHide is true', () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError} // severity is 'error'
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
        autoHide={true}
        autoHideDelay={1000}
      />
    );

    expect(screen.getByText('Test Error Title 🔧')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Should not auto-dismiss for error severity
    expect(mockOnDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('Test Error Title 🔧')).toBeInTheDocument();
  });

  it('should handle error without action button', () => {
    const errorWithoutAction = {
      ...mockError,
      actionButton: undefined
    };

    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={errorWithoutAction}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('should handle error with single recovery option (no More Options button)', () => {
    const errorWithSingleOption = {
      ...mockError,
      recoveryOptions: [
        { id: 'retry', text: 'Try Again', action: 'retry', icon: '🔄' }
      ]
    };

    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={errorWithSingleOption}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByRole('button', { name: /more options/i })).not.toBeInTheDocument();
  });

  it('should apply correct styling for different severity levels', () => {
    const { rerender } = renderWithTheme(
      <ChildFriendlyErrorComponent
        error={{ ...mockError, severity: 'error' }}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    let titleElement = screen.getByText('Test Error Title 🔧');
    expect(titleElement).toHaveStyle({ color: expect.any(String) });

    rerender(
      <ThemeProvider theme={theme}>
        <ChildFriendlyErrorComponent
          error={{ ...mockError, severity: 'warning' }}
          onAction={mockOnAction}
          onDismiss={mockOnDismiss}
        />
      </ThemeProvider>
    );

    titleElement = screen.getByText('Test Error Title 🔧');
    expect(titleElement).toHaveStyle({ color: expect.any(String) });

    rerender(
      <ThemeProvider theme={theme}>
        <ChildFriendlyErrorComponent
          error={{ ...mockError, severity: 'info' }}
          onAction={mockOnAction}
          onDismiss={mockOnDismiss}
        />
      </ThemeProvider>
    );

    titleElement = screen.getByText('Test Error Title 🔧');
    expect(titleElement).toHaveStyle({ color: expect.any(String) });
  });

  it('should auto-dismiss after retry actions', async () => {
    renderWithTheme(
      <ChildFriendlyErrorComponent
        error={mockError}
        onAction={mockOnAction}
        onDismiss={mockOnDismiss}
      />
    );

    const actionButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(actionButton);

    expect(mockOnAction).toHaveBeenCalledWith('retry');

    // Should auto-dismiss after 1 second for retry actions
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });
});