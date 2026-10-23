import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  resetUserCredentials,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/schemas.js';

const router = Router();

// Only Administrator can manage users
router.use(authenticate, authorize('Administrator'));

router.get('/', listUsers);
router.post('/', validateRequest(createUserSchema), createUser);
router.patch('/:id', validateRequest(updateUserSchema), updateUser);
router.post('/:id/reset-credentials', resetUserCredentials);

export default router;
