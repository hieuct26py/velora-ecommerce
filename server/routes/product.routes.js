import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';

const router = Router();

router.get('/', optionalAuth, getAllProducts);
router.get('/:productId', optionalAuth, getProductById);

router.use(verifyToken, verifyAdmin);
router.post('/', createProduct);
router.patch('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

export default router;
