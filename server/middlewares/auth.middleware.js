import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token xác thực!' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
        if (err) {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
        }
        req.user = decodedPayload;
        next();
    });
};

export const verifyActiveUser = async (req, res, next) => {
    try {
        // Đảm bảo req.user đã được gán từ middleware verifyToken chạy trước đó
        if (!req.user || !req.user.sub) {
            return res.status(401).json({ message: 'Không tìm thấy thông tin xác thực' });
        }

        // Truy vấn DB qua khóa chính (rất nhanh)
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { is_active: true, role: true },
        });

        // Chặn nếu user không tồn tại hoặc đã bị khóa
        if (!user || !user.is_active) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
        }

        // Cập nhật lại role mới nhất từ DB vào req (phòng khi Admin vừa đổi quyền của user)
        req.user.role = user.role;
        
        next();
    } catch (error) {
        next(error); // Đẩy lỗi 500 về cho Global Error Handler xử lý
    }
};

export const verifyAdmin = (req, res, next) => {
    if (!req.user || String(req.user.role || '').toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này!' });
    }
    next();
};