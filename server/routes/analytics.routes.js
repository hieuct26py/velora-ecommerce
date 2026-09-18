import { Router } from 'express';
import { getTotalSales, getTotalOrders } from '../controllers/analytics.controller.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken, verifyActiveUser, verifyAdmin);

router.get('/total-sales', getTotalSales);
router.get('/total-orders', getTotalOrders);

export default router;