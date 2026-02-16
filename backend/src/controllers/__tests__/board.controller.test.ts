
import request from 'supertest';
import app from '../../app';
import { prismaMock as mockCtx } from '../../../tests/setup';
import jwt from 'jsonwebtoken';

describe('Board Controller', () => {
    const userId = 'user-id-123';
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret');

    describe('POST /api/boards', () => {
        it('should create a new board', async () => {
            const boardData = {
                title: 'New Board',
                description: 'Board Description',
                color: '#6366f1'
            };

            const createdBoard = {
                id: 'board-id-1',
                ...boardData,
                createdAt: new Date(),
                updatedAt: new Date(),
                members: [],
                lists: []
            };

            mockCtx.board.create.mockResolvedValue(createdBoard as any);
            mockCtx.activity.create.mockResolvedValue({} as any); // mock logActivity

            const response = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send(boardData);

            expect(response.status).toBe(201);
            expect(response.body.data.board).toHaveProperty('id', 'board-id-1');
            expect(mockCtx.board.create).toHaveBeenCalled();
            expect(mockCtx.activity.create).toHaveBeenCalled();
        });

        it('should validation error', async () => {
            const response = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Description only'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/boards', () => {
        it('should get all boards for user', async () => {
            mockCtx.board.findMany.mockResolvedValue([
                { id: 'board-1', title: 'Board 1', members: [], _count: { lists: 0 } }
            ] as any);
            mockCtx.board.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/boards')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.boards).toHaveLength(1);
            expect(mockCtx.board.findMany).toHaveBeenCalled();
        });
    });

    describe('GET /api/boards/:id', () => {
        it('should get a single board', async () => {
            const boardId = 'board-1';

            // Mock checkBoardAccess
            mockCtx.boardMember.findUnique.mockResolvedValue({
                userId,
                boardId,
                role: 'owner',
                createdAt: new Date()
            } as any);

            mockCtx.board.findUnique.mockResolvedValue({
                id: boardId,
                title: 'Board 1',
                members: [],
                lists: []
            } as any);

            const response = await request(app)
                .get(`/api/boards/${boardId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.board).toHaveProperty('id', boardId);
        });

        it('should fail if user is not a member', async () => {
            const boardId = 'board-1';

            // Mock checkBoardAccess returning null
            mockCtx.boardMember.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/boards/${boardId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You are not a member of this board');
        });
    });

    describe('PUT /api/boards/:id', () => {
        it('should update board', async () => {
            const boardId = 'board-1';
            const updateData = { title: 'Updated Title' };

            // Mock checkBoardAccess
            mockCtx.boardMember.findUnique.mockResolvedValue({
                userId,
                boardId,
                role: 'owner', // must be owner
                createdAt: new Date()
            } as any);

            mockCtx.board.update.mockResolvedValue({
                id: boardId,
                title: 'Updated Title'
            } as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .put(`/api/boards/${boardId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data.board.title).toBe('Updated Title');
        });

        it('should fail if not owner', async () => {
            const boardId = 'board-1';

            // Mock checkBoardAccess
            mockCtx.boardMember.findUnique.mockResolvedValue({
                userId,
                boardId,
                role: 'member', // not owner
                createdAt: new Date()
            } as any);

            const response = await request(app)
                .put(`/api/boards/${boardId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'New Title' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Only the owner can update this board');
        });
    });

    describe('DELETE /api/boards/:id', () => {
        it('should delete board', async () => {
            const boardId = 'board-1';

            // Mock checkBoardAccess
            mockCtx.boardMember.findUnique.mockResolvedValue({
                userId,
                boardId,
                role: 'owner',
                createdAt: new Date()
            } as any);

            mockCtx.board.delete.mockResolvedValue({ id: boardId } as any);

            const response = await request(app)
                .delete(`/api/boards/${boardId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Board deleted');
        });
    });

    describe('POST /api/boards/:id/members', () => {
        it('should add a member', async () => {
            const boardId = 'board-1';
            const newMemberEmail = 'new@example.com';

            // Mock checkBoardAccess
            mockCtx.boardMember.findUnique.mockResolvedValueOnce({
                userId,
                boardId,
                role: 'owner',
                createdAt: new Date()
            } as any); // check access

            // Mock user find
            mockCtx.user.findUnique.mockResolvedValue({
                id: 'new-user-id',
                email: newMemberEmail,
                name: 'New User'
            } as any);

            // Mock existing member check
            mockCtx.boardMember.findUnique.mockResolvedValueOnce(null); // not already member

            // Mock create member
            mockCtx.boardMember.create.mockResolvedValue({} as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            // Mock return board
            mockCtx.board.findUnique.mockResolvedValue({
                id: boardId,
                members: []
            } as any);

            const response = await request(app)
                .post(`/api/boards/${boardId}/members`)
                .set('Authorization', `Bearer ${token}`)
                .send({ email: newMemberEmail });

            expect(response.status).toBe(200);
            expect(mockCtx.boardMember.create).toHaveBeenCalled();
        });
    });
});
