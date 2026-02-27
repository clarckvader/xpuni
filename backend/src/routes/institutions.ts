import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { institutionController } from '../container';

const router = Router();

router.get('/', institutionController.list);
router.get('/:slug', institutionController.findBySlug);
router.post('/', authenticate, requireRole('ADMIN'), institutionController.create);
router.patch('/:id', authenticate, requireRole('ADMIN'), institutionController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), institutionController.deactivate);

export default router;
