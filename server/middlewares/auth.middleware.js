import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token xác thực!' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
        if (err) {
            return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
        }
        req.user = decodedPayload;
        next();
    });
};

export const verifyAdmin = (req, res, next) => {
    if (!req.user || String(req.user.role || '').toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này!' });
    }
    next();
};