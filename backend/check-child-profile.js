const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkChildProfile() {
  try {
    // Find the test parent first
    const parent = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!parent) {
      console.log('Test parent not found');
      return;
    }
    
    console.log('Parent found:', parent.id);
    
    // Find child profiles for this parent
    const children = await prisma.childProfile.findMany({
      where: { parentId: parent.id }
    });
    
    console.log('Number of child profiles:', children.length);
    
    for (const child of children) {
      console.log('\nChild Profile:', {
        id: child.id,
        name: child.name,
        username: child.username,
        age: child.age,
        gradeLevel: child.gradeLevel
      });
      
      // Test PIN
      if (child.pinHash) {
        const isPinValid = await bcrypt.compare('1234', child.pinHash);
        console.log('PIN 1234 valid:', isPinValid);
      } else {
        console.log('No PIN hash found');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChildProfile();