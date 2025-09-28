const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Database connection
const { connectDB } = require('./database');

// Routes
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const navigationRoutes = require('./routes/navigation');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, uploadsDir)));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/navigation', navigationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Indoor Navigation System API',
    version: '1.0.0',
    endpoints: {
      user: {
        description: 'User authentication and profile management',
        routes: [
          'POST /api/user/register',
          'POST /api/user/login',
          'GET /api/user/profile',
          'PUT /api/user/profile',
          'POST /api/user/change-password',
          'GET /api/user/navigation-history',
          'POST /api/user/navigation-feedback',
          'GET /api/user/stats',
          'DELETE /api/user/account'
        ]
      },
      navigation: {
        description: 'Navigation and route planning',
        routes: [
          'GET /api/navigation/buildings',
          'GET /api/navigation/buildings/:id/landmarks',
          'POST /api/navigation/route',
          'GET /api/navigation/landmarks/:id',
          'GET /api/navigation/search',
          'GET /api/navigation/popular',
          'GET /api/navigation/nearby/:id',
          'GET /api/navigation/accessibility/:buildingId',
          'PUT /api/navigation/history/:id/status'
        ]
      },
      admin: {
        description: 'Admin management endpoints',
        routes: [
          'GET /api/admin/dashboard',
          'GET/POST/PUT/DELETE /api/admin/buildings',
          'GET/POST/PUT/DELETE /api/admin/landmarks',
          'GET/POST/PUT/DELETE /api/admin/paths',
          'GET /api/admin/users',
          'PUT /api/admin/users/:id/status',
          'GET /api/admin/analytics/buildings/:id',
          'GET /api/admin/export/buildings'
        ]
      }
    },
    documentation: 'https://github.com/yourrepo/indoor-navigation-api'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: ['/api/user', '/api/navigation', '/api/admin']
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Indoor Navigation Server Started Successfully!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Configuration needed'}
🔗 API Base: http://localhost:${PORT}/api
📚 Health Check: http://localhost:${PORT}/health
${process.env.NODE_ENV !== 'production' ? `🔧 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}` : ''}
  `);
});

module.exports = app;