import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { redemptionController } from '../container';

const router = Router();

router.post('/', authenticate, requireRole('STUDENT'), redemptionController.create);
router.get('/', authenticate, redemptionController.list);
router.get('/:id', authenticate, redemptionController.findById);
router.patch('/:id/complete', authenticate, requireRole('ADMIN'), redemptionController.complete);

export default router;
