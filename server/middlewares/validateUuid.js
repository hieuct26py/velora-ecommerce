const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUuid = (value) => {
    return typeof value === 'string' && UUID_REGEX.test(value.trim());
};

export const validateUuidParam = (...paramNames) => {
    return (req, res, next) => {
        for (const name of paramNames) {
            const val = req.params[name];
            if (!val || !UUID_REGEX.test(String(val).trim())) {
                return res.status(400).json({ message: 'ID không hợp lệ!' });
            }
        }
        next();
    };
};
