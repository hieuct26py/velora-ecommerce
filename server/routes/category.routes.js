import { Router } from 'express';
import { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getAllCategories);
router.get('/:categoryId', getCategoryById);

router.use(verifyToken, verifyActiveUser, verifyAdmin);
router.post('/', createCategory);
router.patch('/:categoryId', updateCategory);
router.delete('/:categoryId', deleteCategory);

export default router;