// middlewares/awsupload.js

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
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

// Configure multer-s3 storage
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read', // Change to 'private' if you want uploads private
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const folder = 'uploads';
    const fileName = `${folder}/${Date.now()}_${path.basename(file.originalname)}`;
    cb(null, fileName);
  },
});

// Create multer upload instance
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
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

module.exports = { upload, checkS3Connection };
