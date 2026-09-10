import { Router } from 'express';
import { getTotalSales, getTotalOrders } from '../controllers/analytics.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/total-sales', getTotalSales);
router.get('/total-orders', getTotalOrders);

export default router;