import { PrismaClient } from "@prisma/client";
import prisma from '../utils/prisma.js';

// const prisma = new PrismaClient();

export const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const { expectedTotalAmount } = req.body || {};
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

        if (expectedTotalAmount !== undefined && Math.abs(Number(expectedTotalAmount) - totalAmount) > 0.01) {
            return res.status(400).json({
                message: 'Giá sản phẩm đã thay đổi. Vui lòng kiểm tra lại giỏ hàng.'
            });
        }

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    user_id: userId,
                    total_amount: totalAmount,
                    status: 'PENDING',
                }
            });

            // const orderItemsData = [];
            const sortedItems = [...cart.items].sort((a, b) => a.product_id.localeCompare(b.product_id));
            const orderItemsData = sortedItems.map(item => ({
                order_id: newOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_purchase: item.product.price
            }));

            const updatePromises = sortedItems.map(item =>
                tx.product.updateMany({
                    where: {
                        id: item.product_id,
                        is_active: true,
                        stock_quantity: { gte: item.quantity },
                        price: item.product.price
                    },
                    data: {
                        stock_quantity: { decrement: item.quantity }
                    }
                })
            );

            const updateResults = await Promise.all(updatePromises);

            const failedIndex = updateResults.findIndex(result => result.count === 0);

            if (failedIndex !== -1) {
                const failedItem = sortedItems[failedIndex].product.name;
                throw {
                    type: 'ATOMIC_INVENTORY_ERROR',
                    message: `Sản phẩm ${failedItem} không đủ số lượng hoặc đã bị thay đổi giá. Vui lòng kiểm tra lại giỏ hàng.`
                };
            }

            await tx.orderItem.createMany({ data: orderItemsData });
            await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });

            return newOrder;
        });

        return res.status(201).json({ message: 'Đơn hàng đã được tạo thành công!', order });
    }
    catch (error) {
        if (error.type === 'ATOMIC_INVENTORY_ERROR') {
            return res.status(400).json({ message: error.message });
        }

        next(error);
    }
};

export const getMyOrders = async (req, res, next) => {
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
        next(error);
    }
};

export const getAllOrders = async (req, res, next) => {
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
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
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
        next(error);
    }
};

const VALID_TRANSITIONS = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: [],
    CANCELLED: [],
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status: newStatus } = req.body;

        const validStatuses = ['PENDING', 'PAID', 'CANCELLED'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
        }

        const existingOrder = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!existingOrder) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        const allowed = VALID_TRANSITIONS[existingOrder.status] || [];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                message: `Không thể chuyển từ ${existingOrder.status} sang ${newStatus}`,
            });
        }

        if (newStatus === 'CANCELLED') {
            await prisma.$transaction(async (tx) => {
                const updateResult = await tx.order.updateMany({
                    where: {
                        id: orderId,
                        status: existingOrder.status
                    },
                    data: { status: 'CANCELLED' }
                });

                if (updateResult.count === 0) {
                    throw {
                        type: 'STATE_CONFLICT',
                        message: 'Xung đột dữ liệu: Đơn hàng đã được xử lý bởi một yêu cầu khác. Vui lòng tải lại trang.'
                    };
                }

                for (const item of existingOrder.items) {
                    await tx.product.update({
                        where: { id: item.product_id },
                        data: { stock_quantity: { increment: item.quantity } },
                    });
                }
            });
        } 
        else {
            const updateResult = await prisma.order.updateMany({
                where: { id: orderId, status: existingOrder.status },
                data: { status: newStatus }
            });

            if (updateResult.count === 0) {
                return res.status(409).json({ message: 'Xung đột trạng thái. Vui lòng tải lại trang.' });
            }
        }
        return res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
    }
    catch (error) {
        if (error.type === 'STATE_CONFLICT') {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

export const deleteOrder = async (req, res, next) => {
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

            const sortedItems = [...order.items].sort((a, b) => a.product_id.localeCompare(b.product_id));

            const updatePromises = sortedItems.map(item =>
                tx.product.update({
                    where: { id: item.product_id },
                    data: { stock_quantity: { increment: item.quantity } }
                })
            );
            
            await Promise.all(updatePromises);
        });

        return res.status(200).json({ message: 'Xóa đơn hàng thành công' });
    }
    catch (error) {
        next(error);
    }
}