import { profileService } from '../profileService';

// Simple integration test to verify the service can be instantiated and basic methods work
describe('ProfileService Integration', () => {
  it('should validate profile data correctly', () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      settings: {
        theme: 'dark' as const,
        privacyLevel: 'standard' as const,
      },
    };

    const result = profileService.validateProfileData(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should sanitize profile data correctly', () => {
    const dirtyData = {
      firstName: '  John<script>  ',
      lastName: '  Doe>alert()  ',
      email: '  JOHN@EXAMPLE.COM  ',
      settings: {
        theme: 'dark' as const,
      },
    };

    const result = profileService.sanitizeProfileData(dirtyData);
    expect(result.firstName).toBe('Johnscript');
    expect(result.lastName).toBe('Doealert()');
    expect(result.email).toBe('john@example.com');
    expect(result.settings?.theme).toBe('dark');
  });

  it('should return validation errors for invalid data', () => {
    const invalidData = {
      firstName: '', // Too short
      lastName: 'A'.repeat(51), // Too long
      email: 'invalid-email', // Invalid format
      settings: {
        theme: 'invalid' as any,
        privacyLevel: 'invalid' as any,
      },
    };

    const result = profileService.validateProfileData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('First name must be between 1 and 50 characters');
    expect(result.errors).toContain('Last name must be between 1 and 50 characters');
    expect(result.errors).toContain('Invalid email format');
    expect(result.errors).toContain('Invalid theme value');
    expect(result.errors).toContain('Invalid privacy level');
  });
});