const express = require('express');
const { Admin, Building, Landmark, Path, NavigationHistory } = require('../database');
const { authenticate, requireAdmin, authLimiter, generateToken } = require('../middlewares/auth');
const { upload, deleteFromS3 } = require('../middlewares/awsupload');
const {
    z,
  validate,
  validateQuery,
  adminSignupSchema,
  adminSigninSchema,
  resetPasswordSchema,
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

// GLOBAL ERROR CATCHER for this router
router.use((err, req, res, next) => {
    console.error('ROUTER-LEVEL ERROR:', err);
    res.status(500).json({
        success: false,
        message: 'Router error: ' + err.message
    });
});

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

// NEW ROUTE: Reset password with master password
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
    const { email, masterPassword, newPassword } = req.body;

    // IMPORTANT: Set your MASTER_PASSWORD in your .env file
    if (masterPassword !== process.env.MASTER_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid master password.' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin with this email does not exist.' });
        }

        admin.password = newPassword; // The pre-save hook in your Admin model will hash this
        await admin.save();

        res.json({ success: true, message: 'Admin password has been reset successfully.' });

    } catch (error) {
        console.error('Admin password reset error:', error);
        res.status(500).json({ success: false, message: 'Server error during password reset.' });
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

// New schema definitions (assuming they would be in your schemas file)
const adminUpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
}).strip(); // Use strip to remove any extra fields

const adminChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

// NEW ROUTE: Update admin profile (name, email)
router.put('/me', validate(adminUpdateProfileSchema), async (req, res) => {
    try {
        const { name, email } = req.body;
        const admin = await Admin.findById(req.user._id);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }

        // Check if email is being updated and if it's already in use
        if (email && email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ success: false, message: 'Email is already in use.' });
            }
            admin.email = email;
        }

        if (name) {
            admin.name = name;
        }

        await admin.save();

        // Return a clean admin object without sensitive data
        const updatedAdmin = { id: admin._id, name: admin.name, email: admin.email, role: admin.role };

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            data: { admin: updatedAdmin }
        });
    } catch (error) {
        console.error('Admin profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
});

// NEW ROUTE: Change admin password
router.put('/change-password', validate(adminChangePasswordSchema), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.user._id).select('+password');

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }

        const isMatch = await admin.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }

        admin.password = newPassword; // The pre-save hook in your model will hash it
        await admin.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Admin change password error:', error);
        res.status(500).json({ success: false, message: 'Server error changing password.' });
    }
});

// ===============================
// BUILDING MANAGEMENT
// ===============================
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in again.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('ERROR IN /buildings ROUTE:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching buildings.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.post('/buildings', upload.single('image'), validate(buildingSchema), async (req, res) => {
    try {
        const buildingData = {
            ...req.body,
            createdBy: req.user._id
        };

        if (buildingData.floors && typeof buildingData.floors === 'string') {
            buildingData.floors = JSON.parse(buildingData.floors);
        }

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
        console.error('Get building by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching building.' });
    }
});

router.put('/buildings/:id', upload.single('image'), validate(buildingUpdateSchema), async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.floors && typeof updateData.floors === 'string') {
            updateData.floors = JSON.parse(updateData.floors);
        }

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

