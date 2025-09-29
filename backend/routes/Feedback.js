const { Feedback } = require('../database');

/**
 * @desc    Submit new feedback from the contact form
 * @route   POST /api/feedback/submit
 * @access  Public
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Attempt to create a new feedback entry in the database.
    const feedback = await Feedback.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    // Send a success response if the entry is created.
    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We will get back to you shortly.',
      data: feedback,
    });

  } catch (error) {
    // If any error occurs in the 'try' block (e.g., a Mongoose validation error
    // or a database connection issue), it will be caught here.
    // We then pass the error to the 'next' middleware, which is your
    // global errorHandler.
    next(error);
  }
};

