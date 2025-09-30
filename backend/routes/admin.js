const express = require('express');
const { Admin, Building, Landmark, Path, NavigationHistory } = require('../database');
const { authenticate, requireAdmin, authLimiter, generateToken } = require('../middlewares/auth');
const { upload, deleteFromS3 } = require('../middlewares/awsupload');
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
router.post('/signup', validate(adminSignupSchema), async (req, res) => {
    const { name, email, password, adminSecret } = req.body;
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
                admin: { id: admin._id, name: admin.name, email: admin.email },
                token: generateToken(admin._id, admin.name, admin.role),
            }
        });
    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({ success: false, message: 'Server error during admin signup.' });
    }
});

router.post('/signin', authLimiter, validate(adminSigninSchema), async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email }).select('+password');
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
                admin: { id: admin._id, name: admin.name, email: admin.email },
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
router.use(authenticate, requireAdmin);

router.get('/me', (req, res) => {
    res.json({ success: true, data: { admin: req.user } });
});

// ===============================
// BUILDING MANAGEMENT
// ===============================
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => {
    try {
        const { page, limit } = req.query;
        const skip = (page - 1) * limit;
        const [buildings, total] = await Promise.all([
            Building.find({ createdBy: req.user._id, isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'name email'),
            Building.countDocuments({ createdBy: req.user._id, isActive: true })
        ]);
        res.json({
            success: true,
            data: { buildings },
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching buildings.' });
    }
});

router.post('/buildings', upload.single('image'), validate(buildingSchema), async (req, res) => {
    try {
        const buildingData = { 
            ...req.body, 
            createdBy: req.user._id
        };

        // Parse floors only if it's a string (from multipart form data)
        if (buildingData.floors && typeof buildingData.floors === 'string') {
            buildingData.floors = JSON.parse(buildingData.floors);
        }

        // Add the single image URL if uploaded
        if (req.file) {
            buildingData.image = req.file.location;
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

router.get('/buildings/:id', async (req, res) => {
    try {
        const building = await Building.findOne({ _id: req.params.id, createdBy: req.user._id, isActive: true }).populate('createdBy', 'name email');
        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found.' });
        }
        res.json({ success: true, data: { building } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching building.' });
    }
});

router.put('/buildings/:id', upload.single('image'), validate(buildingUpdateSchema), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Parse floors if they're sent as string
        if (updateData.floors && typeof updateData.floors === 'string') {
            updateData.floors = JSON.parse(updateData.floors);
        }

        // Add new image if uploaded
        if (req.file) {
            updateData.image = req.file.location;
        }

        const building = await Building.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id }, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');
        
        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found.' });
        }
        
        res.json({ success: true, message: 'Building updated successfully.', data: { building } });
    } catch (error) {
        console.error('Building update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating building.' });
    }
});

// DELETE a building and its associated landmarks
router.delete('/buildings/:id', authenticate, async (req, res) => {
    try {
        const building = await Building.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found.' });
        }
        
        // Find all landmarks associated with this building
        const landmarks = await Landmark.find({ building: building._id });
        const landmarkIds = landmarks.map(l => l._id);
        const urlsToDelete = [];
        
        // Add building image to deletion list
        if (building.image) {
            urlsToDelete.push(building.image);
        }
        
        // Add landmark images to deletion list
        const landmarkImageUrls = landmarks.flatMap(l => l.images.map(img => img.url));
        urlsToDelete.push(...landmarkImageUrls);
        
        // Delete images from S3
        if (urlsToDelete.length > 0) {
            try {
                await deleteFromS3(urlsToDelete);
                console.log(`✅ Deleted ${urlsToDelete.length} images from S3`);
            } catch (s3Error) {
                console.error('❌ S3 deletion failed:', s3Error);
                // Continue with database deletion even if S3 fails
            }
        }
        
        // Delete all paths associated with these landmarks
        const pathsDeleted = await Path.deleteMany({
            $or: [
                { from: { $in: landmarkIds } },
                { to: { $in: landmarkIds } }
            ]
        });
        console.log(`✅ Deleted ${pathsDeleted.deletedCount} paths associated with building landmarks`);
        
        // Delete all navigation history associated with this building
        const navHistoryDeleted = await NavigationHistory.deleteMany({ building: building._id });
        console.log(`✅ Deleted ${navHistoryDeleted.deletedCount} navigation history records`);
        
        // HARD DELETE landmarks from database
        await Landmark.deleteMany({ building: building._id });
        console.log(`✅ Deleted ${landmarks.length} landmarks from database`);
        
        // HARD DELETE building from database
        await Building.findByIdAndDelete(building._id);
        console.log(`✅ Building "${building.name}" deleted from database`);
        
        res.json({ 
            success: true, 
            message: 'Building and all associated data deleted successfully.',
            data: {
                deletedCounts: {
                    landmarks: landmarks.length,
                    paths: pathsDeleted.deletedCount,
                    navigationHistory: navHistoryDeleted.deletedCount,
                    images: urlsToDelete.length
                }
            }
        });
    } catch (error) {
        console.error('Building delete error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting building.' });
    }
});

