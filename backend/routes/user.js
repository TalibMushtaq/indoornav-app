const express = require('express');
const { User, Building, Landmark, Path, NavigationHistory } = require('../database');
const { authenticate, requireAdmin } = require('../middlewares/auth');
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

// Apply admin authentication to all routes
router.use(authenticate, requireAdmin);

// ===============================
// BUILDING MANAGEMENT
// ===============================

// @route   GET /api/admin/buildings
// @desc    Get all buildings with pagination
// @access  Admin
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const buildings = await Building.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Building.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        buildings,
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
    console.error('Buildings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching buildings'
    });
  }
});

// @route   POST /api/admin/buildings
// @desc    Create a new building
// @access  Admin
router.post('/buildings', validate(buildingSchema), async (req, res) => {
  try {
    const buildingData = {
      ...req.body,
      createdBy: req.user._id
    };

    const building = new Building(buildingData);
    await building.save();

    await building.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: { building }
    });
  } catch (error) {
    console.error('Building creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating building'
    });
  }
});

// @route   GET /api/admin/buildings/:id
// @desc    Get building by ID with landmarks count
// @access  Admin
router.get('/buildings/:id', async (req, res) => {
  try {
    const building = await Building.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!building || !building.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    // Get landmarks count for each floor
    const landmarksCount = await Landmark.aggregate([
      { 
        $match: { 
          building: building._id, 
          isActive: true 
        } 
      },
      { 
        $group: { 
          _id: '$floor', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const buildingData = building.toObject();
    buildingData.floors = buildingData.floors.map(floor => ({
      ...floor,
      landmarksCount: landmarksCount.find(l => l._id === floor.number)?.count || 0
    }));

    res.json({
      success: true,
      data: { building: buildingData }
    });
  } catch (error) {
    console.error('Building fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching building'
    });
  }
});

// @route   PUT /api/admin/buildings/:id
// @desc    Update building
// @access  Admin
router.put('/buildings/:id', validate(buildingUpdateSchema), async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!building || !building.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    res.json({
      success: true,
      message: 'Building updated successfully',
      data: { building }
    });
  } catch (error) {
    console.error('Building update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating building'
    });
  }
});

// @route   DELETE /api/admin/buildings/:id
// @desc    Delete building (soft delete)
// @access  Admin
router.delete('/buildings/:id', async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    // Also deactivate all landmarks and paths in this building
    await Landmark.updateMany(
      { building: req.params.id },
      { isActive: false }
    );

    const landmarkIds = await Landmark.find({ building: req.params.id })
      .select('_id');
    
    await Path.updateMany(
      { 
        $or: [
          { from: { $in: landmarkIds } },
          { to: { $in: landmarkIds } }
        ]
      },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Building deleted successfully'
    });
  } catch (error) {
    console.error('Building deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting building'
    });
  }
});

// ===============================
// LANDMARK MANAGEMENT
// ===============================

