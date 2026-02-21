import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authController } from '../container';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

export default router;
