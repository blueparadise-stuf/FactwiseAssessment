import { Router } from 'express';
import {
  getDoctorRoundsQueue,
  createDoctorVisit,
  updateDoctorVisit,
  getPatientDoctorVisits,
} from '../controllers/doctorVisitController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createDoctorVisitSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

// View rounds queue
router.get('/', getDoctorRoundsQueue);
router.get('/patient/:patientId', getPatientDoctorVisits);

// Doctor only can record and amend doctor rounds
router.post(
  '/',
  authorize('Doctor'),
  validateRequest(createDoctorVisitSchema),
  createDoctorVisit
);
router.patch('/:id', authorize('Doctor'), updateDoctorVisit);

export default router;