// @route   GET /api/admin/landmarks
// @desc    Get all landmarks with filters
// @access  Admin
router.get('/landmarks', 
  validateQuery(paginationSchema.merge(searchSchema)), 
  async (req, res) => {
  try {
    const { page, limit, q, type, floor, building } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    // Apply filters
    if (building) query.building = building;
    if (floor) query.floor = floor;
    if (type) query.type = type;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const landmarks = await Landmark.find(query)
      .populate('building', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Landmark.countDocuments(query);

    res.json({
      success: true,
      data: {
        landmarks,
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
    console.error('Landmarks fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching landmarks'
    });
  }
});

// @route   POST /api/admin/landmarks
// @desc    Create a new landmark
// @access  Admin
router.post('/landmarks', validate(landmarkSchema), async (req, res) => {
  try {
    // Validate building exists
    const building = await Building.findById(req.body.building);
    if (!building || !building.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID'
      });
    }

    // Validate floor exists in building
    const floorExists = building.floors.some(f => f.number === req.body.floor);
    if (!floorExists) {
      return res.status(400).json({
        success: false,
        message: 'Floor does not exist in the specified building'
      });
    }

    const landmarkData = {
      ...req.body,
      createdBy: req.user._id
    };

    const landmark = new Landmark(landmarkData);
    await landmark.save();

    await landmark.populate([
      { path: 'building', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Landmark created successfully',
      data: { landmark }
    });
  } catch (error) {
    console.error('Landmark creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating landmark'
    });
  }
});

// @route   GET /api/admin/landmarks/:id
// @desc    Get landmark by ID with connections
// @access  Admin
router.get('/landmarks/:id', async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id)
      .populate('building', 'name')
      .populate('createdBy', 'name email');

    if (!landmark || !landmark.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Landmark not found'
      });
    }

    // Get connected paths
    const connections = await Path.find({
      $or: [
        { from: landmark._id },
        { to: landmark._id }
      ],
      isActive: true
    }).populate('from to', 'name type floor');

    res.json({
      success: true,
      data: { 
        landmark,
        connections
      }
    });
  } catch (error) {
    console.error('Landmark fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching landmark'
    });
  }
});

// @route   PUT /api/admin/landmarks/:id
// @desc    Update landmark
// @access  Admin
router.put('/landmarks/:id', validate(landmarkUpdateSchema), async (req, res) => {
  try {
    // If building is being updated, validate it
    if (req.body.building) {
      const building = await Building.findById(req.body.building);
      if (!building || !building.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid building ID'
        });
      }

      // If floor is also being updated, validate it exists in the building
      if (req.body.floor) {
        const floorExists = building.floors.some(f => f.number === req.body.floor);
        if (!floorExists) {
          return res.status(400).json({
            success: false,
            message: 'Floor does not exist in the specified building'
          });
        }
      }
    }

    const landmark = await Landmark.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'building', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!landmark || !landmark.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Landmark not found'
      });
    }

    res.json({
      success: true,
      message: 'Landmark updated successfully',
      data: { landmark }
    });
  } catch (error) {
    console.error('Landmark update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating landmark'
    });
  }
});

// @route   DELETE /api/admin/landmarks/:id
// @desc    Delete landmark (soft delete)
// @access  Admin
router.delete('/landmarks/:id', async (req, res) => {
  try {
    const landmark = await Landmark.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!landmark) {
      return res.status(404).json({
        success: false,
        message: 'Landmark not found'
      });
    }

    // Deactivate all paths connected to this landmark
    await Path.updateMany(
      { 
        $or: [
          { from: req.params.id },
          { to: req.params.id }
        ]
      },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Landmark deleted successfully'
    });
  } catch (error) {
    console.error('Landmark deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting landmark'
    });
  }
});

// ===============================
// PATH MANAGEMENT
// ===============================

// @route   GET /api/admin/paths
// @desc    Get all paths with filters
// @access  Admin
router.get('/paths', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const paths = await Path.find({ isActive: true })
      .populate('from', 'name type floor')
      .populate('to', 'name type floor')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Path.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        paths,
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
    console.error('Paths fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching paths'
    });
  }
});

// @route   POST /api/admin/paths
// @desc    Create a new path
// @access  Admin
router.post('/paths', validate(pathSchema), async (req, res) => {
  try {
    const { from, to } = req.body;

    // Validate landmarks exist and are active
    const fromLandmark = await Landmark.findById(from);
    const toLandmark = await Landmark.findById(to);

    if (!fromLandmark || !fromLandmark.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid from landmark ID'
      });
    }

    if (!toLandmark || !toLandmark.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid to landmark ID'
      });
    }

    // Check if path already exists
    const existingPath = await Path.findOne({
      $or: [
        { from, to },
        { from: to, to: from, isBidirectional: true }
      ],
      isActive: true
    });

    if (existingPath) {
      return res.status(400).json({
        success: false,
        message: 'Path already exists between these landmarks'
      });
    }

    const pathData = {
      ...req.body,
      createdBy: req.user._id
    };

    const path = new Path(pathData);
    await path.save();

    await path.populate([
      { path: 'from', select: 'name type floor' },
      { path: 'to', select: 'name type floor' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Path created successfully',
      data: { path }
    });
  } catch (error) {
    console.error('Path creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating path'
    });
  }
});

