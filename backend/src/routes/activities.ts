import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { activityController } from '../container';

const router = Router();

router.get('/', authenticate, activityController.list);
router.get('/:id', authenticate, activityController.findById);
router.post('/', authenticate, requireRole('ADMIN'), activityController.create);
router.patch('/:id', authenticate, requireRole('ADMIN'), activityController.update);
router.post('/:id/badge-image', authenticate, requireRole('ADMIN'), upload.single('image'), activityController.uploadBadgeImage);
router.delete('/:id', authenticate, requireRole('ADMIN'), activityController.deactivate);

export default router;
