const express = require('express');
const { Building } = require('../database'); // Assuming Building model is exported
const router = express.Router();

// @route   GET /api/buildings/list
// @desc    Get a simplified list of active buildings for dropdowns
// @access  Public
router.get('/list', async (req, res) => {
    try {
        const buildings = await Building.find({ isActive: true }).select('name');
        res.json({
            success: true,
            data: buildings.map(b => ({ id: b._id, name: b.name }))
        });
    } catch (error) {
        console.error('Error fetching building list:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;