import { Router } from 'express';
import {
  listTemperatures,
  createTemperature,
  getPendingTemperatures,
  getPatientTemperatures,
  correctTemperature,
} from '../controllers/temperatureController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { recordTemperatureSchema, correctTemperatureSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', listTemperatures);
router.get('/pending', getPendingTemperatures);
router.get('/patient/:patientId', getPatientTemperatures);

// Nurse, Doctor, Administrator can record temperatures
router.post(
  '/',
  authorize('Nurse', 'Doctor', 'Administrator'),
  validateRequest(recordTemperatureSchema),
  createTemperature
);

// Nurse and Administrator can execute authorized corrections
router.post(
  '/:id/corrections',
  authorize('Nurse', 'Administrator'),
  validateRequest(correctTemperatureSchema),
  correctTemperature
);

export default router;
