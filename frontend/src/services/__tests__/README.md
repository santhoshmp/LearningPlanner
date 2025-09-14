# Frontend Services Test Coverage

## Overview
This directory contains comprehensive tests for frontend services, with special attention to environment variable handling and real-time functionality.

## Recent Updates

### Environment Variable Migration (Vite)
The codebase has been updated to use Vite's `import.meta.env.VITE_API_URL` instead of React's `process.env.REACT_APP_API_URL`. All tests have been updated to reflect this change.

### Test Files Updated

#### 1. `realTimeProgressService.test.ts` (NEW)
- **Purpose**: Tests the real-time progress service Socket.IO connection logic
- **Key Test Areas**:
  - Environment variable handling with URL manipulation (removing `/api` suffix)
  - Socket.IO connection management
  - Progress update queuing and offline functionality
  - Event system and error handling
  - Backup and recovery operations
  - Device and session ID generation

#### 2. `api.test.ts` (UPDATED)
- **Purpose**: Tests the main API service
- **Updates Made**:
  - Added `import.meta.env` mocking in `beforeEach`
  - Added environment variable integration tests
  - Ensured compatibility with different API URL configurations

### Environment Variable Test Patterns

All service tests now follow this pattern for environment variable mocking:

```typescript
beforeEach(() => {
  // Mock import.meta.env for consistent testing
  (global as any).import = {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3001/api'
      }
    }
  };
});
```

### Key Test Scenarios Covered

#### Environment Variable Handling
1. **URL with `/api` suffix**: `http://localhost:3001/api` → `http://localhost:3001`
2. **URL without `/api` suffix**: `http://localhost:3001` → `http://localhost:3001`
3. **Complex URLs**: `https://api.example.com/api/v1` → `https://api.example.com/v1`
4. **Undefined/missing variables**: Falls back to `http://localhost:3001`

#### Real-Time Service Specific Tests
1. **Connection Management**: Successful connections, timeouts, errors
2. **Progress Updates**: Online/offline queuing, local state management
3. **Event System**: Registration, emission, cleanup, error handling
4. **Offline Functionality**: Queue persistence, sync operations
5. **Backup Operations**: Creation, restoration, error handling

### Jest Configuration Updates

The Jest configuration has been updated to properly mock `import.meta.env`:

```javascript
globals: {
  'import.meta': {
    env: {
      VITE_API_URL: 'http://localhost:3001/api'
    }
  }
}
```

### Running Tests

```bash
# Run all service tests
npm test src/services

# Run specific test file
npm test realTimeProgressService.test.ts

# Run with coverage
npm test -- --coverage src/services
```

### Test Coverage Goals

- **Environment Variable Handling**: 100% coverage of different URL configurations
- **Error Scenarios**: All connection, timeout, and API error cases
- **Edge Cases**: Missing variables, malformed URLs, network failures
- **Integration**: Service interaction with hooks and components

### Future Considerations

1. **E2E Tests**: Consider adding Cypress tests for real-time functionality
2. **Performance Tests**: Add tests for connection pooling and resource cleanup
3. **Security Tests**: Validate token handling and secure connections
4. **Mobile Tests**: Test offline functionality on mobile devices

### Dependencies

These tests rely on:
- Jest for test framework
- Socket.IO client mocking
- LocalStorage mocking
- Axios mocking
- React Testing Library for hook tests