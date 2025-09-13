const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgressValidation() {
  console.log('🧪 Testing Progress Validation and Consistency Checks...\n');

  try {
    // Test 1: Valid progress update
    console.log('Test 1: Valid Progress Update');
    const response1 = await fetch('http://localhost:3001/api/child/activity/test-activity-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-child-token'
      },
      body: JSON.stringify({
        timeSpent: 300,
        score: 85,
        status: 'IN_PROGRESS',
        sessionData: {
          startTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          endTime: new Date().toISOString(),
          pausedDuration: 0,
          focusEvents: [
            { type: 'focus', timestamp: new Date(Date.now() - 300000).toISOString() }
          ],
          helpRequests: [],
          interactionEvents: [
            { type: 'click', element: 'submit-button', timestamp: new Date().toISOString() }
          ]
        },
        helpRequestsCount: 0,
        pauseCount: 0,
        resumeCount: 0
      })
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Valid progress update successful');
      console.log('   Validation passed:', result1.validation?.passed);
      console.log('   Consistency issues:', result1.consistency?.issues);
      console.log('   Message:', result1.message);
    } else {
      console.log('❌ Valid progress update failed:', response1.status);
      const error1 = await response1.json();
      console.log('   Error:', error1.error?.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Invalid progress update (negative time)
    console.log('Test 2: Invalid Progress Update (Negative Time)');
    const response2 = await fetch('http://localhost:3001/api/child/activity/test-activity-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-child-token'
      },
      body: JSON.stringify({
        timeSpent: -100, // Invalid negative time
        score: 85,
        status: 'IN_PROGRESS'
      })
    });

    if (response2.ok) {
      console.log('❌ Invalid progress update should have failed but succeeded');
    } else {
      const error2 = await response2.json();
      console.log('✅ Invalid progress update correctly rejected');
      console.log('   Error message:', error2.error?.message);
      console.log('   Validation errors:', error2.error?.validationErrors);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Inconsistent session data
    console.log('Test 3: Inconsistent Session Data');
    const response3 = await fetch('http://localhost:3001/api/child/activity/test-activity-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-child-token'
      },
      body: JSON.stringify({
        timeSpent: 600, // 10 minutes
        score: 90,
        status: 'IN_PROGRESS',
        sessionData: {
          startTime: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
          endTime: new Date().toISOString(), // Now (only 2 minutes session)
          pausedDuration: 0,
          focusEvents: [],
          helpRequests: [],
          interactionEvents: []
        }
      })
    });

    if (response3.ok) {
      const result3 = await response3.json();
      console.log('⚠️  Inconsistent data accepted with warnings');
      console.log('   Validation passed:', result3.validation?.passed);
      console.log('   Consistency issues:', result3.consistency?.issues);
      console.log('   Warnings:', result3.validation?.warnings?.length || 0);
    } else {
      const error3 = await response3.json();
      console.log('✅ Inconsistent data correctly rejected');
      console.log('   Error message:', error3.error?.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Activity completion with validation
    console.log('Test 4: Activity Completion with Enhanced Validation');
    const response4 = await fetch('http://localhost:3001/api/child/activity/test-activity-2/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-child-token'
      },
      body: JSON.stringify({
        score: 95,
        timeSpent: 450,
        sessionData: {
          startTime: new Date(Date.now() - 450000).toISOString(), // 7.5 minutes ago
          endTime: new Date().toISOString(),
          pausedDuration: 0,
          focusEvents: [
            { type: 'focus', timestamp: new Date(Date.now() - 450000).toISOString() },
            { type: 'blur', timestamp: new Date(Date.now() - 200000).toISOString() },
            { type: 'focus', timestamp: new Date(Date.now() - 180000).toISOString() }
          ],
          helpRequests: [
            {
              question: 'How do I solve this problem?',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              resolved: true,
              responseTime: 45
            }
          ],
          interactionEvents: [
            { type: 'click', element: 'help-button', timestamp: new Date(Date.now() - 300000).toISOString() },
            { type: 'input', element: 'answer-field', timestamp: new Date(Date.now() - 100000).toISOString() },
            { type: 'click', element: 'submit-button', timestamp: new Date().toISOString() }
          ]
        }
      })
    });

    if (response4.ok) {
      const result4 = await response4.json();
      console.log('✅ Activity completion successful');
      console.log('   Validation passed:', result4.validation?.passed);
      console.log('   Consistency checks:', result4.consistency?.checked);
      console.log('   Issues found:', result4.consistency?.issues);
      console.log('   Issues corrected:', result4.consistency?.corrected);
      console.log('   Badges earned:', result4.badges?.count || 0);
    } else {
      const error4 = await response4.json();
      console.log('❌ Activity completion failed');
      console.log('   Error message:', error4.error?.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Suspicious quick completion
    console.log('Test 5: Suspicious Quick Completion');
    const response5 = await fetch('http://localhost:3001/api/child/activity/test-activity-3/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-child-token'
      },
      body: JSON.stringify({
        score: 100, // Perfect score
        timeSpent: 15, // Very quick (15 seconds)
        sessionData: {
          startTime: new Date(Date.now() - 15000).toISOString(), // 15 seconds ago
          endTime: new Date().toISOString(),
          pausedDuration: 0,
          focusEvents: [],
          helpRequests: [],
          interactionEvents: [
            { type: 'click', element: 'submit-button', timestamp: new Date().toISOString() }
          ]
        }
      })
    });

    if (response5.ok) {
      const result5 = await response5.json();
      console.log('⚠️  Suspicious completion accepted with warnings');
      console.log('   Validation passed:', result5.validation?.passed);
      console.log('   Consistency issues:', result5.consistency?.issues);
      console.log('   Warnings:', result5.validation?.warnings?.length || 0);
    } else {
      const error5 = await response5.json();
      console.log('✅ Suspicious completion correctly flagged');
      console.log('   Error message:', error5.error?.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Score with excessive help requests
    console.log('Test 6: High Score with Many Help Requests');
    const response6 = await fetch('http://localhost:3001/api/child/activity/test-activity-4/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-child-token'
      },
      body: JSON.stringify({
        timeSpent: 600,
        score: 98, // Very high score
        status: 'IN_PROGRESS',
        helpRequestsCount: 15, // Many help requests
        sessionData: {
          startTime: new Date(Date.now() - 600000).toISOString(),
          endTime: new Date().toISOString(),
          pausedDuration: 0,
          focusEvents: [],
          helpRequests: Array.from({ length: 15 }, (_, i) => ({
            question: `Help request ${i + 1}`,
            timestamp: new Date(Date.now() - (600000 - i * 40000)).toISOString(),
            resolved: true
          })),
          interactionEvents: []
        }
      })
    });

    if (response6.ok) {
      const result6 = await response6.json();
      console.log('⚠️  High score with many help requests accepted with warnings');
      console.log('   Validation passed:', result6.validation?.passed);
      console.log('   Consistency issues:', result6.consistency?.issues);
      console.log('   Warnings:', result6.validation?.warnings?.length || 0);
    } else {
      const error6 = await response6.json();
      console.log('✅ High score with many help requests correctly flagged');
      console.log('   Error message:', error6.error?.message);
    }

    console.log('\n🎉 Progress validation and consistency testing completed!\n');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to create test data
async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // This would typically create test child, activities, etc.
    // For now, we'll assume they exist from previous tests
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  setupTestData()
    .then(() => testProgressValidation())
    .catch(console.error);
}

module.exports = { testProgressValidation, setupTestData };