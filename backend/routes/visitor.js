const express = require('express');
const { Visitor } = require('../database');
const { validate, visitorLogSchema } = require('../validators/schemas');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// @route   POST /api/visitors/log
// @desc    Log a new visitor's details
// @access  Public
router.post('/log', validate(visitorLogSchema), async (req, res) => {
  try {
    const { name, phone, address, buildingId } = req.body;

    const visitor = new Visitor({
      name,
      phone,
      address,
      lastVisit: new Date(),
      building: buildingId || null
    });

    await visitor.save();

    res.status(201).json({
      success: true,
      message: 'Visitor details logged successfully. Thank you!',
      data: { visitor }
    });
  } catch (error) {
    console.error('Visitor log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging visitor.'
    });
  }
});

// @route   GET /api/visitors
// @desc    Get all visitor logs (Admin only)
// @access  Private/Admin
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const visitors = await Visitor.find({})
      .populate('building', 'name') // Get building name
      .sort({ createdAt: -1 });     // Newest visitors first

    res.json({
      success: true,
      data: visitors
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching visitors.'
    });
  }
});

module.exports = router;