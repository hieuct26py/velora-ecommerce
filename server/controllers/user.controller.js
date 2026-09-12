import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const profileSelect = {
    id: true,
    email: true,
    name: true,
    avatar_url: true,
    role: true,
    is_active: true,
    created_at: true,
};

export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: profileSelect,
        });

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        return res.status(200).json({ data: user });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const updateMe = async (req, res) => {
    try {
        const { name, avatar_url: avatarUrl } = req.body;
        const data = {};

        if (name !== undefined) {
            const normalizedName = String(name).trim();
            if (normalizedName.length > 120) {
                return res.status(400).json({ message: 'Tên không được dài quá 120 ký tự!' });
            }
            data.name = normalizedName || null;
        }

        if (avatarUrl !== undefined) {
            const normalizedAvatarUrl = String(avatarUrl).trim();
            if (normalizedAvatarUrl.length > 255) {
                return res.status(400).json({ message: 'Avatar URL không được dài quá 255 ký tự!' });
            }
            data.avatar_url = normalizedAvatarUrl || null;
        }

        if (!Object.keys(data).length) {
            return res.status(400).json({ message: 'Không có dữ liệu hợp lệ để cập nhật!' });
        }

        const user = await prisma.user.update({
            where: { id: req.user.sub },
            data,
            select: profileSelect,
        });

        return res.status(200).json({ message: 'Cập nhật hồ sơ thành công!', data: user });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let whereCondition = {};
        if (req.query.status === 'active') {
            whereCondition.is_active = true;
        }
        if (req.query.status === 'inactive') {
            whereCondition.is_active = false;
        }

        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                where: whereCondition,
                skip,
                take: limit,
                select: { id: true, email: true, role: true, is_active: true, created_at: true },
                orderBy: { created_at: 'desc' },
            }),
            prisma.user.count({ where: whereCondition }),
        ]);

        return res.status(200).json({
            data: users,
            meta: {
                total: totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, is_active: true, created_at: true },
        });

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        if (!user.is_active && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Tài khoản của người dùng đã bị vô hiệu hóa!' });
        }

        return res.status(200).json({ data: user });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!currentUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        if (!currentUser.is_active && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Tài khoản của người dùng đã bị vô hiệu hóa!' });
        }

        const { email, role } = req.body;
        const updatedData = {};

        if (email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác!' });
            }
            updatedData.email = email;
        }

        if (role && req.user.role === 'ADMIN') {
            updatedData.role = role;
        }

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: 'Không có dữ liệu hợp lệ để cập nhật!' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updatedData,
            select: { id: true, email: true, role: true, is_active: true },
        });

        return res.status(200).json({ message: 'Cập nhật người dùng thành công!', data: updatedUser });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.sub === userId) {
            return res.status(400).json({ message: 'Bạn không thể thay đổi trạng thái của chính mình!' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!targetUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { is_active: !targetUser.is_active },
            select: { id: true, email: true, role: true, is_active: true },
        });

        const statusMessage = updatedUser.is_active ? 'Kích hoạt tài khoản thành công!' : 'Vô hiệu hóa tài khoản thành công!';

        return res.status(200).json({ message: statusMessage, data: updatedUser });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};