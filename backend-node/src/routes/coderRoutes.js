import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getCoderDashboard, getPlanDetails,
  updateActivityProgress, getModuleMilestones,
  getActivePlan, completeDay, requestPlan,
  markFeedbackRead,
} from '../controllers/coderControllers.js';
import {
  getCoderProfile, updateCoderProfile, generateCoderCV,
} from '../controllers/profileControllers.js';
import {
  generateExercise, submitExercise, getSubmissions,
} from '../controllers/exerciseControllers.js';
import {
  searchResources, listResourcesCoder, getResourceDownload,
} from '../controllers/resourceControllers.js';
import { isAuthenticated, hasRole, checkOnboarding } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated, hasRole('coder'), checkOnboarding);

const profileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ── Dashboard ── */
router.get('/dashboard',                            getCoderDashboard);

/* ── Profile ── */
router.get('/profile',                             profileLimiter, getCoderProfile);
router.put('/profile',                             profileLimiter, updateCoderProfile);
router.get('/profile/cv',                          profileLimiter, generateCoderCV);

/* ── Plans ── */
router.get('/plan',                                getActivePlan);
router.post('/plan/request',                       requestPlan);
router.post('/plan/:planId/day/:day/complete',     completeDay);
router.get('/plans/:planId',                       getPlanDetails);

/* ── Exercises ── */
router.post('/exercise/generate',                  generateExercise);
router.post('/exercise/:exerciseId/submit',        submitExercise);
router.get('/exercise/:exerciseId/submissions',    getSubmissions);

/* ── Resources ── */
router.get('/resources',                           listResourcesCoder);
router.get('/resource/:id/download',               getResourceDownload);
router.post('/resources/search',                   searchResources);

/* ── Activity & Feedback ── */
router.patch('/activities/:id/complete',           updateActivityProgress);
router.patch('/feedback/:id/read',                 markFeedbackRead);
router.get('/milestones',                          getModuleMilestones);

export default router;
