import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // Protect all user directory endpoints

router.get('/search', userController.searchUsers);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

export default router;
