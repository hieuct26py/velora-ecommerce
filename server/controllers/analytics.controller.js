import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getTotalSales = async (req, res) => {
    try {
        const aggregation = await prisma.order.aggregate({
            _sum: { total_amount: true },
            where: { status: 'PAID' }
        });

        const totalSales = aggregation._sum.total_amount ? Number(aggregation._sum.total_amount) : 0;

        return res.status(200).json({ data: totalSales });
    } 
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getTotalOrders = async (req, res) => {
    try {
        const totalOrders = await prisma.order.count();
        return res.status(200).json({ data: totalOrders });
    } 
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};