const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
// const fs = require('fs'); // fs is no longer needed for this
require('dotenv').config();

// Database connection
const { connectDB } = require('./database');

// Routes
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const navigationRoutes = require('./routes/navigation');

// Error handler
const errorHandler = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: { /* ... existing directives ... */ },
}));

// CORS configuration
const corsOptions = { /* ... existing options ... */ };
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- REMOVED ---
// The code block for creating './uploads' directory and app.use('/uploads', ...) has been removed.
// S3 now handles all file serving.
// ---------------

// Request logging middleware
app.use((req, res, next) => { /* ... existing code ... */ });

// Health check endpoint
app.get('/health', (req, res) => { /* ... existing code ... */ });

// API routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/navigation', navigationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => { /* ... existing code ... */ });

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: ['/api/user', '/api/navigation', '/api/admin']
  });
});

// Use error handler middleware
app.use(errorHandler);

// Handle graceful shutdown and exceptions
process.on('SIGTERM', () => { /* ... */ });
process.on('SIGINT', () => { /* ... */ });
process.on('unhandledRejection', (err) => { /* ... */ });
process.on('uncaughtException', (err) => { /* ... */ });

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