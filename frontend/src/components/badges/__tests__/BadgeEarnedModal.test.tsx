import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BadgeEarnedModal from '../BadgeEarnedModal';

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

describe('BadgeEarnedModal', () => {
  it('renders when open with badge', () => {
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={mockBadge}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('🎉 BADGE EARNED! 🎉')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Complete your first activity')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithTheme(
      <BadgeEarnedModal
        open={false}
        badge={mockBadge}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.queryByText('🎉 BADGE EARNED! 🎉')).not.toBeInTheDocument();
  });

  it('does not render when badge is null', () => {
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={null}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.queryByText('🎉 BADGE EARNED! 🎉')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={mockBadge}
        onClose={handleClose}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close badge modal/i });
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when Awesome button is clicked', () => {
    const handleClose = jest.fn();
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={mockBadge}
        onClose={handleClose}
      />
    );
    
    const awesomeButton = screen.getByRole('button', { name: /awesome/i });
    fireEvent.click(awesomeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('shows share button when onShare is provided', () => {
    const handleShare = jest.fn();
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={mockBadge}
        onClose={jest.fn()}
        onShare={handleShare}
      />
    );
    
    const shareButton = screen.getByRole('button', { name: /share achievement/i });
    expect(shareButton).toBeInTheDocument();
    
    fireEvent.click(shareButton);
    expect(handleShare).toHaveBeenCalledWith(mockBadge);
  });

  it('does not show share button when onShare is not provided', () => {
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={mockBadge}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.queryByRole('button', { name: /share achievement/i })).not.toBeInTheDocument();
  });

  it('shows different celebration messages for different rarities', () => {
    const legendaryBadge = { ...mockBadge, rarity: 'legendary' as const };
    const epicBadge = { ...mockBadge, rarity: 'epic' as const };
    const rareBadge = { ...mockBadge, rarity: 'rare' as const };

    // Test legendary
    const { rerender } = renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={legendaryBadge}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('🎆 LEGENDARY ACHIEVEMENT! 🎆')).toBeInTheDocument();

    // Test epic
    rerender(
      <ThemeProvider theme={theme}>
        <BadgeEarnedModal
          open={true}
          badge={epicBadge}
          onClose={jest.fn()}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('✨ EPIC BADGE EARNED! ✨')).toBeInTheDocument();

    // Test rare
    rerender(
      <ThemeProvider theme={theme}>
        <BadgeEarnedModal
          open={true}
          badge={rareBadge}
          onClose={jest.fn()}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('🌟 RARE BADGE UNLOCKED! 🌟')).toBeInTheDocument();
  });

  it('displays badge category and rarity information', () => {
    renderWithTheme(
      <BadgeEarnedModal
        open={true}
        badge={mockBadge}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Category: Learning • Rarity: COMMON/)).toBeInTheDocument();
  });
});