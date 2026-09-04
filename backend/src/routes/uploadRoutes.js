import { Router } from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', uploadSingle, uploadController.uploadMedia);

export default router;
