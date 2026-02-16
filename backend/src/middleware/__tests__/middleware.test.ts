
import { errorHandler } from '../errorHandler';
import { AppError, UnauthorizedError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { Request, Response, NextFunction } from 'express';
import { validate } from '../validate';
import { z } from 'zod';

describe('Middleware', () => {
    describe('errorHandler', () => {
        let req: Partial<Request>;
        let res: Partial<Response>;
        let next: NextFunction;

        beforeEach(() => {
            req = {};
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should handle AppError', () => {
            const error = new AppError('Test Error', 400);
            errorHandler(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Test Error'
            });
        });

        it('should handle Error', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const error = new Error('Internal Error');
            errorHandler(error as any, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Internal server error'
            });
            expect(consoleSpy).toHaveBeenCalledWith("Unexpected error", error);
            consoleSpy.mockRestore();
        });

        it('should handle UnauthorizedError', () => {
            const error = new UnauthorizedError('Unauthorized');
            errorHandler(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Unauthorized'
            });
        });

        it('should handle NotFoundError', () => {
            const error = new NotFoundError('Not Found');
            errorHandler(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle ForbiddenError', () => {
            const error = new ForbiddenError('Forbidden');
            errorHandler(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('validate', () => {
        it('should validate schema', async () => {
            const schema = z.object({
                name: z.string()
            });
            const middleware = validate(schema);

            const req = { body: { name: 'Test' } } as Request;
            const res = {} as Response;
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should fail with invalid data', async () => {
            const schema = z.object({
                name: z.string()
            });
            const middleware = validate(schema);

            const req = { body: { name: 123 } } as Request;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;
            const next = jest.fn();

            await middleware(req, res, next);



            expect(next).toHaveBeenCalledWith(expect.anything());
        });
    });
});
