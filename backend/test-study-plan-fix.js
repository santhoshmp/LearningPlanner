const axios = require('axios');

async function testStudyPlanFix() {
  try {
    console.log('Testing study plan topic matching fix...\n');
    
    // First, let's get a valid auth token by creating a test user
    console.log('1. Creating test user...');
    const userResponse = await axios.post('http://localhost:3001/api/auth/register', {
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'parent'
    }).catch(err => {
      if (err.response?.status === 409) {
        console.log('   User already exists, trying to login...');
        return axios.post('http://localhost:3001/api/auth/login', {
          email: 'testuser@example.com',
          password: 'TestPassword123!'
        });
      }
      throw err;
    });
    
    const token = userResponse.data.accessToken;
    console.log('   ✓ Got auth token');
    
    // Create a test child profile
    console.log('2. Creating test child profile...');
    const childResponse = await axios.post('http://localhost:3001/api/child-profiles', {
      name: 'Test Child',
      age: 11,
      gradeLevel: '5',
      username: 'testchild123',
      pin: '1234',
      learningStyle: 'visual'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => {
      if (err.response?.status === 409) {
        console.log('   Child profile already exists, using existing one');
        return { data: { childProfile: { id: 'existing-child-id' } } };
      }
      throw err;
    });
    
    const childId = childResponse.data.childProfile?.id || 'test-child-id';
    console.log('   ✓ Child profile ready');
    
    // Test 1: English Language Arts Study Plan
    console.log('\n3. Testing English Language Arts study plan...');
    const englishPlan = {
      childId: childId,
      subject: 'English',
      grade: '5',
      difficulty: 'INTERMEDIATE',
      selectedTopics: ['reading-comprehension', 'creative-writing', 'vocabulary-building'],
      learningStyle: 'visual',
      additionalNotes: 'Focus on improving reading skills and creative expression'
    };
    
    const englishResponse = await axios.post('http://localhost:3001/api/study-plans', englishPlan, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const englishStudyPlan = englishResponse.data.plan;
    console.log('   ✓ English study plan created');
    
    // Verify English plan
    console.log('\n   English Plan Analysis:');
    console.log(`   Subject: ${englishStudyPlan.subject}`);
    console.log(`   Selected Topics: ${englishStudyPlan.selectedTopics.join(', ')}`);
    console.log(`   Number of Activities: ${englishStudyPlan.activities.length}`);
    
    console.log('\n   Activities:');
    englishStudyPlan.activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.title}`);
      console.log(`      Type: ${activity.content.type}`);
      console.log(`      Duration: ${activity.estimatedDuration} minutes`);
      console.log(`      Subject: ${activity.subject}`);
      if (activity.content.data.relatedTopics) {
        console.log(`      Related Topics: ${activity.content.data.relatedTopics.join(', ')}`);
      }
    });
    
    // Check if activities match the subject
    const englishSubjectMatch = englishStudyPlan.activities.every(activity => 
      activity.subject === 'English'
    );
    
    const hasEnglishContent = englishStudyPlan.activities.some(activity =>
      activity.title.toLowerCase().includes('reading') ||
      activity.title.toLowerCase().includes('writing') ||
      activity.title.toLowerCase().includes('vocabulary') ||
      activity.title.toLowerCase().includes('comprehension')
    );
    
    const noMathContent = !englishStudyPlan.activities.some(activity =>
      activity.title.toLowerCase().includes('number') ||
      activity.title.toLowerCase().includes('addition') ||
      activity.title.toLowerCase().includes('shape') ||
      activity.title.toLowerCase().includes('multiplication')
    );
    
    console.log('\n   English Plan Verification:');
    console.log(`   ✓ All activities have correct subject: ${englishSubjectMatch}`);
    console.log(`   ✓ Contains English-specific content: ${hasEnglishContent}`);
    console.log(`   ✓ No math content in English plan: ${noMathContent}`);
    
    // Test 2: Mathematics Study Plan
    console.log('\n4. Testing Mathematics study plan...');
    const mathPlan = {
      childId: childId,
      subject: 'Mathematics',
      grade: '5',
      difficulty: 'INTERMEDIATE',
      selectedTopics: ['fractions-decimals', 'multiplication-division', 'geometry-basics'],
      learningStyle: 'kinesthetic',
      additionalNotes: 'Focus on practical applications and visual learning'
    };
    
    const mathResponse = await axios.post('http://localhost:3001/api/study-plans', mathPlan, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const mathStudyPlan = mathResponse.data.plan;
    console.log('   ✓ Math study plan created');
    
    // Verify Math plan
    console.log('\n   Math Plan Analysis:');
    console.log(`   Subject: ${mathStudyPlan.subject}`);
    console.log(`   Selected Topics: ${mathStudyPlan.selectedTopics.join(', ')}`);
    console.log(`   Number of Activities: ${mathStudyPlan.activities.length}`);
    
    console.log('\n   Activities:');
    mathStudyPlan.activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.title}`);
      console.log(`      Type: ${activity.content.type}`);
      console.log(`      Duration: ${activity.estimatedDuration} minutes`);
      console.log(`      Subject: ${activity.subject}`);
      if (activity.content.data.relatedTopics) {
        console.log(`      Related Topics: ${activity.content.data.relatedTopics.join(', ')}`);
      }
    });
    
    // Check if activities match the subject
    const mathSubjectMatch = mathStudyPlan.activities.every(activity => 
      activity.subject === 'Mathematics'
    );
    
    const hasMathContent = mathStudyPlan.activities.some(activity =>
      activity.title.toLowerCase().includes('fraction') ||
      activity.title.toLowerCase().includes('decimal') ||
      activity.title.toLowerCase().includes('multiplication') ||
      activity.title.toLowerCase().includes('division') ||
      activity.title.toLowerCase().includes('geometry')
    );
    
    const noEnglishContent = !mathStudyPlan.activities.some(activity =>
      activity.title.toLowerCase().includes('reading') ||
      activity.title.toLowerCase().includes('writing') ||
      activity.title.toLowerCase().includes('vocabulary')
    );
    
    console.log('\n   Math Plan Verification:');
    console.log(`   ✓ All activities have correct subject: ${mathSubjectMatch}`);
    console.log(`   ✓ Contains Math-specific content: ${hasMathContent}`);
    console.log(`   ✓ No English content in Math plan: ${noEnglishContent}`);
    
    // Overall Results
    console.log('\n' + '='.repeat(60));
    console.log('OVERALL TEST RESULTS:');
    console.log('='.repeat(60));
    
    const allTestsPassed = englishSubjectMatch && hasEnglishContent && noMathContent &&
                          mathSubjectMatch && hasMathContent && noEnglishContent;
    
    if (allTestsPassed) {
      console.log('🎉 SUCCESS: All tests passed!');
      console.log('✅ Study plans now correctly match selected subjects and topics');
      console.log('✅ No more mismatched activities (e.g., math activities in English plans)');
      console.log('✅ Topic-specific activity generation is working properly');
    } else {
      console.log('❌ ISSUES FOUND:');
      if (!englishSubjectMatch) console.log('   - English plan has incorrect subject assignments');
      if (!hasEnglishContent) console.log('   - English plan missing English-specific content');
      if (!noMathContent) console.log('   - English plan contains math content');
      if (!mathSubjectMatch) console.log('   - Math plan has incorrect subject assignments');
      if (!hasMathContent) console.log('   - Math plan missing Math-specific content');
      if (!noEnglishContent) console.log('   - Math plan contains English content');
    }
    
    console.log('\n📊 Test Summary:');
    console.log(`   English Plan Activities: ${englishStudyPlan.activities.length}`);
    console.log(`   Math Plan Activities: ${mathStudyPlan.activities.length}`);
    console.log(`   Subject Matching: ${englishSubjectMatch && mathSubjectMatch ? 'PASS' : 'FAIL'}`);
    console.log(`   Content Relevance: ${hasEnglishContent && hasMathContent ? 'PASS' : 'FAIL'}`);
    console.log(`   No Cross-contamination: ${noMathContent && noEnglishContent ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: Authentication failed. Make sure the server is running and auth is working.');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Note: Validation error. Check the request data format.');
    }
  }
}

// Run the test
testStudyPlanFix().then(() => {
  console.log('\n✅ Study plan fix testing completed!');
}).catch(error => {
  console.error('Test execution failed:', error);
});