const express = require('express');
const { Visitor } = require('../database'); // We assume Visitor model is added to your database index
const { validate, visitorLogSchema } = require('../validators/schemas'); // Assuming you add a validator for visitors

const router = express.Router();

// @route   POST /api/visitors/log
// @desc    Log a new visitor's details
// @access  Public
router.post('/log', validate(visitorLogSchema), async (req, res) => {
    try {
        const { name, email, phone, buildingId } = req.body;

        // Optional: Check if a visitor with this email has visited before today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let visitor = await Visitor.findOne({
            email,
            createdAt: { $gte: startOfDay }
        });

        if (visitor) {
            // Visitor already logged today, maybe just update their last visit time
            visitor.lastVisit = new Date();
            await visitor.save();
            return res.status(200).json({
                success: true,
                message: 'Welcome back! Your visit has been updated.',
                data: { visitor }
            });
        }

        // Create a new visitor log
        visitor = new Visitor({
            name,
            email,
            phone,
            lastVisit: new Date(),
            // You might want to associate a visit with a specific building
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
        res.status(500).json({ success: false, message: 'Server error while logging visitor.' });
    }
});


module.exports = router;
