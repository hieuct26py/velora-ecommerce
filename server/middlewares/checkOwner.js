export const checkOwner = (req, res, next) => {
    const { userId } = req.params;
    
    if (req.user.role !== 'ADMIN' && req.user.sub !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này!' });
    }

    next();
};