router.delete('/buildings/:id', async (req, res) => {
    try {
        const building = await Building.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!building) {
            return res.status(404).json({ success: false, message: 'Building not found.' });
        }

        const landmarks = await Landmark.find({ building: building._id });
        const landmarkIds = landmarks.map(l => l._id);
        const urlsToDelete = [];

        if (building.image) {
            urlsToDelete.push(building.image);
        }

        const landmarkImageUrls = landmarks.flatMap(l => l.images.map(img => img.url));
        urlsToDelete.push(...landmarkImageUrls);

        if (urlsToDelete.length > 0) {
            try {
                await deleteFromS3(urlsToDelete);
                console.log(`Deleted ${urlsToDelete.length} images from S3`);
            } catch (s3Error) {
                console.error('S3 deletion failed:', s3Error);
            }
        }

        const pathsDeleted = await Path.deleteMany({
            $or: [
                { from: { $in: landmarkIds } },
                { to: { $in: landmarkIds } }
            ]
        });
        console.log(`Deleted ${pathsDeleted.deletedCount} paths`);

        const navHistoryDeleted = await NavigationHistory.deleteMany({ building: building._id });
        console.log(`Deleted ${navHistoryDeleted.deletedCount} navigation history records`);

        await Landmark.deleteMany({ building: building._id });
        console.log(`Deleted ${landmarks.length} landmarks`);

        await Building.findByIdAndDelete(building._id);
        console.log(`Building "${building.name}" deleted`);

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
        const { page = 1, limit = 10, q, type, floor, building } = req.query;
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
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
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

        if (imageUrls.length > 0) {
            try {
                await deleteFromS3(imageUrls);
                console.log(`Deleted ${imageUrls.length} images from S3`);
            } catch (s3Error) {
                console.error('S3 deletion failed:', s3Error);
            }
        }

        const pathsDeleted = await Path.deleteMany({
            $or: [
                { from: landmark._id },
                { to: landmark._id }
            ]
        });
        console.log(`Deleted ${pathsDeleted.deletedCount} paths`);

        const navHistoryDeleted = await NavigationHistory.deleteMany({
            $or: [
                { fromLandmark: landmark._id },
                { toLandmark: landmark._id }
            ]
        });
        console.log(`Deleted ${navHistoryDeleted.deletedCount} navigation history records`);

        await Landmark.findByIdAndDelete(landmark._id);
        console.log(`Landmark "${landmark.name}" deleted`);

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
// PATH MANAGEMENT
// ===============================
router.post('/paths', validate(pathSchema), async (req, res) => {
    try {
        const { from, to, ...rest } = req.body;
        const createdBy = req.user._id;

        if (from === to) {
            return res.status(400).json({ success: false, message: 'A path must connect two different landmarks.' });
        }

        const fromLandmark = await Landmark.findOne({ _id: from, createdBy });
        const toLandmark = await Landmark.findOne({ _id: to, createdBy });

        if (!fromLandmark || !toLandmark) {
            return res.status(404).json({ success: false, message: 'One or both landmarks not found or you do not have permission to access them.' });
        }
        if (fromLandmark.building.toString() !== toLandmark.building.toString()) {
            return res.status(400).json({ success: false, message: 'Landmarks must be in the same building.' });
        }

        const existingPath = await Path.findOne({
            $or: [{ from, to }, { from: to, to: from }]
        });
        if (existingPath) {
            return res.status(400).json({ success: false, message: 'A path between these two landmarks already exists.' });
        }

        const path = new Path({ from, to, createdBy, ...rest });
        await path.save();
        await path.populate([
            { path: 'from', select: 'name floor' },
            { path: 'to', select: 'name floor' }
        ]);

        res.status(201).json({ success: true, message: 'Path created successfully.', data: { path } });
    } catch (error) {
        console.error('Path creation error:', error);
        res.status(500).json({ success: false, message: 'Server error creating path.' });
    }
});

router.get('/paths', validateQuery(paginationSchema.merge(z.object({ building: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid building ID') }))), async (req, res) => {
    try {
        const { building, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const buildingLandmarks = await Landmark.find({ building, createdBy: req.user._id }).select('_id');
        const landmarkIds = buildingLandmarks.map(l => l._id);

        const query = {
            from: { $in: landmarkIds },
            to: { $in: landmarkIds },
            createdBy: req.user._id
        };

        const [paths, total] = await Promise.all([
            Path.find(query)
                .populate('from', 'name floor')
                .populate('to', 'name floor')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Path.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: { paths },
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get paths error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching paths.' });
    }
});

router.put('/paths/:id', validate(pathUpdateSchema), async (req, res) => {
    try {
        const path = await Path.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        ).populate('from to', 'name floor');

        if (!path) {
            return res.status(404).json({ success: false, message: 'Path not found.' });
        }
        res.json({ success: true, message: 'Path updated successfully.', data: { path } });
    } catch (error) {
        console.error('Path update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating path.' });
    }
});

// @route   PATCH /api/admin/paths/:id/status
// @desc    Update the status of a single path
// @access  Admin
router.patch('/paths/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        // Basic validation
        if (!['open', 'closed', 'restricted'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const path = await Path.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            { $set: { status: status } },
            { new: true }
        );

        if (!path) {
            return res.status(404).json({ success: false, message: 'Path not found.' });
        }

        res.json({ success: true, message: `Path status updated to "${status}".`, data: { path } });

    } catch (error) {
        console.error('Path status update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating path status.' });
    }
});

router.delete('/paths/:id', async (req, res) => {
    try {
        const path = await Path.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!path) {
            return res.status(404).json({ success: false, message: 'Path not found.' });
        }
        res.json({ success: true, message: 'Path deleted successfully.' });
    } catch (error) {
        console.error('Path delete error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting path.' });
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