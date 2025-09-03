const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testChildProfileCreation() {
  console.log('🧪 TESTING CHILD PROFILE CREATION');
  console.log('==================================\n');

  try {
    // Get a parent user
    const parent = await prisma.user.findFirst({
      where: { role: 'PARENT' }
    });

    if (!parent) {
      console.log('❌ No parent user found');
      return;
    }

    console.log(`✅ Found parent user: ${parent.id}`);

    // Create a valid JWT token
    const token = jwt.sign(
      { userId: parent.id, role: parent.role }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Test child profile creation with valid data
    const testChildData = {
      name: 'Test Child',
      age: 8,
      gradeLevel: '3', // Using the correct format from our database
      learningStyle: 'VISUAL',
      username: `testchild_${Date.now()}`, // Unique username
      pin: '1234',
      preferences: {
        theme: 'colorful',
        soundEnabled: true,
        animationsEnabled: true,
        difficultyPreference: 'adaptive'
      }
    };

    console.log('📝 Testing child profile creation with data:');
    console.log('   Name:', testChildData.name);
    console.log('   Age:', testChildData.age);
    console.log('   Grade Level:', testChildData.gradeLevel);
    console.log('   Learning Style:', testChildData.learningStyle);
    console.log('   Username:', testChildData.username);

    // Make API call to create child profile
    const response = await fetch('http://localhost:3001/api/child-profiles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testChildData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Child profile created successfully!');
      console.log('   Child ID:', result.childProfile.id);
      console.log('   Name:', result.childProfile.name);
      console.log('   Grade Level:', result.childProfile.gradeLevel);
      
      // Clean up - delete the test child
      await prisma.childProfile.delete({
        where: { id: result.childProfile.id }
      });
      console.log('🧹 Test child profile cleaned up');
      
    } else {
      const error = await response.text();
      console.log('\n❌ Child profile creation failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', error);
      
      // Try to parse as JSON for better error display
      try {
        const errorJson = JSON.parse(error);
        if (errorJson.error) {
          console.log('   Error Code:', errorJson.error.code);
          console.log('   Error Message:', errorJson.error.message);
        }
        if (errorJson.details) {
          console.log('   Validation Details:', JSON.stringify(errorJson.details, null, 2));
        }
      } catch (e) {
        // Error is not JSON, already displayed above
      }
    }

    // Test with invalid grade level to verify validation
    console.log('\n📝 Testing with invalid grade level...');
    const invalidChildData = {
      ...testChildData,
      gradeLevel: 'invalid-grade',
      username: `testchild_invalid_${Date.now()}`
    };

    const invalidResponse = await fetch('http://localhost:3001/api/child-profiles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidChildData)
    });

    if (!invalidResponse.ok) {
      console.log('✅ Validation correctly rejected invalid grade level');
    } else {
      console.log('❌ Validation should have rejected invalid grade level');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChildProfileCreation();