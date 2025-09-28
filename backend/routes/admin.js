const express = require('express');
const { User, Building, Landmark, Path, NavigationHistory } = require('../database');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/awsupload'); // Assuming your file is named awsupload.js
const { 
  validate, 
  validateQuery,
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
router.use(authenticate, requireAdmin);

// ===============================
// BUILDING MANAGEMENT
// ===============================

// Get all buildings (no changes)
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => { /* ... existing code ... */ });

// Create a new building
router.post('/buildings', 
  upload.array('mapImages'), // Field name for floor map images
  validate(buildingSchema), 
  async (req, res) => {
    try {
      const buildingData = { ...req.body, createdBy: req.user._id };

      // Map uploaded image URLs to the correct floor
      if (req.files && req.files.length > 0) {
        let imageIndex = 0;
        buildingData.floors = buildingData.floors.map(floor => {
          // A simple mapping strategy: assume files are uploaded in the same order as floors
          if (imageIndex < req.files.length) {
            return { ...floor, mapImage: req.files[imageIndex++].location };
          }
          return floor;
        });
      }

      const building = new Building(buildingData);
      await building.save();
      await building.populate('createdBy', 'name email');
      res.status(201).json({ success: true, message: 'Building created successfully', data: { building } });
    } catch (error) {
      console.error('Building creation error:', error);
      res.status(500).json({ success: false, message: 'Server error while creating building' });
    }
  });

// Get building by ID (no changes)
router.get('/buildings/:id', async (req, res) => { /* ... existing code ... */ });

// Update building
router.put('/buildings/:id',
  upload.array('mapImages'),
  validate(buildingUpdateSchema),
  async (req, res) => {
    try {
      const updateData = { ...req.body };
      // Similar logic as create for handling updated images
      if (req.files && req.files.length > 0) {
        let imageIndex = 0;
        updateData.floors = updateData.floors.map(floor => {
          if (floor.newImage) { // Client should flag which floors have new images
             if (imageIndex < req.files.length) {
                return { ...floor, mapImage: req.files[imageIndex++].location };
             }
          }
          return floor;
        });
      }

      const building = await Building.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate('createdBy', 'name email');

      if (!building || !building.isActive) {
        return res.status(404).json({ success: false, message: 'Building not found' });
      }
      res.json({ success: true, message: 'Building updated successfully', data: { building } });
    } catch (error) {
      console.error('Building update error:', error);
      res.status(500).json({ success: false, message: 'Server error while updating building' });
    }
  });

// Delete building (no changes)
router.delete('/buildings/:id', async (req, res) => { /* ... existing code ... */ });

// ===============================
// LANDMARK MANAGEMENT
// ===============================

// Get all landmarks (no changes)
router.get('/landmarks', validateQuery(paginationSchema.merge(searchSchema)), async (req, res) => { /* ... existing code ... */ });

// Create a new landmark
router.post('/landmarks', 
  upload.array('images', 5), // Max 5 images for a landmark
  validate(landmarkSchema), 
  async (req, res) => {
    try {
      const landmarkData = { ...req.body, createdBy: req.user._id };

      // Add uploaded image URLs to the landmark data
      if (req.files && req.files.length > 0) {
        landmarkData.images = req.files.map(file => ({ url: file.location, caption: '' }));
      }

      const building = await Building.findById(landmarkData.building);
      if (!building || !building.isActive) return res.status(400).json({ success: false, message: 'Invalid building ID' });
      const floorExists = building.floors.some(f => f.number === landmarkData.floor);
      if (!floorExists) return res.status(400).json({ success: false, message: 'Floor does not exist in the specified building' });
      
      const landmark = new Landmark(landmarkData);
      await landmark.save();
      await landmark.populate([{ path: 'building', select: 'name' }, { path: 'createdBy', select: 'name email' }]);
      res.status(201).json({ success: true, message: 'Landmark created successfully', data: { landmark } });
    } catch (error) {
      console.error('Landmark creation error:', error);
      res.status(500).json({ success: false, message: 'Server error while creating landmark' });
    }
  });

