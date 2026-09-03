import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
    const payload = {
        sub: user.id,
        role: String(user.role || 'CUSTOMER').toUpperCase(),
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};