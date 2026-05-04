const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (wrapped in try-catch for read-only filesystems like Vercel)
const uploadsDir = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not create uploads directory. This is expected on Vercel or read-only environments.');
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File size limit (5MB)
const fileSizeLimit = 5 * 1024 * 1024; // 5MB in bytes

// Multer configuration for loan images
const uploadLoanImages = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: fileSizeLimit,
    files: 5 // Maximum 5 files
  }
}).array('images', 5); // Field name: 'images', max 5 files

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 images allowed.'
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// Single file upload for profile pictures (if needed)
const uploadSingleImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: fileSizeLimit
  }
}).single('image');

// Get file URL helper
const getFileUrl = (filename) => {
  if (!filename) return null;
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/uploads/${filename}`;
};

// Delete file helper
const deleteFile = (filename) => {
  if (!filename) return;

  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
};

// Clean up files helper (for failed operations)
const cleanupFiles = (files) => {
  if (!files || !Array.isArray(files)) return;

  files.forEach(file => {
    if (file.filename) {
      deleteFile(file.filename);
    }
  });
};

module.exports = {
  uploadLoanImages,
  uploadSingleImage,
  handleMulterError,
  getFileUrl,
  deleteFile,
  cleanupFiles
};