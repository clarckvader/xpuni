import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { submissionController } from '../container';

const router = Router();

router.post('/', authenticate, requireRole('STUDENT'), upload.single('file'), submissionController.create);
router.get('/', authenticate, submissionController.list);
router.get('/:id', authenticate, submissionController.findById);
router.patch('/:id/approve', authenticate, requireRole('ADMIN', 'REVIEWER'), submissionController.approve);
router.patch('/:id/reject', authenticate, requireRole('ADMIN', 'REVIEWER'), submissionController.reject);

export default router;
