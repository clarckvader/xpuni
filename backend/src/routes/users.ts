import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { userController } from '../container';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), userController.list);
router.post('/', authenticate, requireRole('ADMIN'), userController.create);
router.get('/:id', authenticate, requireRole('ADMIN'), userController.findById);
router.delete('/:id', authenticate, requireRole('ADMIN'), userController.delete);
router.patch('/:id/role', authenticate, requireRole('ADMIN'), userController.updateRole);

export default router;
