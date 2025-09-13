const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceActivityContent() {
  try {
    console.log('🎨 Enhancing activity content...');
    
    // Enhanced content for each activity type
    const enhancedActivities = [
      {
        title: 'Number Recognition Practice',
        content: {
          type: 'interactive',
          data: {
            description: 'Practice recognizing and writing numbers from 1 to 20. Click on the correct number when you see it!',
            instructions: 'Look at each number carefully and practice writing it.',
            difficulty: 'intermediate',
            exercises: [
              { number: 5, word: 'five' },
              { number: 12, word: 'twelve' },
              { number: 18, word: 'eighteen' }
            ]
          }
        }
      },
      {
        title: 'Shape Identification Game',
        content: {
          type: 'interactive',
          data: {
            description: 'Learn to identify different shapes! Can you find all the circles, squares, and triangles?',
            instructions: 'Look at each shape and identify what it is.',
            difficulty: 'intermediate',
            shapes: ['circle', 'square', 'triangle', 'rectangle']
          }
        }
      },
      {
        title: 'Basic Addition Problems',
        content: {
          type: 'quiz',
          data: {
            instructions: 'Solve these addition problems step by step.',
            difficulty: 'intermediate',
            questions: [
              {
                text: 'What is 5 + 3?',
                type: 'multiple-choice',
                options: ['6', '7', '8', '9'],
                correct: 2
              },
              {
                text: 'What is 12 + 7?',
                type: 'multiple-choice',
                options: ['18', '19', '20', '21'],
                correct: 1
              },
              {
                text: 'What is 15 + 6?',
                type: 'multiple-choice',
                options: ['20', '21', '22', '23'],
                correct: 1
              }
            ]
          }
        }
      }
    ];

    // Update each activity
    for (const activityData of enhancedActivities) {
      const activity = await prisma.studyActivity.findFirst({
        where: {
          title: activityData.title,
          plan: {
            childId: 'cmfeccya6000fnjw9k5yo2m0l'
          }
        }
      });

      if (activity) {
        await prisma.studyActivity.update({
          where: { id: activity.id },
          data: {
            content: JSON.stringify(activityData.content)
          }
        });
        console.log('✅ Enhanced:', activityData.title);
      } else {
        console.log('❌ Activity not found:', activityData.title);
      }
    }

    // Also enhance the test activities we created earlier
    const testActivities = [
      {
        title: 'Addition Practice',
        content: {
          type: 'quiz',
          data: {
            instructions: 'Solve these addition problems',
            difficulty: 'intermediate',
            questions: [
              {
                text: 'What is 15 + 27?',
                type: 'multiple-choice',
                options: ['40', '41', '42', '43'],
                correct: 2
              },
              {
                text: 'What is 34 + 18?',
                type: 'multiple-choice',
                options: ['50', '51', '52', '53'],
                correct: 2
              }
            ]
          }
        }
      },
      {
        title: 'Subtraction Challenge',
        content: {
          type: 'interactive',
          data: {
            description: 'Practice subtraction with larger numbers. Work through each problem step by step!',
            instructions: 'Solve these subtraction problems step by step',
            difficulty: 'intermediate',
            exercises: [
              { problem: '85 - 37', solution: '48' },
              { problem: '92 - 46', solution: '46' }
            ]
          }
        }
      },
      {
        title: 'Fraction Basics',
        content: {
          type: 'text',
          data: {
            content: '<h2>Understanding Fractions</h2><p>A fraction represents a part of a whole. The top number (numerator) tells us how many parts we have, and the bottom number (denominator) tells us how many parts the whole is divided into.</p><p>For example, in the fraction 1/2, we have 1 part out of 2 total parts.</p><img src="/images/fractions-example.png" alt="Fraction examples" style="max-width: 100%; height: auto;" />',
            instructions: 'Learn about fractions through visual examples',
            difficulty: 'intermediate',
            comprehensionQuestion: 'Can you explain what a fraction represents in your own words?'
          }
        }
      }
    ];

    for (const activityData of testActivities) {
      const activity = await prisma.studyActivity.findFirst({
        where: {
          title: activityData.title,
          plan: {
            childId: 'cmfck6wu900015vm5lar2u7oi' // Test child ID
          }
        }
      });

      if (activity) {
        await prisma.studyActivity.update({
          where: { id: activity.id },
          data: {
            content: JSON.stringify(activityData.content)
          }
        });
        console.log('✅ Enhanced test activity:', activityData.title);
      }
    }

    console.log('\n🎉 All activities enhanced with proper content!');
    
  } catch (error) {
    console.error('❌ Error enhancing activities:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

enhanceActivityContent();