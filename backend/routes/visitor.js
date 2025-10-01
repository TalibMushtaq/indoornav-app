const express = require('express');
const { Visitor } = require('../database');
const { validate, visitorLogSchema } = require('../validators/schemas');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');

const VISITOR_TOKEN_SECRET = process.env.JWT_SECRET

const router = express.Router();

/**
 * @route   POST /api/visitors/log
 * @desc    Log a new visitor's details
 * @access  Public
 */
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

    // Create a token valid for 12 hours
    const token = jwt.sign(
      { visitorId: visitor._id },
      VISITOR_TOKEN_SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      message: 'Visitor details logged successfully.',
      data: { visitor, token }
    });
  } catch (error) {
    console.error('Visitor log error:', error);
    res.status(500).json({ success: false, message: 'Server error while logging visitor.' });
  }
});

/**
 * @route   GET /api/visitors
 * @desc    Get all visitor logs (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const visitors = await Visitor.find({})
      .populate('building', 'name') // Include only the building name
      .sort({ createdAt: -1 });     // Most recent visitors first

    res.status(200).json({
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
