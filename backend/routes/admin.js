const express = require('express');
const fetch = require('node-fetch');
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

router.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
    const { email, masterPassword, newPassword } = req.body;
    if (masterPassword !== process.env.MASTER_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid master password.' });
    }
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin with this email does not exist.' });
        }
        admin.password = newPassword;
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

const adminUpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
}).strip();

const adminChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

router.put('/me', validate(adminUpdateProfileSchema), async (req, res) => {
    try {
        const { name, email } = req.body;
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }
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
        admin.password = newPassword;
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
        const buildingData = { ...req.body, createdBy: req.user._id };
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
            } catch (s3Error) {
                console.error('S3 deletion failed:', s3Error);
            }
        }
        const pathsDeleted = await Path.deleteMany({ $or: [{ from: { $in: landmarkIds } }, { to: { $in: landmarkIds } }] });
        const navHistoryDeleted = await NavigationHistory.deleteMany({ building: building._id });
        await Landmark.deleteMany({ building: building._id });
        await Building.findByIdAndDelete(building._id);
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
        const existingLandmark = await Landmark.findOne({ name: landmarkData.name, building: landmarkData.building, floor: landmarkData.floor, createdBy: req.user._id });
        if (existingLandmark) {
            return res.status(400).json({ success: false, message: `A landmark named "${landmarkData.name}" already exists on this floor.` });
        }
        if (req.files && req.files.length > 0) {
            landmarkData.images = req.files.map(file => ({ url: file.location, caption: '' }));
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
            const newImages = req.files.map(file => ({ url: file.location, caption: '' }));
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
            } catch (s3Error) {
                console.error('S3 deletion failed:', s3Error);
            }
        }
        const pathsDeleted = await Path.deleteMany({ $or: [{ from: landmark._id }, { to: landmark._id }] });
        const navHistoryDeleted = await NavigationHistory.deleteMany({ $or: [{ fromLandmark: landmark._id }, { toLandmark: landmark._id }] });
        await Landmark.findByIdAndDelete(landmark._id);
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
// AI-POWERED INSTRUCTION PROCESSING
// ===============================
async function processInstructionsWithAI(text, mode, fromLandmarkName, toLandmarkName) {
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  if (!API_KEY) {
    console.warn("Google Gemini API Key not configured. Using original text.");
    return text;
  }
  
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  let prompt = '';
  if (mode === 'standardize') {
    prompt = `You are rewriting indoor navigation instructions. Convert the user's input into clear, step-by-step walking directions.

ROUTE: From "${fromLandmarkName}" to "${toLandmarkName}"

USER'S INSTRUCTIONS:
"${text}"

REQUIREMENTS:
- Start with action verbs (Exit, Turn, Walk, Continue, Enter, Take, Pass, etc.)
- Include clear landmarks/reference points
- Use simple directional terms: left, right, straight, ahead
- Keep sentences short and action-focused
- Remove casual language, filler words, and unnecessary details
- If stairs/elevators are mentioned, keep them explicit
- Maintain logical sequence of movements

OUTPUT ONLY THE REWRITTEN INSTRUCTIONS. NO EXTRA TEXT.`;

  } else if (mode === 'reverse') {
    prompt = `You are reversing indoor walking directions. Convert a path from "${fromLandmarkName}" → "${toLandmarkName}" into the reverse journey from "${toLandmarkName}" → "${fromLandmarkName}".

ORIGINAL INSTRUCTIONS (${fromLandmarkName} → ${toLandmarkName}):
"${text}"

REVERSAL RULES:
1. Reverse the ORDER of all steps (last step becomes first)
2. Flip ALL directional terms:
   - "Turn left" → "Turn right"
   - "Turn right" → "Turn left"
   - "Pass X on your left" → "Pass X on your right"
   - "Exit" → "Enter" (and vice versa)
3. Adjust reference points
4. Keep distances and landmarks the same

OUTPUT ONLY THE REVERSED INSTRUCTIONS. NO EXTRA TEXT.`;

  } else {
    throw new Error("Invalid AI processing mode specified.");
  }
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40
        }
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error:', response.status, errorBody);
      
      if (response.status === 429) {
        console.warn('AI API rate limit reached. Using original text.');
        return text;
      } else if (response.status === 400) {
        console.warn('AI API bad request. Using original text.');
        return text;
      }
      
      throw new Error(`AI API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.warn('AI returned no candidates. Using original text.');
      return text;
    }

    const candidate = data.candidates[0];
    let result = null;

    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn(`AI hit MAX_TOKENS limit for ${mode} mode. Using original text.`);
      return text;
    }

    if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
      console.warn(`AI filtered content due to ${candidate.finishReason}. Using original text.`);
      return text;
    }

    if (candidate.content && candidate.content.parts && candidate.content.parts[0]?.text) {
      result = candidate.content.parts[0].text;
    } else if (candidate.output) {
      result = candidate.output;
    }

    if (!result) {
      console.warn("AI response missing text content. Using original text.");
      return text;
    }

    result = result.trim();
    result = result.replace(/^(Here are the|Here's the|The) (rewritten|reversed) instructions?:?\s*/i, '');
    result = result.replace(/^Instructions?:?\s*/i, '');
    result = result.replace(/```.*?\n?/g, '');
    
    return result || text;
    
  } catch (error) {
    console.error(`Error in processInstructionsWithAI (${mode} mode):`, error.message);
    console.warn('AI processing failed. Using original text as fallback.');
    return text;
  }
}

// ===============================
// PATH MANAGEMENT
// ===============================

