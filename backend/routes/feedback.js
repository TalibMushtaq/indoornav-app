// routes/feedback.js

const express = require('express');
const router = express.Router();
const { Feedback } = require('../database'); // Make sure this path is correct

/**
 * @desc    Submit new feedback from the contact form
 * @route   POST /api/feedback/submit
 * @access  Public
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Create a new feedback entry in the database.
    const feedback = await Feedback.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    // Send a success response.
    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We will get back to you shortly.',
      data: feedback,
    });

  } catch (error) {
    // Pass any errors to the global error handler.
    next(error);
  }
};

// Define the route and attach the handler logic directly
router.post('/submit', submitFeedback);

// Export the configured router
module.exports = router;