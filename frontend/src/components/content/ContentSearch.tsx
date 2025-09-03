import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Autocomplete,
  Chip,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  Extension as ExtensionIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { masterDataService, MasterDataSubject } from '../../services/masterDataService';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'content' | 'subject' | 'tag' | 'recent' | 'trending';
  contentType?: 'video' | 'article' | 'interactive';
  count?: number;
}

interface ContentSearchProps {
  onSearch: (query: string, filters?: any) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  showFilters?: boolean;
  childId: string;
}

const ContentSearch: React.FC<ContentSearchProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search for videos, articles, and activities...",
  showSuggestions = true,
  showFilters = true,
  childId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<MasterDataSubject[]>([]);

  // Fetch subjects from master data
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectData = await masterDataService.getAllSubjects();
        setSubjects(subjectData);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    
    fetchSubjects();
  }, []);

  // Fetch search suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', searchQuery, childId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const response = await fetch(`/api/content/search/suggestions?q=${encodeURIComponent(searchQuery)}&childId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: showSuggestions && searchQuery.length >= 2,
  });

  // Fetch trending searches
  const { data: trendingSearches } = useQuery({
    queryKey: ['trending-searches', childId],
    queryFn: async () => {
      const response = await fetch(`/api/content/search/trending?childId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: showSuggestions,
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`recentSearches_${childId}`);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, [childId]);

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem(`recentSearches_${childId}`, JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) return;
    
    saveRecentSearch(query);
    
    const filters = {
      subjects: selectedSubjects,
      contentTypes: selectedContentTypes,
    };
    
    onSearch(query, filters);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    
    if (suggestion.type === 'subject') {
      setSelectedSubjects(prev => 
        prev.includes(suggestion.text) ? prev : [...prev, suggestion.text]
      );
    } else if (suggestion.contentType) {
      setSelectedContentTypes(prev => 
        prev.includes(suggestion.contentType!) ? prev : [...prev, suggestion.contentType!]
      );
    }
    
    handleSearch(suggestion.text);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedSubjects([]);
    setSelectedContentTypes([]);
    onSearch('');
  };

  // Get suggestion icon
  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'recent':
        return <HistoryIcon color="action" />;
      case 'trending':
        return <TrendingUpIcon color="primary" />;
      case 'subject':
        return <SchoolIcon color="primary" />;
      case 'content':
        switch (suggestion.contentType) {
          case 'video':
            return <PlayArrowIcon sx={{ color: 'error.main' }} />;
          case 'article':
            return <ArticleIcon sx={{ color: 'info.main' }} />;
          case 'interactive':
            return <ExtensionIcon sx={{ color: 'success.main' }} />;
          default:
            return <SearchIcon color="action" />;
        }
      default:
        return <SearchIcon color="action" />;
    }
  };

  // Combine all suggestions
  const allSuggestions = useMemo(() => {
    const combined: SearchSuggestion[] = [];
    
    // Add API suggestions first
    if (suggestions?.length) {
      combined.push(...suggestions);
    }
    
    // Add recent searches if no query or query is short
    if ((!searchQuery || searchQuery.length < 2) && recentSearches.length) {
      combined.push(
        ...recentSearches.slice(0, 5).map(search => ({
          id: `recent_${search}`,
          text: search,
          type: 'recent' as const,
        }))
      );
    }
    
    // Add trending searches if no query
    if (!searchQuery && trendingSearches?.length) {
      combined.push(
        ...trendingSearches.slice(0, 5).map((search: any) => ({
          id: `trending_${search.query}`,
          text: search.query,
          type: 'trending' as const,
          count: search.count,
        }))
      );
    }
    
    return combined;
  }, [suggestions, recentSearches, trendingSearches, searchQuery]);

  return (
    <Box>
      {/* Main Search Input */}
      <Autocomplete
        freeSolo
        options={allSuggestions}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.text}
        inputValue={searchQuery}
        onInputChange={(_, value) => setSearchQuery(value)}
        onChange={(_, value) => {
          if (value && typeof value === 'object') {
            handleSuggestionSelect(value);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery && (
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon />
                    </IconButton>
                  )}
                  {showFilters && (
                    <IconButton
                      size="small"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        )}
        renderOption={(props, option) => (
          <ListItem {...props} key={option.id}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getSuggestionIcon(option)}
            </ListItemIcon>
            <ListItemText
              primary={option.text}
              secondary={
                option.type === 'trending' && option.count
                  ? `${option.count} searches`
                  : option.type === 'content' && option.contentType
                  ? option.contentType.charAt(0).toUpperCase() + option.contentType.slice(1)
                  : undefined
              }
            />
          </ListItem>
        )}
        PaperComponent={({ children, ...props }) => (
          <Paper {...props} sx={{ mt: 1 }}>
            {children}
            {allSuggestions.length === 0 && searchQuery.length >= 2 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No suggestions found
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      />

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Filter by:
          </Typography>
          
          {/* Subject Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Subjects:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {subjects.map((subject) => (
                <Chip
                  key={subject.id}
                  label={subject.displayName}
                  size="small"
                  clickable
                  color={selectedSubjects.includes(subject.id) ? 'primary' : 'default'}
                  variant={selectedSubjects.includes(subject.id) ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedSubjects(prev =>
                      prev.includes(subject.id)
                        ? prev.filter(s => s !== subject.id)
                        : [...prev, subject.id]
                    );
                  }}
                />
              ))}
            </Box>
          </Box>
          
          {/* Content Type Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Content Types:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[
                { value: 'video', label: 'Videos', icon: <PlayArrowIcon /> },
                { value: 'article', label: 'Articles', icon: <ArticleIcon /> },
                { value: 'interactive', label: 'Interactive', icon: <ExtensionIcon /> },
              ].map((type) => (
                <Chip
                  key={type.value}
                  label={type.label}
                  size="small"
                  clickable
                  icon={type.icon}
                  color={selectedContentTypes.includes(type.value) ? 'primary' : 'default'}
                  variant={selectedContentTypes.includes(type.value) ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedContentTypes(prev =>
                      prev.includes(type.value)
                        ? prev.filter(t => t !== type.value)
                        : [...prev, type.value]
                    );
                  }}
                />
              ))}
            </Box>
          </Box>
          
          {/* Clear Filters */}
          {(selectedSubjects.length > 0 || selectedContentTypes.length > 0) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedSubjects([]);
                  setSelectedContentTypes([]);
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Active Filters Display */}
      {(selectedSubjects.length > 0 || selectedContentTypes.length > 0) && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedSubjects.map((subjectId) => {
            const subject = subjects.find(s => s.id === subjectId);
            return (
              <Chip
                key={subjectId}
                label={subject?.displayName || subjectId}
                size="small"
                onDelete={() => setSelectedSubjects(prev => prev.filter(s => s !== subjectId))}
                color="primary"
              />
            );
          })}
          {selectedContentTypes.map((type) => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              size="small"
              onDelete={() => setSelectedContentTypes(prev => prev.filter(t => t !== type))}
              color="secondary"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ContentSearch;