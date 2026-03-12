import { Router } from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../controllers/assignmentControllers.js';
import { isAuthenticated } from '../middlewares/authMiddlewares.js';

const router = Router();
router.use(isAuthenticated);
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

export default router;
