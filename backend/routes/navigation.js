const express = require('express');
const { Building, Landmark, Path, NavigationHistory } = require('../database');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const {
  validate,
  validateQuery,
  navigationRequestSchema,
  searchSchema,
  paginationSchema
} = require('../validators/schemas');

const router = express.Router();

// --- OPTIMIZED ALGORITHM IMPLEMENTATION ---

// Binary Heap Priority Queue (much faster than linear insertion)
class MinHeap {
  constructor() {
    this.heap = [];
  }

  enqueue(element) {
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].distance <= this.heap[index].distance) break;
      
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    while (true) {
      let minIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.heap.length && 
          this.heap[leftChild].distance < this.heap[minIndex].distance) {
        minIndex = leftChild;
      }

      if (rightChild < this.heap.length && 
          this.heap[rightChild].distance < this.heap[minIndex].distance) {
        minIndex = rightChild;
      }

      if (minIndex === index) break;

      [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
      index = minIndex;
    }
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

// Optimized Graph with better Dijkstra implementation
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
    if (!this.adjacencyList.has(from)) return;
    
    this.adjacencyList.get(from).push({
      node: to,
      weight,
      path: pathData
    });

    // Handle bidirectional paths
    if (pathData.isBidirectional && this.adjacencyList.has(to)) {
      this.adjacencyList.get(to).push({
        node: from,
        weight,
        path: {
          ...pathData,
          instructions: pathData.reverseInstructions || `Return via: ${pathData.instructions}`,
          images: pathData.images ? [...pathData.images].reverse() : []
        }
      });
    }
  }

  dijkstra(start, end, preferences = {}) {
    const distances = new Map();
    const previous = new Map();
    const pathDetails = new Map();
    const visited = new Set();
    const pq = new MinHeap();

    // Early exit if start or end don't exist
    if (!this.nodes.has(start) || !this.nodes.has(end)) {
      return { path: [], totalDistance: Infinity, totalTime: 0 };
    }

    // Initialize distances
    for (let node of this.nodes.keys()) {
      distances.set(node, Infinity);
    }
    distances.set(start, 0);
    pq.enqueue({ node: start, distance: 0 });

    while (!pq.isEmpty()) {
      const { node: currentNode, distance: currentDistance } = pq.dequeue();

      // Skip if already visited (handles duplicate entries in heap)
      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      // Early termination - we found the shortest path to end
      if (currentNode === end) break;

      // Skip if this is an outdated entry
      if (currentDistance > distances.get(currentNode)) continue;

      const neighbors = this.adjacencyList.get(currentNode) || [];

      for (let neighbor of neighbors) {
        // Skip visited nodes
        if (visited.has(neighbor.node)) continue;

        // Apply preference filters
        if (!this.meetsPreferences(neighbor.path, preferences)) {
          continue;
        }

        const distance = currentDistance + neighbor.weight;

        if (distance < distances.get(neighbor.node)) {
          distances.set(neighbor.node, distance);
          previous.set(neighbor.node, currentNode);
          pathDetails.set(neighbor.node, neighbor.path);
          pq.enqueue({ node: neighbor.node, distance });
        }
      }
    }

    // Reconstruct path
    return this.reconstructPath(start, end, distances, previous, pathDetails);
  }

  meetsPreferences(path, preferences) {
    if (!path) return true;

    // Check accessibility preferences
    if (preferences.avoidStairs && path.accessibility?.requiresStairs) {
      return false;
    }
    if (preferences.wheelchairAccessible && !path.accessibility?.wheelchairAccessible) {
      return false;
    }
    if (preferences.avoidElevators && path.accessibility?.requiresElevator) {
      return false;
    }
    if (preferences.maxDifficulty) {
      const difficultyLevel = { easy: 1, medium: 2, hard: 3 };
      if (difficultyLevel[path.difficulty] > difficultyLevel[preferences.maxDifficulty]) {
        return false;
      }
    }

    return true;
  }

  reconstructPath(start, end, distances, previous, pathDetails) {
    const path = [];
    let current = end;

    // No path found
    if (distances.get(current) === Infinity) {
      return { path: [], totalDistance: Infinity, totalTime: 0 };
    }

    // Build path from end to start
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

  // A* Algorithm (optional upgrade for even better performance)
  astar(start, end, preferences = {}) {
    const gScore = new Map(); // Actual distance from start
    const fScore = new Map(); // gScore + heuristic
    const previous = new Map();
    const pathDetails = new Map();
    const visited = new Set();
    const pq = new MinHeap();

    if (!this.nodes.has(start) || !this.nodes.has(end)) {
      return { path: [], totalDistance: Infinity, totalTime: 0 };
    }

    const heuristic = (nodeId) => {
      const node = this.nodes.get(nodeId);
      const endNode = this.nodes.get(end);
      
      // Euclidean distance heuristic (if coordinates available)
      if (node.coordinates && endNode.coordinates) {
        const dx = node.coordinates.x - endNode.coordinates.x;
        const dy = node.coordinates.y - endNode.coordinates.y;
        
        // --- FIX IMPLEMENTED HERE ---
        // Safely parse floor strings to integers before subtraction.
        const startFloor = parseInt(node.floor, 10) || 0;
        const endFloor = parseInt(endNode.floor, 10) || 0;
        const dz = (startFloor - endFloor) * 5; // Assume 5m per floor
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
      
      // Floor difference heuristic as a fallback
      const startFloor = parseInt(node.floor, 10) || 0;
      const endFloor = parseInt(endNode.floor, 10) || 0;
      return Math.abs(startFloor - endFloor) * 5;
    };

    for (let node of this.nodes.keys()) {
      gScore.set(node, Infinity);
      fScore.set(node, Infinity);
    }
    
    gScore.set(start, 0);
    fScore.set(start, heuristic(start));
    pq.enqueue({ node: start, distance: fScore.get(start) });

    while (!pq.isEmpty()) {
      const { node: currentNode } = pq.dequeue();

      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      if (currentNode === end) break;

      const neighbors = this.adjacencyList.get(currentNode) || [];

      for (let neighbor of neighbors) {
        if (visited.has(neighbor.node)) continue;
        if (!this.meetsPreferences(neighbor.path, preferences)) continue;

        const tentativeGScore = gScore.get(currentNode) + neighbor.weight;

        if (tentativeGScore < gScore.get(neighbor.node)) {
          previous.set(neighbor.node, currentNode);
          pathDetails.set(neighbor.node, neighbor.path);
          gScore.set(neighbor.node, tentativeGScore);
          fScore.set(neighbor.node, tentativeGScore + heuristic(neighbor.node));
          pq.enqueue({ node: neighbor.node, distance: fScore.get(neighbor.node) });
        }
      }
    }

    return this.reconstructPath(start, end, gScore, previous, pathDetails);
  }
}


// --- API ROUTES ---

// @route   GET /api/navigation/buildings
// @desc    Get all available buildings for navigation
// @access  Public
router.get('/buildings', validateQuery(paginationSchema), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [buildings, total] = await Promise.all([
      Building.aggregate([
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
      ]),
      Building.countDocuments({ isActive: true })
    ]);

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

    const building = await Building.findById(buildingId).lean();
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
    if (floor) query.floor = floor; // Note: floor is a string, so direct comparison works
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
      .sort({ floor: 1, name: 1 })
      .lean();

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
        landmarks,
        landmarksByFloor,
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
// @desc    Calculate route between two landmarks (OPTIMIZED)
// @access  Public (with optional auth for history)
router.post('/route', async (req, res) => {
  try {
    // Optional authentication
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        // Add your token verification logic here
      } catch (authError) {
        console.log('Optional auth failed:', authError.message);
      }
    }

    // Validation
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

    const { building: buildingId, from: fromId, to: toId, preferences = {}, algorithm = 'dijkstra' } = validationResult.data;

    // Fetch data concurrently with lean() for better performance
    const [building, fromLandmark, toLandmark] = await Promise.all([
      Building.findById(buildingId).lean(),
      Landmark.findById(fromId).lean(),
      Landmark.findById(toId).lean()
    ]);

    // Validation
    if (!building || !building.isActive) {
      return res.status(400).json({ success: false, message: 'Building not found' });
    }
    if (!fromLandmark || !fromLandmark.isActive || fromLandmark.building.toString() !== buildingId) {
      return res.status(400).json({ success: false, message: 'Invalid "from" landmark' });
    }
    if (!toLandmark || !toLandmark.isActive || toLandmark.building.toString() !== buildingId) {
      return res.status(400).json({ success: false, message: 'Invalid "to" landmark' });
    }

    // Same location check
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
    
    // Get all active landmark IDs for the building once
    const landmarkIdsInBuilding = await Landmark.distinct('_id', { building: buildingId, isActive: true });

    // Fetch landmarks and paths concurrently
    const [landmarks, buildingPaths] = await Promise.all([
      Landmark.find({ _id: { $in: landmarkIdsInBuilding } }).lean(),
      Path.find({
        isActive: true,
        from: { $in: landmarkIdsInBuilding },
        to: { $in: landmarkIdsInBuilding } // Ensures both ends are in the building
      }).lean()
    ]);

    // Build graph
    const graph = new Graph();
    landmarks.forEach(landmark => 
      graph.addNode(landmark._id.toString(), landmark)
    );
    buildingPaths.forEach(path => {
      graph.addEdge(
        path.from.toString(),
        path.to.toString(),
        path.distance,
        path
      );
    });

    // Calculate route (use A* if requested, otherwise Dijkstra)
    const result = algorithm === 'astar' 
      ? graph.astar(fromId, toId, preferences)
      : graph.dijkstra(fromId, toId, preferences);

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
      path: index > 0 ? result.path[index].path : null,
      instructions: index === 0 
        ? `Start at ${step.landmark.name}` 
        : result.path[index].path.instructions,
      distance: index > 0 ? result.path[index].path.distance : 0,
      estimatedTime: index > 0 ? result.path[index].path.estimatedTime : 0,
      images: index > 0 ? result.path[index].path.images : [],
      difficulty: index > 0 ? result.path[index].path.difficulty : 'easy',
      accessibility: index > 0 ? result.path[index].path.accessibility : null
    }));

    const routeData = {
      steps,
      totalDistance: Math.round(result.totalDistance),
      totalTime: result.totalTime,
      preferences,
      algorithm: algorithm || 'dijkstra',
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
        route: steps.slice(1).map(step => ({
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
      .populate('building', 'name floors')
      .lean();

    if (!landmark || !landmark.isActive) {
      return res.status(404).json({ success: false, message: 'Landmark not found' });
    }

    const connectedPaths = await Path.find({
      $or: [{ from: landmark._id }, { to: landmark._id, isBidirectional: true }],
      isActive: true
    })
    .populate('from to', 'name type floor')
    .lean();

    const connections = connectedPaths.map(path => {
      const isFromCurrent = path.from._id.toString() === landmark._id.toString();
      const connectedLandmark = isFromCurrent ? path.to : path.from;

      return {
        landmark: connectedLandmark,
        distance: path.distance,
        estimatedTime: path.estimatedTime,
        difficulty: path.difficulty,
        instructions: isFromCurrent ? path.instructions : (path.reverseInstructions || `Return via: ${path.instructions}`),
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
      { _id: navigationId, user: req.user._id },
      { 
        status, 
        completedAt: status === 'completed' ? new Date() : undefined,
      },
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
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

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

        const [landmarks, total] = await Promise.all([
          Landmark.find(query)
            .populate('building', 'name address')
            .select('name description type floor coordinates roomNumber images building')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Landmark.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                landmarks,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
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