const express = require('express');
const { Admin, Building, Landmark, Path, NavigationHistory } = require('../database');
const { authenticate, requireAdmin, authLimiter, generateToken } = require('../middlewares/auth');
const { upload } = require('../middlewares/awsupload');
const { 
  validate, 
  validateQuery,
  adminSignupSchema,
  adminSigninSchema,
  buildingSchema,
  buildingUpdateSchema,
  landmarkSchema,
  landmarkUpdateSchema,
  pathSchema,
  pathUpdateSchema,
  paginationSchema,
  searchSchema
} = require('../validators/schemas');

const router = express.Router();

// ===============================
// AUTHENTICATION (Public Routes)
// ===============================

// Admin Signup
router.post('/signup', validate(adminSignupSchema), async (req, res) => {
    const { name, email, password, adminSecret } = req.body;

    // Validate the secret key to restrict admin creation
    if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ success: false, message: 'Not authorized to create an admin account.' });
    }

    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ success: false, message: 'Admin with this email already exists.' });
        }

        const admin = new Admin({ name, email, password });
        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully.',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                },
                token: generateToken(admin._id, admin.name, admin.role),
            }
        });
    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({ success: false, message: 'Server error during admin signup.' });
    }
});

// Admin Signin
router.post('/signin', authLimiter, validate(adminSigninSchema), async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        
        if (!admin.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
        }

        res.json({
            success: true,
            message: 'Logged in successfully.',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                },
                token: generateToken(admin._id, admin.name, admin.role),
            }
        });
    } catch (error) {
        console.error('Admin signin error:', error);
        res.status(500).json({ success: false, message: 'Server error during admin signin.' });
    }
});


// ===============================
// PROTECTED ADMIN ROUTES
// ===============================

// Middleware to protect all subsequent routes in this file
router.use(authenticate, requireAdmin);

// Get current admin's profile
router.get('/me', (req, res) => {
    res.json({ success: true, data: { admin: req.user } });
});


// ===============================
// BUILDING MANAGEMENT
// ===============================

// Get all buildings created by the logged-in admin
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => {
    try {
        const { page, limit } = req.query;
        const skip = (page - 1) * limit;

        const [buildings, total] = await Promise.all([
            Building.find({ createdBy: req.user._id, isActive: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'name email'),
            Building.countDocuments({ createdBy: req.user._id, isActive: true })
        ]);

        res.json({
            success: true,
            data: { buildings },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get buildings error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching buildings.' });
    }
});

// Create a new building
router.post('/buildings', upload.array('mapImages'), validate(buildingSchema), async (req, res) => {
    try {
        const buildingData = { ...req.body, createdBy: req.user._id };

        if (req.files && req.files.length > 0) {
            let imageIndex = 0;
            buildingData.floors = buildingData.floors.map(floor => ({
                ...floor,
                mapImage: req.files[imageIndex++]?.location || floor.mapImage
            }));
        }

        const building = new Building(buildingData);
        await building.save();
        await building.populate('createdBy', 'name email');
        res.status(201).json({ success: true, message: 'Building created successfully.', data: { building } });
    } catch (error) {
        console.error('Building creation error:', error);
        res.status(500).json({ success: false, message: 'Server error creating building.' });
    }
});

// Get a specific building by ID
router.get('/buildings/:id', async (req, res) => {
    try {
        const building = await Building.findOne({ _id: req.params.id, createdBy: req.user._id, isActive: true })
            .populate('createdBy', 'name email');
            
        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found or you do not have permission to view it.' });
        }
        res.json({ success: true, data: { building } });
    } catch (error) {
        console.error('Get building by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching building.' });
    }
});

// Update a building
router.put('/buildings/:id', upload.array('mapImages'), validate(buildingUpdateSchema), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Handle image updates logic here if necessary
        
        const building = await Building.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found or you do not have permission to update it.' });
        }
        res.json({ success: true, message: 'Building updated successfully.', data: { building } });
    } catch (error) {
        console.error('Building update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating building.' });
    }
});

