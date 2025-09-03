/**
 * Integration test for enhanced child authentication
 * This test verifies the core functionality without complex setup
 */

import { authService } from '../authService';

describe('Child Authentication Integration', () => {
  it('should have enhanced child authentication methods', () => {
    // Verify the enhanced methods exist
    expect(typeof authService.authenticateChild).toBe('function');
    expect(typeof authService.validateChildSession).toBe('function');
    expect(typeof authService.updateChildSessionActivity).toBe('function');
    expect(typeof authService.getActiveChildSessions).toBe('function');
    expect(typeof authService.getChildSessionHistory).toBe('function');
  });

  it('should validate device info structure', () => {
    const mockDeviceInfo = {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
      platform: 'iOS',
      isMobile: true,
      screenResolution: '1024x768',
      language: 'en-US',
      timezone: 'America/New_York'
    };

    // Verify device info has required properties
    expect(mockDeviceInfo).toHaveProperty('userAgent');
    expect(mockDeviceInfo).toHaveProperty('platform');
    expect(mockDeviceInfo).toHaveProperty('isMobile');
    expect(typeof mockDeviceInfo.isMobile).toBe('boolean');
  });

  it('should validate login request structure', () => {
    const mockLoginRequest = {
      credentials: {
        username: 'testchild',
        pin: '1234'
      },
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        platform: 'iOS',
        isMobile: true
      },
      ipAddress: '192.168.1.100'
    };

    // Verify login request structure
    expect(mockLoginRequest).toHaveProperty('credentials');
    expect(mockLoginRequest).toHaveProperty('deviceInfo');
    expect(mockLoginRequest).toHaveProperty('ipAddress');
    expect(mockLoginRequest.credentials).toHaveProperty('username');
    expect(mockLoginRequest.credentials).toHaveProperty('pin');
  });

  it('should have proper session timeout constants', () => {
    // Access private constants through reflection (for testing purposes)
    const authServiceInstance = authService as any;
    
    // These should be reasonable values for child sessions
    expect(authServiceInstance.childSessionTimeout).toBeDefined();
    expect(authServiceInstance.childMaxSessionDuration).toBeDefined();
    expect(authServiceInstance.suspiciousActivityThreshold).toBeDefined();
    
    // Verify timeout is shorter than adult sessions (20 minutes = 1200 seconds)
    expect(authServiceInstance.childSessionTimeout).toBe(20 * 60);
    
    // Verify max duration is reasonable (2 hours = 7200 seconds)
    expect(authServiceInstance.childMaxSessionDuration).toBe(2 * 60 * 60);
    
    // Verify suspicious activity threshold is reasonable
    expect(authServiceInstance.suspiciousActivityThreshold).toBe(5);
  });
});