import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });

        return res.status(200).json({ data: categories });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }

        return res.status(200).json({ data: category });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description, image_url } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên danh mục là bắt buộc!' });
        }

        const existingCategory = await prisma.category.findUnique({
            where: { name },
        });

        if (existingCategory) {
            return res.status(400).json({ message: 'Danh mục đã tồn tại!' });
        }

        const category = await prisma.category.create({
            data: { name, description, image_url },
        });

        return res.status(201).json({ data: category });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description, image_url } = req.body;

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }

        if (name && name !== category.name) {
            const existingCategory = await prisma.category.findUnique({
                where: { name },
            });
            if (existingCategory) {
                return res.status(400).json({ message: 'Tên danh mục đã được sử dụng!' });
            }
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: { name, description, image_url },
        });

        return res.status(200).json({ data: updatedCategory });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};


export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: { _count: { select: { products: true } } },
        });

        if (!category) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }

        if (category._count.products > 0) {
            return res.status(400).json({ message: 'Không thể xóa danh mục vì có sản phẩm liên quan!' });
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });

        return res.status(200).json({ message: 'Xóa danh mục thành công!' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};