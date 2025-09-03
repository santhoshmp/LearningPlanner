const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function recreateUser() {
  try {
    // Delete existing user
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
    
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
    
    console.log('Test user recreated successfully:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    // Verify password works
    const isValidPassword = await bcrypt.compare('password123', user.passwordHash);
    console.log('Password verification:', isValidPassword);
    
    console.log('\nYou can now login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error recreating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateUser();