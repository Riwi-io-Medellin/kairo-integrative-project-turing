/**
 * backend-node/src/routes/notificationRoutes.js
 */

import { Router } from 'express';
import { isAuthenticated } from '../middlewares/authMiddlewares.js';
import {
  streamNotifications,
  getNotifications,
  markNotificationsRead,
  deleteNotification
} from '../controllers/notificationControllers.js';

const router = Router();

router.use(isAuthenticated);

router.get('/stream', streamNotifications);
router.get('/', getNotifications);
router.post('/read', markNotificationsRead);
router.delete('/:id', deleteNotification);

export default router;
