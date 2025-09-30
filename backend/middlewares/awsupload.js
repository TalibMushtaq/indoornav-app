// middlewares/awsupload.js

const { S3Client, ListBucketsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Validate .env
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_BUCKET_NAME) {
  throw new Error('Missing AWS configuration in .env. Make sure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_BUCKET_NAME are set.');
}

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// --- S3 Connection Check ---
const checkS3Connection = async () => {
  try {
    console.log('Checking AWS S3 connection...');
    await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ AWS S3 connection successful.');
  } catch (error) {
    console.error('❌ AWS S3 Connection Error: Could not connect to S3.');
    console.error('Please check your AWS credentials and bucket configuration in the .env file.');
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

// --- S3 Deletion Function ---
const deleteFromS3 = async (urls) => {
  if (!urls || urls.length === 0) return;

  // Extract keys from full S3 URLs
  const keys = urls.map(url => {
    try {
      const urlObj = new URL(url);
      // Remove leading slash from pathname
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error('Invalid URL:', url);
      return null;
    }
  }).filter(key => key !== null);

  if (keys.length === 0) return;

  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
      Quiet: false
    }
  };

  try {
    const result = await s3Client.send(new DeleteObjectsCommand(deleteParams));
    console.log(`Successfully deleted ${result.Deleted?.length || 0} objects from S3`);
    if (result.Errors && result.Errors.length > 0) {
      console.error('Some objects failed to delete:', result.Errors);
    }
    return result;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
};

// Configure multer-s3 storage
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  // --- UPDATED: Dynamic key based on admin ID and your desired folder ---
  key: (req, file, cb) => {
    // req.user is available because our 'authenticate' middleware runs first
    const adminId = req.user?._id || 'unauthenticated';
    const folder = `NaviGuide-public/${adminId}`; 
    const fileName = `${folder}/${Date.now()}_${path.basename(file.originalname)}`;
    cb(null, fileName);
  },
});

// Create multer upload instance
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  },
});

// Export the delete function alongside the others
module.exports = { upload, checkS3Connection, deleteFromS3 };