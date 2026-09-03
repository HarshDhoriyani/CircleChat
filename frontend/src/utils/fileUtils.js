/**
 * Formats file size in bytes to human readable format
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Checks if a mime type or filename is an image
 */
export const isImageFile = (mimeType = '', filename = '') => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some((ext) => filename?.toLowerCase().endsWith(ext));
};

/**
 * Returns clean file extension
 */
export const getFileExtension = (filename = '') => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
};

/**
 * Supported MIME types & limits
 */
export const ACCEPTED_FILE_TYPES =
  'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
