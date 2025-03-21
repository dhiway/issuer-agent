import express from 'express';

const { REQUEST_URL_TOKEN } = process.env;

export async function authMiddleware(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const [authType, authToken] = authHeader.split(' ');

    if (authType === 'Bearer' && authToken === REQUEST_URL_TOKEN) {
        next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
