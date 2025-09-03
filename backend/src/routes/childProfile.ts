import express from 'express';
import { childProfileService } from '../services/childProfileService';
import {
  validate,
  childProfileSchema,
  childCredentialsUpdateSchema
} from '../utils/validation';
import { authenticateToken, requireParent } from '../middleware/auth';

const router = express.Router();

// Create child profile endpoint (parent-only)
router.post('/', authenticateToken, requireParent, validate(childProfileSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const childProfile = await childProfileService.createChildProfile(req.user.userId, req.body);
    
    res.status(201).json({
      message: 'Child profile created successfully',
      childProfile
    });
  } catch (error) {
    console.error('Child profile creation error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Username is already taken') {
        return res.status(409).json({
          error: {
            code: 'USERNAME_EXISTS',
            message: 'This username is already taken. Please choose a different one.',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'PROFILE_CREATION_FAILED',
        message: 'Failed to create child profile. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Get all child profiles for parent
router.get('/', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const childProfiles = await childProfileService.getChildProfilesByParent(req.user.userId);
    
    res.json({
      message: 'Child profiles retrieved successfully',
      childProfiles,
      count: childProfiles.length
    });
  } catch (error) {
    console.error('Get child profiles error:', error);
    
    res.status(500).json({
      error: {
        code: 'PROFILES_FETCH_FAILED',
        message: 'Failed to retrieve child profiles. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Get specific child profile by ID
router.get('/:childId', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const childProfile = await childProfileService.getChildProfileById(req.params.childId, req.user.userId);
    
    if (!childProfile) {
      return res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Child profile not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    res.json({
      message: 'Child profile retrieved successfully',
      childProfile
    });
  } catch (error) {
    console.error('Get child profile error:', error);
    
    res.status(500).json({
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to retrieve child profile. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Update child profile
router.put('/:childId', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const updatedProfile = await childProfileService.updateChildProfile(
      req.params.childId, 
      req.user.userId, 
      req.body
    );
    
    res.json({
      message: 'Child profile updated successfully',
      childProfile: updatedProfile
    });
  } catch (error) {
    console.error('Child profile update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Child profile not found or access denied') {
        return res.status(404).json({
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Child profile not found or access denied',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message === 'Username is already taken') {
        return res.status(409).json({
          error: {
            code: 'USERNAME_EXISTS',
            message: 'This username is already taken. Please choose a different one.',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'Failed to update child profile. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Update child credentials (username/PIN)
router.put('/:childId/credentials', authenticateToken, requireParent, validate(childCredentialsUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const updatedProfile = await childProfileService.updateChildProfile(
      req.params.childId, 
      req.user.userId, 
      req.body
    );
    
    res.json({
      message: 'Child credentials updated successfully',
      childProfile: updatedProfile
    });
  } catch (error) {
    console.error('Child credentials update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Child profile not found or access denied') {
        return res.status(404).json({
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Child profile not found or access denied',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message === 'Username is already taken') {
        return res.status(409).json({
          error: {
            code: 'USERNAME_EXISTS',
            message: 'This username is already taken. Please choose a different one.',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'CREDENTIALS_UPDATE_FAILED',
        message: 'Failed to update child credentials. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Delete (deactivate) child profile
router.delete('/:childId', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    await childProfileService.deleteChildProfile(req.params.childId, req.user.userId);
    
    res.json({
      message: 'Child profile deleted successfully'
    });
  } catch (error) {
    console.error('Child profile deletion error:', error);
    
    if (error instanceof Error && error.message === 'Child profile not found or access denied') {
      return res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Child profile not found or access denied',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'PROFILE_DELETION_FAILED',
        message: 'Failed to delete child profile. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Check username availability
router.get('/check-username/:username', authenticateToken, requireParent, async (req, res) => {
  try {
    const isAvailable = await childProfileService.isUsernameAvailable(req.params.username);
    
    res.json({
      username: req.params.username,
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });
  } catch (error) {
    console.error('Username check error:', error);
    
    res.status(500).json({
      error: {
        code: 'USERNAME_CHECK_FAILED',
        message: 'Failed to check username availability. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

export default router;