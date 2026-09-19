import prisma from '../utils/prisma.js';

// const prisma = new PrismaClient();

const profileSelect = {
    id: true,
    email: true,
    name: true,
    avatar_url: true,
    role: true,
    is_active: true,
    created_at: true,
};

const VALID_ROLES = ['CUSTOMER', 'ADMIN'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: profileSelect,
        });

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        const rawName = user.name ? String(user.name).trim() : '';
        const isNameSet = rawName && rawName.toLowerCase() !== 'null' && rawName.toLowerCase() !== 'undefined';
        const cleanName = isNameSet ? rawName : (user.email ? user.email.split('@')[0] : null);

        return res.status(200).json({ data: { ...user, name: cleanName } });
    } catch (error) {
        next(error);
    }
};

export const updateMe = async (req, res, next) => {
    try {
        const { name, avatar_url: avatarUrl } = req.body;
        const data = {};

        if (name !== undefined) {
            const normalizedName = String(name).trim();
            if (normalizedName.length > 120) {
                return res.status(400).json({ message: 'Tên không được dài quá 120 ký tự!' });
            }
            data.name = (!normalizedName || normalizedName.toLowerCase() === 'null' || normalizedName.toLowerCase() === 'undefined')
                ? null
                : normalizedName;
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

        const rawUpdatedName = user.name ? String(user.name).trim() : '';
        const isUpdatedNameSet = rawUpdatedName && rawUpdatedName.toLowerCase() !== 'null' && rawUpdatedName.toLowerCase() !== 'undefined';
        const cleanUpdatedName = isUpdatedNameSet ? rawUpdatedName : (user.email ? user.email.split('@')[0] : null);

        return res.status(200).json({ message: 'Cập nhật hồ sơ thành công!', data: { ...user, name: cleanUpdatedName } });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, role, status, sortBy } = req.query;

        let whereCondition = {};
        if (status === 'active') {
            whereCondition.is_active = true;
        } else if (status === 'inactive') {
            whereCondition.is_active = false;
        }

        if (role && (role === 'CUSTOMER' || role === 'ADMIN')) {
            whereCondition.role = role;
        }

        if (search) {
            const query = String(search).trim();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
            whereCondition.OR = [
                { email: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
            ];
            if (isUuid) {
                whereCondition.OR.push({ id: query });
            }
        }

        let orderBy = { created_at: 'desc' };
        if (sortBy === 'oldest') orderBy = { created_at: 'asc' };
        else if (sortBy === 'email_asc') orderBy = { email: 'asc' };
        else if (sortBy === 'name_asc') orderBy = { name: 'asc' };

        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                where: whereCondition,
                skip,
                take: limit,
                select: { id: true, email: true, name: true, avatar_url: true, role: true, is_active: true, created_at: true },
                orderBy,
            }),
            prisma.user.count({ where: whereCondition }),
        ]);

        const formattedUsers = users.map((u) => {
            const rawName = u.name ? String(u.name).trim() : '';
            const isNameSet = rawName && rawName.toLowerCase() !== 'null' && rawName.toLowerCase() !== 'undefined';
            const cleanName = isNameSet ? rawName : (u.email ? u.email.split('@')[0] : 'User');
            return { ...u, name: cleanName };
        });

        return res.status(200).json({
            data: formattedUsers,
            meta: {
                total: totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
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
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
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
            const normalizedEmail = String(email).trim().toLowerCase();
            if (!EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({ message: 'Email không hợp lệ!' });
            }
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác!' });
            }
            updatedData.email = email;
        }

        if (role && req.user.role === 'ADMIN') {
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ message: 'Vai trò không hợp lệ!' });
            }
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
        next(error);
    }
};

export const toggleUserStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (req.user.sub === userId) {
            return res.status(400).json({ message: 'Bạn không thể thay đổi trạng thái của chính mình!' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!targetUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: userId },
                data: { is_active: !targetUser.is_active },
                select: { id: true, email: true, role: true, is_active: true },
            });

            if (!updated.is_active) {
                await tx.refreshToken.updateMany({
                    where: { user_id: userId, revoked: false },
                    data: { revoked: true },
                });
            }

            return updated;
        });

        const statusMessage = updatedUser.is_active ? 'Kích hoạt tài khoản thành công!' : 'Vô hiệu hóa tài khoản thành công!';

        return res.status(200).json({ message: statusMessage, data: updatedUser });
    }
    catch (error) {
        next(error);
    }
};