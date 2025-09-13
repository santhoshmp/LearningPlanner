# Child Study Plan End-to-End Test Suite

This directory contains comprehensive test scripts for validating child study plan functionality as specified in the requirements document.

## Test Coverage

The test suite validates all requirements from the child-study-plan-fix specification:

### Requirements Coverage
- **1.1, 1.2, 1.3**: Child study plan access (all statuses, not just ACTIVE)
- **2.1, 2.2, 2.3**: Progress updates and persistence
- **3.1, 3.2**: Dashboard updates after activity completion
- **5.1, 5.2, 5.4**: Error handling and validation
- **6.1, 6.2**: Performance and caching
- **7.1, 7.2, 7.4**: Data consistency and integrity

## Test Scripts

### 1. Master Test Runner
```bash
# Run all test suites
node backend/run-child-study-plan-tests.js

# Run specific test suite
node backend/run-child-study-plan-tests.js --quick    # Quick validation only
node backend/run-child-study-plan-tests.js --e2e      # Comprehensive E2E only
node backend/run-child-study-plan-tests.js --errors   # Error scenarios only

# Show help
node backend/run-child-study-plan-tests.js --help
```

### 2. Individual Test Scripts

#### Quick Validation Test
```bash
node backend/test-child-study-plan-quick.js
```
- Fast validation of core functionality
- Tests basic authentication, study plan access, dashboard, and progress updates
- Good for quick smoke testing

#### Comprehensive End-to-End Test
```bash
node backend/test-child-study-plan-e2e.js
```
- Complete workflow testing
- Tests all phases: authentication → study plans → progress → dashboard → persistence
- Validates data consistency and real-time updates

#### Error Scenario Test
```bash
node backend/test-child-error-scenarios.js
```
- Tests error handling and validation
- Invalid tokens, unauthorized access, malformed data
- Rate limiting and security scenarios

## Prerequisites

### 1. Server Running
Ensure the backend server is running on `http://localhost:3001`:
```bash
cd backend
npm run dev
```

### 2. Test Data Setup
The tests require a test child profile with credentials:
- Username: `testchild`
- PIN: `1234`

Create test data if needed:
```bash
node backend/create-test-child.js
```

### 3. Database Connection
Ensure PostgreSQL is running and the database is properly migrated:
```bash
cd backend
npm run prisma:migrate
```

## Test Phases

### Phase 1: Authentication
- Child login with valid credentials
- Session validation and token verification
- Authentication error handling

### Phase 2: Study Plan Access
- Retrieve all study plans (ACTIVE, DRAFT, PAUSED)
- Verify progress data inclusion
- Test specific plan access
- Validate activities ordering

### Phase 3: Progress Updates
- Update activity progress in real-time
- Verify progress persistence
- Test session data tracking
- Validate progress calculations

### Phase 4: Activity Completion
- Complete activities with scores
- Verify streak updates
- Test badge earning
- Validate completion logic

### Phase 5: Dashboard Updates
- Verify real-time dashboard updates
- Test progress summary accuracy
- Validate study plan progress
- Check streak and badge display

### Phase 6: Error Scenarios
- Invalid authentication tokens
- Unauthorized data access
- Malformed request data
- Missing resources (404 handling)
- Rate limiting validation

### Phase 7: Data Persistence
- Database record verification
- Progress record consistency
- Session data integrity
- Streak calculation accuracy

## Expected Results

### Success Criteria
All tests should pass with the following validations:

1. **Authentication**: Child can log in and maintain valid session
2. **Study Plan Access**: All plans visible regardless of status
3. **Progress Updates**: Real-time updates persist correctly
4. **Dashboard Sync**: Dashboard reflects latest progress immediately
5. **Error Handling**: Appropriate error responses for invalid requests
6. **Data Integrity**: Database records match API responses

### Common Issues

#### Authentication Failures
- Check if test child profile exists
- Verify PIN is correct (1234)
- Ensure JWT secret is configured

#### Study Plan Access Issues
- Verify study plans exist for test child
- Check if ACTIVE-only filtering is removed
- Ensure progress data is included in responses

#### Progress Update Failures
- Validate activity IDs exist
- Check progress record creation
- Verify streak calculation logic

#### Dashboard Update Issues
- Check real-time data refresh
- Verify progress summary calculations
- Ensure study plan progress updates

## Debugging

### Enable Detailed Logging
Set environment variables for more detailed output:
```bash
export DEBUG=true
export LOG_LEVEL=debug
node backend/run-child-study-plan-tests.js
```

### Check Server Logs
Monitor backend logs during test execution:
```bash
tail -f backend/logs/combined.log
```

### Database Inspection
Check database state during tests:
```bash
cd backend
npx prisma studio
```

### API Response Inspection
Tests include detailed response logging. Look for:
- HTTP status codes
- Response data structure
- Error messages
- Timing information

## Integration with CI/CD

These tests can be integrated into continuous integration:

```yaml
# Example GitHub Actions step
- name: Run Child Study Plan E2E Tests
  run: |
    cd backend
    npm run dev &
    sleep 10  # Wait for server to start
    node run-child-study-plan-tests.js
    kill %1   # Stop background server
```

## Test Data Cleanup

After running tests, you may want to clean up test data:
```bash
# Remove test progress records
node backend/cleanup-test-data.js

# Or reset test child progress
node backend/reset-test-child.js
```

## Troubleshooting

### Test Failures
1. Check server is running on correct port
2. Verify database connectivity
3. Ensure test child profile exists
4. Check for required environment variables

### Performance Issues
1. Verify database indexes are created
2. Check for slow queries in logs
3. Monitor memory usage during tests
4. Consider test data volume

### Network Issues
1. Verify API base URL configuration
2. Check for firewall blocking
3. Ensure proper timeout settings
4. Test with curl for basic connectivity

## Contributing

When adding new tests:
1. Follow existing test structure
2. Include proper error handling
3. Add descriptive test names
4. Update this README with new test coverage
5. Ensure tests are idempotent (can run multiple times)

## Support

For issues with the test suite:
1. Check server logs for errors
2. Verify test data setup
3. Run individual test scripts for isolation
4. Check database state with Prisma Studio