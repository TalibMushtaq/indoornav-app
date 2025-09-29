const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Database connection
const { connectDB } = require('./database');
// S3 connection check
const { checkS3Connection } = require('./middlewares/awsupload');

// Routes
const adminRoutes = require('./routes/admin');
const navigationRoutes = require('./routes/navigation');
const visitorRoutes = require('./routes/visitor');
const feedbackRoutes = require("./routes/feedback"); 

// Error handler
const errorHandler = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();

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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/visitors', visitorRoutes);
app.use("/api/feedback", feedbackRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Indoor Navigation API' });
});

// Handle 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: ['/api/navigation', '/api/admin', '/api/visitors', '/api/feedback'] // <-- UPDATED 404 MESSAGE
  });
});

// Use error handler middleware
app.use(errorHandler);

// --- Server Startup Logic ---
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    // 2. Check AWS S3 connection
    await checkS3Connection();
    // 3. Start the Express server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
🚀 Indoor Navigation Server Started Successfully!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base: http://localhost:${PORT}/api
      `);
    });
  } catch (error)
 {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});


module.exports = app;

