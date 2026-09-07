import { Router } from 'express';
import { register, login, changePassword, refreshToken, logout } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/change-password', verifyToken, changePassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', verifyToken, logout);

export default router;