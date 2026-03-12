import { Router } from 'express';
import { getTLDashboard, getCoders, submitFeedback, getFeedback, updateRisk, getRisks } from '../controllers/tlControllers.js';
import { isAuthenticated, hasRole } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated, hasRole('tl'));

router.get('/dashboard', getTLDashboard);
router.get('/coders', getCoders);
router.post('/feedback', submitFeedback);
router.get('/feedback', getFeedback);
router.post('/risks', updateRisk);
router.get('/risks', getRisks);

export default router;
