import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { TimeFrame } from '../../types/analytics';

interface TimeFrameSelectorProps {
  timeFrame: TimeFrame;
  onChange: (timeFrame: TimeFrame) => void;
}

const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({ timeFrame, onChange }) => {
  const [customRange, setCustomRange] = useState<boolean>(false);

  const handlePresetChange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
    
    setCustomRange(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...timeFrame,
      start: e.target.value
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...timeFrame,
      end: e.target.value
    });
  };

  // Check if current timeframe matches a preset
  const isPreset = (days: number): boolean => {
    if (customRange) return false;
    
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];
    
    return timeFrame.start === startStr && timeFrame.end === end;
  };

  return (
    <Box>
      <FormControl fullWidth size="small">
        <FormLabel sx={{ fontSize: '0.875rem', mb: 1 }}>
          Time Period
        </FormLabel>
        
        <ButtonGroup size="small" sx={{ mb: customRange ? 2 : 0 }}>
          <Button
            variant={isPreset(7) ? "contained" : "outlined"}
            onClick={() => handlePresetChange(7)}
          >
            7 Days
          </Button>
          <Button
            variant={isPreset(30) ? "contained" : "outlined"}
            onClick={() => handlePresetChange(30)}
          >
            30 Days
          </Button>
          <Button
            variant={isPreset(90) ? "contained" : "outlined"}
            onClick={() => handlePresetChange(90)}
          >
            90 Days
          </Button>
          <Button
            variant={customRange ? "contained" : "outlined"}
            onClick={() => setCustomRange(true)}
          >
            Custom
          </Button>
        </ButtonGroup>
        
        {customRange && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                fullWidth
                value={timeFrame.start}
                onChange={handleStartDateChange}
                inputProps={{ max: timeFrame.end }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                size="small"
                fullWidth
                value={timeFrame.end}
                onChange={handleEndDateChange}
                inputProps={{ 
                  min: timeFrame.start,
                  max: new Date().toISOString().split('T')[0]
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        )}
      </FormControl>
    </Box>
  );
};

export default TimeFrameSelector;