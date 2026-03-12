import { Router } from 'express';
import { submitDiagnostic, getDiagnosticResults } from '../controllers/diagnosticControllers.js';
import { isAuthenticated } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated);
router.post('/submit', submitDiagnostic);
router.get('/results', getDiagnosticResults);

export default router;
