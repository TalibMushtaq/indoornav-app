// routes/feedback.js

const express = require('express');
const router = express.Router();
const { Feedback } = require('../database'); // Make sure this path is correct
const rateLimit = require('express-rate-limit');

// IP-based rate limiter (unchanged)
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @desc    Submit new feedback from the contact form
 * @route   POST /api/feedback/submit
 * @access  Public
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // --- New Email Verification Logic ---
    // 1. Count how many times this email has been used for feedback.
    const existingFeedbackCount = await Feedback.countDocuments({ email });

    // 2. If the count is 3 or more, block the submission.
    if (existingFeedbackCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the maximum number of submissions. Thank you for your feedback.',
      });
    }
    // --- End of New Logic ---

    // If the check passes, create the new feedback entry.
    const feedback = await Feedback.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We will get back to you shortly.',
      data: feedback,
    });
  } catch (error)
 {
    next(error);
  }
};

// Apply both the IP rate limiter and the handler logic to the route
router.post('/submit', feedbackLimiter, submitFeedback);

module.exports = router;