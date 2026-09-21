import { Router } from 'express';
import { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, deleteOrder } from '../controllers/order.controller.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();
router.use(verifyToken, verifyActiveUser);

router.post('/', createOrder);
router.get('/', verifyAdmin, getAllOrders);
router.get('/me', getMyOrders);

router.get('/:orderId', validateUuidParam('orderId'), getOrderById);
router.patch('/:orderId/status', validateUuidParam('orderId'), verifyAdmin, updateOrderStatus);
router.patch('/:orderId', validateUuidParam('orderId'), deleteOrder);

export default router;
