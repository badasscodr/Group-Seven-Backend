import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  createVisa,
  getVisas,
  getVisa,
  updateVisa,
  deleteVisa,
  getVisaStatistics,
  updateAllVisaStatuses,
} from './visa.controller';

const router = Router();

// Apply authentication to all visa routes
router.use(authenticate);

// Visa CRUD operations
router.post('/', createVisa);
router.get('/', getVisas);
router.get('/stats', getVisaStatistics);
router.post('/update-statuses', updateAllVisaStatuses);
router.get('/:id', getVisa);
router.put('/:id', updateVisa);
router.delete('/:id', deleteVisa);

export default router;