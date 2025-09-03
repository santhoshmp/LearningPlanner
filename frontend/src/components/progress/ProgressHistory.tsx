import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  CheckCircle,
  Star,
  EmojiEvents,
  School,
  TrendingUp,
  CalendarToday,
  FilterList,
  Download
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ProgressHistoryItem {
  id: string;
  date: Date;
  type: 'activity_completed' | 'badge_earned' | 'streak_milestone' | 'study_plan_completed';
  title: string;
  description: string;
  score?: number;
  timeSpent?: number; // in minutes
  subject?: string;
  icon?: string;
}

interface DailyStats {
  date: string;
  activitiesCompleted: number;
  timeSpent: number;
  averageScore: number;
  badgesEarned: number;
}

interface ProgressHistoryProps {
  historyItems: ProgressHistoryItem[];
  dailyStats: DailyStats[];
  totalActivities: number;
  totalTimeSpent: number;
  totalBadges: number;
  currentStreak: number;
  onExportData?: () => void;
}

export const ProgressHistory: React.FC<ProgressHistoryProps> = ({
  historyItems,
  dailyStats,
  totalActivities,
  totalTimeSpent,
  totalBadges,
  currentStreak,
  onExportData
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getFilteredItems = () => {
    let filtered = [...historyItems];

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(item => item.date >= filterDate);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'activity_completed':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'badge_earned':
        return <EmojiEvents sx={{ color: 'gold' }} />;
      case 'streak_milestone':
        return <TrendingUp sx={{ color: theme.palette.warning.main }} />;
      case 'study_plan_completed':
        return <School sx={{ color: theme.palette.primary.main }} />;
      default:
        return <Star sx={{ color: theme.palette.secondary.main }} />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'activity_completed':
        return 'success';
      case 'badge_earned':
        return 'warning';
      case 'streak_milestone':
        return 'info';
      case 'study_plan_completed':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const StatsOverview = () => (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <School sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {totalActivities}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Activities
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CalendarToday sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
              {formatTime(totalTimeSpent)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time Spent
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 40, color: 'gold', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
              {totalBadges}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Badges Earned
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {currentStreak}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Day Streak
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const TimelineView = () => {
    const filteredItems = getFilteredItems();

    return (
      <Timeline>
        {filteredItems.map((item, index) => (
          <TimelineItem key={item.id}>
            <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
              {formatDate(item.date)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={getItemColor(item.type) as any}>
                {getItemIcon(item.type)}
              </TimelineDot>
              {index < filteredItems.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Card sx={{ mb: 1 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    {item.subject && (
                      <Chip label={item.subject} size="small" color="primary" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {item.description}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {item.score !== undefined && (
                      <Chip
                        icon={<Star />}
                        label={`${item.score}%`}
                        size="small"
                        color="warning"
                      />
                    )}
                    {item.timeSpent !== undefined && (
                      <Chip
                        icon={<CalendarToday />}
                        label={formatTime(item.timeSpent)}
                        size="small"
                        color="info"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };

  const ChartsView = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📈 Daily Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="activitiesCompleted"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              ⏱️ Time Spent
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar
                  dataKey="timeSpent"
                  fill={theme.palette.secondary.main}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📚 Learning History
        </Typography>
        {onExportData && (
          <Tooltip title="Export Data">
            <IconButton onClick={onExportData} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <StatsOverview />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FilterList color="action" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={timeFilter}
                label="Time Period"
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last 3 Months</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={typeFilter}
                label="Activity Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="activity_completed">Activities</MenuItem>
                <MenuItem value="badge_earned">Badges</MenuItem>
                <MenuItem value="streak_milestone">Streaks</MenuItem>
                <MenuItem value="study_plan_completed">Study Plans</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Timeline" />
            <Tab label="Charts" />
          </Tabs>
        </Box>
        <CardContent>
          {activeTab === 0 && <TimelineView />}
          {activeTab === 1 && <ChartsView />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProgressHistory;