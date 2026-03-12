/**
 * routes/coderRoutes.js
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getCoderDashboard, getPlanDetails,
  updateActivityProgress, getModuleMilestones,
  getActivePlan, completeDay, requestPlan,
  markFeedbackRead,
} from '../controllers/coderControllers.js';
import {
  generateExercise, submitExercise, getSubmissions,
} from '../controllers/exerciseControllers.js';
import {
  searchResources,
  listResourcesCoder,
  getResourceDownload,
} from '../controllers/resourceControllers.js';
import {
  getProfile,
  updateProfile,
  generateCV,
} from '../controllers/profileControllers.js';
import { isAuthenticated, hasRole, checkOnboarding } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated, hasRole('coder'));

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/* ── Profile & CV (no onboarding gate needed) ── */
router.get('/profile',    profileLimiter, getProfile);
router.put('/profile',    profileLimiter, updateProfile);
router.get('/profile/cv', profileLimiter, generateCV);

/* ── All routes below require completed onboarding ── */
router.use(checkOnboarding);

router.get('/dashboard',                             getCoderDashboard);
router.get('/plan',                                  getActivePlan);
router.post('/plan/request',                         requestPlan);
router.post('/plan/:planId/day/:day/complete',       completeDay);
router.get('/plans/:planId',                         getPlanDetails);
router.post('/exercise/generate',                    generateExercise);
router.post('/exercise/:exerciseId/submit',          submitExercise);
router.get('/exercise/:exerciseId/submissions',      getSubmissions);
router.get('/resources',                             listResourcesCoder);
router.get('/resource/:id/download',                 getResourceDownload);
router.post('/resources/search',                     searchResources);
router.patch('/activities/:id/complete',             updateActivityProgress);
router.patch('/feedback/:id/read',                   markFeedbackRead);
router.get('/milestones',                            getModuleMilestones);

export default router;
