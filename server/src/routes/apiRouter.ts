import { Router } from 'express';
import authRoutes from './authRoutes.js';
import patientRoutes from './patientRoutes.js';
import temperatureRoutes from './temperatureRoutes.js';
import doctorVisitRoutes from './doctorVisitRoutes.js';
import dischargeRoutes from './dischargeRoutes.js';
import reportRoutes from './reportRoutes.js';
import userRoutes from './userRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/temperatures', temperatureRoutes);
apiRouter.use('/doctor-visits', doctorVisitRoutes);
apiRouter.use('/discharges', dischargeRoutes);
apiRouter.use('/', reportRoutes); // contains /dashboard/summary, /reports/outcomes, /reports/occupancy, /reports/export
apiRouter.use('/users', userRoutes);
apiRouter.use('/settings', settingsRoutes);

export default apiRouter;
