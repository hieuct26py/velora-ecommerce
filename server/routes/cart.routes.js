import { Router } from "express";
import { getCart, addItemToCart, updateCartItem, removeCartItem, clearCart, syncCart } from "../controllers/cart.controller.js";
import { verifyToken, verifyActiveUser } from "../middlewares/auth.middleware.js";
import { validateUuidParam } from "../middlewares/validateUuid.js";

const router = Router();

router.use(verifyToken, verifyActiveUser);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:itemId', validateUuidParam('itemId'), updateCartItem);
router.delete('/items/:itemId', validateUuidParam('itemId'), removeCartItem);
router.post('/sync', syncCart);
router.delete('/', clearCart);

export default router;