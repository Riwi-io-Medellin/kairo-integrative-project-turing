import { Router } from 'express';
import { getNotifications, markAllRead } from '../controllers/notificationControllers.js';
import { isAuthenticated } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);

export default router;
