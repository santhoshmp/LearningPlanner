import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { Type } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { TextSize } from '../../theme/theme.types';

/**
 * Component for adjusting text size for accessibility
 */
const TextSizeAdjuster: React.FC = () => {
  const { textSize, setTextSize } = useTheme();

  const handleTextSizeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSize: TextSize | null
  ) => {
    if (newSize !== null) {
      setTextSize(newSize);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" component="span" sx={{ mr: 1 }}>
        Text Size:
      </Typography>
      <ToggleButtonGroup
        value={textSize}
        exclusive
        onChange={handleTextSizeChange}
        aria-label="text size"
        size="small"
      >
        <ToggleButton 
          value="normal" 
          aria-label="normal text size"
          sx={{ 
            px: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }
          }}
        >
          <Tooltip title="Normal text size">
            <Type size={16} />
          </Tooltip>
        </ToggleButton>
        <ToggleButton 
          value="large" 
          aria-label="large text size"
          sx={{ 
            px: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }
          }}
        >
          <Tooltip title="Large text size">
            <Type size={20} />
          </Tooltip>
        </ToggleButton>
        <ToggleButton 
          value="larger" 
          aria-label="larger text size"
          sx={{ 
            px: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }
          }}
        >
          <Tooltip title="Larger text size">
            <Type size={24} />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default TextSizeAdjuster;