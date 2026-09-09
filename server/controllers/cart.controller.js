import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const formatCartItems = async (cart) => {
    let totalAmount = 0;

    const items = cart.items.map((item) => {
        const currentPrice = Number(item.product.price);
        const itemTotal = item.product.is_active ? currentPrice * item.quantity : 0;
        totalAmount += itemTotal;

        return {
            id: item.id,
            productId: item.product_id,
            name: item.product.name,
            price: currentPrice,
            quantity: item.quantity,
            image: item.product.images.length > 0 ? item.product.images[0] : null,
            is_active: item.product.is_active,
            itemTotal
        };
    });

    return {
        id: cart.id,
        userId: cart.user_id,
        items,
        totalAmount
    }
};

export const getCart = async (req, res) => {
    try {
        const userId = req.user.sub;

        const cart = await prisma.cart.upsert({
            where: { user_id: userId },
            update: {},
            create: { user_id: userId },
            include: {
                items: { include: { product: true } }
            }
        });

        return res.status(200).json({ data: await formatCartItems(cart) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching the cart." });
    }
};

export const addItemToCart = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { productId, quantity } = req.body;

        if (!productId || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product?.is_active) {
            return res.status(404).json({ error: "Sản phẩm không tồn tại hoặc không khả dụng" });
        }

        if (product.stock_quantity < quantity) {
            return res.status(400).json({ error: "Số lượng sản phẩm vượt quá tồn kho" });
        }

        const cart = await prisma.$transaction(async (tx) => {
            const currentCart = await tx.cart.upsert({
                where: { user_id: userId },
                update: {},
                create: { user_id: userId },
            });

            const existingItem = await tx.cartItem.findUnique({
                where: { cart_id_product_id: { cart_id: currentCart.id, product_id: productId } },
            });

            if (existingItem && existingItem.quantity + quantity > product.stock_quantity) {
                const error = new Error("Tổng số lượng sản phẩm trong giỏ vượt quá tồn kho");
                error.code = "CART_STOCK_EXCEEDED";
                throw error;
            }

            await tx.cartItem.upsert({
                where: { cart_id_product_id: { cart_id: currentCart.id, product_id: productId } },
                update: { quantity: { increment: quantity } },
                create: { cart_id: currentCart.id, product_id: productId, quantity }
            });

            return currentCart;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        return res.status(200).json({ message: "Sản phẩm đã được thêm vào giỏ hàng", data: await formatCartItems(updatedCart) });
    }
    catch (error) {
        console.error(error);
        if (error.code === "CART_STOCK_EXCEEDED") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng." });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ error: "Số lượng phải lớn hơn 0" });
        }

        const cart = await prisma.cart.findUnique({
            where: { user_id: userId }
        });
        if (!cart) {
            return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
        }

        const existingItem = await prisma.cartItem.findFirst({
            where: { id: itemId, cart_id: cart.id },
            include: { product: true },
        });

        if (!existingItem) {
            return res.status(404).json({ error: "Mục giỏ hàng không tồn tại" });
        }

        if (!existingItem.product.is_active) {
            return res.status(400).json({ error: "Sản phẩm không còn khả dụng" });
        }

        if (quantity > existingItem.product.stock_quantity) {
            return res.status(400).json({ error: "Số lượng sản phẩm vượt quá tồn kho" });
        }

        const updateResult = await prisma.cartItem.updateMany({
            where: { id: itemId, cart_id: cart.id },
            data: { quantity }
        });

        if (updateResult.count === 0) {
            return res.status(404).json({ error: "Mục giỏ hàng không tồn tại" });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        return res.status(200).json({ message: "Cập nhật số lượng thành công", data: await formatCartItems(updatedCart) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật số lượng sản phẩm trong giỏ hàng." });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { itemId } = req.params;

        const cart = await prisma.cart.findUnique({
            where: { user_id: userId }
        });
        if (!cart) {
            return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
        }

        const deleteResult = await prisma.cartItem.deleteMany({
            where: { id: itemId, cart_id: cart.id }
        });

        if (deleteResult.count === 0) {
            return res.status(404).json({ error: "Sản phẩm không tồn tại trong giỏ hàng" });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        return res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công", data: await formatCartItems(updatedCart) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng." });
    }
};

export const syncCart = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { localItems } = req.body;

        if (!Array.isArray(localItems) || localItems.length === 0) {
            return res.status(400).json({ error: "Dữ liệu giỏ hàng không hợp lệ" });
        }

        const productIds = localItems.map((item) => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));

        for (const item of localItems) {
            const product = productsById.get(item.productId);

            if (!product?.is_active) {
                return res.status(400).json({ error: "Giỏ hàng chứa sản phẩm không tồn tại hoặc không khả dụng" });
            }

            if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > product.stock_quantity) {
                return res.status(400).json({ error: "Số lượng sản phẩm trong giỏ vượt quá tồn kho hoặc không hợp lệ" });
            }
        }

        const cart = await prisma.cart.upsert({
            where: { user_id: userId },
            update: {},
            create: { user_id: userId },
        });

        await prisma.$transaction(localItems.map(item => {
            return prisma.cartItem.upsert({
                where: { cart_id_product_id: { cart_id: cart.id, product_id: item.productId } },
                update: { quantity: item.quantity },
                create: { cart_id: cart.id, product_id: item.productId, quantity: item.quantity }
            });
        }));

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        return res.status(200).json({ message: "Đồng bộ giỏ hàng thành công", data: await formatCartItems(updatedCart) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi đồng bộ giỏ hàng." });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.user.sub;

        const cart = await prisma.cart.findUnique({
            where: { user_id: userId }
        });

        if (!cart) {
            return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
        }

        await prisma.cartItem.deleteMany({
            where: { cart_id: cart.id }
        });

        return res.status(200).json({
            message: "Xóa tất cả sản phẩm khỏi giỏ hàng thành công", data: { id: cart.id, userId: cart.user_id, items: [], totalAmount: 0 }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi xóa tất cả sản phẩm khỏi giỏ hàng." });
    }
};