const { z } = require('zod');

// User validation schemas
const userRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  role: z.enum(['user', 'admin']).optional().default('user')
});

const userLoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
});

const userUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim()
    .optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional()
});

// Building validation schemas
const buildingSchema = z.object({
  name: z.string()
    .min(2, 'Building name must be at least 2 characters')
    .max(100, 'Building name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .trim()
    .optional(),
  floors: z.array(z.object({
    number: z.string()
      .min(1, 'Floor number is required')
      .trim(),
    name: z.string()
      .min(1, 'Floor name is required')
      .trim(),
    mapImage: z.string().url().optional()
  })).min(1, 'At least one floor is required')
});

const buildingUpdateSchema = buildingSchema.partial();

// Landmark validation schemas
const coordinatesSchema = z.object({
  x: z.number()
    .min(0, 'X coordinate must be non-negative')
    .max(10000, 'X coordinate too large'),
  y: z.number()
    .min(0, 'Y coordinate must be non-negative')
    .max(10000, 'Y coordinate too large')
});

const accessibilitySchema = z.object({
  wheelchairAccessible: z.boolean().default(false),
  visualAidFriendly: z.boolean().default(false),
  hearingAidFriendly: z.boolean().default(false)
});

const landmarkSchema = z.object({
  name: z.string()
    .min(2, 'Landmark name must be at least 2 characters')
    .max(100, 'Landmark name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  building: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID'),
  floor: z.string()
    .min(1, 'Floor is required')
    .trim(),
  coordinates: coordinatesSchema,
  type: z.enum([
    'room', 'entrance', 'elevator', 'stairs', 
    'restroom', 'emergency_exit', 'facility', 'other'
  ]),
  roomNumber: z.string()
    .max(20, 'Room number must be less than 20 characters')
    .trim()
    .optional(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    caption: z.string().max(200).optional(),
    isPrimary: z.boolean().default(false)
  })).optional().default([]),
  accessibility: accessibilitySchema.optional().default({})
});

const landmarkUpdateSchema = landmarkSchema.partial().extend({
  building: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID')
    .optional()
});

// Path validation schemas
const pathAccessibilitySchema = z.object({
  wheelchairAccessible: z.boolean().default(true),
  requiresElevator: z.boolean().default(false),
  requiresStairs: z.boolean().default(false)
});

const pathSchema = z.object({
  from: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid from landmark ID'),
  to: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid to landmark ID'),
  distance: z.number()
    .min(0.1, 'Distance must be at least 0.1 meters')
    .max(10000, 'Distance too large'),
  estimatedTime: z.number()
    .min(1, 'Estimated time must be at least 1 second')
    .max(3600, 'Estimated time too large'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  instructions: z.string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(500, 'Instructions must be less than 500 characters')
    .trim(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    caption: z.string().max(200).optional(),
    stepNumber: z.number().min(1).optional()
  })).optional().default([]),
  accessibility: pathAccessibilitySchema.optional().default({}),
  isBidirectional: z.boolean().default(true)
});

const pathUpdateSchema = pathSchema.partial();

// Navigation validation schemas
const navigationRequestSchema = z.object({
  building: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID'),
  from: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid from landmark ID'),
  to: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid to landmark ID'),
  preferences: z.object({
    avoidStairs: z.boolean().default(false),
    wheelchairAccessible: z.boolean().default(false),
    shortestDistance: z.boolean().default(true)
  }).optional().default({})
});

const navigationFeedbackSchema = z.object({
  navigationId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid navigation ID'),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string()
    .max(500, 'Comment must be less than 500 characters')
    .trim()
    .optional(),
  actualTime: z.number()
    .min(1, 'Actual time must be at least 1 second')
    .optional()
});

// Query parameter schemas
const paginationSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(val => parseInt(val))
    .refine(val => val > 0, 'Page must be greater than 0')
    .optional()
    .default('1')
    .transform(val => typeof val === 'string' ? parseInt(val) : val),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('10')
    .transform(val => typeof val === 'string' ? parseInt(val) : val)
});

const searchSchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .trim()
    .optional(),
  type: z.enum(['room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other'])
    .optional(),
  floor: z.string().optional(),
  building: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID')
    .optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Query validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Params validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parameter validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

module.exports = {
  // Schemas
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  buildingSchema,
  buildingUpdateSchema,
  landmarkSchema,
  landmarkUpdateSchema,
  pathSchema,
  pathUpdateSchema,
  navigationRequestSchema,
  navigationFeedbackSchema,
  paginationSchema,
  searchSchema,
  
  // Middleware
  validate,
  validateQuery,
  validateParams
};