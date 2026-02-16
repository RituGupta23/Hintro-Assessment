import request from 'supertest';
import app from '../../app';
import { prismaMock as mockCtx } from '../../../tests/setup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Controller', () => {
    describe('POST /api/auth/signup', () => {
        it('should create a new user and return a token', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            // Mock prisma.user.findUnique to return null (user doesn't exist)
            mockCtx.user.findUnique.mockResolvedValue(null);

            // Mock bcrypt.hash
            // jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashedPassword');
            // Actually it's better to just let bcrypt run if it's not too slow, or mock it if needed.
            // For integration/unit mix, let's just let it run or mock it if we want to check calls.

            // Mock prisma.user.create
            mockCtx.user.create.mockResolvedValue({
                id: 'user-id-123',
                name: userData.name,
                email: userData.email,
                avatar: null,
                createdAt: new Date(),
                password: 'hashedPassword',
                updatedAt: new Date()
            });

            const response = await request(app)
                .post('/api/auth/signup')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.newUser).toHaveProperty('id', 'user-id-123');
            expect(mockCtx.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
            expect(mockCtx.user.create).toHaveBeenCalled();
        });

        it('should return 409 if user already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123'
            };

            mockCtx.user.findUnique.mockResolvedValue({
                id: 'existing-id',
                email: userData.email,
                name: 'Existing',
                password: 'hash',
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .post('/api/auth/signup')
                .send(userData);

            expect(response.status).toBe(409);
            expect(response.body.message).toBe('User already exist with this Email');
        });

        it('should validate input', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Te', // too short
                    email: 'invalid-email',
                    password: 'short' // too short
                });

            expect(response.status).toBe(400); // Assuming existing validation middleware returns 400
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const hashedPassword = await bcrypt.hash(loginData.password, 12);

            mockCtx.user.findUnique.mockResolvedValue({
                id: 'user-id-123',
                name: 'Test User',
                email: loginData.email,
                password: hashedPassword,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('token');
        });

        it('should fail with incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const hashedPassword = await bcrypt.hash('correctpassword', 12);

            mockCtx.user.findUnique.mockResolvedValue({
                id: 'user-id-123',
                name: 'Test User',
                email: loginData.email,
                password: hashedPassword,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            // Expect 401 Unauthorized
            expect(response.status).toBe(401);
        });

        it('should fail if user not found', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            mockCtx.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        const userId = 'user-id-123';
        const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret');

        it('should return current user data', async () => {
            mockCtx.user.findUnique.mockResolvedValue({
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword',
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.user).toHaveProperty('id', userId);
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(401); // Or 500/403 depending on implementation
        });

        it('should fail with missing token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });

        it('should fail if user not found', async () => {
            mockCtx.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(401);
        });
    });
});
