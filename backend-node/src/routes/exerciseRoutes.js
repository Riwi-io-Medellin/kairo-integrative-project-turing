import { Router } from 'express';
import { generateExercise, submitExercise, getSubmissions } from '../controllers/exerciseControllers.js';
import { isAuthenticated } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated);
router.post('/generate', generateExercise);
router.post('/:id/submit', submitExercise);
router.get('/:id/submissions', getSubmissions);

export default router;
