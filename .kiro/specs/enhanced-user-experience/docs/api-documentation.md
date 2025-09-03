# Enhanced User Experience API Documentation

## Overview

This document provides comprehensive API documentation for the enhanced user experience features including social authentication, profile management, settings configuration, AI-powered study plan generation, and content management.

## Base URL

```
Production: https://api.studyplanner.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API endpoints require authentication unless otherwise specified. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Table of Contents

1. [OAuth Authentication](#oauth-authentication)
2. [Profile Management](#profile-management)
3. [Settings Management](#settings-management)
4. [Gemini AI Integration](#gemini-ai-integration)
5. [Content Management](#content-management)
6. [Enhanced Analytics](#enhanced-analytics)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## OAuth Authentication

### Initiate OAuth Flow

**Endpoint:** `GET /oauth/{provider}/initiate`

**Description:** Initiates OAuth authentication flow for the specified provider.

**Parameters:**
- `provider` (path): OAuth provider (`google`, `apple`, `instagram`)
- `redirect_uri` (query): Callback URL after authentication
- `state` (query, optional): State parameter for CSRF protection

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "state": "random_state_string",
  "codeVerifier": "pkce_code_verifier"
}
```

**Example:**
```bash
curl -X GET "https://api.studyplanner.com/api/v1/oauth/google/initiate?redirect_uri=https://app.studyplanner.com/auth/callback"
```

### OAuth Callback

**Endpoint:** `POST /oauth/{provider}/callback`

**Description:** Handles OAuth callback and completes authentication.

**Parameters:**
- `provider` (path): OAuth provider (`google`, `apple`, `instagram`)

**Request Body:**
```json
{
  "code": "authorization_code",
  "state": "state_parameter",
  "codeVerifier": "pkce_code_verifier"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "isNewUser": false
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "socialProvider": {
    "provider": "google",
    "providerUserId": "google_user_id",
    "linkedAt": "2025-08-07T10:00:00Z"
  }
}
```

### Link Social Account

**Endpoint:** `POST /oauth/{provider}/link`

**Description:** Links a social account to an existing user account.

**Authentication:** Required

**Parameters:**
- `provider` (path): OAuth provider (`google`, `apple`, `instagram`)

**Request Body:**
```json
{
  "code": "authorization_code",
  "state": "state_parameter",
  "codeVerifier": "pkce_code_verifier"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account linked successfully",
  "provider": {
    "provider": "google",
    "providerEmail": "user@gmail.com",
    "providerName": "User Name",
    "linkedAt": "2025-08-07T10:00:00Z"
  }
}
```

### Unlink Social Account

**Endpoint:** `DELETE /oauth/{provider}/unlink`

**Description:** Unlinks a social account from the user's account.

**Authentication:** Required

**Parameters:**
- `provider` (path): OAuth provider (`google`, `apple`, `instagram`)

**Response:**
```json
{
  "success": true,
  "message": "Account unlinked successfully"
}
```

### List Linked Accounts

**Endpoint:** `GET /oauth/linked-accounts`

**Description:** Retrieves all linked social accounts for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "linkedAccounts": [
    {
      "provider": "google",
      "providerEmail": "user@gmail.com",
      "providerName": "User Name",
      "linkedAt": "2025-08-07T10:00:00Z"
    },
    {
      "provider": "apple",
      "providerEmail": "user@icloud.com",
      "providerName": "User Name",
      "linkedAt": "2025-08-06T15:30:00Z"
    }
  ]
}
```

---

## Profile Management

### Get User Profile

**Endpoint:** `GET /profile`

**Description:** Retrieves the authenticated user's profile information.

**Authentication:** Required

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "profilePicture": "https://cdn.studyplanner.com/avatars/user_id.jpg",
  "role": "parent",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-08-07T10:00:00Z",
  "lastLoginAt": "2025-08-07T09:30:00Z",
  "loginCount": 42,
  "settings": {
    "theme": "light",
    "language": "en",
    "timezone": "UTC",
    "emailNotifications": true,
    "pushNotifications": true,
    "privacyLevel": "standard",
    "dataSharingConsent": false
  },
  "socialProviders": [
    {
      "provider": "google",
      "providerEmail": "user@gmail.com",
      "linkedAt": "2025-08-07T10:00:00Z"
    }
  ]
}
```

### Update User Profile

**Endpoint:** `PUT /profile`

