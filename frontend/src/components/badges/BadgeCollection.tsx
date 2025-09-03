import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import BadgeDisplay from './BadgeDisplay';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
  category: string;
}

interface BadgeCollectionProps {
  badges: Badge[];
  onBadgeClick?: (badge: Badge) => void;
  showFilters?: boolean;
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  badges,
  onBadgeClick,
  showFilters = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(badges.map(badge => badge.category)));
    return ['all', ...cats];
  }, [badges]);

  // Filter and sort badges
  const filteredBadges = useMemo(() => {
    let filtered = badges.filter(badge => {
      const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
      const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           badge.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesRarity && matchesSearch;
    });

    // Sort badges
    switch (sortBy) {
      case 'recent':
        return filtered.sort((a, b) => {
          if (!a.earnedAt && !b.earnedAt) return 0;
          if (!a.earnedAt) return 1;
          if (!b.earnedAt) return -1;
          return b.earnedAt.getTime() - a.earnedAt.getTime();
        });
      case 'alphabetical':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'rarity':
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        return filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
      default:
        return filtered;
    }
  }, [badges, selectedCategory, selectedRarity, searchQuery, sortBy]);

  const earnedBadges = badges.filter(badge => badge.earnedAt);
  const totalBadges = badges.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with stats */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
          Badge Collection
        </Typography>
        <Stack direction="row" spacing={2}>
          <Chip
            label={`${earnedBadges.length} / ${totalBadges} Earned`}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          <Chip
            label={`${Math.round((earnedBadges.length / totalBadges) * 100)}% Complete`}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Stack>
      </Paper>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Rarity</InputLabel>
                <Select
                  value={selectedRarity}
                  label="Rarity"
                  onChange={(e) => setSelectedRarity(e.target.value)}
                >
                  <MenuItem value="all">All Rarities</MenuItem>
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="rare">Rare</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="legendary">Legendary</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="recent">Recently Earned</MenuItem>
                  <MenuItem value="alphabetical">Alphabetical</MenuItem>
                  <MenuItem value="rarity">Rarity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Badge Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredBadges.map((badge) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={badge.id}>
                <motion.div
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: badge.earnedAt ? 'background.paper' : 'grey.100',
                      opacity: badge.earnedAt ? 1 : 0.6,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: badge.earnedAt ? 'action.hover' : 'grey.200',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <BadgeDisplay
                      badge={badge}
                      size="medium"
                      showAnimation={!!badge.earnedAt}
                      onClick={() => onBadgeClick?.(badge)}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        textAlign: 'center',
                        fontWeight: badge.earnedAt ? 'bold' : 'normal',
                        color: badge.earnedAt ? 'text.primary' : 'text.secondary'
                      }}
                    >
                      {badge.name}
                    </Typography>
                    {!badge.earnedAt && (
                      <Typography
                        variant="caption"
                        sx={{
                          textAlign: 'center',
                          color: 'text.secondary',
                          fontStyle: 'italic'
                        }}
                      >
                        Not earned yet
                      </Typography>
                    )}
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </motion.div>

      {/* Empty state */}
      {filteredBadges.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary'
          }}
        >
          <FilterList sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No badges found
          </Typography>
          <Typography variant="body2">
            Try adjusting your filters or search terms
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BadgeCollection;