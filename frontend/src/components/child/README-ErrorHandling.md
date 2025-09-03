# Child-Friendly Error Handling System

This document explains how to use the child-friendly error handling system implemented for the AI Study Planner.

## Overview

The child error handling system provides age-appropriate error messages, recovery options, and parental notifications for children using the learning platform. It consists of:

1. **Backend Service** (`childErrorHandler`) - Formats errors and logs them with child-specific context
2. **Frontend Components** - Display child-friendly error messages with animations
3. **React Hook** (`useChildErrorHandler`) - Manages error state and actions
4. **Error Boundary** - Catches React errors and displays them appropriately

## Components

### 1. ChildErrorHandler Service (Backend)

Located: `backend/src/services/childErrorHandler.ts`

**Features:**
- Age-appropriate error messages (5-8, 9-12, 13-18 age groups)
- Automatic error categorization (authentication, network, activity, progress, badge, session, permission)
- Recovery options based on error type
- Parent notification triggers for security issues
- Comprehensive error logging

**Usage:**
```typescript
import { childErrorHandler } from '../services/childErrorHandler';

const context = {
  childId: 'child-123',
  childAge: 10,
  activityId: 'activity-456',
  sessionId: 'session-789',
  timestamp: new Date()
};

const friendlyError = childErrorHandler.formatErrorForChild(error, context);
await childErrorHandler.logChildError(context, error, friendlyError);
```

### 2. ChildFriendlyError Component (Frontend)

Located: `frontend/src/components/common/ChildFriendlyError.tsx`

**Features:**
- Animated error display with child-friendly icons
- Age-appropriate messaging
- Recovery action buttons
- Auto-hide for info-level errors
- Parent notification indicators

**Usage:**
```tsx
import { ChildFriendlyError } from '../components/common';

<ChildFriendlyError
  error={friendlyError}
  onAction={handleErrorAction}
  onDismiss={dismissError}
  autoHide={true}
/>
```

### 3. useChildErrorHandler Hook

Located: `frontend/src/hooks/useChildErrorHandler.ts`

**Features:**
- Automatic error formatting based on child's age
- Error state management
- Built-in action handlers for common recovery actions
- Integration with authentication context

**Usage:**
```tsx
import { useChildErrorHandler } from '../hooks/useChildErrorHandler';

const { currentError, showError, dismissError, handleErrorAction, isErrorVisible } = useChildErrorHandler();

// Show an error
try {
  await someApiCall();
} catch (error) {
  showError(error, { activityId: 'current-activity' });
}

// Handle custom actions
const handleCustomAction = (action: string) => {
  if (action === 'retry_save') {
    // Custom retry logic
  } else {
    handleErrorAction(action); // Use default handler
  }
};
```

### 4. ChildErrorBoundary Component

Located: `frontend/src/components/common/ChildErrorBoundary.tsx`

**Features:**
- Catches React component errors
- Displays child-friendly error messages
- Automatic error logging
- Fallback UI for critical errors

**Usage:**
```tsx
import { ChildErrorBoundary } from '../components/common';

<ChildErrorBoundary
  childAge={currentChild?.age}
  childId={currentChild?.id}
  onError={(error, errorInfo) => {
    console.error('Component error:', error);
  }}
>
  <YourChildComponent />
</ChildErrorBoundary>
```

## Error Types and Messages

### Age Groups
- **Early (5-8)**: Simple, encouraging language with emojis
- **Middle (9-12)**: Clear explanations with helpful suggestions
- **Teen (13-18)**: More technical but still supportive language

### Error Categories
1. **Authentication**: Login/logout issues
2. **Network**: Connection problems
3. **Activity**: Learning activity errors
4. **Progress**: Save/load progress issues
5. **Badge**: Achievement system errors
6. **Session**: Timeout and session management
7. **Permission**: Parental approval required

### Example Messages

**Network Error (Age 9-12):**
- Title: "Connection Problem 🌐"
- Message: "We're having trouble connecting to the internet. Check your wifi and try again!"
- Recovery Options: Try Again, Check Internet

**Badge Error (Age 5-8):**
- Title: "Badge Magic Loading! 🏅"
- Message: "Your special badges are getting ready to appear. They'll show up very soon!"
- Recovery Options: Refresh Badges, Keep Learning

## Integration Example

Here's a complete example of integrating the error handling system into a child component:

```tsx
import React, { useState, useEffect } from 'react';
import { useChildErrorHandler } from '../../hooks/useChildErrorHandler';
import { ChildFriendlyError, ChildErrorBoundary } from '../common';

const ChildDashboard: React.FC = () => {
  const { currentError, showError, dismissError, handleErrorAction, isErrorVisible } = useChildErrorHandler();
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/child/dashboard');
      if (!response.ok) throw new Error('Failed to load dashboard');
      // Handle success
    } catch (error) {
      showError(error as Error, { activityId: 'dashboard-load' });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomErrorAction = (action: string) => {
    switch (action) {
      case 'retry_dashboard':
        loadDashboard();
        break;
      default:
        handleErrorAction(action);
    }
  };

  return (
    <ChildErrorBoundary childAge={10} childId="child-123">
      {isErrorVisible && currentError && (
        <ChildFriendlyError
          error={currentError}
          onAction={handleCustomErrorAction}
          onDismiss={dismissError}
        />
      )}
      
      {/* Your dashboard content */}
    </ChildErrorBoundary>
  );
};
```

## API Endpoints

### POST /api/child/errors
Log a child-specific error with context.

### POST /api/child/errors/recovery
Track error recovery attempts.

### POST /api/child/errors/format
Format an error into child-friendly format.

### GET /api/child/:childId/errors/summary
Get error summary for parental monitoring.

## Testing

The system includes comprehensive tests:
- Backend service tests: `backend/src/services/__tests__/childErrorHandler.test.ts`
- Frontend component tests: `frontend/src/components/common/__tests__/ChildFriendlyError.test.tsx`
- Hook tests: `frontend/src/hooks/__tests__/useChildErrorHandler.test.tsx`

## Best Practices

1. **Always wrap child components** in `ChildErrorBoundary`
2. **Use the hook** for API error handling rather than generic error handling
3. **Provide context** when showing errors (activityId, sessionId, etc.)
4. **Handle custom actions** for component-specific recovery options
5. **Test with different age groups** to ensure appropriate messaging
6. **Monitor parent notifications** to avoid overwhelming parents

## Security Considerations

- Errors containing sensitive information are automatically flagged for parent notification
- All error logs include child-specific context for monitoring
- Recovery actions are validated to prevent security issues
- Parent notifications are triggered for authentication and security errors