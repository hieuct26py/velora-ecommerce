import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { generateTokens } from '../utils/token.js';

const prisma = new PrismaClient();

export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc!' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng!' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password_hash: passwordHash,
                role: 'CUSTOMER',
                verification_token: verificationToken
            },
            select: { id: true, email: true, role: true, created_at: true },
        });

        return res.status(201).json({ message: 'Đăng ký thành công!', user });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(401).json({ message: 'Email không tồn tại!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Sai mật khẩu!' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Đăng nhập thành công',
            accessToken,
            id: user.id,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc!' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng!' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password_hash: passwordHash },
        });

        return res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const refreshToken = async (req, res) => {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
        return res.status(401).json({ message: 'Không tìm thấy phiên đăng nhập trong Cookie!' });
    }

    jwt.verify(refreshTokenValue, process.env.REFRESH_TOKEN_SECRET, async (err, decodedPayload) => {
        if (err) {
            return res.status(403).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ!' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { id: decodedPayload.sub } });

            if (!user) {
                return res.status(404).json({ message: 'Người dùng không tồn tại!' });
            }

            if (!user.is_active) {
                return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
            }

            const newAccessToken = jwt.sign(
                { sub: user.id, role: user.role },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            return res.status(200).json({ accessToken: newAccessToken });
        }
        catch (error) {
            return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    });
};

export const logout = async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({ message: 'Đăng xuất thành công!' });
};