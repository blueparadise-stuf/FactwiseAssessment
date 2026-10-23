import { Router } from 'express';
import {
  getEligibleDischarges,
  recommendDischarge,
  confirmDischarge,
} from '../controllers/dischargeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { confirmDischargeSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

// View discharge candidates queue
router.get('/eligible', getEligibleDischarges);

// Doctors recommend discharge
router.post(
  '/:patientId/recommend',
  authorize('Doctor'),
  recommendDischarge
);

// Only Administrators can confirm discharge
router.post(
  '/:patientId/confirm',
  authorize('Administrator'),
  validateRequest(confirmDischargeSchema),
  confirmDischarge
);

export default router;