router.get('/paths', validateQuery(paginationSchema.merge(searchSchema)), async (req, res) => {
  try {
    const { page = 1, limit = 10, building, floor } = req.query;
    const skip = (page - 1) * limit;

    let query = { createdBy: req.user._id, isActive: true };

    if (building) {
      const landmarkIds = await Landmark.find({ 
        building, 
        createdBy: req.user._id 
      }).distinct('_id');
      
      if (landmarkIds.length === 0) {
        return res.json({
          success: true,
          data: { paths: [] },
          pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
        });
      }

      query.$or = [
        { from: { $in: landmarkIds }, to: { $in: landmarkIds } }
      ];
    }

    const [paths, total] = await Promise.all([
      Path.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('from', 'name floor building')
          .populate('to', 'name floor building'),
      Path.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: { paths },
      pagination: { 
        total, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        totalPages: Math.ceil(total / limit) 
      }
    });
  } catch (error) {
    console.error('Get paths error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching paths.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// AI-POWERED PATH CREATION
// ===============================
router.post('/paths', validate(pathSchema), async (req, res) => {
  try {
    const { from, to, isBidirectional, instructions, ...rest } = req.body;
    const createdBy = req.user._id;

    // === VALIDATION ===
    if (from === to) {
      return res.status(400).json({ 
        success: false, 
        message: 'A path must connect two different landmarks.' 
      });
    }

    // Fetch landmarks in parallel for better performance
    const [fromLandmark, toLandmark] = await Promise.all([
      Landmark.findOne({ _id: from, createdBy }).lean(),
      Landmark.findOne({ _id: to, createdBy }).lean()
    ]);

    if (!fromLandmark || !toLandmark) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or both landmarks not found or you do not have access.' 
      });
    }

    // Ensure same building
    if (fromLandmark.building.toString() !== toLandmark.building.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both landmarks must be in the same building.' 
      });
    }

    // Check for existing path (bidirectional check)
    const existingPath = await Path.findOne({ 
      $or: [
        { from, to },
        { from: to, to: from }
      ]
    }).lean();
    
    if (existingPath) {
      return res.status(400).json({ 
        success: false, 
        message: 'A path between these landmarks already exists.' 
      });
    }

    // === AI PROCESSING ===
    console.log(`[AI] Processing path: ${fromLandmark.name} → ${toLandmark.name}`);
    
    let forwardInstructions = instructions;
    let reverseInstructions = null;
    const aiStatus = {
      forward: { attempted: true, success: false, enhanced: false },
      reverse: { attempted: false, success: false, enhanced: false }
    };

    // Step 1: Enhance forward instructions
    try {
      const enhanced = await processInstructionsWithAI(
        instructions,
        'standardize',
        fromLandmark.name,
        toLandmark.name
      );
      
      // Only use AI result if it's meaningfully different
      if (enhanced && enhanced.trim() !== instructions.trim() && enhanced.length > 10) {
        forwardInstructions = enhanced;
        aiStatus.forward.success = true;
        aiStatus.forward.enhanced = true;
        console.log('[AI] ✅ Forward instructions enhanced');
      } else {
        console.log('[AI] ⚠️ Forward enhancement returned similar/empty result, keeping original');
      }
    } catch (error) {
      console.warn('[AI] ❌ Forward enhancement failed:', error.message);
    }

    // Step 2: Generate reverse instructions (only if bidirectional)
    if (isBidirectional) {
      aiStatus.reverse.attempted = true;
      
      try {
        const reversed = await processInstructionsWithAI(
          forwardInstructions,  // ✅ Use ENHANCED instructions
          'reverse',
          fromLandmark.name,
          toLandmark.name
        );
        
        // Validate reverse instructions quality
        if (reversed && reversed.trim().length > 10) {
          reverseInstructions = reversed;
          aiStatus.reverse.success = true;
          aiStatus.reverse.enhanced = true;
          console.log('[AI] ✅ Reverse instructions generated from enhanced version');
        } else {
          console.log('[AI] ⚠️ Reverse generation returned empty/invalid result');
        }
      } catch (error) {
        console.warn('[AI] ❌ Reverse generation failed:', error.message);
      }
    }

    // === DATABASE SAVE ===
    const pathData = { 
      from, 
      to, 
      isBidirectional, 
      createdBy, 
      ...rest,
      instructions: forwardInstructions,
      reverseInstructions: isBidirectional ? reverseInstructions : undefined
    };

    const path = new Path(pathData);
    await path.save();
    
    // Populate landmarks for response
    await path.populate([
      { path: 'from', select: 'name floor type' }, 
      { path: 'to', select: 'name floor type' }
    ]);

    // === RESPONSE MESSAGE ===
    let message = 'Path created successfully';
    const enhancements = [];
    
    if (aiStatus.forward.enhanced) {
      enhancements.push('forward instructions enhanced');
    }
    if (aiStatus.reverse.enhanced) {
      enhancements.push('reverse instructions auto-generated');
    }
    
    if (enhancements.length > 0) {
      message += ` with AI: ${enhancements.join(' and ')}.`;
    } else if (aiStatus.forward.attempted || aiStatus.reverse.attempted) {
      message += '. (AI processing unavailable - original instructions saved)';
    } else {
      message += '.';
    }

    res.status(201).json({ 
      success: true, 
      message,
      data: { 
        path,
        aiProcessing: {
          forward: aiStatus.forward,
          reverse: aiStatus.reverse,
          usedEnhancedForReverse: aiStatus.forward.enhanced && aiStatus.reverse.success
        }
      }
    });

  } catch (error) {
    console.error('[PATH_CREATE_ERROR]', error);
    
    // Better error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid path data',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating path. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
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

router.patch('/paths/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
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