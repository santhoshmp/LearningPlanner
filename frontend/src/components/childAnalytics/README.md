# Child Analytics Components

This directory contains child-friendly learning analytics components designed to motivate and engage young learners through visual progress tracking and gamification.

## Components

### 1. LearningStreakDisplay
Displays the child's current learning streak with animated fire icons and motivational messages.

**Features:**
- Visual streak indicators with color-coded fire icons
- Animated progress bar showing progress toward personal best
- Motivational messages based on streak length
- Support for different streak types (daily, weekly, activity completion)

**Props:**
- `currentStreak`: Current streak count
- `longestStreak`: Personal best streak count
- `streakType`: Type of streak ('daily' | 'weekly' | 'activity_completion')
- `lastActivityDate`: Date of last activity (optional)
- `isActive`: Whether the streak is currently active

### 2. WeeklyProgressChart
Child-friendly bar chart showing weekly activity completion with emoji indicators.

**Features:**
- Colorful bar chart with activity completion data
- Goal progress tracking with visual progress bar
- Emoji indicators for each day based on performance
- Encouraging messages based on goal achievement

**Props:**
- `weeklyData`: Array of daily progress data
- `weeklyGoal`: Target number of activities for the week
- `totalActivitiesThisWeek`: Current week's completed activities

### 3. SubjectMasteryRadar
Radar chart displaying proficiency levels across different subjects.

**Features:**
- Interactive radar chart showing subject proficiency
- Color-coded proficiency levels with badges
- Subject-specific progress indicators
- Motivational tips for improvement

**Props:**
- `subjectData`: Array of subject mastery data
- `overallLevel`: Overall proficiency level

### 4. LearningTimeTracker
Comprehensive time tracking with pie charts and trend analysis.

**Features:**
- Daily goal progress with visual indicators
- Time distribution across subjects (pie chart)
- 7-day learning trend (area chart)
- Time statistics (weekly, monthly, average session)

**Props:**
- `todayTime`: Minutes spent learning today
- `weeklyTime`: Minutes spent learning this week
- `monthlyTime`: Minutes spent learning this month
- `dailyGoal`: Daily learning goal in minutes
- `subjectTimeData`: Time distribution by subject
- `dailyTimeData`: Daily time data for trend chart
- `averageSessionTime`: Average session duration

### 5. ChildAnalyticsDashboard
Complete dashboard combining all analytics components.

**Features:**
- Responsive grid layout
- Motivational header and footer messages
- Integrated data flow between components
- Child-friendly color scheme and typography

**Props:**
- `analyticsData`: Complete analytics summary object

## Design Principles

### Child-Friendly Design
- Bright, engaging colors
- Large, easy-to-read fonts
- Emoji and icon usage for visual appeal
- Encouraging, positive language

### Gamification Elements
- Streak tracking with fire animations
- Achievement levels and badges
- Progress bars and visual feedback
- Celebration animations and messages

### Accessibility
- High contrast colors
- Screen reader friendly
- Keyboard navigation support
- Responsive design for tablets

## Usage Example

```tsx
import { ChildAnalyticsDashboard } from '../components/childAnalytics';
import { ChildAnalyticsSummary } from '../types/childAnalytics';

const analyticsData: ChildAnalyticsSummary = {
  childId: 'child-123',
  learningStreaks: [
    {
      streakType: 'daily',
      currentCount: 5,
      longestCount: 12,
      isActive: true,
      lastActivityDate: new Date()
    }
  ],
  weeklyProgress: [
    { day: 'Monday', dayShort: 'Mon', activitiesCompleted: 3, timeSpent: 45, score: 85 },
    // ... more days
  ],
  // ... other data
};

function MyComponent() {
  return <ChildAnalyticsDashboard analyticsData={analyticsData} />;
}
```

## Dependencies

- **@mui/material**: UI components and theming
- **recharts**: Chart library for data visualization
- **framer-motion**: Animation library for engaging interactions
- **@mui/icons-material**: Icons for visual elements

## Testing

Components include comprehensive tests covering:
- Rendering without errors
- Prop validation
- Accessibility compliance
- Responsive behavior

Note: Chart components may require ResizeObserver polyfill in test environments.

## Integration with Backend

These components expect data in the format defined by the `ChildAnalyticsSummary` interface. The backend should provide:

1. Learning streak data from the `learning_streaks` table
2. Weekly progress from aggregated `progress_records`
3. Subject mastery calculations based on activity scores
4. Time tracking from session and activity data

See `types/childAnalytics.ts` for complete type definitions.