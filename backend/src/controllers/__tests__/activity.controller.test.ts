
import request from 'supertest';
import app from '../../app';
import { prismaMock as mockCtx } from '../../../tests/setup';
import jwt from 'jsonwebtoken';
jest.mock('../../sockets', () => ({
    emitBoardEvent: jest.fn()
}));

describe('Activity Controller', () => {
    const userId = 'user-id-123';
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret');
    const boardId = 'board-1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/boards/:boardId/activities', () => {
        it('should get activities for board', async () => {
            // Mock checkBoardAccess (via prisma direct check in controller)
            mockCtx.boardMember.findUnique.mockResolvedValue({
                userId,
                boardId,
                role: 'owner',
            } as any);

            mockCtx.activity.findMany.mockResolvedValue([] as any);
            mockCtx.activity.count.mockResolvedValue(0);

            const response = await request(app)
                .get(`/api/boards/${boardId}/activities`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('activities');
            expect(mockCtx.activity.findMany).toHaveBeenCalled();
        });

        it('should fail if not member', async () => {
            // Mock checkBoardAccess returning null
            mockCtx.boardMember.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/boards/${boardId}/activities`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });
    });
});
