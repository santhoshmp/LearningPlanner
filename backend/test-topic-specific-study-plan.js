const axios = require('axios');

async function testTopicSpecificStudyPlan() {
  try {
    console.log('Testing topic-specific study plan generation...\n');
    
    // Test data - English Language Arts with specific topics
    const testData = {
      childId: 'test-child-123',
      subject: 'English',
      grade: '5',
      difficulty: 'INTERMEDIATE',
      selectedTopics: ['reading-comprehension', 'creative-writing', 'vocabulary-building'],
      learningStyle: 'visual',
      additionalNotes: 'Focus on improving reading skills and creative expression'
    };
    
    console.log('Creating study plan with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Make API call to create study plan
    const response = await axios.post('http://localhost:3001/api/study-plans', testData, {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a valid token
        'Content-Type': 'application/json'
      }
    });
    
    const studyPlan = response.data.plan;
    
    console.log('Generated Study Plan:');
    console.log('===================');
    console.log(`Subject: ${studyPlan.subject}`);
    console.log(`Grade: ${studyPlan.grade}`);
    console.log(`Difficulty: ${studyPlan.difficulty}`);
    console.log(`Selected Topics: ${studyPlan.selectedTopics.join(', ')}`);
    console.log('\nObjectives:');
    studyPlan.objectives.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.description}`);
    });
    
    console.log('\nActivities:');
    studyPlan.activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title}`);
      console.log(`   Description: ${activity.description}`);
      console.log(`   Type: ${activity.content.type}`);
      console.log(`   Duration: ${activity.estimatedDuration} minutes`);
      console.log(`   Subject: ${activity.subject}`);
      if (activity.content.data.relatedTopics) {
        console.log(`   Related Topics: ${activity.content.data.relatedTopics.join(', ')}`);
      }
      console.log('');
    });
    
    // Verify that activities match the selected subject and topics
    console.log('Verification:');
    console.log('=============');
    
    const subjectMatches = studyPlan.activities.every(activity => 
      activity.subject === testData.subject
    );
    console.log(`✓ All activities match subject (${testData.subject}): ${subjectMatches}`);
    
    const topicMatches = studyPlan.activities.some(activity => 
      activity.content.data.relatedTopics && 
      activity.content.data.relatedTopics.some(topic => 
        testData.selectedTopics.includes(topic)
      )
    );
    console.log(`✓ Activities relate to selected topics: ${topicMatches}`);
    
    const hasEnglishActivities = studyPlan.activities.some(activity =>
      activity.title.toLowerCase().includes('reading') ||
      activity.title.toLowerCase().includes('writing') ||
      activity.title.toLowerCase().includes('vocabulary')
    );
    console.log(`✓ Contains English-specific activities: ${hasEnglishActivities}`);
    
    const noMathActivities = !studyPlan.activities.some(activity =>
      activity.title.toLowerCase().includes('number') ||
      activity.title.toLowerCase().includes('addition') ||
      activity.title.toLowerCase().includes('shape')
    );
    console.log(`✓ No math activities in English plan: ${noMathActivities}`);
    
    if (subjectMatches && topicMatches && hasEnglishActivities && noMathActivities) {
      console.log('\n🎉 SUCCESS: Study plan correctly matches subject and topics!');
    } else {
      console.log('\n❌ ISSUE: Study plan does not properly match subject and topics');
    }
    
  } catch (error) {
    console.error('Error testing study plan:', error.response?.data || error.message);
    
    // If API call fails, test the topic-specific activities directly
    console.log('\nTesting topic-specific activities directly...');
    
    const { getActivitiesForTopics } = require('./src/data/topicSpecificActivities');
    
    const activities = getActivitiesForTopics('English', ['reading-comprehension', 'creative-writing']);
    console.log('\nDirect topic activities:');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.type}, ${activity.estimatedDuration}min)`);
      console.log(`   ${activity.description}`);
      console.log(`   Related Topics: ${activity.relatedTopics.join(', ')}`);
    });
  }
}

// Test with Math as well
async function testMathStudyPlan() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('Testing Math study plan...\n');
    
    const testData = {
      childId: 'test-child-123',
      subject: 'Mathematics',
      grade: '5',
      difficulty: 'INTERMEDIATE',
      selectedTopics: ['fractions-decimals', 'multiplication-division'],
      learningStyle: 'kinesthetic',
      additionalNotes: 'Focus on practical applications'
    };
    
    console.log('Creating Math study plan with data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Test topic-specific activities directly since API might not be running
    const { getActivitiesForTopics } = require('./src/data/topicSpecificActivities');
    
    const activities = getActivitiesForTopics('Mathematics', testData.selectedTopics);
    console.log('\nMath topic activities:');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.type}, ${activity.estimatedDuration}min)`);
      console.log(`   ${activity.description}`);
      console.log(`   Related Topics: ${activity.relatedTopics.join(', ')}`);
    });
    
    const hasMathActivities = activities.some(activity =>
      activity.title.toLowerCase().includes('fractions') ||
      activity.title.toLowerCase().includes('multiplication') ||
      activity.title.toLowerCase().includes('decimals')
    );
    console.log(`\n✓ Contains Math-specific activities: ${hasMathActivities}`);
    
  } catch (error) {
    console.error('Error testing math study plan:', error.message);
  }
}

// Run tests
testTopicSpecificStudyPlan().then(() => {
  return testMathStudyPlan();
}).then(() => {
  console.log('\n✅ Topic-specific study plan testing completed!');
}).catch(error => {
  console.error('Test failed:', error);
});