**Description:** Updates the authenticated user's profile information.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "user_id",
    "email": "newemail@example.com",
    "name": "Updated Name",
    "updatedAt": "2025-08-07T10:15:00Z"
  }
}
```

### Upload Profile Picture

**Endpoint:** `POST /profile/avatar`

**Description:** Uploads a new profile picture for the authenticated user.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `avatar` (file): Image file (JPEG, PNG, WebP, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "profilePicture": "https://cdn.studyplanner.com/avatars/user_id.jpg"
}
```

### Export Profile Data

**Endpoint:** `GET /profile/export`

**Description:** Exports all user profile data in JSON format.

**Authentication:** Required

**Query Parameters:**
- `format` (optional): Export format (`json`, `csv`) - default: `json`

**Response:**
```json
{
  "exportedAt": "2025-08-07T10:00:00Z",
  "user": {
    "profile": { /* user profile data */ },
    "settings": { /* user settings */ },
    "children": [ /* child profiles */ ],
    "studyPlans": [ /* study plans */ ],
    "analytics": { /* analytics data */ }
  }
}
```

---

## Settings Management

### Get User Settings

**Endpoint:** `GET /settings`

**Description:** Retrieves the authenticated user's settings.

**Authentication:** Required

**Response:**
```json
{
  "theme": "light",
  "language": "en",
  "timezone": "UTC",
  "emailNotifications": true,
  "pushNotifications": true,
  "privacyLevel": "standard",
  "dataSharingConsent": false,
  "updatedAt": "2025-08-07T10:00:00Z"
}
```

### Update User Settings

**Endpoint:** `PUT /settings`

**Description:** Updates the authenticated user's settings.

**Authentication:** Required

**Request Body:**
```json
{
  "theme": "dark",
  "language": "es",
  "emailNotifications": false,
  "privacyLevel": "minimal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "theme": "dark",
    "language": "es",
    "timezone": "UTC",
    "emailNotifications": false,
    "pushNotifications": true,
    "privacyLevel": "minimal",
    "dataSharingConsent": false,
    "updatedAt": "2025-08-07T10:15:00Z"
  }
}
```

### Get Child Settings

**Endpoint:** `GET /settings/child/{childId}`

**Description:** Retrieves settings for a specific child profile.

**Authentication:** Required (parent only)

**Parameters:**
- `childId` (path): Child profile ID

**Response:**
```json
{
  "childId": "child_id",
  "contentFilterLevel": "moderate",
  "sessionTimeLimit": 60,
  "breakReminders": true,
  "parentalNotifications": true,
  "aiAssistanceEnabled": true,
  "videoAutoplay": false,
  "updatedAt": "2025-08-07T10:00:00Z"
}
```

### Update Child Settings

**Endpoint:** `PUT /settings/child/{childId}`

**Description:** Updates settings for a specific child profile.

**Authentication:** Required (parent only)

**Parameters:**
- `childId` (path): Child profile ID

**Request Body:**
```json
{
  "contentFilterLevel": "strict",
  "sessionTimeLimit": 45,
  "breakReminders": true,
  "aiAssistanceEnabled": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Child settings updated successfully",
  "settings": {
    "childId": "child_id",
    "contentFilterLevel": "strict",
    "sessionTimeLimit": 45,
    "breakReminders": true,
    "parentalNotifications": true,
    "aiAssistanceEnabled": false,
    "videoAutoplay": false,
    "updatedAt": "2025-08-07T10:15:00Z"
  }
}
```

---

## Gemini AI Integration

### Generate Study Plan

**Endpoint:** `POST /gemini/generate-study-plan`

**Description:** Generates an AI-powered study plan using Gemini Pro API.

**Authentication:** Required

**Request Body:**
```json
{
  "childId": "child_id",
  "subject": "mathematics",
  "gradeLevel": "5th",
  "duration": 60,
  "objectives": [
    "Learn basic fractions",
    "Practice multiplication tables"
  ],
  "learningStyle": "visual",
  "includeVideos": true,
  "includeArticles": true
}
```

