
import request from 'supertest';
import app from '../../app';
import { prismaMock as mockCtx } from '../../../tests/setup';
import jwt from 'jsonwebtoken';
import { emitBoardEvent } from '../../sockets';

jest.mock('../../sockets', () => ({
    emitBoardEvent: jest.fn()
}));

describe('Task Controller', () => {
    const userId = 'user-id-123';
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret');
    const boardId = 'board-1';
    const listId = 'list-1';
    const taskId = 'task-1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/lists/:listId/tasks', () => {
        it('should create a new task', async () => {
            // Mock list find
            mockCtx.list.findUnique.mockResolvedValue({ id: listId, boardId } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock position aggregate
            mockCtx.task.aggregate.mockResolvedValue({ _max: { position: 1 } } as any);

            // Mock create task
            const createdTask = {
                id: taskId,
                title: 'New Task',
                listId,
                position: 2
            };
            mockCtx.task.create.mockResolvedValue(createdTask as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'New Task' });

            expect(response.status).toBe(201);
            expect(response.body.data.task).toHaveProperty('id', taskId);
            expect(mockCtx.task.create).toHaveBeenCalled();
            expect(emitBoardEvent).toHaveBeenCalledWith(boardId, 'task:created', expect.anything());
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update task', async () => {
            // Mock getTaskWithBoard
            mockCtx.task.findUnique.mockResolvedValue({
                id: taskId,
                listId,
                list: { boardId, board: { id: boardId } }
            } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            mockCtx.task.update.mockResolvedValue({
                id: taskId,
                title: 'Updated Task',
                listId
            } as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Task' });

            expect(response.status).toBe(200);
            expect(emitBoardEvent).toHaveBeenCalledWith(boardId, 'task:updated', expect.anything());
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete task', async () => {
            // Mock getTaskWithBoard
            mockCtx.task.findUnique.mockResolvedValue({
                id: taskId,
                listId,
                title: 'Task to Delete',
                list: { boardId, board: { id: boardId } }
            } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            mockCtx.task.delete.mockResolvedValue({ id: taskId } as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(emitBoardEvent).toHaveBeenCalledWith(boardId, 'task:deleted', expect.anything());
        });
    });

    describe('PUT /api/tasks/:id/move', () => {
        it('should move task', async () => {
            const targetListId = 'list-2';
            const position = 0;

            // Mock getTaskWithBoard
            mockCtx.task.findUnique.mockResolvedValue({
                id: taskId,
                listId,
                list: { boardId, board: { id: boardId } }
            } as any);

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock list checks
            mockCtx.list.findUnique
                .mockResolvedValueOnce({ id: targetListId } as any) // target
                .mockResolvedValueOnce({ id: listId, title: 'Old List' } as any); // old

            // Mock updateMany (shift positions)
            mockCtx.task.updateMany.mockResolvedValue({ count: 1 } as any);

            // Mock update task
            mockCtx.task.update.mockResolvedValue({
                id: taskId,
                listId: targetListId,
                position
            } as any);

            const response = await request(app)
                .put(`/api/tasks/${taskId}/move`)
                .set('Authorization', `Bearer ${token}`)
                .send({ listId: targetListId, position });

            expect(response.status).toBe(200);
            expect(emitBoardEvent).toHaveBeenCalledWith(boardId, 'task:moved', expect.anything());
        });
    });

    describe('POST /api/tasks/:id/assign', () => {
        it('should assign user to task', async () => {
            // Mock getTaskWithBoard
            mockCtx.task.findUnique.mockResolvedValue({
                id: taskId,
                listId,
                title: 'Task',
                list: { boardId, board: { id: boardId } }
            } as any);

            // Mock access check (twice: for requester and for target user)
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId } as any);

            // Mock user check
            mockCtx.user.findUnique.mockResolvedValue({ id: userId, name: 'User' } as any);

            // Mock existing check
            mockCtx.taskAssignee.findUnique.mockResolvedValue(null);

            // Mock create
            mockCtx.taskAssignee.create.mockResolvedValue({} as any);

            const response = await request(app)
                .post(`/api/tasks/${taskId}/assign`)
                .set('Authorization', `Bearer ${token}`)
                .send({ userId });

            expect(response.status).toBe(200);
        });

        it('should return message if user already assigned', async () => {
            // Mock getTaskWithBoard
            mockCtx.task.findUnique.mockResolvedValue({
                id: taskId,
                listId,
                list: { boardId, board: { id: boardId } }
            } as any);

            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId } as any);
            mockCtx.user.findUnique.mockResolvedValue({ id: userId } as any);

            // Mock existing
            mockCtx.taskAssignee.findUnique.mockResolvedValue({ id: 'assignee-id' } as any);

            const response = await request(app)
                .post(`/api/tasks/${taskId}/assign`)
                .set('Authorization', `Bearer ${token}`)
                .send({ userId });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User already assigned');
        });
    });

    describe('DELETE /api/tasks/:id/assign/:userId', () => {
        it('should unassign user from task', async () => {
            const targetUserId = 'target-user';

            // Mock getTaskWithBoard
            mockCtx.task.findUnique
                .mockResolvedValueOnce({
                    id: taskId,
                    listId,
                    title: 'Task',
                    list: { boardId, board: { id: boardId } }
                } as any) // first call
                .mockResolvedValueOnce({
                    id: taskId,
                    listId,
                    title: 'Task',
                    list: { boardId, board: { id: boardId } }
                } as any); // second call (return task)

            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId } as any);

            // Mock delete
            mockCtx.taskAssignee.deleteMany.mockResolvedValue({ count: 1 } as any);

            // Mock user
            mockCtx.user.findUnique.mockResolvedValue({ id: targetUserId, name: 'Target' } as any);
            mockCtx.activity.create.mockResolvedValue({} as any);

            const response = await request(app)
                .delete(`/api/tasks/${taskId}/assign/${targetUserId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(mockCtx.taskAssignee.deleteMany).toHaveBeenCalled();
        });
    });

    describe('GET /api/boards/:boardId/tasks/search', () => {
        it('should search tasks', async () => {
            // Mock access check
            mockCtx.boardMember.findUnique.mockResolvedValue({ userId, boardId, role: 'owner' } as any);

            // Mock findMany and count
            mockCtx.task.findMany.mockResolvedValue([
                { id: taskId, title: 'Found Task' }
            ] as any);
            mockCtx.task.count.mockResolvedValue(1);

            const response = await request(app)
                .get(`/api/boards/${boardId}/tasks/search?q=Task`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.tasks).toHaveLength(1);
            expect(mockCtx.task.findMany).toHaveBeenCalled();
        });
    });
});

