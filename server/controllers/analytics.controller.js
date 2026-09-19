import prisma from "../utils/prisma.js";

export const getTotalSales = async (req, res, next) => {
    try {
        const aggregation = await prisma.order.aggregate({
            _sum: { total_amount: true },
            where: { status: 'PAID' }
        });

        const totalSales = aggregation._sum.total_amount ? Number(aggregation._sum.total_amount) : 0;

        return res.status(200).json({ data: totalSales });
    } 
    catch (error) {
        next(error);
    }
};

export const getTotalOrders = async (req, res, next) => {
    try {
        const totalOrders = await prisma.order.count();
        return res.status(200).json({ data: totalOrders });
    } 
    catch (error) {
        next(error);
    }
};