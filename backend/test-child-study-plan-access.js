const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testChildStudyPlanAccess() {
  console.log('🧪 TESTING CHILD STUDY PLAN ACCESS');
  console.log('=====================================\n');

  try {
    // 1. Get test child
    const testChild = await prisma.childProfile.findFirst({
      where: { username: 'testchild' }
    });
    
    if (!testChild) {
      console.log('❌ Test child not found');
      return;
    }

    console.log('✅ Test child found:', testChild.name);

    // 2. Get an active study plan for this child
    const studyPlan = await prisma.studyPlan.findFirst({
      where: { 
        childId: testChild.id,
        status: 'ACTIVE'
      }
    });

    if (!studyPlan) {
      console.log('❌ No active study plan found for test child');
      return;
    }

    console.log('✅ Active study plan found:', studyPlan.id);

    // 3. Create JWT token for child
    const token = jwt.sign(
      { userId: testChild.id, role: 'CHILD' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // 4. Test the new child study plan endpoint
    const fetch = require('node-fetch');
    
    console.log('\n📝 Testing child study plan access...');
    console.log(`URL: /api/study-plans/child/${testChild.id}/plan/${studyPlan.id}`);

    const response = await fetch(`http://localhost:3001/api/study-plans/child/${testChild.id}/plan/${studyPlan.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Child study plan access successful!');
      console.log('📋 Plan details:');
      console.log(`   - ID: ${result.plan.id}`);
      console.log(`   - Subject: ${result.plan.subject}`);
      console.log(`   - Status: ${result.plan.status}`);
      console.log(`   - Activities: ${result.plan.activities?.length || 0}`);
      console.log(`   - Objectives: ${result.plan.objectives?.length || 0}`);
      
      console.log('\n🎉 Child can now access their study plans without 403 errors!');
    } else {
      console.log('❌ Child study plan access failed:', result);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChildStudyPlanAccess();