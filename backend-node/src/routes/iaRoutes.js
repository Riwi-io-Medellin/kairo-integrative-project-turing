import { Router } from 'express';
import { askAI, getAIHistory } from '../controllers/iaControllers.js';
import { isAuthenticated } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated);
router.post('/ask', askAI);
router.get('/history', getAIHistory);

export default router;
