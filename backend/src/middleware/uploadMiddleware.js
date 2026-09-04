import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES, SUPPORTED_DOC_TYPES } from '../config/constants.js';
import { ApiError } from '../utils/apiError.js';

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${sanitizedExt}`);
  },
});

// File filter for images & supported documents
const fileFilter = (req, file, cb) => {
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/');
  const isDoc = SUPPORTED_DOC_TYPES.includes(file.mimetype);

  if (isImage || isDoc) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Unsupported file type '${file.mimetype}'. Supported: Images (PNG, JPEG, WebP, GIF), Documents (PDF, DOCX, ZIP, TXT, XLSX).`
      ),
      false
    );
  }
};

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
}).single('file');

export default uploadSingle;
