import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllProducts = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const { keyword, minPrice, maxPrice, category, status = 'ACTIVE' } = req.query;

        let whereCondition = {};

        const isAdmin = req.user?.role === 'ADMIN';

        if (isAdmin && status === 'ALL') {
            // Admin can explicitly request all products.
        }
        else if (isAdmin && status === 'INACTIVE') {
            whereCondition.is_active = false;
        }
        else {
            whereCondition.is_active = true;
        }

        if (keyword) {
            whereCondition.name = {
                contains: keyword,
                mode: 'insensitive',
            };
        }

        if (category) {
            whereCondition.category_id = category;
        }

        if (minPrice || maxPrice) {
            whereCondition.price = {};
            if (minPrice) {
                whereCondition.price.gte = Number.parseFloat(minPrice);
            }
            if (maxPrice) {
                whereCondition.price.lte = Number.parseFloat(maxPrice);
            }
        }


        const [products, totalProducts] = await Promise.all([
            prisma.product.findMany({
                where: whereCondition,
                skip,
                take: limit,
                include: {
                    category: {select: { id: true, name: true }},
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma.product.count({ where: whereCondition }),
        ]);

        return res.status(200).json({
            data: products,
            meta: {
                total: totalProducts,
                page,
                limit,
                totalPages: Math.ceil(totalProducts / limit),
            },
        });
    } 
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
        }

        if (!product.is_active && req.user?.role !== 'ADMIN') {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
        }

        return res.status(200).json({ data: product });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock_quantity, category_id, images } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Tên và giá sản phẩm là bắt buộc!' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price,
                stock_quantity: stock_quantity || 0,
                category_id: category_id || null,
                images: images || [],
            },
        });
        return res.status(201).json({ data: product });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, description, price, stock_quantity, category_id, images, is_active } = req.body;

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                description,
                price,
                stock_quantity: stock_quantity || existingProduct.stock_quantity,
                category_id: category_id || existingProduct.category_id,
                images: images !== undefined ? images : existingProduct.images,
                is_active: is_active !== undefined ? is_active : existingProduct.is_active,
            },
        });

        return res.status(200).json({ data: updatedProduct });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
        }

        const deletedProduct = await prisma.product.update({
            where: { id: productId },
            data: { is_active: false },
        });

        return res.status(200).json({ data: deletedProduct });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};
