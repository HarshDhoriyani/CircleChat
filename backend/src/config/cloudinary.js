import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export const configureCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    return true;
  }
  return false;
};

// Initialize on module load
if (configureCloudinary()) {
  logger.info(`☁️ Cloudinary configured successfully for cloud: "${process.env.CLOUDINARY_CLOUD_NAME}"`);
} else {
  logger.info('📁 Cloudinary credentials not detected; using local storage for media uploads');
}

export { cloudinary };
export default cloudinary;