// @route   GET /api/admin/paths/:id
// @desc    Get path by ID
// @access  Admin
router.get('/paths/:id', async (req, res) => {
  try {
    const path = await Path.findById(req.params.id)
      .populate('from', 'name type floor coordinates')
      .populate('to', 'name type floor coordinates')
      .populate('createdBy', 'name email');

    if (!path || !path.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      data: { path }
    });
  } catch (error) {
    console.error('Path fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching path'
    });
  }
});

// @route   PUT /api/admin/paths/:id
// @desc    Update path
// @access  Admin
router.put('/paths/:id', validate(pathUpdateSchema), async (req, res) => {
  try {
    // If landmarks are being updated, validate them
    if (req.body.from) {
      const fromLandmark = await Landmark.findById(req.body.from);
      if (!fromLandmark || !fromLandmark.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid from landmark ID'
        });
      }
    }

    if (req.body.to) {
      const toLandmark = await Landmark.findById(req.body.to);
      if (!toLandmark || !toLandmark.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid to landmark ID'
        });
      }
    }

    const path = await Path.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'from', select: 'name type floor' },
      { path: 'to', select: 'name type floor' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!path || !path.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      message: 'Path updated successfully',
      data: { path }
    });
  } catch (error) {
    console.error('Path update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating path'
    });
  }
});

// @route   DELETE /api/admin/paths/:id
// @desc    Delete path (soft delete)
// @access  Admin
router.delete('/paths/:id', async (req, res) => {
  try {
    const path = await Path.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      message: 'Path deleted successfully'
    });
  } catch (error) {
    console.error('Path deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting path'
    });
  }
});

// ===============================
// ANALYTICS & REPORTING
// ===============================

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic counts
    const [
      totalBuildings,
      totalLandmarks,
      totalPaths,
      totalUsers,
      totalNavigations
    ] = await Promise.all([
      Building.countDocuments({ isActive: true }),
      Landmark.countDocuments({ isActive: true }),
      Path.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      NavigationHistory.countDocuments()
    ]);

    // Get recent activity
    const recentNavigations = await NavigationHistory.find()
      .populate('user', 'name')
      .populate('building', 'name')
      .populate('fromLandmark', 'name')
      .populate('toLandmark', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get most popular buildings
    const popularBuildings = await NavigationHistory.aggregate([
      {
        $group: {
          _id: '$building',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'buildings',
          localField: '_id',
          foreignField: '_id',
          as: 'building'
        }
      },
      {
        $project: {
          building: { $arrayElemAt: ['$building.name', 0] },
          count: 1
        }
      }
    ]);

    // Get navigation success rate
    const navigationStats = await NavigationHistory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const completed = navigationStats.find(s => s._id === 'completed')?.count || 0;
    const total = navigationStats.reduce((sum, stat) => sum + stat.count, 0);
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    // Get monthly navigation trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await NavigationHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBuildings,
          totalLandmarks,
          totalPaths,
          totalUsers,
          totalNavigations,
          successRate: `${successRate}%`
        },
        recentActivity: recentNavigations,
        popularBuildings,
        navigationStats,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/admin/analytics/buildings/:id
