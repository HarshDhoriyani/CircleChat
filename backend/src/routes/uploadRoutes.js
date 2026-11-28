import { Router } from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingle, validateUploadedFile } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', uploadSingle, validateUploadedFile, uploadController.uploadMedia);

export default router;
