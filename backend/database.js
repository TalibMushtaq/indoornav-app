const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- MongoDB Connection Logic ---
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
        serverSelectionTimeoutMS: 5000, // modern driver only needs this
      });
      return;
    } catch (error) {
      console.error(`Database connection error (retries left: ${retries - 1}):`, error.message);
      retries--;
      if (retries > 0) {
        await new Promise(res => setTimeout(res, 5000));
      } else {
        console.error('Fatal: Could not connect to the database after multiple retries.');
        process.exit(1);
      }
    }
  }
};

// --- Admin Schema ---
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true, // unique index already created here
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// --- Feedback Schema ---
const feedbackSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
  }
}, {
  timestamps: true
});

feedbackSchema.index({ email: 1 });

// Middleware to hash password before saving admin
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- Visitor Schema ---
const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  lastVisit: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// --- Building Schema ---
const buildingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  address: { type: String, trim: true },
  image: { type: String },
  floors: [{
    number: { type: String, required: true },
    name: { type: String, required: true },
    mapImage: { type: String }
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
}, {
  timestamps: true
});

// --- Landmark Schema ---
const landmarkSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  floor: { type: String, required: true },
  coordinates: { x: { type: Number, required: true }, y: { type: Number, required: true } },
  type: {
    type: String,
    enum: [
      'room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other',
      'lecture_hall', 'classroom', 'lab', 'library', 'auditorium', 'department_office',
      'admissions_office', 'student_union', 'cafeteria', 'bookstore', 'gym',
      'health_center', 'information_desk'
    ],
    required: true
  },
  roomNumber: { type: String, trim: true },
  images: [{
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    visualAidFriendly: { type: Boolean, default: false },
    hearingAidFriendly: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
}, {
  timestamps: true
});

// --- Path Schema ---
const pathSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'Landmark', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'Landmark', required: true },
  distance: { type: Number, required: true, min: 0 },
  estimatedTime: { type: Number, required: true, min: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  instructions: { type: String, required: true, trim: true },
  images: [{ url: String, caption: String, stepNumber: Number }],
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: true },
    requiresElevator: { type: Boolean, default: false },
    requiresStairs: { type: Boolean, default: false }
  },
  isBidirectional: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
}, {
  timestamps: true
});

// --- Navigation History Schema ---
const navigationHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  sessionId: { type: String, required: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  fromLandmark: { type: mongoose.Schema.Types.ObjectId, ref: 'Landmark', required: true },
  toLandmark: { type: mongoose.Schema.Types.ObjectId, ref: 'Landmark', required: true },
  route: [mongoose.Schema.Types.Mixed],
  totalDistance: { type: Number, required: true },
  estimatedTime: { type: Number, required: true },
  actualTime: { type: Number },
  status: { type: String, enum: ['started', 'in_progress', 'completed', 'cancelled'], default: 'started' },
  completedAt: { type: Date },
  feedback: { rating: { type: Number, min: 1, max: 5 }, comment: String }
}, {
  timestamps: true
});

// --- Create indexes for better performance ---
// (Removed duplicate admin index)
visitorSchema.index({ email: 1 });
buildingSchema.index({ createdBy: 1 });
landmarkSchema.index({ building: 1, createdBy: 1 });
pathSchema.index({ from: 1, to: 1, createdBy: 1 });
navigationHistorySchema.index({ building: 1 });

// --- Create models ---
const Admin = mongoose.model('Admin', adminSchema);
const Visitor = mongoose.model('Visitor', visitorSchema);
const Building = mongoose.model('Building', buildingSchema);
const Landmark = mongoose.model('Landmark', landmarkSchema);
const Path = mongoose.model('Path', pathSchema);
const NavigationHistory = mongoose.model('NavigationHistory', navigationHistorySchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

// --- Export models and connection function ---
module.exports = {
  connectDB,
  Admin,
  Visitor,
  Building,
  Landmark,
  Path,
  NavigationHistory,
  Feedback
};