// "Soft" delete a building
router.delete('/buildings/:id', async (req, res) => {
    try {
        const building = await Building.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            { isActive: false },
            { new: true }
        );

        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found or you do not have permission to delete it.' });
        }
        res.json({ success: true, message: 'Building deleted successfully.' });
    } catch (error) {
        console.error('Building delete error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting building.' });
    }
});


// ===============================
// LANDMARK MANAGEMENT
// ===============================

// Get all landmarks for the admin
router.get('/landmarks', validateQuery(paginationSchema.merge(searchSchema)), async (req, res) => {
    try {
        const { page, limit, q, type, floor, building } = req.query;
        const skip = (page - 1) * limit;

        let query = { createdBy: req.user._id, isActive: true };
        if (q) query.$text = { $search: q };
        if (type) query.type = type;
        if (floor) query.floor = floor;
        if (building) query.building = building;
        
        const [landmarks, total] = await Promise.all([
            Landmark.find(query).skip(skip).limit(limit).populate('building', 'name'),
            Landmark.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: { landmarks },
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get landmarks error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching landmarks.' });
    }
});

// Create a new landmark
router.post('/landmarks', upload.array('images', 5), validate(landmarkSchema), async (req, res) => {
    try {
        const landmarkData = { ...req.body, createdBy: req.user._id };
        
        // Ensure the admin owns the building they are adding a landmark to
        const parentBuilding = await Building.findOne({ _id: landmarkData.building, createdBy: req.user._id });
        if(!parentBuilding) {
            return res.status(403).json({ success: false, message: 'You can only add landmarks to your own buildings.' });
        }

        const landmark = new Landmark(landmarkData);
        await landmark.save();
        res.status(201).json({ success: true, message: 'Landmark created successfully.', data: { landmark } });
    } catch (error) {
        console.error('Landmark creation error:', error);
        res.status(500).json({ success: false, message: 'Server error creating landmark.' });
    }
});

// Update a landmark
router.put('/landmarks/:id', upload.array('images', 5), validate(landmarkUpdateSchema), async (req, res) => {
    try {
        const landmark = await Landmark.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!landmark) {
            return res.status(404).json({ success: false, message: 'Landmark not found or you do not have permission to update it.' });
        }
        res.json({ success: true, message: 'Landmark updated successfully.', data: { landmark } });
    } catch (error) {
        console.error('Landmark update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating landmark.' });
    }
});

// "Soft" delete a landmark
router.delete('/landmarks/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            { isActive: false },
            { new: true }
        );

        if (!landmark) {
            return res.status(404).json({ success: false, message: 'Landmark not found or you do not have permission to delete it.' });
        }
        res.json({ success: true, message: 'Landmark deleted successfully.' });
    } catch (error) {
        console.error('Landmark delete error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting landmark.' });
    }
});


// ===============================
// PATH MANAGEMENT
// ===============================

// (Similar CRUD operations for Paths, ensuring createdBy check)
// This section is left concise for brevity, but would follow the same pattern as Buildings/Landmarks


// ===============================
// DASHBOARD & ANALYTICS
// ===============================

router.get('/dashboard', async (req, res) => {
    try {
        const [buildingCount, landmarkCount, pathCount, recentNavigations] = await Promise.all([
            Building.countDocuments({ createdBy: req.user._id, isActive: true }),
            Landmark.countDocuments({ createdBy: req.user._id, isActive: true }),
            Path.countDocuments({ createdBy: req.user._id, isActive: true }),
            // This could be further scoped if NavigationHistory is linked to an admin
            NavigationHistory.find({}).sort({ createdAt: -1 }).limit(5) 
        ]);

        res.json({
            success: true,
            data: {
                counts: {
                    buildings: buildingCount,
                    landmarks: landmarkCount,
                    paths: pathCount,
                },
                recentNavigations
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


module.exports = router;