// @desc    Get detailed analytics for a specific building
// @access  Admin
router.get('/analytics/buildings/:id', async (req, res) => {
  try {
    const buildingId = req.params.id;

    // Validate building exists
    const building = await Building.findById(buildingId);
    if (!building || !building.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    // Get navigation statistics for this building
    const [
      totalNavigations,
      completedNavigations,
      averageRating,
      mostUsedLandmarks,
      floorUsage
    ] = await Promise.all([
      NavigationHistory.countDocuments({ building: buildingId }),
      
      NavigationHistory.countDocuments({ 
        building: buildingId, 
        status: 'completed' 
      }),
      
      NavigationHistory.aggregate([
        { 
          $match: { 
            building: buildingId,
            'feedback.rating': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$feedback.rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]),
      
      NavigationHistory.aggregate([
        { $match: { building: buildingId } },
        {
          $facet: {
            fromLandmarks: [
              { $group: { _id: '$fromLandmark', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            toLandmarks: [
              { $group: { _id: '$toLandmark', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]),
      
      NavigationHistory.aggregate([
        { $match: { building: buildingId } },
        {
          $lookup: {
            from: 'landmarks',
            localField: 'fromLandmark',
            foreignField: '_id',
            as: 'fromLandmarkData'
          }
        },
        {
          $group: {
            _id: { $arrayElemAt: ['$fromLandmarkData.floor', 0] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    // Populate landmark names for most used landmarks
    const fromLandmarkIds = mostUsedLandmarks[0].fromLandmarks.map(l => l._id);
    const toLandmarkIds = mostUsedLandmarks[0].toLandmarks.map(l => l._id);
    
    const landmarks = await Landmark.find({
      _id: { $in: [...fromLandmarkIds, ...toLandmarkIds] }
    }).select('_id name type');

    const landmarkMap = {};
    landmarks.forEach(l => {
      landmarkMap[l._id.toString()] = l;
    });

    const popularStartPoints = mostUsedLandmarks[0].fromLandmarks.map(l => ({
      landmark: landmarkMap[l._id.toString()],
      count: l.count
    }));

    const popularDestinations = mostUsedLandmarks[0].toLandmarks.map(l => ({
      landmark: landmarkMap[l._id.toString()],
      count: l.count
    }));

    const successRate = totalNavigations > 0 ? 
      ((completedNavigations / totalNavigations) * 100).toFixed(1) : 0;

    const avgRating = averageRating.length > 0 ? 
      averageRating[0].avgRating.toFixed(1) : null;

    res.json({
      success: true,
      data: {
        building: {
          id: building._id,
          name: building.name,
          description: building.description
        },
        statistics: {
          totalNavigations,
          completedNavigations,
          successRate: `${successRate}%`,
          averageRating: avgRating,
          totalRatings: averageRating.length > 0 ? averageRating[0].totalRatings : 0
        },
        usage: {
          popularStartPoints,
          popularDestinations,
          floorUsage
        }
      }
    });
  } catch (error) {
    console.error('Building analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching building analytics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    // Get user statistics
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const navigationCount = await NavigationHistory.countDocuments({ 
          user: user._id 
        });
        
        return {
          ...user.toObject(),
          navigationCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
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
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Admin
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @route   GET /api/admin/export/buildings
// @desc    Export buildings data
// @access  Admin
router.get('/export/buildings', async (req, res) => {
  try {
    const buildings = await Building.find({ isActive: true })
      .populate('createdBy', 'name email')
      .select('-__v');

    // Add landmarks count to each building
    const buildingsWithCounts = await Promise.all(
      buildings.map(async (building) => {
        const landmarksCount = await Landmark.countDocuments({
          building: building._id,
          isActive: true
        });
        
        const pathsCount = await Path.countDocuments({
          $or: [
            { from: { $in: await Landmark.find({ building: building._id }).select('_id') } },
            { to: { $in: await Landmark.find({ building: building._id }).select('_id') } }
          ],
          isActive: true
        });

        return {
          ...building.toObject(),
          landmarksCount,
          pathsCount
        };
      })
    );

    res.json({
      success: true,
      data: buildingsWithCounts,
      exportedAt: new Date(),
      totalCount: buildingsWithCounts.length
    });
  } catch (error) {
    console.error('Buildings export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting buildings data'
    });
  }
});

module.exports = router;