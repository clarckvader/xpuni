import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { rewardController } from '../container';

const router = Router();

router.get('/', authenticate, rewardController.list);
router.get('/:id', authenticate, rewardController.findById);
router.post('/', authenticate, requireRole('ADMIN'), rewardController.create);
router.patch('/:id', authenticate, requireRole('ADMIN'), rewardController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), rewardController.deactivate);
router.post('/:id/image', authenticate, requireRole('ADMIN'), upload.single('image'), rewardController.uploadImage);

export default router;
