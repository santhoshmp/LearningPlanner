const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndUpdateChildProfile() {
  try {
    // Find the test child
    const child = await prisma.childProfile.findUnique({
      where: { username: 'testchild' }
    });
    
    if (!child) {
      console.log('Test child not found');
      return;
    }
    
    console.log('Child profile:', {
      id: child.id,
      name: child.name,
      username: child.username,
      isActive: child.isActive
    });
    
    // Update to make sure it's active
    if (!child.isActive) {
      const updated = await prisma.childProfile.update({
        where: { id: child.id },
        data: { isActive: true }
      });
      console.log('Updated child to active:', updated.isActive);
    } else {
      console.log('Child is already active');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateChildProfile();