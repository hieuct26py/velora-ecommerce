import { Router } from 'express';
import { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, deleteOrder } from '../controllers/order.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.post('/', createOrder);
router.get('/', verifyAdmin, getAllOrders);
router.get('/me', getMyOrders);

router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', verifyAdmin, updateOrderStatus);
router.patch('/:orderId', deleteOrder);

export default router;
