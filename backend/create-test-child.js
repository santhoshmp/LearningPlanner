const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestChild() {
  try {
    // Find the test parent
    const parent = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!parent) {
      console.log('Test parent not found. Please create the parent first.');
      return;
    }
    
    // Hash the PIN
    const pinHash = await bcrypt.hash('1234', 12);
    
    // Create test child
    const child = await prisma.childProfile.create({
      data: {
        name: 'Test Child',
        age: 8,
        gradeLevel: '3rd Grade',
        learningStyle: 'VISUAL',
        username: 'testchild',
        pinHash,
        parentId: parent.id,
        preferences: {}
      }
    });
    
    console.log('Test child created successfully:', {
      id: child.id,
      name: child.name,
      username: child.username,
      parentId: child.parentId
    });
    
    console.log('You can now use this child ID for analytics testing:', child.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Test child already exists');
    } else {
      console.error('Error creating test child:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestChild();