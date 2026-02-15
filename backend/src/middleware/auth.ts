import { UnauthorizedError } from "../utils/errors";
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw new UnauthorizedError('Invalid User');
        }
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else {
            next(new UnauthorizedError('Invalid token'));
        }
    }
}