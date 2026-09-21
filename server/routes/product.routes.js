import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

router.get('/', optionalAuth, getAllProducts);
router.get('/:productId', validateUuidParam('productId'), optionalAuth, getProductById);

router.use(verifyToken, verifyActiveUser, verifyAdmin);
router.post('/', createProduct);
router.patch('/:productId', validateUuidParam('productId'), updateProduct);
router.delete('/:productId', validateUuidParam('productId'), deleteProduct);

export default router;
