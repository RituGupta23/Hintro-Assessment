import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

export const validate = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.errors.map(e => e.message).join(', ');
            next(new ValidationError(messages));
            return;
        }
        req.body = result.data;
        next();
    };
};