const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testSimpleAPI() {
  console.log('=== TESTING SIMPLE MASTER DATA API ===\n');

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

    // Test simple API endpoints
    const baseURL = 'http://localhost:3001/api/master-data-simple';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test grades endpoint
    console.log('\n📚 Testing simple /grades endpoint...');
    try {
      const gradesResponse = await fetch(`${baseURL}/grades`, { headers });
      if (gradesResponse.ok) {
        const grades = await gradesResponse.json();
        console.log(`✅ Simple Grades API working - returned ${grades.length} grades`);
        console.log('Sample grades:', grades.slice(0, 3).map(g => `${g.grade}: ${g.displayName}`));
      } else {
        console.log('❌ Simple Grades API failed:', gradesResponse.status, await gradesResponse.text());
      }
    } catch (error) {
      console.log('❌ Simple Grades API error:', error.message);
    }

    // Test subjects endpoint
    console.log('\n📖 Testing simple /subjects endpoint...');
    try {
      const subjectsResponse = await fetch(`${baseURL}/subjects`, { headers });
      if (subjectsResponse.ok) {
        const subjects = await subjectsResponse.json();
        console.log(`✅ Simple Subjects API working - returned ${subjects.length} subjects`);
        console.log('Sample subjects:', subjects.slice(0, 3).map(s => `${s.name}: ${s.displayName}`));
      } else {
        console.log('❌ Simple Subjects API failed:', subjectsResponse.status, await subjectsResponse.text());
      }
    } catch (error) {
      console.log('❌ Simple Subjects API error:', error.message);
    }

    // Test topics endpoint for a specific grade and subject
    console.log('\n📝 Testing simple /topics endpoint...');
    try {
      const topicsResponse = await fetch(`${baseURL}/topics/by-subject/K/mathematics`, { headers });
      if (topicsResponse.ok) {
        const topics = await topicsResponse.json();
        console.log(`✅ Simple Topics API working - returned ${topics.length} topics for K mathematics`);
        console.log('Sample topics:', topics.slice(0, 3).map(t => `${t.name}: ${t.displayName}`));
      } else {
        console.log('❌ Simple Topics API failed:', topicsResponse.status, await topicsResponse.text());
      }
    } catch (error) {
      console.log('❌ Simple Topics API error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleAPI();