const express = require('express');
const { Building, Landmark, Path, NavigationHistory } = require('../database');
// Assuming you have a standard 'auth' middleware that requires a logged-in user.
const { authenticate, optionalAuth } = require('../middlewares/auth');
const {
  validate,
  validateQuery,
  navigationRequestSchema,
  searchSchema,
  paginationSchema
} = require('../validators/schemas');

const router = express.Router();

// --- ALGORITHM IMPLEMENTATION ---

// More efficient Priority Queue for Dijkstra's Algorithm
class PriorityQueue {
  constructor() {
    this.collection = [];
  }
  enqueue(element) {
    if (this.isEmpty()) {
      this.collection.push(element);
    } else {
      let added = false;
      for (let i = 1; i <= this.collection.length; i++) {
        if (element.distance < this.collection[i - 1].distance) {
          this.collection.splice(i - 1, 0, element);
          added = true;
          break;
        }
      }
      if (!added) {
        this.collection.push(element);
      }
    }
  }
  dequeue() {
    return this.collection.shift();
  }
  isEmpty() {
    return this.collection.length === 0;
  }
}

// Dijkstra's Algorithm Implementation using a Priority Queue
class Graph {
  constructor() {
    this.nodes = new Map();
    this.adjacencyList = new Map();
  }

  addNode(id, data) {
    this.nodes.set(id, data);
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
  }

  addEdge(from, to, weight, pathData) {
    this.adjacencyList.get(from)?.push({
      node: to,
      weight,
      path: pathData
    });

    if (pathData.isBidirectional) {
      this.adjacencyList.get(to)?.push({
        node: from,
        weight,
        path: {
          ...pathData,
          instructions: `(Return) ${pathData.instructions}`, // Clarify reverse instructions
          images: pathData.images.slice().reverse()
        }
      });
    }
  }

  dijkstra(start, end, preferences = {}) {
    const distances = new Map();
    const previous = new Map();
    const pathDetails = new Map();
    const pq = new PriorityQueue();

    // Initialize distances
    for (let node of this.nodes.keys()) {
      distances.set(node, Infinity);
    }
    distances.set(start, 0);
    pq.enqueue({ node: start, distance: 0 });

    while (!pq.isEmpty()) {
      const { node: currentNode } = pq.dequeue();

      if (currentNode === end) break;

      const neighbors = this.adjacencyList.get(currentNode) || [];

      for (let neighbor of neighbors) {
        // Apply preference filters
        if (preferences.avoidStairs && neighbor.path.accessibility?.requiresStairs) {
          continue;
        }
        if (preferences.wheelchairAccessible && !neighbor.path.accessibility?.wheelchairAccessible) {
          continue;
        }

        const distance = distances.get(currentNode) + neighbor.weight;

        if (distance < distances.get(neighbor.node)) {
          distances.set(neighbor.node, distance);
          previous.set(neighbor.node, currentNode);
          pathDetails.set(neighbor.node, neighbor.path);
          pq.enqueue({ node: neighbor.node, distance });
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = end;

    if (distances.get(current) === Infinity) {
        return { path: [], totalDistance: Infinity, totalTime: 0 };
    }

    while (current !== undefined) {
      const nodeData = this.nodes.get(current);
      const pathData = pathDetails.get(current);

      path.unshift({
        landmark: nodeData,
        path: pathData,
      });

      current = previous.get(current);
    }

    return {
      path,
      totalDistance: distances.get(end),
      totalTime: path.reduce((sum, step) => sum + (step.path?.estimatedTime || 0), 0)
    };
  }
}


// --- API ROUTES ---

// @route   GET /api/navigation/buildings
// @desc    Get all available buildings for navigation
// @access  Public
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    // OPTIMIZATION: Use aggregation to get buildings and their landmark counts in one query.
    const buildingsPromise = Building.aggregate([
      { $match: { isActive: true } },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'landmarks',
          localField: '_id',
          foreignField: 'building',
          pipeline: [{ $match: { isActive: true } }, { $count: 'count' }],
          as: 'landmarkData'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          address: 1,
          floors: 1,
          landmarksCount: { $ifNull: [{ $arrayElemAt: ['$landmarkData.count', 0] }, 0] }
        }
      }
    ]);

    const totalPromise = Building.countDocuments({ isActive: true });

    const [buildings, total] = await Promise.all([buildingsPromise, totalPromise]);

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


// @route   GET /api/navigation/buildings/:id/landmarks
// @desc    Get all landmarks for a specific building
// @access  Public
router.get('/buildings/:id/landmarks',
  validateQuery(searchSchema.pick({ type: true, floor: true, q: true })),
  async (req, res) => {
  try {
    const { type, floor, q } = req.query;
    const buildingId = req.params.id;

    const building = await Building.findById(buildingId);
    if (!building || !building.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    let query = {
      building: buildingId,
      isActive: true
    };

    if (type) query.type = type;
    if (floor) query.floor = floor;
    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { description: regex },
        { roomNumber: regex }
      ];
    }

    const landmarks = await Landmark.find(query)
      .select('name description type floor coordinates roomNumber images accessibility')
      .sort({ floor: 1, name: 1 });

    const landmarksByFloor = landmarks.reduce((acc, landmark) => {
        (acc[landmark.floor] = acc[landmark.floor] || []).push(landmark);
        return acc;
    }, {});

    res.json({
      success: true,
      data: {
        building: {
          id: building._id,
          name: building.name,
          floors: building.floors
        },
        landmarks, // Keep flat list for easier client-side filtering
        landmarksByFloor, // Provide grouped view
        totalCount: landmarks.length
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

// @route   POST /api/navigation/route
// @desc    Calculate route between two landmarks
// @access  Public (with optional auth for history)
router.post('/route', async (req, res) => {
  try {
    // Apply optional auth manually
    if (req.headers.authorization) {
      try {
        // Basic token extraction - adapt this to match your auth logic
        const token = req.headers.authorization.split(' ')[1];
        // Add your token verification logic here
        // For now, we'll skip the actual verification
        // req.user = decoded user from token
      } catch (authError) {
        // Continue without user if auth fails
        console.log('Optional auth failed:', authError.message);
      }
    }

    // Manual validation using Zod
    const validationResult = navigationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors.map(err => ({ 
          field: err.path.join('.'), 
          message: err.message 
        }))
      });
    }

    const { building: buildingId, from: fromId, to: toId, preferences = {} } = validationResult.data;

    // Fetch building and landmarks concurrently
    const [building, fromLandmark, toLandmark] = await Promise.all([
      Building.findById(buildingId).lean(),
      Landmark.findById(fromId).lean(),
      Landmark.findById(toId).lean()
    ]);

    if (!building || !building.isActive) {
      return res.status(400).json({ success: false, message: 'Building not found' });
    }
    if (!fromLandmark || !fromLandmark.isActive || fromLandmark.building.toString() !== buildingId) {
      return res.status(400).json({ success: false, message: 'Invalid "from" landmark' });
    }
    if (!toLandmark || !toLandmark.isActive || toLandmark.building.toString() !== buildingId) {
      return res.status(400).json({ success: false, message: 'Invalid "to" landmark' });
    }

    if (fromId === toId) {
      return res.json({
        success: true,
        data: {
          route: {
            steps: [{
              stepNumber: 1,
              landmark: fromLandmark,
              path: null,
              instructions: "You are already at your destination!",
              distance: 0,
              estimatedTime: 0
            }],
            totalDistance: 0,
            totalTime: 0,
            preferences
          }
        }
      });
    }

    // Get all active landmarks for this building
    const landmarks = await Landmark.find({ building: buildingId, isActive: true });

    // OPTIMIZATION: Only fetch paths connected to landmarks within this building
    const landmarkIds = landmarks.map(l => l._id);
    const buildingPaths = await Path.find({
        isActive: true,
        from: { $in: landmarkIds },
        to: { $in: landmarkIds }
    });

    // Build graph
    const graph = new Graph();
    landmarks.forEach(landmark => graph.addNode(landmark._id.toString(), landmark.toObject()));
    buildingPaths.forEach(path => {
      graph.addEdge(
        path.from.toString(),
        path.to.toString(),
        path.distance,
        path.toObject()
      );
    });

    const result = graph.dijkstra(fromId, toId, preferences);

    if (result.totalDistance === Infinity) {
      return res.status(404).json({
        success: false,
        message: 'No route found. The destination may be unreachable with your selected preferences.'
      });
    }

    // Format route steps
    const steps = result.path.map((step, index) => ({
      stepNumber: index + 1,
      landmark: step.landmark,
      path: index > 0 ? result.path[index].path : null, // The path leads TO this step's landmark
      instructions: index === 0 ?
        `Start at ${step.landmark.name}.` :
        result.path[index].path.instructions,
      distance: index > 0 ? result.path[index].path.distance : 0,
      estimatedTime: index > 0 ? result.path[index].path.estimatedTime : 0,
      images: index > 0 ? result.path[index].path.images : [],
      difficulty: index > 0 ? result.path[index].path.difficulty : 'easy'
    }));

    const routeData = {
      steps,
      totalDistance: Math.round(result.totalDistance),
      totalTime: result.totalTime,
      preferences,
      building: { id: building._id, name: building.name },
      from: fromLandmark,
      to: toLandmark
    };

    // Save to navigation history if user is authenticated
    if (req.user) {
      const navigationHistory = new NavigationHistory({
        user: req.user._id,
        sessionId: `${req.user._id}_${Date.now()}`,
        building: buildingId,
        fromLandmark: fromId,
        toLandmark: toId,
        route: steps.slice(1).map(step => ({ // Exclude the start step which has no path
          landmark: step.landmark._id,
          path: step.path?._id,
          stepNumber: step.stepNumber
        })),
        totalDistance: result.totalDistance,
        estimatedTime: result.totalTime,
        status: 'started'
      });
      await navigationHistory.save();
      routeData.navigationId = navigationHistory._id;
    }

    res.json({ success: true, data: { route: routeData } });
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ success: false, message: 'Server error while calculating route' });
  }
});

// @route   GET /api/navigation/landmarks/:id
// @desc    Get landmark details with connected landmarks
// @access  Public
router.get('/landmarks/:id', async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id)
      .populate('building', 'name floors');

