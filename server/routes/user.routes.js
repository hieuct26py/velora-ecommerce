import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, toggleUserStatus } from '../controllers/user.controller.js';
import { checkOwner } from '../middlewares/checkOwner.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/', verifyAdmin, getAllUsers);
router.get('/:userId', checkOwner, getUserById);
router.patch('/:userId', checkOwner, updateUser);
router.patch('/:userId/status', verifyAdmin, toggleUserStatus);

export default router;