// ===============================
// LANDMARK MANAGEMENT
// ===============================
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
            Landmark.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('building', 'name').select('name type floor building images'),
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

router.get('/landmarks/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findOne({ _id: req.params.id, createdBy: req.user._id, isActive: true }).populate('building', 'name floors');
        if (!landmark) {
            return res.status(404).json({ success: false, message: 'Landmark not found.' });
        }
        res.json({ success: true, data: { landmark } });
    } catch (error) {
        console.error('Get landmark by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching landmark.' });
    }
});

router.post('/landmarks', upload.array('images', 5), validate(landmarkSchema), async (req, res) => {
    try {
        const landmarkData = { ...req.body, createdBy: req.user._id };
        const parentBuilding = await Building.findOne({ _id: landmarkData.building, createdBy: req.user._id });
        if (!parentBuilding) {
            return res.status(403).json({ success: false, message: 'You can only add landmarks to your own buildings.' });
        }
        const existingLandmark = await Landmark.findOne({
            name: landmarkData.name,
            building: landmarkData.building,
            floor: landmarkData.floor,
            createdBy: req.user._id
        });
        if (existingLandmark) {
            return res.status(400).json({ success: false, message: `A landmark named "${landmarkData.name}" already exists on this floor.` });
        }
        
        if (req.files && req.files.length > 0) {
            landmarkData.images = req.files.map(file => ({
                url: file.location,
                caption: '' 
            }));
        }

        const landmark = new Landmark(landmarkData);
        await landmark.save();
        res.status(201).json({ success: true, message: 'Landmark created successfully.', data: { landmark } });
    } catch (error) {
        console.error('Landmark creation error:', error);
        res.status(500).json({ success: false, message: 'Server error creating landmark.' });
    }
});

router.put('/landmarks/:id', upload.array('images', 5), validate(landmarkUpdateSchema), async (req, res) => {
    try {
        const landmark = await Landmark.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!landmark) {
            return res.status(404).json({ success: false, message: 'Landmark not found.' });
        }

        const updateData = { ...req.body };

        // If new images are uploaded, add them to the existing images array
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: file.location,
                caption: ''
            }));
            updateData.images = [...(landmark.images || []), ...newImages];
        }

        const updatedLandmark = await Landmark.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        res.json({ success: true, message: 'Landmark updated successfully.', data: { landmark: updatedLandmark } });
    } catch (error) {
        console.error('Landmark update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating landmark.' });
    }
});

router.delete('/landmarks/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!landmark) {
            return res.status(404).json({ success: false, message: 'Landmark not found.' });
        }
        
        const imageUrls = landmark.images.map(img => img.url).filter(Boolean);
        
        // Delete images from S3
        if (imageUrls.length > 0) {
            try {
                await deleteFromS3(imageUrls);
                console.log(`✅ Deleted ${imageUrls.length} images from S3 for landmark "${landmark.name}"`);
            } catch (s3Error) {
                console.error('❌ S3 deletion failed:', s3Error);
                // Continue with database deletion even if S3 fails
            }
        }
        
        // Delete all paths that reference this landmark (CASCADE DELETE)
        const pathsDeleted = await Path.deleteMany({
            $or: [
                { from: landmark._id },
                { to: landmark._id }
            ]
        });
        console.log(`✅ Deleted ${pathsDeleted.deletedCount} paths associated with landmark "${landmark.name}"`);
        
        // Delete navigation history that references this landmark
        const navHistoryDeleted = await NavigationHistory.deleteMany({
            $or: [
                { fromLandmark: landmark._id },
                { toLandmark: landmark._id }
            ]
        });
        console.log(`✅ Deleted ${navHistoryDeleted.deletedCount} navigation history records`);
        
        // HARD DELETE landmark from database
        await Landmark.findByIdAndDelete(landmark._id);
        console.log(`✅ Landmark "${landmark.name}" permanently deleted from database`);
        
        res.json({ 
            success: true, 
            message: 'Landmark and all associated data deleted successfully.',
            data: {
                deletedCounts: {
                    paths: pathsDeleted.deletedCount,
                    navigationHistory: navHistoryDeleted.deletedCount,
                    images: imageUrls.length
                }
            }
        });
    } catch (error) {
        console.error('Landmark delete error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting landmark.' });
    }
});

// ===============================
// DASHBOARD & ANALYTICS
// ===============================
router.get('/dashboard', async (req, res) => {
    try {
        const [buildingCount, landmarkCount, pathCount, recentNavigations] = await Promise.all([
            Building.countDocuments({ createdBy: req.user._id, isActive: true }),
            Landmark.countDocuments({ createdBy: req.user._id, isActive: true }),
            Path.countDocuments({ createdBy: req.user._id, isActive: true }),
            NavigationHistory.find({}).sort({ createdAt: -1 }).limit(5) 
        ]);
        res.json({
            success: true,
            data: {
                counts: { buildings: buildingCount, landmarks: landmarkCount, paths: pathCount },
                recentNavigations
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;