**Response:**
```json
{
  "planId": "generated_plan_id",
  "title": "5th Grade Mathematics - Fractions & Multiplication",
  "description": "AI-generated study plan focusing on fractions and multiplication",
  "estimatedDuration": 65,
  "difficultyProgression": [3, 4, 5, 6],
  "activities": [
    {
      "id": "activity_1",
      "title": "Introduction to Fractions",
      "description": "Learn what fractions are and how they work",
      "type": "video",
      "duration": 15,
      "content": {
        "url": "https://content.studyplanner.com/videos/fractions-intro.mp4",
        "thumbnail": "https://content.studyplanner.com/thumbnails/fractions-intro.jpg"
      },
      "safetyRating": "safe",
      "ageAppropriate": true
    },
    {
      "id": "activity_2",
      "title": "Fraction Practice Problems",
      "description": "Interactive exercises to practice fraction concepts",
      "type": "article",
      "duration": 20,
      "content": {
        "url": "https://content.studyplanner.com/articles/fraction-practice.html"
      },
      "safetyRating": "safe",
      "ageAppropriate": true
    }
  ],
  "contentRecommendations": [
    {
      "type": "video",
      "title": "Fun with Fractions",
      "url": "https://youtube.com/watch?v=example",
      "duration": 300,
      "safetyScore": 0.95,
      "ageAppropriate": true
    }
  ],
  "requiresParentalApproval": false,
  "generatedAt": "2025-08-07T10:00:00Z"
}
```

### Get Content Recommendations

**Endpoint:** `GET /gemini/content-recommendations`

**Description:** Gets AI-powered content recommendations for a child.

**Authentication:** Required

