import { Router } from 'express';
import { register, login, changePassword, refreshToken, logout } from '../controllers/auth.controller.js';
import { verifyToken, verifyActiveUser } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  message: 'Too many login attempts from this IP, please try again later.'
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    message: 'Too many refresh token requests from this IP, please try again later.'
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.patch('/change-password', verifyToken, verifyActiveUser, changePassword);
router.post('/refresh-token', refreshLimiter, refreshToken);
router.post('/logout', verifyToken, logout);

export default router;