import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import BadgeDisplay from '../BadgeDisplay';

const theme = createTheme();

const mockBadge = {
  id: '1',
  name: 'First Steps',
  description: 'Complete your first activity',
  icon: 'star',
  rarity: 'common' as const,
  earnedAt: new Date('2024-01-01'),
  category: 'Learning'
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('BadgeDisplay', () => {
  it('renders badge with correct rarity', () => {
    renderWithTheme(<BadgeDisplay badge={mockBadge} />);
    
    expect(screen.getByText('COMMON')).toBeInTheDocument();
  });

  it('shows badge information in tooltip on hover', async () => {
    const user = userEvent.setup();
    renderWithTheme(<BadgeDisplay badge={mockBadge} />);
    
    const badgeContainer = screen.getByText('COMMON').closest('div');
    if (badgeContainer?.parentElement?.parentElement) {
      await user.hover(badgeContainer.parentElement.parentElement);
      
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
        expect(screen.getByText('Complete your first activity')).toBeInTheDocument();
      });
    }
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderWithTheme(<BadgeDisplay badge={mockBadge} onClick={handleClick} />);
    
    const badgeContainer = screen.getByText('COMMON').closest('div');
    if (badgeContainer?.parentElement?.parentElement) {
      fireEvent.click(badgeContainer.parentElement.parentElement);
      expect(handleClick).toHaveBeenCalled();
    }
  });

  it('renders different sizes correctly', () => {
    const { rerender } = renderWithTheme(<BadgeDisplay badge={mockBadge} size="small" />);
    
    // Test that component renders without error for different sizes
    rerender(
      <ThemeProvider theme={theme}>
        <BadgeDisplay badge={mockBadge} size="medium" />
      </ThemeProvider>
    );
    
    rerender(
      <ThemeProvider theme={theme}>
        <BadgeDisplay badge={mockBadge} size="large" />
      </ThemeProvider>
    );
    
    expect(screen.getByText('COMMON')).toBeInTheDocument();
  });

  it('displays category indicator', () => {
    renderWithTheme(<BadgeDisplay badge={mockBadge} />);
    
    // Category indicator shows first letter of category
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('handles unearned badges', async () => {
    const user = userEvent.setup();
    const unearnedBadge = { ...mockBadge, earnedAt: undefined };
    renderWithTheme(<BadgeDisplay badge={unearnedBadge} />);
    
    const badgeContainer = screen.getByText('COMMON').closest('div');
    if (badgeContainer?.parentElement?.parentElement) {
      await user.hover(badgeContainer.parentElement.parentElement);
      
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
        expect(screen.queryByText(/Earned:/)).not.toBeInTheDocument();
      });
    }
  });
});