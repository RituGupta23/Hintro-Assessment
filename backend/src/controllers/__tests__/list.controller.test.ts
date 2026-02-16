
import request from 'supertest';
import app from '../../app';
import { prismaMock as mockCtx } from '../../../tests/setup';
import jwt from 'jsonwebtoken';
import { emitBoardEvent } from '../../sockets';

jest.mock('../../sockets', () => ({
    emitBoardEvent: jest.fn()
}));

describe('List Controller', () => {
    const userId = 'user-id-123';
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret');
    const boardId = 'board-1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/boards/:boardId/lists', () => {
        it('should create a new list', async () => {
            const listData = { title: 'New List' };

            // Mock board check
            mockCtx.board.findUnique.mockResolvedValue({ id: boardId } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock max position aggregation
            mockCtx.list.aggregate.mockResolvedValue({ _max: { position: 1 } } as any);

            // Mock create list
            const createdList = {
                id: 'list-1',
                title: 'New List',
                position: 2,
                boardId,
                tasks: []
            };
            mockCtx.list.create.mockResolvedValue(createdList as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .post(`/api/boards/${boardId}/lists`)
                .set('Authorization', `Bearer ${token}`)
                .send(listData);

            expect(response.status).toBe(201);
            expect(response.body.data.list).toHaveProperty('id', 'list-1');
            expect(mockCtx.list.create).toHaveBeenCalled();
            expect(emitBoardEvent).toHaveBeenCalledWith(boardId, 'list:created', expect.anything());
        });
    });

    describe('PUT /api/lists/:id', () => {
        it('should update list', async () => {
            const listId = 'list-1';
            const updateData = { title: 'Updated List' };

            // Mock find list
            mockCtx.list.findUnique.mockResolvedValue({ id: listId, boardId } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock update
            mockCtx.list.update.mockResolvedValue({ id: listId, title: 'Updated List' } as any);

            const response = await request(app)
                .put(`/api/lists/${listId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data.list.title).toBe('Updated List');
        });
    });

    describe('DELETE /api/lists/:id', () => {
        it('should delete list', async () => {
            const listId = 'list-1';

            // Mock find list
            mockCtx.list.findUnique.mockResolvedValue({ id: listId, boardId, title: 'To Delete' } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock delete tasks and list
            mockCtx.task.deleteMany.mockResolvedValue({ count: 0 } as any);
            mockCtx.list.delete.mockResolvedValue({ id: listId } as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .delete(`/api/lists/${listId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(emitBoardEvent).toHaveBeenCalledWith(boardId, 'list:deleted', expect.anything());
        });
    });

    describe('PUT /api/boards/:boardId/lists/reorder', () => {
        it('should reorder lists', async () => {
            const lists = [
                { id: 'list-1', position: 0 },
                { id: 'list-2', position: 1 }
            ];

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock transaction
            mockCtx.$transaction.mockResolvedValue([
                { id: 'list-1', position: 0 },
                { id: 'list-2', position: 1 }
            ] as any);

            const response = await request(app)
                .put(`/api/boards/${boardId}/lists/reorder`)
                .set('Authorization', `Bearer ${token}`)
                .send({ lists });

            expect(response.status).toBe(200);
            expect(mockCtx.$transaction).toHaveBeenCalled();
        });
    });
});
