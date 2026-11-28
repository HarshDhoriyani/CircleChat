import { cloudinary, isCloudinaryConfigured, configureCloudinary } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';
import fsPromises from 'fs/promises';

export const uploadService = {
  /**
   * Processes an uploaded file (from Multer) and returns normalized attachment metadata
   */
  async processUploadedFile(file, req) {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    let fileUrl = '';

    try {
      if (isCloudinaryConfigured()) {
        try {
          configureCloudinary();
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'circlechat_uploads',
            resource_type: 'auto',
          });
          fileUrl = result.secure_url;
        } catch (err) {
          logger.warn(`⚠️ Cloudinary upload failed (${err.message}). Falling back to local storage URL.`);
          fileUrl = this.generateLocalFileUrl(file.filename, req);
        }
      } else {
        fileUrl = this.generateLocalFileUrl(file.filename, req);
      }

      return {
        _id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        url: fileUrl,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      };
    } finally {
      if (isCloudinaryConfigured() && fileUrl !== this.generateLocalFileUrl(file.filename, req)) {
        await fsPromises.unlink(file.path).catch(() => {});
      }
    }
  },

  generateLocalFileUrl(filename, req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
    return `${protocol}://${host}/uploads/${filename}`;
  },
};

export default uploadService;
