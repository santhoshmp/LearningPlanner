const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Simple child authentication test
async function testSimpleChildAuth() {
  try {
    console.log('🧪 Testing Simple Child Authentication...');
    
    const credentials = {
      username: 'testchild',
      pin: '1234'
    };
    
    // Step 1: Find child profile
    console.log('\n1. Finding child profile...');
    const childProfile = await prisma.childProfile.findUnique({
      where: { 
        username: credentials.username,
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
      console.log('❌ Child profile not found');
      return;
    }
    
    console.log('✅ Child profile found');
    
    // Step 2: Validate PIN
    console.log('\n2. Validating PIN...');
    const isPinValid = await bcrypt.compare(credentials.pin, childProfile.pinHash);
    
    if (!isPinValid) {
      console.log('❌ PIN validation failed');
      return;
    }
    
    console.log('✅ PIN validation successful');
    
    // Step 3: Create login session
    console.log('\n3. Creating login session...');
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
    
    // Step 4: Generate JWT token
    console.log('\n4. Generating JWT token...');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = {
      userId: childProfile.id,
      role: 'CHILD',
      parentId: childProfile.parentId
    };
    
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '20m' });
    console.log('✅ JWT token generated');
    
    // Step 5: Generate refresh token
    console.log('\n5. Creating refresh token...');
    const refreshTokenValue = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const refreshToken = await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        childId: childProfile.id,
        expiresAt
      }
    });
    
    console.log('✅ Refresh token created');
    
    // Step 6: Prepare response
    const { pinHash, ...childWithoutPin } = childProfile;
    const authResult = {
      child: childWithoutPin,
      accessToken,
      refreshToken: refreshTokenValue,
      sessionId: loginSession.id,
      expiresIn: 1200 // 20 minutes
    };
    
    console.log('\n✅ Authentication successful!');
    console.log('Child ID:', authResult.child.id);
    console.log('Child Name:', authResult.child.name);
    console.log('Token length:', authResult.accessToken.length);
    
    // Clean up test data
    await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
    await prisma.childLoginSession.delete({ where: { id: loginSession.id } });
    
    return authResult;
    
  } catch (error) {
    console.error('❌ Simple authentication failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleChildAuth();