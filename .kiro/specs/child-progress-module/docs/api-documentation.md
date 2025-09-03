# Child Progress Module API Documentation

## Overview

This document provides comprehensive API documentation for all child-specific endpoints in the AI Study Planner application. These endpoints are designed to support the child progress tracking module with enhanced authentication, progress monitoring, badge management, and parental oversight features.

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All child-specific endpoints require authentication using JWT tokens. Child authentication uses a separate flow with PIN validation and enhanced security monitoring.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Child Authentication Endpoints

### POST /api/child/auth/login
Authenticate a child user with username and PIN.

**Request Body:**
```json
{
  "username": "string",
  "pin": "string",
  "deviceInfo": {
    "userAgent": "string",
    "platform": "string",
    "isMobile": "boolean",
    "screenResolution": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string",
    "child": {
      "id": "string",
      "username": "string",
      "displayName": "string",
      "avatar": "string",
      "grade": "string",
      "age": "number",
      "skillProfile": "object"
    },
    "session": {
      "id": "string",
      "loginTime": "string",
      "deviceInfo": "object"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid credentials or missing required fields
- `401` - Authentication failed
- `423` - Account temporarily locked due to multiple failed attempts
- `500` - Internal server error

### POST /api/child/auth/logout
Securely logout a child user and cleanup session data.

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/child/auth/refresh
Refresh authentication token for extended sessions.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "expiresIn": "number"
  }
}
```

### GET /api/child/auth/session
Get current session information and activity status.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "loginTime": "string",
    "lastActivity": "string",
    "timeRemaining": "number",
    "activitiesCompleted": "number",
    "badgesEarned": "number"
  }
}
```

## Child Dashboard Endpoints

### GET /api/child/:childId/dashboard
Get comprehensive dashboard data for a child including progress summary, active study plans, and quick statistics.

**Parameters:**
- `childId` (string): The child's unique identifier

**Query Parameters:**
- `includeStreaks` (boolean): Include learning streak information
- `includeRecentBadges` (boolean): Include recently earned badges

**Response:**
```json
{
  "success": true,
  "data": {
    "child": {
      "id": "string",
      "displayName": "string",
      "avatar": "string",
      "grade": "string"
    },
    "progressSummary": {
      "totalActivities": "number",
      "completedActivities": "number",
      "inProgressActivities": "number",
      "totalTimeSpent": "number",
      "averageScore": "number",
      "weeklyGoalProgress": "number",
      "monthlyGoalProgress": "number"
    },
    "activeStudyPlans": [
      {
        "id": "string",
        "title": "string",
        "subject": "string",
        "progress": "number",
        "totalActivities": "number",
        "completedActivities": "number",
        "nextActivity": "object"
      }
    ],
    "learningStreaks": {
      "daily": {
        "current": "number",
        "longest": "number",
        "isActive": "boolean"
      },
      "weekly": {
        "current": "number",
        "longest": "number",
        "isActive": "boolean"
      }
    },
    "recentBadges": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "icon": "string",
        "earnedAt": "string",
        "celebrationShown": "boolean"
      }
    ],
    "dailyGoals": {
      "activitiesTarget": "number",
      "activitiesCompleted": "number",
      "timeTarget": "number",
      "timeSpent": "number",
      "streakTarget": "number",
      "currentStreak": "number"
    }
  }
}
```

## Child Progress Management Endpoints

### GET /api/child/:childId/progress
Get detailed progress information for a child across all subjects and activities.

**Parameters:**
- `childId` (string): The child's unique identifier

**Query Parameters:**
- `timeframe` (string): Filter by timeframe ('week', 'month', 'quarter', 'year')
- `subject` (string): Filter by specific subject
- `includeHistory` (boolean): Include historical progress data

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalActivities": "number",
      "completedActivities": "number",
      "averageScore": "number",
      "totalTimeSpent": "number",
      "progressPercentage": "number"
    },
    "subjectProgress": [
      {
        "subjectId": "string",
        "subjectName": "string",
        "completedActivities": "number",
        "totalActivities": "number",
        "averageScore": "number",
        "timeSpent": "number",
        "proficiencyLevel": "string",
        "lastActivity": "string"
      }
    ],
    "recentActivities": [
      {
        "id": "string",
        "title": "string",
        "subject": "string",
        "completedAt": "string",
        "score": "number",
        "timeSpent": "number",
        "helpRequests": "number"
      }
    ],
    "progressHistory": [
      {
        "date": "string",
        "activitiesCompleted": "number",
        "averageScore": "number",
        "timeSpent": "number"
      }
    ]
  }
}
```

### POST /api/child/activity/:activityId/progress
Update progress for a specific activity.

**Parameters:**
- `activityId` (string): The activity's unique identifier

**Request Body:**
```json
{
  "progress": "number",
  "timeSpent": "number",
  "sessionData": {
    "pauseCount": "number",
    "resumeCount": "number",
    "helpRequests": "number",
    "focusEvents": "array",
    "interactionEvents": "array"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progressRecord": {
      "id": "string",
      "progress": "number",
      "timeSpent": "number",
      "updatedAt": "string"
    },
    "streakUpdated": "boolean",
    "badgesEarned": "array"
  }
}
```

### POST /api/child/activity/:activityId/complete
Mark an activity as completed and process any achievements.

**Parameters:**
- `activityId` (string): The activity's unique identifier

**Request Body:**
```json
{
  "score": "number",
  "timeSpent": "number",
  "sessionData": {
    "totalPauses": "number",
    "helpRequestsCount": "number",
    "difficultyAdjustments": "array",
    "completionMethod": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progressRecord": {
      "id": "string",
      "completed": "boolean",
      "score": "number",
      "completedAt": "string"
    },
    "streaksUpdated": {
      "daily": "object",
      "weekly": "object",
      "activityCompletion": "object"
    },
    "badgesEarned": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "icon": "string",
        "celebrationConfig": "object"
      }
    ],
    "nextActivity": "object"
  }
}
```

### GET /api/child/:childId/streaks
Get learning streak information for a child.

**Parameters:**
- `childId` (string): The child's unique identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "streaks": [
      {
        "type": "string",
        "currentCount": "number",
        "longestCount": "number",
        "lastActivityDate": "string",
        "streakStartDate": "string",
        "isActive": "boolean",
        "milestones": "array"
      }
    ],
    "streakSummary": {
      "totalActiveStreaks": "number",
      "longestOverallStreak": "number",
      "streakPoints": "number"
    }
  }
}
```

## Badge and Achievement Endpoints

### GET /api/child/:childId/badges
Get all earned badges for a child.

**Parameters:**
- `childId` (string): The child's unique identifier

**Query Parameters:**
- `category` (string): Filter by badge category
- `includeProgress` (boolean): Include progress toward next badges

**Response:**
```json
{
  "success": true,
  "data": {
    "earnedBadges": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "category": "string",
        "rarity": "string",
        "icon": "string",
        "earnedAt": "string",
        "celebrationShown": "boolean"
      }
    ],
    "badgeStats": {
      "totalEarned": "number",
      "byCategory": "object",
      "byRarity": "object",
      "recentCount": "number"
    }
  }
}
```

### GET /api/child/:childId/badges/progress
Get progress toward next available badges.

**Parameters:**
- `childId` (string): The child's unique identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "nextBadges": [
      {
        "badgeId": "string",
        "name": "string",
        "description": "string",
        "category": "string",
        "requirements": "object",
        "progress": {
          "currentValue": "number",
          "targetValue": "number",
          "progressPercentage": "number",
          "estimatedTimeToCompletion": "string"
        }
      }
    ],
    "recommendations": [
      {
        "badgeId": "string",
        "name": "string",
        "actionRequired": "string",
        "difficulty": "string"
      }
    ]
  }
}
```

### POST /api/child/:childId/badges/celebrate
Mark badge celebration as shown to prevent duplicate celebrations.

**Parameters:**
- `childId` (string): The child's unique identifier

**Request Body:**
```json
{
  "badgeIds": ["string"],
  "celebrationTimestamp": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Celebration status updated"
}
```

