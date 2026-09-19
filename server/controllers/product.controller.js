import prisma from '../utils/prisma.js';

// const prisma = new PrismaClient();

export const getAllProducts = async (req, res, next) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 12);
        const skip = (page - 1) * limit;
        
        const { keyword, minPrice, maxPrice, category, status = 'ACTIVE', stockStatus, sortBy } = req.query;

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
                contains: String(keyword).trim(),
                mode: 'insensitive',
            };
        }

        if (category) {
            whereCondition.category_id = category;
        }

        if (stockStatus === 'OUT_OF_STOCK') {
            whereCondition.stock_quantity = 0;
        } else if (stockStatus === 'LOW_STOCK') {
            whereCondition.stock_quantity = { lte: 3, gt: 0 };
        } else if (stockStatus === 'IN_STOCK') {
            whereCondition.stock_quantity = { gt: 0 };
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

        let orderBy = { created_at: 'desc' };
        if (sortBy === 'price_asc') orderBy = { price: 'asc' };
        else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
        else if (sortBy === 'stock_asc') orderBy = { stock_quantity: 'asc' };
        else if (sortBy === 'stock_desc') orderBy = { stock_quantity: 'desc' };
        else if (sortBy === 'name_asc') orderBy = { name: 'asc' };
        else if (sortBy === 'oldest') orderBy = { created_at: 'asc' };

        const [products, totalProducts] = await Promise.all([
            prisma.product.findMany({
                where: whereCondition,
                skip,
                take: limit,
                include: {
                    category: { select: { id: true, name: true } },
                },
                orderBy,
            }),
            prisma.product.count({ where: whereCondition }),
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        return res.status(200).json({
            data: products,
            meta: {
                totalItems: totalProducts,
                totalPages,
                currentPage: page,
                total: totalProducts,
                page,
                limit,
            },
        });
    } 
    catch (error) {
        next(error);
    }
};

export const getProductById = async (req, res, next) => {
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
        next(error);
    }
};

export const createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock_quantity, category_id, images } = req.body;

        if (!name || price === undefined || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ message: 'Tên và giá sản phẩm là bắt buộc!' });
        }

        if (name.trim().length > 255) {
            return res.status(400).json({ message: 'Tên sản phẩm tối đa 255 ký tự!' });
        }
        const numericPrice = Number(price);
        if (price === undefined || !Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: 'Giá sản phẩm phải là số dương!' });
        }
        const qty = Number(stock_quantity) || 0;
        if (!Number.isInteger(qty) || qty < 0) {
            return res.status(400).json({ message: 'Số lượng tồn kho phải là số nguyên không âm!' });
        }
        if (images && (!Array.isArray(images) || images.some(url => typeof url !== 'string'))) {
            return res.status(400).json({ message: 'Images phải là mảng URL hợp lệ!' });
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                description,
                price: numericPrice,
                stock_quantity: qty,
                category_id: category_id || null,
                images: images || [],
            },
        });
        return res.status(201).json({ data: product });
    }
    catch (error) {
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
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
                stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : existingProduct.stock_quantity,
                category_id: category_id || existingProduct.category_id,
                images: images !== undefined ? images : existingProduct.images,
                is_active: is_active !== undefined ? is_active : existingProduct.is_active,
            },
        });

        return res.status(200).json({ data: updatedProduct });
    }
    catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
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
        next(error);
    }
};
