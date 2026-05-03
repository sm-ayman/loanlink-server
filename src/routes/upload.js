const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLoanImages, handleMulterError } = require('../middleware/upload');

// All upload routes require authentication and manager/admin role
router.use(authenticate);
router.use(authorize('manager', 'admin'));

// Upload loan images
router.post('/loan-images', uploadLoanImages, handleMulterError, (req, res) => {
  try {
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Return uploaded file information
    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/uploads/${file.filename}`
    }));

    res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles
      }
    });
  } catch (error) {
    console.error('Upload response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing upload'
    });
  }
});

module.exports = router;