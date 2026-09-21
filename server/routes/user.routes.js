import { Router } from 'express';
import { getAllUsers, getMe, getUserById, updateMe, updateUser, toggleUserStatus } from '../controllers/user.controller.js';
import { checkOwner } from '../middlewares/checkOwner.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();
router.use(verifyToken, verifyActiveUser);

router.get('/', verifyAdmin, getAllUsers);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/:userId', validateUuidParam('userId'), checkOwner, getUserById);
router.patch('/:userId', validateUuidParam('userId'), checkOwner, updateUser);
router.patch('/:userId/status', validateUuidParam('userId'), verifyAdmin, toggleUserStatus);

export default router;