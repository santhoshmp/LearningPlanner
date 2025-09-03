const { PrismaClient } = require('@prisma/client');
const { authService } = require('./src/services/authService');

const prisma = new PrismaClient();

async function testChildAuthDirect() {
  try {
    console.log('Testing child authentication directly...');
    
    const loginRequest = {
      credentials: {
        username: 'testchild',
        pin: '1234'
      },
      deviceInfo: {
        userAgent: 'Test Browser',
        platform: 'Test Platform',
        isMobile: false,
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        language: 'en-US'
      },
      ipAddress: '127.0.0.1'
    };
    
    const result = await authService.authenticateChild(loginRequest);
    console.log('✅ Child authentication successful');
    console.log('Child ID:', result.child.id);
    console.log('Token length:', result.token.length);
    
  } catch (error) {
    console.error('❌ Child authentication failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testChildAuthDirect();