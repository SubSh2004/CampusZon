import multer from 'multer';
import path from 'path';

// Configure multer to use memory storage (for cloud upload)
const storage = multer.memoryStorage();

// File filter to accept only static images (no GIFs/animations)
const fileFilter = (req, file, cb) => {
  // Only allow JPEG, JPG, PNG, and WEBP (no GIFs)
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only static image files (JPEG, PNG, WEBP) are allowed. Animated images (GIF) are not permitted.'));
  }
};

// Configure multer with enhanced security and memory optimization
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit per file (reduced for 512MB server)
    files: 3 // Maximum 3 files per upload (reduced to save memory)
  },
  fileFilter: fileFilter,
});

export default upload;
