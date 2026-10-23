import { Router } from 'express';
import {
  listPatients,
  createPatient,
  getPatientDetails,
  updatePatient,
  getPatientHistory,
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createPatientSchema, updatePatientSchema } from '../validators/schemas.js';

const router = Router();

// All authenticated roles can view patient lists and details
router.use(authenticate);

router.get('/', listPatients);
router.post(
  '/',
  authorize('Administrator'),
  validateRequest(createPatientSchema),
  createPatient
);
router.get('/:id', getPatientDetails);
router.patch(
  '/:id',
  authorize('Administrator'),
  validateRequest(updatePatientSchema),
  updatePatient
);
router.get('/:id/history', getPatientHistory);

export default router;