**Query Parameters:**
- `childId` (required): Child profile ID
- `subject` (optional): Subject filter
- `contentType` (optional): Content type filter (`video`, `article`)
- `limit` (optional): Number of recommendations (default: 10)

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_1",
      "type": "video",
      "title": "Advanced Multiplication Tricks",
      "description": "Learn quick multiplication methods",
      "url": "https://content.studyplanner.com/videos/mult-tricks.mp4",
      "thumbnail": "https://content.studyplanner.com/thumbnails/mult-tricks.jpg",
      "duration": 480,
      "subject": "mathematics",
      "gradeLevel": "5th",
      "safetyRating": "safe",
      "relevanceScore": 0.92,
      "ageAppropriate": true
    }
  ],
  "generatedAt": "2025-08-07T10:00:00Z"
}
```

### Validate Content Safety

**Endpoint:** `POST /gemini/validate-content`

**Description:** Validates content safety using AI analysis.

**Authentication:** Required

**Request Body:**
```json
{
  "contentUrl": "https://example.com/video.mp4",
  "contentType": "video",
  "childAge": 10,
  "title": "Educational Video Title",
  "description": "Video description"
}
```

**Response:**
```json
{
  "safetyRating": "safe",
  "safetyScore": 0.95,
  "ageAppropriate": true,
  "concerns": [],
  "recommendations": [
    "Content is appropriate for the specified age group",
    "Educational value is high"
  ],
  "validatedAt": "2025-08-07T10:00:00Z"
}
```

---

## Content Management

### Get Study Content

**Endpoint:** `GET /content`

**Description:** Retrieves study content with filtering and pagination.

**Authentication:** Required

**Query Parameters:**
- `childId` (optional): Filter by child ID
- `contentType` (optional): Filter by type (`video`, `article`, `interactive`)
- `subject` (optional): Filter by subject
- `safetyRating` (optional): Filter by safety rating
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "content": [
    {
      "id": "content_1",
      "activityId": "activity_1",
      "contentType": "video",
      "title": "Introduction to Fractions",
      "description": "Learn the basics of fractions",
      "contentUrl": "https://content.studyplanner.com/videos/fractions.mp4",
      "thumbnailUrl": "https://content.studyplanner.com/thumbnails/fractions.jpg",
      "duration": 900,
      "difficultyLevel": 3,
      "ageAppropriate": {
        "min": 8,
        "max": 12
      },
      "safetyRating": "safe",
      "sourceAttribution": "Khan Academy",
      "metadata": {
        "tags": ["fractions", "mathematics", "elementary"],
        "subject": "mathematics",
        "curriculum": ["common-core"]
      },
      "createdAt": "2025-08-07T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Track Content Interaction

**Endpoint:** `POST /content/{contentId}/interaction`

**Description:** Records a content interaction for analytics.

**Authentication:** Required

**Parameters:**
- `contentId` (path): Content ID

**Request Body:**
```json
{
  "childId": "child_id",
  "interactionType": "view",
  "progressPercentage": 75,
  "timeSpent": 450
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interaction recorded successfully",
  "interaction": {
    "id": "interaction_id",
    "contentId": "content_1",
    "childId": "child_id",
    "interactionType": "view",
    "progressPercentage": 75,
    "timeSpent": 450,
    "timestamp": "2025-08-07T10:00:00Z"
  }
}
```

### Get Content Interactions

**Endpoint:** `GET /content/interactions`

**Description:** Retrieves content interactions for analytics.

**Authentication:** Required

**Query Parameters:**
- `childId` (required): Child profile ID
- `contentId` (optional): Filter by content ID
- `interactionType` (optional): Filter by interaction type
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)

**Response:**
```json
{
  "interactions": [
    {
      "id": "interaction_1",
      "contentId": "content_1",
      "childId": "child_id",
      "interactionType": "complete",
      "progressPercentage": 100,
      "timeSpent": 900,
      "timestamp": "2025-08-07T10:00:00Z",
      "content": {
        "title": "Introduction to Fractions",
        "contentType": "video",
        "duration": 900
      }
    }
  ]
}
```

---

## Enhanced Analytics

### Get Enhanced Analytics

**Endpoint:** `GET /analytics/enhanced`

**Description:** Retrieves comprehensive analytics data with AI insights.

**Authentication:** Required

**Query Parameters:**
- `childId` (optional): Filter by child ID
- `timeframe` (optional): Time period (`week`, `month`, `quarter`, `year`)
- `startDate` (optional): Custom start date (ISO 8601)
- `endDate` (optional): Custom end date (ISO 8601)
- `includeInsights` (optional): Include AI-generated insights (default: true)

**Response:**
```json
{
  "timeframe": {
    "startDate": "2025-07-01T00:00:00Z",
    "endDate": "2025-08-07T23:59:59Z",
    "period": "month"
  },
  "overview": {
    "totalStudyTime": 1800,
    "activitiesCompleted": 25,
    "averageSessionDuration": 45,
    "streakDays": 7,
    "improvementRate": 15.5
  },
  "subjectPerformance": [
    {
      "subject": "mathematics",
      "completionRate": 85,
      "averageScore": 92,
      "timeSpent": 720,
      "trend": "improving"
    },
    {
      "subject": "science",
      "completionRate": 78,
      "averageScore": 88,
      "timeSpent": 540,
      "trend": "stable"
    }
  ],
  "learningPatterns": {
    "preferredStudyTime": "afternoon",
    "averageSessionLength": 45,
    "mostEngagingContentType": "video",
    "difficultyPreference": "moderate"
  },
  "insights": [
    {
      "type": "strength",
      "message": "Shows strong performance in visual learning activities",
      "confidence": 0.89
    },
    {
      "type": "recommendation",
      "message": "Consider adding more interactive content for science topics",
      "confidence": 0.76
    }
  ],
  "predictions": {
    "nextWeekPerformance": 88,
    "recommendedStudyTime": 50,
    "suggestedFocus": ["geometry", "basic_chemistry"]
  },
  "generatedAt": "2025-08-07T10:00:00Z"
}
```

### Export Analytics Report

**Endpoint:** `GET /analytics/export`

**Description:** Exports detailed analytics report in various formats.

**Authentication:** Required

**Query Parameters:**
- `childId` (optional): Filter by child ID
- `format` (required): Export format (`pdf`, `csv`, `json`)
- `timeframe` (optional): Time period (`week`, `month`, `quarter`, `year`)
- `includeCharts` (optional): Include visual charts in PDF (default: true)

**Response:**
- For PDF/CSV: File download
- For JSON: Analytics data in JSON format

---

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "reason": "validation_failed"
    }
  },
  "timestamp": "2025-08-07T10:00:00Z",
  "requestId": "req_12345"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |

### OAuth-Specific Errors

| Code | Description |
|------|-------------|
| `OAUTH_PROVIDER_ERROR` | OAuth provider returned an error |
| `INVALID_OAUTH_CODE` | Invalid authorization code |
| `OAUTH_STATE_MISMATCH` | State parameter mismatch |
| `ACCOUNT_ALREADY_LINKED` | Social account already linked |
| `PROVIDER_NOT_SUPPORTED` | OAuth provider not supported |

### Gemini API Errors

| Code | Description |
|------|-------------|
| `GEMINI_API_ERROR` | Gemini API returned an error |
| `CONTENT_SAFETY_VIOLATION` | Content failed safety checks |
| `GENERATION_FAILED` | AI content generation failed |
| `QUOTA_EXCEEDED` | API quota exceeded |

---

## Rate Limiting

### Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 10 requests | 1 minute |
| Profile Management | 30 requests | 1 minute |
| Settings | 20 requests | 1 minute |
| Gemini AI | 5 requests | 1 minute |
| Content | 100 requests | 1 minute |
| Analytics | 50 requests | 1 minute |

### Rate Limit Headers

All responses include rate limiting headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1691404800
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 30,
      "remaining": 0,
      "resetAt": "2025-08-07T10:05:00Z"
    }
  }
}
```