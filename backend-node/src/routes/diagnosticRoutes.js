import { Router } from 'express';
import {
  saveDiagnostic,
  getDiagnostic,
  getAllDiagnostics,
} from '../controllers/diagnosticControllers.js';
import { isAuthenticated, hasRole } from '../middlewares/authMiddlewares.js';

const router = Router();

router.post('/', isAuthenticated, hasRole('coder'), saveDiagnostic);
router.get('/me', isAuthenticated, hasRole('coder'), getDiagnostic);
router.get('/all', isAuthenticated, hasRole('tl'), getAllDiagnostics);

export default router;
