import express from 'express';
import { authService } from '../services/authService';

const router = express.Router();

// Test endpoint for child authentication
router.post('/test-child-auth', async (req, res) => {
  try {
    console.log('🧪 Test child auth endpoint called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
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
    
    console.log('Calling authService.authenticateChild...');
    const authResult = await authService.authenticateChild(loginRequest);
    
    console.log('Authentication successful!');
    res.json({
      success: true,
      message: 'Child authentication test successful',
      childId: authResult.child.id,
      childName: authResult.child.name,
      tokenLength: authResult.accessToken.length
    });
    
  } catch (error) {
    console.error('Test child auth error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;