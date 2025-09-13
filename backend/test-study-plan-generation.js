const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function) {
  console.log('🧪 TESTING STUD);
  conso');

  try {
    // 1. Get test ushild
    const testUser = await pri
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    con({
      
    });
    
    if (!testChild) {
      console.log('❌ Test child not found');
      return;
    }

    con);
    co;

    // 
    const token = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: 'PAR
      process.env.JWT_SECRET-key',
      { expiresIn: '1h' }
    );

    /
    
    
    const studyPlanData = {
      cild.id,
      subject: 'mathematics',
      grade: 'K',
      difficulty: 'BEGINNER',
      selectedTopics: ['counties'],
      learningStyle: 'visual',
      areation'
    };

    connData);

    const response = await fetch('http://localhost:3001/api/study-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
       
     
   
   });

    const result = awai
    
   k) {
      console.l
      console.l);
      c
      console.log('📚 Ac);
      
      // Check obre
      if (result.plan.objectives) {
        console.log('\n🎯 OBJECTIVES:');
        result.plan.objectives.forEach((obj, index) => {
         `);
        ;
      }
      
      // Check activities st
      if (result. {
        console.log('\n📚 ACTIVITIES:');
        result.plan.activities.forEach((activity, index) => {
         
       
     }
   
  ');
 else {
      console.log('❌ Study plan creation failed:', r);
    }

  ror) {
    console.error('❌ Error duri', error);
  } finally {
    await prisma.$disconnect();
  }
}

tn();ratioGeneyPlanestStud