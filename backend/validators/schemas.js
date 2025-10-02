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
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6).max(100),
  adminSecret: z.string().min(1)
});

const adminSigninSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1)
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  masterPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

// --- Feedback Schema ---
const feedbackSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  subject: z.string().min(5).max(100).trim(),
  message: z.string().min(10).max(1000).trim(),
});

// --- Building Schemas ---
const buildingSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  address: z.string().max(200).trim().optional(),
  floors: jsonString.pipe(
    z.array(z.object({
      number: z.string().min(1).trim(),
      name: z.string().min(1).trim()
    })).min(1)
  )
});

const buildingUpdateSchema = buildingSchema.partial();

// --- Landmark Schemas ---
const coordinatesSchema = z.object({
  x: z.number().min(0).max(10000),
  y: z.number().min(0).max(10000)
});

const accessibilitySchema = z.object({
  wheelchairAccessible: z.boolean().default(false),
  visualAidFriendly: z.boolean().default(false),
  hearingAidFriendly: z.boolean().default(false)
});

const landmarkSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  building: z.string().regex(/^[0-9a-fA-F]{24}$/),
  floor: z.string().min(1).trim(),
  coordinates: jsonString.pipe(coordinatesSchema),
  type: z.enum([
    'room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other',
    'lecture_hall', 'classroom', 'lab', 'library', 'auditorium', 'department_office',
    'admissions_office', 'student_union', 'cafeteria', 'bookstore', 'gym',
    'health_center', 'information_desk'
  ]),
  roomNumber: z.string().max(20).trim().optional()
});

const landmarkUpdateSchema = landmarkSchema.partial().extend({
  building: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

// --- Path Schemas (CORRECTED ORDER) ---

// 1. Define the accessibility schema for paths FIRST.
const pathAccessibilitySchema = z.object({
  wheelchairAccessible: z.boolean().default(true),
  requiresElevator: z.boolean().default(false),
  requiresStairs: z.boolean().default(false)
});

// 2. NOW, define the main path schema which can safely reference the one above.
const pathSchema = z.object({
  from: z.string().regex(/^[0-9a-fA-F]{24}$/),
  to: z.string().regex(/^[0-9a-fA-F]{24}$/),
  distance: z.string().transform(Number).refine(val => val >= 0.1),
  estimatedTime: z.string().transform(Number).refine(val => val >= 1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  instructions: z.string().min(10).max(500).trim(),
  images: z.array(z.object({
    url: z.string().url(),
    caption: z.string().max(200).optional(),
    stepNumber: z.number().min(1).optional()
  })).optional().default([]),
  accessibility: jsonString.pipe(pathAccessibilitySchema).optional().default({}),
  isBidirectional: z.preprocess(val => val === 'true', z.boolean()).default(true)
});

// 3. FINALLY, define the update schema which includes the reverseInstructions field.
const pathUpdateSchema = pathSchema.partial().extend({
  reverseInstructions: z.string().min(10).max(500).trim().optional()
});


// --- Navigation Schemas ---
const navigationRequestSchema = z.object({
  building: z.string().regex(/^[0-9a-fA-F]{24}$/),
  from: z.string().regex(/^[0-9a-fA-F]{24}$/),
  to: z.string().regex(/^[0-9a-fA-F]{24}$/),
  preferences: z.object({
    avoidStairs: z.boolean().default(false),
    wheelchairAccessible: z.boolean().default(false),
    shortestDistance: z.boolean().default(true)
  }).optional().default({})
});

const navigationFeedbackSchema = z.object({
  navigationId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).trim().optional(),
  actualTime: z.number().min(1).optional(),
  status: z.enum(['completed', 'cancelled']).optional()
});

// --- Visitor Schema ---
const visitorLogSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  phone: z.string().max(20).trim().optional(),
  address: z.string().min(5).max(250).trim().optional(),
  buildingId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

// --- Query Parameter Schemas ---
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100).optional().default(10)
});

const searchSchema = z.object({
  q: z.string().min(1).max(100).trim().optional(),
  type: z.enum(['room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other']).optional(),
  floor: z.string().optional(),
  building: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

// --- Middleware ---
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
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
  z,
  adminSignupSchema, adminSigninSchema,
  resetPasswordSchema,
  feedbackSchema,
  buildingSchema, buildingUpdateSchema,
  landmarkSchema, landmarkUpdateSchema,
  pathSchema, pathUpdateSchema,
  navigationRequestSchema, navigationFeedbackSchema,
  visitorLogSchema,
  paginationSchema, searchSchema,
  validate, validateQuery, validateParams
};