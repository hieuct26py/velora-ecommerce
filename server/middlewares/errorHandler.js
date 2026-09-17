export const errorHandler = (err, req, res, next) => {
    console.error(`[${req.method} ${req.originalUrl}]`, err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi máy chủ nội bộ';

    // Ánh xạ lỗi Prisma sang mã HTTP và thông báo thân thiện
    if (err.code === 'P2002') {
        statusCode = 409;
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
        message = target 
            ? `Dữ liệu '${target}' đã tồn tại trong hệ thống.`
            : 'Dữ liệu đã tồn tại trong hệ thống (trùng lặp giá trị duy nhất).';
    } else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Không tìm thấy dữ liệu yêu cầu hoặc bản ghi đã bị xóa.';
    }

    const response = {
        success: false,
        message: statusCode === 500 ? 'Hệ thống đang gặp sự cố, vui lòng thử lại sau.' : message,
        ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
    };

    return res.status(statusCode).json(response);
};