    if (!landmark || !landmark.isActive) {
      return res.status(404).json({ success: false, message: 'Landmark not found' });
    }

    const connectedPaths = await Path.find({
      $or: [{ from: landmark._id }, { to: landmark._id, isBidirectional: true }],
      isActive: true
    }).populate('from to', 'name type floor');

    const connections = connectedPaths.map(path => {
      const isFromCurrent = path.from._id.toString() === landmark._id.toString();
      const connectedLandmark = isFromCurrent ? path.to : path.from;

      return {
        landmark: connectedLandmark,
        distance: path.distance,
        estimatedTime: path.estimatedTime,
        difficulty: path.difficulty,
        instructions: isFromCurrent ? path.instructions : `(Return) ${path.instructions}`,
        accessibility: path.accessibility
      };
    });

    res.json({
      success: true,
      data: {
        landmark,
        connections,
        connectionsCount: connections.length
      }
    });
  } catch (error) {
    console.error('Landmark details error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching landmark details' });
  }
});


// @route   PUT /api/navigation/history/:id/status
// @desc    Update navigation status
// @access  Private
router.put('/history/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const navigationId = req.params.id;

    if (!['in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: in_progress, completed, cancelled'
      });
    }

    const navigation = await NavigationHistory.findOneAndUpdate(
      { _id: navigationId, user: req.user._id }, // Ensure user owns this record
      { status, completedAt: status === 'completed' ? new Date() : undefined },
      { new: true }
    );

    if (!navigation) {
      return res.status(404).json({
        success: false,
        message: 'Navigation record not found or you do not have permission to update it'
      });
    }

    res.json({
      success: true,
      message: 'Navigation status updated successfully',
      data: { navigation }
    });
  } catch (error) {
    console.error('Navigation status update error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating navigation status' });
  }
});


// @route   GET /api/navigation/search
// @desc    Search landmarks across all buildings
// @access  Public
router.get('/search', validateQuery(searchSchema.merge(paginationSchema)), async (req, res) => {
    try {
        const { q, type, floor, building, page, limit } = req.query;
        const skip = (page - 1) * limit;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const regex = new RegExp(q, 'i');
        let query = {
            isActive: true,
            $or: [
                { name: regex },
                { description: regex },
                { roomNumber: regex }
            ]
        };

        if (building) query.building = building;
        if (floor) query.floor = floor;
        if (type) query.type = type;

        const landmarksPromise = Landmark.find(query)
            .populate('building', 'name address')
            .select('name description type floor coordinates roomNumber images building')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const totalPromise = Landmark.countDocuments(query);
        const [landmarks, total] = await Promise.all([landmarksPromise, totalPromise]);

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
                },
                searchQuery: q
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Server error while searching landmarks' });
    }
});


// @route   GET /api/navigation/popular
// @desc    Get popular landmarks and routes
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const popularLandmarksPipeline = (field) => ([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'landmarks', localField: '_id', foreignField: '_id', as: 'landmark' } },
      { $unwind: '$landmark' },
      { $lookup: { from: 'buildings', localField: 'landmark.building', foreignField: '_id', as: 'building' } },
      { $unwind: '$building' },
      {
          $project: {
              _id: 0,
              landmark: { _id: '$landmark._id', name: '$landmark.name', type: '$landmark.type', floor: '$landmark.floor' },
              building: { _id: '$building._id', name: '$building.name' },
              count: 1
          }
      }
    ]);

    const popularBuildingsPipeline = [
        { $match: { status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: '$building',
                count: { $sum: 1 },
                avgDistance: { $avg: '$totalDistance' },
                avgTime: { $avg: '$estimatedTime' }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'buildings', localField: '_id', foreignField: '_id', as: 'building' } },
        { $unwind: '$building' },
        {
            $project: {
                building: { _id: '$building._id', name: '$building.name' },
                count: 1,
                avgDistance: { $round: ['$avgDistance', 1] },
                avgTime: { $round: ['$avgTime', 0] }
            }
        }
    ];

    const [popularDestinations, popularStartPoints, popularBuildings] = await Promise.all([
        NavigationHistory.aggregate(popularLandmarksPipeline('toLandmark')),
        NavigationHistory.aggregate(popularLandmarksPipeline('fromLandmark')),
        NavigationHistory.aggregate(popularBuildingsPipeline)
    ]);

    res.json({
      success: true,
      data: { popularDestinations, popularStartPoints, popularBuildings }
    });
  } catch (error) {
    console.error('Popular data error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching popular data' });
  }
});


module.exports = router;