### GET /api/child/:childId/achievements
Get comprehensive achievement history for a child.

**Parameters:**
- `childId` (string): The child's unique identifier

**Query Parameters:**
- `limit` (number): Limit number of results
- `offset` (number): Offset for pagination
- `type` (string): Filter by achievement type

**Response:**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "string",
        "type": "string",
        "title": "string",
        "description": "string",
        "earnedAt": "string",
        "points": "number",
        "metadata": "object"
      }
    ],
    "summary": {
      "totalAchievements": "number",
      "totalPoints": "number",
      "rank": "string",
      "percentile": "number"
    },
    "pagination": {
      "total": "number",
      "limit": "number",
      "offset": "number",
      "hasMore": "boolean"
    }
  }
}
```

## Child Analytics Endpoints

### GET /api/child/:childId/analytics/summary
Get child-friendly analytics summary with visual data for dashboard display.

**Parameters:**
- `childId` (string): The child's unique identifier

**Query Parameters:**
- `period` (string): Time period ('week', 'month', 'quarter')

**Response:**
```json
{
  "success": true,
  "data": {
    "learningTime": {
      "total": "number",
      "daily": "array",
      "weekly": "array",
      "average": "number"
    },
    "subjectMastery": [
      {
        "subject": "string",
        "proficiency": "number",
        "activitiesCompleted": "number",
        "averageScore": "number"
      }
    ],
    "streakAnalytics": {
      "currentStreak": "number",
      "longestStreak": "number",
      "streakHistory": "array",
      "streakPrediction": "number"
    },
    "performanceTrends": {
      "scoreImprovement": "number",
      "speedImprovement": "number",
      "consistencyScore": "number",
      "focusScore": "number"
    }
  }
}
```

### GET /api/child/:childId/help-requests
Get help request analytics for learning insights.

**Parameters:**
- `childId` (string): The child's unique identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "helpRequests": [
      {
        "id": "string",
        "activityId": "string",
        "subject": "string",
        "requestType": "string",
        "timestamp": "string",
        "resolved": "boolean",
        "helpfulnessRating": "number"
      }
    ],
    "analytics": {
      "totalRequests": "number",
      "bySubject": "object",
      "byType": "object",
      "resolutionRate": "number",
      "averageHelpfulness": "number"
    },
    "insights": [
      {
        "type": "string",
        "message": "string",
        "actionable": "boolean",
        "priority": "string"
      }
    ]
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object",
    "timestamp": "string",
    "requestId": "string"
  }
}
```

### Common Error Codes

- `CHILD_AUTH_001` - Invalid credentials
- `CHILD_AUTH_002` - Account locked
- `CHILD_AUTH_003` - Session expired
- `CHILD_PROGRESS_001` - Activity not found
- `CHILD_PROGRESS_002` - Invalid progress data
- `CHILD_BADGE_001` - Badge not available
- `CHILD_BADGE_002` - Badge already earned
- `CHILD_ANALYTICS_001` - Insufficient data
- `PARENTAL_OVERSIGHT_001` - Parental approval required

## Rate Limiting

Child-specific endpoints have enhanced rate limiting for safety:

- Authentication endpoints: 5 requests per minute
- Progress updates: 60 requests per minute
- Dashboard data: 30 requests per minute
- Badge queries: 20 requests per minute

## Security Considerations

1. **Session Management**: Child sessions have shorter timeouts (20 minutes)
2. **Device Tracking**: All requests log device information
3. **Parental Notifications**: Suspicious activity triggers parent alerts
4. **Data Minimization**: Only necessary data is collected and stored
5. **COPPA Compliance**: All endpoints comply with children's privacy regulations

## Testing

Use the provided test utilities for endpoint testing:

```bash
# Run child-specific API tests
npm run test:child-api

# Run integration tests
npm run test:integration:child

# Run security tests
npm run test:security:child
```

## Support

For API support and questions:
- Documentation: `/docs/api`
- Test Environment: `https://test-api.your-domain.com`
- Support Email: api-support@your-domain.com