import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        })
        return;
    }
    console.error("Unexpected error", err);

    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    })
}