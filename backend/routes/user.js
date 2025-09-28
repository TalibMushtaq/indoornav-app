const express = require('express');
const { User, NavigationHistory } = require('../database');
const { authenticate, generateToken, authLimiter } = require('../middlewares/auth');
const {
  validate,
  validateQuery,
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  navigationFeedbackSchema,
  paginationSchema
} = require('../validators/schemas');

const router = express.Router();

// @route   POST /api/user/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validate(userRegistrationSchema), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({ name, email, password, role });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/user/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validate(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, validate(userUpdateSchema), async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/user/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// @route   GET /api/user/navigation-history
// @desc    Get user navigation history
// @access  Private
router.get('/navigation-history', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const navigations = await NavigationHistory.find({ user: req.user._id })
      .populate('building', 'name')
      .populate('fromLandmark', 'name type')
      .populate('toLandmark', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await NavigationHistory.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        navigations,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Navigation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching navigation history'
    });
  }
});

// @route   POST /api/user/navigation-feedback
// @desc    Submit navigation feedback
// @access  Private
router.post('/navigation-feedback', authenticate, validate(navigationFeedbackSchema), async (req, res) => {
  try {
    const { navigationId, rating, comment, actualTime, status } = req.body;

    const navigation = await NavigationHistory.findOne({
      _id: navigationId,
      user: req.user._id
    });

    if (!navigation) {
      return res.status(404).json({
        success: false,
        message: 'Navigation record not found'
      });
    }

    navigation.feedback = { rating, comment };
    if (actualTime) navigation.actualTime = actualTime;
    if (status) navigation.status = status;
    
    if (status === 'completed' && !navigation.completedAt) {
      navigation.completedAt = new Date();
    }

    await navigation.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { navigation }
    });
  } catch (error) {
    console.error('Navigation feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback'
    });
  }
});

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await NavigationHistory.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalNavigations: { $sum: 1 },
          completedNavigations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalDistance: { $sum: '$totalDistance' },
          totalTime: { $sum: '$estimatedTime' },
          averageRating: { $avg: '$feedback.rating' }
        }
      }
    ]);

    const recentNavigations = await NavigationHistory.find({ user: req.user._id })
      .populate('building', 'name')
      .populate('toLandmark', 'name type')
      .sort({ createdAt: -1 })
      .limit(5);

    const userStats = stats[0] || {
      totalNavigations: 0,
      completedNavigations: 0,
      totalDistance: 0,
      totalTime: 0,
      averageRating: 0
    };

    res.json({
      success: true,
      data: {
        stats: userStats,
        recentNavigations
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account (soft delete)
// @access  Private
router.delete('/account', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
});

module.exports = router;