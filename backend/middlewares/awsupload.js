
// middlewares/awsupload.js

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure the AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// --- New S3 Connection Check Function ---
const checkS3Connection = async () => {
  try {
    if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
      throw new Error('AWS_BUCKET_NAME and AWS_REGION must be defined in your .env file.');
    }
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

// Create the multer-s3 storage engine
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  
  // Set public read access for uploaded files
  acl: 'public-read', 
  
  // Optional: Add metadata to the file
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },

  // Set the key (i.e., the file name and path in the bucket)
  key: (req, file, cb) => {
    // We can create different folders based on the route or file type
    // Here, we'll use a generic "uploads" folder.
    const folder = 'uploads'; 
    const fileName = `${folder}/${Date.now()}_${path.basename(file.originalname)}`;
    cb(null, fileName);
  }
});

// Create the multer upload instance
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  }
});

module.exports = { upload, checkS3Connection };