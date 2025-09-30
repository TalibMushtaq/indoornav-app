const { z } = require('zod');

// Helper to handle stringified JSON in multipart/form-data
const jsonString = z.string().transform((val, ctx) => {
  try {
    return JSON.parse(val);
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid JSON string",
    });
    return z.NEVER;
  }
});

// --- Admin Schemas ---
const adminSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  adminSecret: z.string().min(1, "Admin secret is required for signup.")
});

const adminSigninSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

// --- Feedback Schema ---
const feedbackSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  email: z.string().email('A valid email is required').toLowerCase().trim(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100).trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000).trim(),
});

// --- Building Schemas (UPDATED 
const buildingSchema = z.object({
  name: z.string().min(2, 'Building name must be at least 2 characters').max(100, 'Building name must be less than 100 characters').trim(),
  description: z.string().max(500, 'Description must be less than 500 characters').trim().optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').trim().optional(),
  floors: jsonString.pipe(z.array(z.object({
    number: z.string().min(1, 'Floor number is required').trim(),
    name: z.string().min(1, 'Floor name is required').trim()
   
  })).min(1, 'At least one floor is required'))
  
});

const buildingUpdateSchema = buildingSchema.partial();

// --- Landmark Schemas ---
const coordinatesSchema = z.object({
  x: z.number().min(0, 'X coordinate must be non-negative').max(10000, 'X coordinate too large'),
  y: z.number().min(0, 'Y coordinate must be non-negative').max(10000, 'Y coordinate too large')
});

const accessibilitySchema = z.object({
  wheelchairAccessible: z.boolean().default(false),
  visualAidFriendly: z.boolean().default(false),
  hearingAidFriendly: z.boolean().default(false)
});

const landmarkSchema = z.object({
  name: z.string().min(2, 'Landmark name must be at least 2 characters').max(100, 'Landmark name must be less than 100 characters').trim(),
  description: z.string().max(500, 'Description must be less than 500 characters').trim().optional(),
  building: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID'),
  floor: z.string().min(1, 'Floor is required').trim(),
  coordinates: jsonString.pipe(coordinatesSchema),
  type: z.enum([
      'room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other',
      'lecture_hall', 'classroom', 'lab', 'library', 'auditorium', 'department_office',
      'admissions_office', 'student_union', 'cafeteria', 'bookstore', 'gym', 
      'health_center', 'information_desk'
  ]),
  roomNumber: z.string().max(20, 'Room number must be less than 20 characters').trim().optional(),
  // Images are handled by multer, so they are not in the Zod schema for validation
  // accessibility: jsonString.pipe(accessibilitySchema).optional().default({})
});

const landmarkUpdateSchema = landmarkSchema.partial().extend({
  building: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID').optional()
});

// --- Path Schemas ---
const pathAccessibilitySchema = z.object({
  wheelchairAccessible: z.boolean().default(true),
  requiresElevator: z.boolean().default(false),
  requiresStairs: z.boolean().default(false)
});

const pathSchema = z.object({
  from: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid from landmark ID'),
  to: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid to landmark ID'),
  distance: z.string().transform(Number).refine(val => val >= 0.1, 'Distance must be at least 0.1 meters'),
  estimatedTime: z.string().transform(Number).refine(val => val >= 1, 'Estimated time must be at least 1 second'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters').max(500, 'Instructions must be less than 500 characters').trim(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    caption: z.string().max(200).optional(),
    stepNumber: z.number().min(1).optional()
  })).optional().default([]),
  accessibility: jsonString.pipe(pathAccessibilitySchema).optional().default({}),
  isBidirectional: z.preprocess((val) => val === 'true', z.boolean()).default(true)
});

const pathUpdateSchema = pathSchema.partial();

// --- Navigation Schemas ---
const navigationRequestSchema = z.object({
  building: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID'),
  from: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid from landmark ID'),
  to: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid to landmark ID'),
  preferences: z.object({
    avoidStairs: z.boolean().default(false),
    wheelchairAccessible: z.boolean().default(false),
    shortestDistance: z.boolean().default(true)
  }).optional().default({})
});

const navigationFeedbackSchema = z.object({
  navigationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid navigation ID'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(500, 'Comment must be less than 500 characters').trim().optional(),
  actualTime: z.number().min(1, 'Actual time must be at least 1 second').optional(),
  status: z.enum(['completed', 'cancelled']).optional()
});

// --- Visitor Schema ---
const visitorLogSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100, 'Name is too long').trim(),
  email: z.string().email('A valid email is required').toLowerCase().trim(),
  phone: z.string().max(20, 'Phone number is too long').trim().optional(),
  buildingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID').optional(),
});

// --- Query Parameter Schemas ---
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/,'Page must be a number').transform(val => parseInt(val)).refine(val => val > 0, 'Page must be greater than 0').optional().default('1'),
  limit: z.string().regex(/^\d+$/,'Limit must be a number').transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional().default('10')
});

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long').trim().optional(),
  type: z.enum(['room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other']).optional(),
  floor: z.string().optional(),
  building: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID').optional()
});

// --- Middleware (CORRECTED) ---
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        // FIX: Zod errors use 'issues', not 'errors'
        errors: error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }
    next(error);
  }
};

const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }
    next(error);
  }
};

const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors: error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }
    next(error);
  }
};

module.exports = {
  adminSignupSchema, adminSigninSchema,
  feedbackSchema,
  buildingSchema, buildingUpdateSchema,
  landmarkSchema, landmarkUpdateSchema,
  pathSchema, pathUpdateSchema,
  navigationRequestSchema, navigationFeedbackSchema,
  visitorLogSchema,
  paginationSchema, searchSchema,
  validate, validateQuery, validateParams
};