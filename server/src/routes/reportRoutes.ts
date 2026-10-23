import { Router } from 'express';
import {
  getDashboardSummary,
  getOutcomesReport,
  getOccupancyReport,
  exportReportsCSV,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard/summary', getDashboardSummary);
router.get('/reports/outcomes', getOutcomesReport);
router.get('/reports/occupancy', getOccupancyReport);
router.get('/reports/export', exportReportsCSV);

export default router;
