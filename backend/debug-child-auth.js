const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function debugChildAuth() {
  try {
    console.log('🔍 Debugging Child Authentication...');
    
    // Test 1: Check if child profile exists
    console.log('\n1. Checking child profile...');
    const childProfile = await prisma.childProfile.findUnique({
      where: { 
        username: 'testchild',
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!childProfile) {
      console.log('❌ Child profile not found or not active');
      return;
    }
    
    console.log('✅ Child profile found:', {
      id: childProfile.id,
      name: childProfile.name,
      username: childProfile.username,
      isActive: childProfile.isActive,
      parentId: childProfile.parentId
    });
    
    // Test 2: Check PIN validation
    console.log('\n2. Testing PIN validation...');
    const isPinValid = await bcrypt.compare('1234', childProfile.pinHash);
    console.log('PIN validation result:', isPinValid);
    
    if (!isPinValid) {
      console.log('❌ PIN validation failed');
      return;
    }
    
    // Test 3: Try to create login session
    console.log('\n3. Testing login session creation...');
    try {
      const loginSession = await prisma.childLoginSession.create({
        data: {
          childId: childProfile.id,
          loginTime: new Date(),
          deviceInfo: {
            userAgent: 'Test Browser',
            platform: 'Test Platform',
            isMobile: false
          },
          ipAddress: '127.0.0.1',
          isActive: true
        }
      });
      
      console.log('✅ Login session created:', loginSession.id);
      
      // Clean up - delete the test session
      await prisma.childLoginSession.delete({
        where: { id: loginSession.id }
      });
      
    } catch (sessionError) {
      console.log('❌ Login session creation failed:', sessionError.message);
      return;
    }
    
    // Test 4: Check refresh token creation
    console.log('\n4. Testing refresh token creation...');
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token-' + Date.now(),
          childId: childProfile.id,
          expiresAt
        }
      });
      
      console.log('✅ Refresh token created:', refreshToken.id);
      
      // Clean up - delete the test token
      await prisma.refreshToken.delete({
        where: { id: refreshToken.id }
      });
      
    } catch (tokenError) {
      console.log('❌ Refresh token creation failed:', tokenError.message);
      return;
    }
    
    console.log('\n✅ All database operations successful!');
    console.log('The issue might be in:');
    console.log('- Redis connection');
    console.log('- JWT token generation');
    console.log('- Security monitoring middleware');
    console.log('- Request validation');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChildAuth();