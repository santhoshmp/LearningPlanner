import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BadgeCollection from '../BadgeCollection';

const theme = createTheme();

const mockBadges = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first activity',
    icon: 'star',
    rarity: 'common' as const,
    earnedAt: new Date('2024-01-01'),
    category: 'Learning'
  },
  {
    id: '2',
    name: 'Streak Master',
    description: 'Maintain a 7-day learning streak',
    icon: 'fire',
    rarity: 'rare' as const,
    earnedAt: new Date('2024-01-02'),
    category: 'Consistency'
  },
  {
    id: '3',
    name: 'Future Badge',
    description: 'A badge not yet earned',
    icon: 'trophy',
    rarity: 'epic' as const,
    category: 'Achievement'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('BadgeCollection', () => {
  it('renders all badges', () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
    expect(screen.getByText('Future Badge')).toBeInTheDocument();
  });

  it('shows collection statistics', () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    expect(screen.getByText('Badge Collection')).toBeInTheDocument();
    expect(screen.getByText('2 / 3 Earned')).toBeInTheDocument();
    expect(screen.getByText('67% Complete')).toBeInTheDocument();
  });

  it('filters badges by category', async () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    // Open category filter
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    
    // Select Learning category
    const learningOption = screen.getByText('Learning');
    fireEvent.click(learningOption);
    
    // Should show only Learning category badge
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('filters badges by rarity', async () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    // Open rarity filter
    const raritySelect = screen.getByLabelText('Rarity');
    fireEvent.mouseDown(raritySelect);
    
    // Select rare rarity
    const rareOption = screen.getByText('Rare');
    fireEvent.click(rareOption);
    
    // Should show only rare badge
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
  });

  it('searches badges by name', () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    const searchInput = screen.getByPlaceholderText('Search badges...');
    fireEvent.change(searchInput, { target: { value: 'streak' } });
    
    expect(screen.getByText('Streak Master')).toBeInTheDocument();
    expect(screen.queryByText('First Steps')).not.toBeInTheDocument();
  });

  it('handles badge clicks', () => {
    const handleBadgeClick = jest.fn();
    renderWithTheme(<BadgeCollection badges={mockBadges} onBadgeClick={handleBadgeClick} />);
    
    const firstBadge = screen.getByText('First Steps');
    fireEvent.click(firstBadge);
    
    expect(handleBadgeClick).toHaveBeenCalledWith(mockBadges[0]);
  });

  it('shows empty state when no badges match filters', () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    const searchInput = screen.getByPlaceholderText('Search badges...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No badges found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument();
  });

  it('sorts badges correctly', async () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    // Open sort filter
    const sortSelect = screen.getByLabelText('Sort By');
    fireEvent.mouseDown(sortSelect);
    
    // Select alphabetical sort
    const alphabeticalOption = screen.getByText('Alphabetical');
    fireEvent.click(alphabeticalOption);
    
    // Badges should be sorted alphabetically
    const badgeNames = screen.getAllByText(/First Steps|Streak Master|Future Badge/);
    expect(badgeNames[0]).toHaveTextContent('First Steps');
  });

  it('distinguishes between earned and unearned badges', () => {
    renderWithTheme(<BadgeCollection badges={mockBadges} />);
    
    // Earned badges should not have "Not earned yet" text
    expect(screen.queryByText('Not earned yet')).toBeInTheDocument();
    
    // Future Badge should show as not earned
    const futureBadgeContainer = screen.getByText('Future Badge').closest('div');
    expect(futureBadgeContainer).toHaveTextContent('Not earned yet');
  });
});