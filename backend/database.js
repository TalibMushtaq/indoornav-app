const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Updated MongoDB Connection Logic ---
const connectDB = async (retries = 5) => {
  // Listen for connection events
  mongoose.connection.on('connected', () => console.log('✅ MongoDB connected successfully.'));
  mongoose.connection.on('error', err => console.error('❌ MongoDB connection error:', err));
  mongoose.connection.on('disconnected', () => console.log('🟡 MongoDB disconnected.'));

  while (retries > 0) {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in your .env file.');
      }
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      });
      return; // Successful connection
    } catch (error) {
      console.error(`Database connection error (retries left: ${retries - 1}):`, error.message);
      retries--;
      if (retries > 0) {
        // Wait 5 seconds before trying again
        await new Promise(res => setTimeout(res, 5000));
      } else {
        console.error('Fatal: Could not connect to the database after multiple retries.');
        process.exit(1);
      }
    }
  }
};

// ... (the rest of your database.js file remains the same)

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Building Schema
const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  floors: [{
    number: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    mapImage: {
      type: String // URL to floor plan image
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Landmark Schema
const landmarkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  floor: {
    type: String,
    required: true
  },
  coordinates: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  type: {
    type: String,
    enum: ['room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other'],
    required: true
  },
  roomNumber: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    visualAidFriendly: {
      type: Boolean,
      default: false
    },
    hearingAidFriendly: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Path Schema (connections between landmarks)
const pathSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landmark',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landmark',
    required: true
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedTime: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    url: String,
    caption: String,
    stepNumber: Number
  }],
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: true
    },
    requiresElevator: {
      type: Boolean,
      default: false
    },
    requiresStairs: {
      type: Boolean,
      default: false
    }
  },
  isBidirectional: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Navigation History Schema
const navigationHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  fromLandmark: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landmark',
    required: true
  },
  toLandmark: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landmark',
    required: true
  },
  route: [{
    landmark: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landmark'
    },
    path: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Path'
    },
    stepNumber: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  totalDistance: {
    type: Number,
    required: true
  },
  estimatedTime: {
    type: Number,
    required: true
  },
  actualTime: {
    type: Number // Time taken to complete navigation
  },
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'cancelled'],
    default: 'started'
  },
  completedAt: {
    type: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  }
}, {
  timestamps: true
});

// Create indexes for better performance
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

buildingSchema.index({ isActive: 1 });
buildingSchema.index({ name: 'text', description: 'text' });
buildingSchema.index({ createdAt: -1 });

landmarkSchema.index({ building: 1, floor: 1 });
landmarkSchema.index({ coordinates: 1 });
landmarkSchema.index({ isActive: 1 });
landmarkSchema.index({ name: 'text', description: 'text', roomNumber: 'text' });

pathSchema.index({ from: 1, to: 1 });
pathSchema.index({ isActive: 1 });
pathSchema.index({ 'accessibility.wheelchairAccessible': 1 });

navigationHistorySchema.index({ user: 1, createdAt: -1 });
navigationHistorySchema.index({ building: 1, createdAt: -1 });
navigationHistorySchema.index({ sessionId: 1 });
navigationHistorySchema.index({ status: 1 });

// Create models
const User = mongoose.model('User', userSchema);
const Building = mongoose.model('Building', buildingSchema);
const Landmark = mongoose.model('Landmark', landmarkSchema);
const Path = mongoose.model('Path', pathSchema);
const NavigationHistory = mongoose.model('NavigationHistory', navigationHistorySchema);

module.exports = {
  connectDB,
  User,
  Building,
  Landmark,
  Path,
  NavigationHistory
};