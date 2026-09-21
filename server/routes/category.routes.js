import { Router } from 'express';
import { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

router.get('/', getAllCategories);
router.get('/:categoryId', validateUuidParam('categoryId'), getCategoryById);

router.use(verifyToken, verifyActiveUser, verifyAdmin);
router.post('/', createCategory);
router.patch('/:categoryId', validateUuidParam('categoryId'), updateCategory);
router.delete('/:categoryId', validateUuidParam('categoryId'), deleteCategory);

export default router;