import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { BadgeDisplay } from '../BadgeDisplay';
import { BadgeCollection } from '../BadgeCollection';
import { BadgeEarnedModal } from '../BadgeEarnedModal';
import { AchievementCenter } from '../AchievementCenter';
import { childTheme } from '../../../theme/childTheme';

const mockBadges = [
  {
    id: 'badge-1',
    name: 'Math Star',
    description: 'Complete 10 math activities',
    icon: '⭐',
    category: 'math',
    rarity: 'common',
    earnedAt: new Date('2024-01-15'),
    progress: { current: 10, target: 10 }
  },
  {
    id: 'badge-2',
    name: 'Reading Champion',
    description: 'Read for 5 days in a row',
    icon: '📚',
    category: 'reading',
    rarity: 'rare',
    earnedAt: new Date('2024-01-20'),
    progress: { current: 5, target: 5 }
  },
  {
    id: 'badge-3',
    name: 'Science Explorer',
    description: 'Complete 20 science experiments',
    icon: '🔬',
    category: 'science',
    rarity: 'epic',
    earnedAt: null,
    progress: { current: 12, target: 20 }
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={childTheme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('BadgeDisplay', () => {
  it('should render earned badge with animation', () => {
    renderWithProviders(<BadgeDisplay badge={mockBadges[0]} />);

    expect(screen.getByText('Math Star')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('Complete 10 math activities')).toBeInTheDocument();
  });

  it('should show progress for unearned badges', () => {
    renderWithProviders(<BadgeDisplay badge={mockBadges[2]} />);

    expect(screen.getByText('Science Explorer')).toBeInTheDocument();
    expect(screen.getByText('12 / 20')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });

  it('should display rarity indicators', () => {
    renderWithProviders(<BadgeDisplay badge={mockBadges[1]} />);

    expect(screen.getByTestId('rarity-indicator')).toHaveClass('rarity-rare');
  });

  it('should be accessible with proper ARIA labels', () => {
    renderWithProviders(<BadgeDisplay badge={mockBadges[0]} />);

    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Math Star badge');
    expect(screen.getByText('⭐')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('BadgeCollection', () => {
  it('should render all badges in grid layout', () => {
    renderWithProviders(<BadgeCollection badges={mockBadges} />);

    expect(screen.getByText('Math Star')).toBeInTheDocument();
    expect(screen.getByText('Reading Champion')).toBeInTheDocument();
    expect(screen.getByText('Science Explorer')).toBeInTheDocument();
  });

  it('should filter badges by category', () => {
    renderWithProviders(<BadgeCollection badges={mockBadges} />);

    const mathFilter = screen.getByRole('button', { name: /math/i });
    fireEvent.click(mathFilter);

    expect(screen.getByText('Math Star')).toBeInTheDocument();
    expect(screen.queryByText('Reading Champion')).not.toBeInTheDocument();
  });

  it('should show earned vs unearned badges separately', () => {
    renderWithProviders(<BadgeCollection badges={mockBadges} />);

    const earnedTab = screen.getByRole('tab', { name: /earned/i });
    const unearnedTab = screen.getByRole('tab', { name: /in progress/i });

    expect(earnedTab).toBeInTheDocument();
    expect(unearnedTab).toBeInTheDocument();

    fireEvent.click(unearnedTab);
    expect(screen.getByText('Science Explorer')).toBeInTheDocument();
    expect(screen.queryByText('Math Star')).not.toBeInTheDocument();
  });

  it('should support keyboard navigation between badges', () => {
    renderWithProviders(<BadgeCollection badges={mockBadges} />);

    const firstBadge = screen.getAllByRole('article')[0];
    firstBadge.focus();
    expect(firstBadge).toHaveFocus();

    fireEvent.keyDown(firstBadge, { key: 'ArrowRight' });
    const secondBadge = screen.getAllByRole('article')[1];
    expect(secondBadge).toHaveFocus();
  });
});

describe('BadgeEarnedModal', () => {
  const newBadge = mockBadges[0];

  it('should show celebration animation when badge is earned', () => {
    renderWithProviders(
      <BadgeEarnedModal 
        badge={newBadge} 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );

    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText('You earned the Math Star badge!')).toBeInTheDocument();
  });

  it('should play celebration sound effect', () => {
    const mockAudio = {
      play: jest.fn(),
      pause: jest.fn(),
      currentTime: 0
    };
    
    global.Audio = jest.fn().mockImplementation(() => mockAudio);

    renderWithProviders(
      <BadgeEarnedModal 
        badge={newBadge} 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('should close modal when clicking continue button', () => {
    const mockOnClose = jest.fn();

    renderWithProviders(
      <BadgeEarnedModal 
        badge={newBadge} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue learning/i });
    fireEvent.click(continueButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should be accessible with focus management', () => {
    renderWithProviders(
      <BadgeEarnedModal 
        badge={newBadge} 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    expect(modal).toHaveAttribute('aria-describedby');

    const continueButton = screen.getByRole('button', { name: /continue learning/i });
    expect(continueButton).toHaveFocus();
  });
});

describe('AchievementCenter', () => {
  it('should display achievement statistics', () => {
    renderWithProviders(<AchievementCenter childId="child-1" />);

    expect(screen.getByText(/2 badges earned/i)).toBeInTheDocument();
    expect(screen.getByText(/1 badge in progress/i)).toBeInTheDocument();
  });

  it('should show recent achievements', () => {
    renderWithProviders(<AchievementCenter childId="child-1" />);

    expect(screen.getByText(/recent achievements/i)).toBeInTheDocument();
    expect(screen.getByText('Reading Champion')).toBeInTheDocument();
  });

  it('should display next badge to earn', () => {
    renderWithProviders(<AchievementCenter childId="child-1" />);

    expect(screen.getByText(/next badge/i)).toBeInTheDocument();
    expect(screen.getByText('Science Explorer')).toBeInTheDocument();
    expect(screen.getByText('8 more to go!')).toBeInTheDocument();
  });

  it('should show achievement timeline', () => {
    renderWithProviders(<AchievementCenter childId="child-1" />);

    expect(screen.getByText(/achievement timeline/i)).toBeInTheDocument();
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('January 20, 2024')).toBeInTheDocument();
  });

  it('should handle empty state when no badges earned', () => {
    renderWithProviders(<AchievementCenter childId="child-no-badges" />);

    expect(screen.getByText(/start your badge collection/i)).toBeInTheDocument();
    expect(screen.getByText(/complete activities to earn your first badge/i)).toBeInTheDocument();
  });
});