#!/usr/bin/env node

/**
 * Child Study Plan Error Scenarios Test
 * 
 * Tests specific error conditions:
 * - Invalid tokens
 * - Missing study plans
 * - Unauthorized access
 * - Network failures
 * - Invalid data
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';

class ErrorScenarioTester {
  constructor() {
    this.validToken = null;
    this.validChildId = null;
    this.testResults = [];
  }

  async setupValidSession() {
    console.log('🔧 Setting up valid session for error testing...');
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/child/login`, {
        credentials: {
          username: 'testchild',
          pin: '1234'
        },
        deviceInfo: {
          userAgent: 'Error-Test/1.0',
          platform: 'test',
          isMobile: false
        },
        ipAddress: '127.0.0.1'
      });

      this.validToken = loginResponse.data.token;
      this.validChildId = loginResponse.data.child.id;
      
      console.log(`✅ Valid session established for child: ${loginResponse.data.child.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to establish valid session:', error.message);
      return false;
    }
  }

  async testInvalidTokens() {
    console.log('\n🚫 Testing Invalid Token Scenarios...');

    const invalidTokens = [
      { name: 'Completely Invalid Token', token: 'invalid-token-12345' },
      { name: 'Malformed JWT', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid' },
      { name: 'Empty Token', token: '' },
      { name: 'Null Token', token: null },
      { name: 'Expired Token', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid' }
    ];

    for (const tokenTest of invalidTokens) {
      try {
        const headers = tokenTest.token ? { Authorization: `Bearer ${tokenTest.token}` } : {};
        
        await axios.get(`${API_BASE}/child/${this.validChildId}/dashboard`, { headers });
        
        this.testResults.push({
          test: `Invalid Token: ${tokenTest.name}`,
          passed: false,
          error: 'Should have rejected invalid token but did not'
        });
        
      } catch (error) {
        const expectedStatus = [401, 403];
        const correctRejection = expectedStatus.includes(error.response?.status);
        
        this.testResults.push({
          test: `Invalid Token: ${tokenTest.name}`,
          passed: correctRejection,
          details: {
            statusCode: error.response?.status,
            errorMessage: error.response?.data?.error?.message || error.response?.data?.message
          },
          error: correctRejection ? null : `Unexpected status code: ${error.response?.status}`
        });

        if (correctRejection) {
          console.log(`✅ ${tokenTest.name}: Correctly rejected (${error.response.status})`);
        } else {
          console.log(`❌ ${tokenTest.name}: Unexpected response (${error.response?.status})`);
        }
      }
    }
  }

  async testUnauthorizedAccess() {
    console.log('\n🔒 Testing Unauthorized Access Scenarios...');

    const unauthorizedTests = [
      {
        name: 'Access Other Child Dashboard',
        endpoint: `/child/fake-child-id-12345/dashboard`,
        method: 'GET'
      },
      {
        name: 'Access Other Child Progress',
        endpoint: `/child/fake-child-id-12345/progress`,
        method: 'GET'
      },
      {
        name: 'Update Other Child Activity',
        endpoint: `/child/activity/fake-activity-id/progress`,
        method: 'POST',
        data: { timeSpent: 60, score: 80 }
      }
    ];

    for (const test of unauthorizedTests) {
      try {
        const config = {
          headers: { Authorization: `Bearer ${this.validToken}` }
        };

        if (test.method === 'POST') {
          await axios.post(`${API_BASE}${test.endpoint}`, test.data, config);
        } else {
          await axios.get(`${API_BASE}${test.endpoint}`, config);
        }

        this.testResults.push({
          test: `Unauthorized Access: ${test.name}`,
          passed: false,
          error: 'Should have denied unauthorized access but did not'
        });

      } catch (error) {
        const expectedStatus = [403, 404, 400];
        const correctDenial = expectedStatus.includes(error.response?.status);
        
        this.testResults.push({
          test: `Unauthorized Access: ${test.name}`,
          passed: correctDenial,
          details: {
            statusCode: error.response?.status,
            errorMessage: error.response?.data?.error?.message || error.response?.data?.message
          },
          error: correctDenial ? null : `Unexpected status code: ${error.response?.status}`
        });

        if (correctDenial) {
          console.log(`✅ ${test.name}: Correctly denied (${error.response.status})`);
        } else {
          console.log(`❌ ${test.name}: Unexpected response (${error.response?.status})`);
        }
      }
    }
  }

  async testInvalidData() {
    console.log('\n📝 Testing Invalid Data Scenarios...');

    // First, get a valid activity ID
    let validActivityId = null;
    try {
      const plansResponse = await axios.get(`${API_BASE}/study-plans/child/${this.validChildId}`, {
        headers: { Authorization: `Bearer ${this.validToken}` }
      });
      
      const plans = plansResponse.data.plans || plansResponse.data;
      if (plans.length > 0 && plans[0].activities && plans[0].activities.length > 0) {
        validActivityId = plans[0].activities[0].id;
      }
    } catch (error) {
      console.log('⚠️ Could not get valid activity ID for testing');
    }

    const invalidDataTests = [
      {
        name: 'Negative Time Spent',
        endpoint: `/child/activity/${validActivityId || 'test-activity'}/progress`,
        data: { timeSpent: -100, score: 80 }
      },
      {
        name: 'Score Over 100',
        endpoint: `/child/activity/${validActivityId || 'test-activity'}/progress`,
        data: { timeSpent: 60, score: 150 }
      },
      {
        name: 'Invalid Status',
        endpoint: `/child/activity/${validActivityId || 'test-activity'}/progress`,
        data: { timeSpent: 60, score: 80, status: 'INVALID_STATUS' }
      },
      {
        name: 'Missing Required Fields',
        endpoint: `/child/activity/${validActivityId || 'test-activity'}/progress`,
        data: { score: 80 } // Missing timeSpent
      },
      {
        name: 'Invalid Session Data',
        endpoint: `/child/activity/${validActivityId || 'test-activity'}/progress`,
        data: { 
          timeSpent: 60, 
          score: 80,
          sessionData: {
            startTime: 'invalid-date',
            endTime: 'also-invalid'
          }
        }
      }
    ];

    for (const test of invalidDataTests) {
      if (!validActivityId && test.endpoint.includes('test-activity')) {
        console.log(`⚠️ Skipping ${test.name}: No valid activity ID available`);
        continue;
      }

      try {
        await axios.post(`${API_BASE}${test.endpoint}`, test.data, {
          headers: { Authorization: `Bearer ${this.validToken}` }
        });

        this.testResults.push({
          test: `Invalid Data: ${test.name}`,
          passed: false,
          error: 'Should have rejected invalid data but did not'
        });

      } catch (error) {
        const expectedStatus = [400, 422];
        const correctValidation = expectedStatus.includes(error.response?.status);
        
        this.testResults.push({
          test: `Invalid Data: ${test.name}`,
          passed: correctValidation,
          details: {
            statusCode: error.response?.status,
            errorMessage: error.response?.data?.error?.message || error.response?.data?.message,
            validationErrors: error.response?.data?.validationErrors
          },
          error: correctValidation ? null : `Unexpected status code: ${error.response?.status}`
        });

        if (correctValidation) {
          console.log(`✅ ${test.name}: Correctly rejected (${error.response.status})`);
        } else {
          console.log(`❌ ${test.name}: Unexpected response (${error.response?.status})`);
        }
      }
    }
  }

  async testMissingResources() {
    console.log('\n🔍 Testing Missing Resource Scenarios...');

    const missingResourceTests = [
      {
        name: 'Non-existent Child Dashboard',
        endpoint: `/child/non-existent-child-id/dashboard`,
        method: 'GET'
      },
      {
        name: 'Non-existent Activity Progress',
        endpoint: `/child/activity/non-existent-activity-id/progress`,
        method: 'POST',
        data: { timeSpent: 60, score: 80 }
      },
      {
        name: 'Non-existent Study Plan',
        endpoint: `/study-plans/child/${this.validChildId}/plan/non-existent-plan-id`,
        method: 'GET'
      }
    ];

    for (const test of missingResourceTests) {
      try {
        const config = {
          headers: { Authorization: `Bearer ${this.validToken}` }
        };

        if (test.method === 'POST') {
          await axios.post(`${API_BASE}${test.endpoint}`, test.data, config);
        } else {
          await axios.get(`${API_BASE}${test.endpoint}`, config);
        }

        this.testResults.push({
          test: `Missing Resource: ${test.name}`,
          passed: false,
          error: 'Should have returned 404 for missing resource but did not'
        });

      } catch (error) {
        const expectedStatus = [404, 403, 400];
        const correctHandling = expectedStatus.includes(error.response?.status);
        
        this.testResults.push({
          test: `Missing Resource: ${test.name}`,
          passed: correctHandling,
          details: {
            statusCode: error.response?.status,
            errorMessage: error.response?.data?.error?.message || error.response?.data?.message
          },
          error: correctHandling ? null : `Unexpected status code: ${error.response?.status}`
        });

        if (correctHandling) {
          console.log(`✅ ${test.name}: Correctly handled (${error.response.status})`);
        } else {
          console.log(`❌ ${test.name}: Unexpected response (${error.response?.status})`);
        }
      }
    }
  }

  async testRateLimiting() {
    console.log('\n⏱️ Testing Rate Limiting...');

    try {
      // Make multiple rapid requests to test rate limiting
      const rapidRequests = Array(10).fill().map((_, i) => 
        axios.get(`${API_BASE}/child/${this.validChildId}/dashboard`, {
          headers: { Authorization: `Bearer ${this.validToken}` }
        }).catch(error => ({ error, index: i }))
      );

      const results = await Promise.all(rapidRequests);
      const rateLimitedRequests = results.filter(result => 
        result.error && result.error.response?.status === 429
      );

      const rateLimitingWorking = rateLimitedRequests.length > 0;

      this.testResults.push({
        test: 'Rate Limiting',
        passed: rateLimitingWorking,
        details: {
          totalRequests: rapidRequests.length,
          rateLimitedRequests: rateLimitedRequests.length,
          successfulRequests: results.filter(r => !r.error).length
        },
        error: rateLimitingWorking ? null : 'Rate limiting may not be configured'
      });

      if (rateLimitingWorking) {
        console.log(`✅ Rate limiting working: ${rateLimitedRequests.length}/${rapidRequests.length} requests limited`);
      } else {
        console.log(`⚠️ Rate limiting not detected - may need configuration`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Rate Limiting',
        passed: false,
        error: `Rate limiting test failed: ${error.message}`
      });
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 ERROR SCENARIO TEST RESULTS');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.testResults.length}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.test}: ${result.error}`);
        if (result.details) {
          console.log(`     Status: ${result.details.statusCode}, Message: ${result.details.errorMessage}`);
        }
      });
    }

    console.log('='.repeat(60));
    return failed === 0;
  }

  async runAllTests() {
    console.log('🚨 Child Study Plan Error Scenarios Test');
    console.log('==========================================\n');

    const sessionReady = await this.setupValidSession();
    if (!sessionReady) {
      console.log('❌ Cannot proceed without valid session');
      return false;
    }

    await this.testInvalidTokens();
    await this.testUnauthorizedAccess();
    await this.testInvalidData();
    await this.testMissingResources();
    await this.testRateLimiting();

    return this.printResults();
  }
}

// Main execution
async function runErrorScenarioTests() {
  const tester = new ErrorScenarioTester();
  const success = await tester.runAllTests();
  
  if (success) {
    console.log('\n🎉 All error scenario tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some error scenario tests failed.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runErrorScenarioTests().catch(error => {
    console.error('❌ Critical error in test execution:', error);
    process.exit(1);
  });
}

module.exports = { ErrorScenarioTester, runErrorScenarioTests };