// Get landmark by ID (no changes)
router.get('/landmarks/:id', async (req, res) => { /* ... existing code ... */ });

// Update landmark
router.put('/landmarks/:id',
  upload.array('images', 5),
  validate(landmarkUpdateSchema),
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      // Handle newly uploaded images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({ url: file.location, caption: '' }));
        // Client should send existing images if they are to be kept
        const existingImages = updateData.images || []; 
        updateData.images = [...existingImages, ...newImages];
      }

      const landmark = await Landmark.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate([{ path: 'building', select: 'name' }, { path: 'createdBy', select: 'name email' }]);

      if (!landmark || !landmark.isActive) {
        return res.status(404).json({ success: false, message: 'Landmark not found' });
      }
      res.json({ success: true, message: 'Landmark updated successfully', data: { landmark } });
    } catch (error) {
      console.error('Landmark update error:', error);
      res.status(500).json({ success: false, message: 'Server error while updating landmark' });
    }
  });

// Delete landmark (no changes)
router.delete('/landmarks/:id', async (req, res) => { /* ... existing code ... */ });

// ===============================
// PATH MANAGEMENT
// ===============================

// Get all paths (no changes)
router.get('/paths', validateQuery(paginationSchema), async (req, res) => { /* ... existing code ... */ });

// Create a new path
router.post('/paths',
  upload.array('images', 5),
  validate(pathSchema),
  async (req, res) => {
    try {
      const pathData = { ...req.body, createdBy: req.user._id };

      if (req.files && req.files.length > 0) {
        pathData.images = req.files.map(file => ({ url: file.location, caption: '' }));
      }

      const fromLandmark = await Landmark.findById(pathData.from);
      const toLandmark = await Landmark.findById(pathData.to);
      if (!fromLandmark || !toLandmark) return res.status(400).json({ success: false, message: 'Invalid landmark ID' });
      
      const path = new Path(pathData);
      await path.save();
      await path.populate([{ path: 'from', select: 'name type floor' }, { path: 'to', select: 'name type floor' }, { path: 'createdBy', select: 'name email' }]);
      res.status(201).json({ success: true, message: 'Path created successfully', data: { path } });
    } catch (error) {
      console.error('Path creation error:', error);
      res.status(500).json({ success: false, message: 'Server error while creating path' });
    }
  });

// Get path by ID (no changes)
router.get('/paths/:id', async (req, res) => { /* ... existing code ... */ });

// Update path
router.put('/paths/:id',
  upload.array('images', 5),
  validate(pathUpdateSchema),
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({ url: file.location, caption: '' }));
        const existingImages = updateData.images || []; 
        updateData.images = [...existingImages, ...newImages];
      }
      
      const path = await Path.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate([{ path: 'from', select: 'name type floor' }, { path: 'to', select: 'name type floor' }, { path: 'createdBy', select: 'name email' }]);

      if (!path || !path.isActive) {
        return res.status(404).json({ success: false, message: 'Path not found' });
      }
      res.json({ success: true, message: 'Path updated successfully', data: { path } });
    } catch (error) {
      console.error('Path update error:', error);
      res.status(500).json({ success: false, message: 'Server error while updating path' });
    }
  });

// Delete path (no changes)
router.delete('/paths/:id', async (req, res) => { /* ... existing code ... */ });

// ===============================
// ANALYTICS & REPORTING (No changes in this section)
// ===============================
router.get('/dashboard', async (req, res) => { /* ... existing code ... */ });
router.get('/analytics/buildings/:id', async (req, res) => { /* ... existing code ... */ });
router.get('/users', validateQuery(paginationSchema), async (req, res) => { /* ... existing code ... */ });
router.put('/users/:id/status', async (req, res) => { /* ... existing code ... */ });
router.get('/export/buildings', async (req, res) => { /* ... existing code ... */ });


module.exports = router;