import Joi from 'joi';

// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    'any.required': 'Password is required'
  });

// Parent registration validation schema
export const parentRegistrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: passwordSchema,
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    })
});

// Parent login validation schema
export const parentLoginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Email verification token validation schema
export const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .length(64)
    .hex()
    .required()
    .messages({
      'string.length': 'Invalid verification token',
      'string.hex': 'Invalid verification token',
      'any.required': 'Verification token is required'
    })
});

// Password reset request validation schema
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Password reset validation schema
export const passwordResetSchema = Joi.object({
  token: Joi.string()
    .length(64)
    .hex()
    .required()
    .messages({
      'string.length': 'Invalid reset token',
      'string.hex': 'Invalid reset token',
      'any.required': 'Reset token is required'
    }),
  password: passwordSchema
});

// Password update validation schema
export const passwordUpdateSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: passwordSchema
});

// Refresh token validation schema
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

// Child profile validation schemas
export const childProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Child name is required',
      'string.max': 'Child name must not exceed 50 characters',
      'any.required': 'Child name is required'
    }),
  age: Joi.number()
    .integer()
    .min(3)
    .max(18)
    .required()
    .messages({
      'number.min': 'Child must be at least 3 years old',
      'number.max': 'Child must be 18 years old or younger',
      'any.required': 'Child age is required'
    }),
  gradeLevel: Joi.string()
    .valid('K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12')
    .required()
    .messages({
      'any.only': 'Please select a valid grade level',
      'any.required': 'Grade level is required'
    }),
  learningStyle: Joi.string()
    .valid('VISUAL', 'AUDITORY', 'KINESTHETIC', 'MIXED')
    .default('MIXED')
    .messages({
      'any.only': 'Please select a valid learning style'
    }),
  username: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 20 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'any.required': 'Username is required'
    }),
  pin: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.length': 'PIN must be exactly 4 digits',
      'string.pattern.base': 'PIN must contain only numbers',
      'any.required': 'PIN is required'
    }),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'colorful').default('colorful'),
    soundEnabled: Joi.boolean().default(true),
    animationsEnabled: Joi.boolean().default(true),
    difficultyPreference: Joi.string().valid('easy', 'medium', 'hard', 'adaptive').default('adaptive')
  }).default({})
});

// Child login validation schema
export const childLoginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  pin: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.length': 'PIN must be exactly 4 digits',
      'string.pattern.base': 'PIN must contain only numbers',
      'any.required': 'PIN is required'
    })
});

// Enhanced child login validation schema with device info
export const enhancedChildLoginSchema = Joi.object({
  credentials: Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'any.required': 'Username is required'
      }),
    pin: Joi.string()
      .length(4)
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        'string.length': 'PIN must be exactly 4 digits',
        'string.pattern.base': 'PIN must contain only numbers',
        'any.required': 'PIN is required'
      })
  }).required(),
  deviceInfo: Joi.object({
    userAgent: Joi.string().required(),
    platform: Joi.string().required(),
    isMobile: Joi.boolean().required(),
    screenResolution: Joi.string().optional(),
    language: Joi.string().optional(),
    timezone: Joi.string().optional()
  }).required(),
  ipAddress: Joi.string().ip().required()
});

// Child credentials update validation schema
export const childCredentialsUpdateSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 20 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
    }),
  pin: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .messages({
      'string.length': 'PIN must be exactly 4 digits',
      'string.pattern.base': 'PIN must contain only numbers'
    })
}).min(1); // At least one field must be provided

// Validation middleware function
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    req.body = value;
    next();
  };
};