import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
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
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.mimetype);
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

const startsWith = (buffer, signature) =>
  signature.every((byte, index) => buffer[index] === byte);

export const validateUploadedFile = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const buffer = await fsPromises.readFile(req.file.path);

    const detectedTypes = [];
    if (startsWith(buffer, [0xff, 0xd8, 0xff])) detectedTypes.push('image/jpeg');
    if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) detectedTypes.push('image/png');
    if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) detectedTypes.push('image/gif');
    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      detectedTypes.push('image/webp');
    }
    if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) detectedTypes.push('application/pdf');
    if (
      startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
      startsWith(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
      startsWith(buffer, [0x50, 0x4b, 0x07, 0x08])
    ) {
      detectedTypes.push(
        'application/zip',
        'application/x-zip-compressed',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    }
    if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
      detectedTypes.push(
        'application/msword',
        'application/vnd.ms-excel'
      );
    }
    if (!buffer.includes(0)) detectedTypes.push('text/plain');

    if (!detectedTypes.includes(req.file.mimetype)) {
      await fsPromises.unlink(req.file.path).catch(() => {});
      throw ApiError.badRequest(
        `The uploaded file contents do not match declared type '${req.file.mimetype}'.`
      );
    }

    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(ApiError.badRequest('Unable to validate the uploaded file.'));
  }
};

export default uploadSingle;
