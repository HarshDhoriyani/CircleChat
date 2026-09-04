import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(protect);

router.post('/catch-me-up', aiLimiter, aiController.catchMeUp);

export default router;
