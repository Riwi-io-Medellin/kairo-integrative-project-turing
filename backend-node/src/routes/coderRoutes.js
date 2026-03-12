import { Router } from 'express';
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

/* ── Dashboard ── */
router.get('/dashboard',                            getCoderDashboard);

/* ── Profile ── */
router.get('/profile',                             getCoderProfile);
router.put('/profile',                             updateCoderProfile);
router.get('/profile/cv',                          generateCoderCV);

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
