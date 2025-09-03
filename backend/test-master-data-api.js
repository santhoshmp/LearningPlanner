const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testMasterDataAPI() {
  console.log('=== TESTING MASTER DATA API ===\n');

  try {
    // Get a real user from the database to create a valid token
    const user = await prisma.user.findFirst({
      where: { role: 'PARENT' }
    });

    if (!user) {
      console.log('❌ No parent user found in database');
      return;
    }

    // Create a valid JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('✅ Created valid JWT token for user:', user.id);

    // Test API endpoints
    const baseURL = 'http://localhost:3001/api/master-data';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test grades endpoint
    console.log('\n📚 Testing /grades endpoint...');
    try {
      const gradesResponse = await fetch(`${baseURL}/grades`, { headers });
      if (gradesResponse.ok) {
        const grades = await gradesResponse.json();
        console.log(`✅ Grades API working - returned ${grades.length} grades`);
        console.log('Sample grades:', grades.slice(0, 3).map(g => `${g.grade}: ${g.displayName}`));
      } else {
        console.log('❌ Grades API failed:', gradesResponse.status, await gradesResponse.text());
      }
    } catch (error) {
      console.log('❌ Grades API error:', error.message);
    }

    // Test subjects endpoint
    console.log('\n📖 Testing /subjects endpoint...');
    try {
      const subjectsResponse = await fetch(`${baseURL}/subjects`, { headers });
      if (subjectsResponse.ok) {
        const subjects = await subjectsResponse.json();
        console.log(`✅ Subjects API working - returned ${subjects.length} subjects`);
        console.log('Sample subjects:', subjects.slice(0, 3).map(s => `${s.name}: ${s.displayName}`));
      } else {
        console.log('❌ Subjects API failed:', subjectsResponse.status, await subjectsResponse.text());
      }
    } catch (error) {
      console.log('❌ Subjects API error:', error.message);
    }

    // Test topics endpoint for a specific grade and subject
    console.log('\n📝 Testing /topics endpoint...');
    try {
      const topicsResponse = await fetch(`${baseURL}/topics/by-subject/K/mathematics`, { headers });
      if (topicsResponse.ok) {
        const topics = await topicsResponse.json();
        console.log(`✅ Topics API working - returned ${topics.length} topics for K mathematics`);
        console.log('Sample topics:', topics.slice(0, 3).map(t => `${t.name}: ${t.displayName}`));
      } else {
        console.log('❌ Topics API failed:', topicsResponse.status, await topicsResponse.text());
      }
    } catch (error) {
      console.log('❌ Topics API error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMasterDataAPI();