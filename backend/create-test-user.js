const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('password123', 12);
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        role: 'PARENT',
        isEmailVerified: true
      }
    });
    
    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    console.log('You can now login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Test user already exists');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();