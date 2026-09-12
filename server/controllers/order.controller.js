import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.sub;
        const cart = await prisma.cart.findUnique({
            where: { user_id: userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống!' });
        }

        let totalAmount = 0;
        for (const item of cart.items) {
            if (!item.product.is_active) {
                return res.status(400).json({ message: `Sản phẩm ${item.product.name} không khả dụng!` });
            }
            if (item.quantity > item.product.stock_quantity) {
                return res.status(400).json({ message: `Sản phẩm ${item.product.name} không đủ số lượng!` });
            }
            totalAmount += Number(item.product.price) * item.quantity;
        }

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    user_id: userId,
                    total_amount: totalAmount,
                    status: 'PENDING',
                }
            })

            const orderItemsData = [];
            for (const item of cart.items) {
                orderItemsData.push({
                    order_id: newOrder.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_at_purchase: item.product.price
                });

                await tx.product.update({
                    where: { id: item.product_id },
                    data: { stock_quantity: { decrement: item.quantity } }
                });
            }

            await tx.orderItem.createMany({ data: orderItemsData });

            await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });

            return newOrder;
        });
        return res.status(201).json({ message: 'Đơn hàng đã được tạo thành công!', order });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { user_id: req.user.sub },
            orderBy: { created_at: 'desc' },
            include: { items: { include: { product: { select: { name: true, images: true } } } } }
        });
        
        const formattedOrders = orders.map(order => ({
            ...order,
            total_amount: Number(order.total_amount),
            items: order.items.map(item => ({
                ...item,
                price_at_purchase: Number(item.price_at_purchase)
            }))
        }));
        
        return res.status(200).json({ data: formattedOrders });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const validStatuses = ['PENDING', 'PAID', 'CANCELLED'];
        const normalizedStatus = status?.toUpperCase();
        if (normalizedStatus && !validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
        }

        const whereCondition = normalizedStatus ? { status: normalizedStatus } : {};

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereCondition,
                skip: Number(skip),
                take: limitNumber,
                orderBy: { created_at: 'desc' },
                include: { user: { select: { email: true } } }
            }),
            prisma.order.count({ where: whereCondition })
        ]);
        
        const formattedOrders = orders.map(order => ({
            ...order,
            total_amount: Number(order.total_amount)
        }));
        
        return res.status(200).json({
            data: formattedOrders,
            meta: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) }
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } }, user: { select: { email: true } } }
        });

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        if (req.user.role !== 'ADMIN' && order.user_id !== req.user.sub) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập đơn hàng này' });
        }

        order.total_amount = Number(order.total_amount);
        order.items = order.items.map(item => ({
            ...item,
            price_at_purchase: Number(item.price_at_purchase)
        }));

        return res.status(200).json({ data: order });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'PAID', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
        }

        const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
        if (!existingOrder) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        const order = await prisma.order.update({ where: { id: orderId }, data: { status } });

        return res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công', data: order });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        if (req.user.role !== 'ADMIN' && order.user_id !== req.user.sub) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa đơn hàng này' });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Chỉ có thể xóa đơn hàng đang chờ xử lý' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });

            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.product_id },
                    data: { stock_quantity: { increment: item.quantity } }
                });
            }
        });

        return res.status(200).json({ message: 'Xóa đơn hàng thành công' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
}