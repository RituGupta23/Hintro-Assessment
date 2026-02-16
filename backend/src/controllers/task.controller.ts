import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import prisma from '../utils/prisma';
import { logActivity } from '../services/activity.service';
import { emitBoardEvent } from '../sockets';

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().optional().nullable(),
});

export const moveTaskSchema = z.object({
    listId: z.string(),
    position: z.number(),
});

export const assignTaskSchema = z.object({
    userId: z.string(),
});

const getTaskWithBoard = async (taskId: string) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { include: { board: true } } },
    });
    if (!task) throw new NotFoundError('Task');
    return task;
};

const checkBoardAccess = async (boardId: string, userId: string) => {
    const member = await prisma.boardMember.findUnique({
        where: { userId_boardId: { userId, boardId } },
    });
    if (!member) throw new ForbiddenError('You are not a member of this board');
    return member;
};

const fullTaskInclude = {
    assignees: {
        include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
        },
    },
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const listId = req.params.listId as string;
        const list = await prisma.list.findUnique({ where: { id: listId } });
        if (!list) throw new NotFoundError('List');

        await checkBoardAccess(list.boardId, req.userId!);

        const maxPosition = await prisma.task.aggregate({
            where: { listId },
            _max: { position: true },
        });

        const task = await prisma.task.create({
            data: {
                title: req.body.title,
                description: req.body.description,
                priority: req.body.priority || 'medium',
                dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
                position: (maxPosition._max.position ?? -1) + 1,
                listId,
            },
            include: fullTaskInclude,
        });

        await logActivity({
            action: 'created',
            details: `created task "${req.body.title}"`,
            taskId: task.id,
            userId: req.userId!,
            boardId: list.boardId,
        });

        emitBoardEvent(list.boardId, 'task:created', { task: { ...task, listId }, boardId: list.boardId });
        res.status(201).json({ status: 'success', data: { task, boardId: list.boardId } });
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const taskId = req.params.id as string;
        const taskWithBoard = await getTaskWithBoard(taskId);
        await checkBoardAccess(taskWithBoard.list.boardId, req.userId!);

        const data: any = {};
        if (req.body.title !== undefined) data.title = req.body.title;
        if (req.body.description !== undefined) data.description = req.body.description;
        if (req.body.priority !== undefined) data.priority = req.body.priority;
        if (req.body.dueDate !== undefined) data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

        const task = await prisma.task.update({
            where: { id: taskId },
            data,
            include: fullTaskInclude,
        });

        await logActivity({
            action: 'updated',
            details: `updated task "${task.title}"`,
            taskId: task.id,
            userId: req.userId!,
            boardId: taskWithBoard.list.boardId,
        });

        emitBoardEvent(taskWithBoard.list.boardId, 'task:updated', { task, boardId: taskWithBoard.list.boardId });
        res.json({ status: 'success', data: { task, boardId: taskWithBoard.list.boardId } });
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const taskId = req.params.id as string;
        const taskWithBoard = await getTaskWithBoard(taskId);
        await checkBoardAccess(taskWithBoard.list.boardId, req.userId!);

        await prisma.task.delete({ where: { id: taskId } });

        await logActivity({
            action: 'deleted',
            details: `deleted task "${taskWithBoard.title}"`,
            userId: req.userId!,
            boardId: taskWithBoard.list.boardId,
        });

        emitBoardEvent(taskWithBoard.list.boardId, 'task:deleted', { taskId, listId: taskWithBoard.listId, boardId: taskWithBoard.list.boardId });
        res.json({ status: 'success', message: 'Task deleted', data: { boardId: taskWithBoard.list.boardId, listId: taskWithBoard.listId, taskId } });
    } catch (error) {
        next(error);
    }
};

export const moveTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const taskId = req.params.id as string;
        const taskWithBoard = await getTaskWithBoard(taskId);
        await checkBoardAccess(taskWithBoard.list.boardId, req.userId!);

        const { listId, position } = req.body;
        const targetList = await prisma.list.findUnique({ where: { id: listId } });
        if (!targetList) throw new NotFoundError('Target list');

        const oldList = await prisma.list.findUnique({ where: { id: taskWithBoard.listId } });

        await prisma.task.updateMany({
            where: { listId, position: { gte: position } },
            data: { position: { increment: 1 } },
        });

        const task = await prisma.task.update({
            where: { id: taskId },
            data: { listId, position },
            include: fullTaskInclude,
        });

        await logActivity({
            action: 'moved',
            details: `moved task "${task.title}" from "${oldList?.title}" to "${targetList.title}"`,
            taskId: task.id,
            userId: req.userId!,
            boardId: taskWithBoard.list.boardId,
        });

        emitBoardEvent(taskWithBoard.list.boardId, 'task:moved', { task, boardId: taskWithBoard.list.boardId });
        res.json({ status: 'success', data: { task, boardId: taskWithBoard.list.boardId } });
    } catch (error) {
        next(error);
    }
};

export const assignTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const taskId = req.params.id as string;
        const taskWithBoard = await getTaskWithBoard(taskId);
        await checkBoardAccess(taskWithBoard.list.boardId, req.userId!);

        const targetUser = await prisma.user.findUnique({ where: { id: req.body.userId } });
        if (!targetUser) throw new NotFoundError('User');
        await checkBoardAccess(taskWithBoard.list.boardId, req.body.userId);

        const existing = await prisma.taskAssignee.findUnique({
            where: { userId_taskId: { userId: req.body.userId, taskId } },
        });

        if (existing) {
            res.json({ status: 'success', message: 'User already assigned' });
            return;
        }

        await prisma.taskAssignee.create({
            data: { userId: req.body.userId, taskId },
        });

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: fullTaskInclude,
        });

        await logActivity({
            action: 'assigned',
            details: `assigned ${targetUser.name} to task "${taskWithBoard.title}"`,
            taskId,
            userId: req.userId!,
            boardId: taskWithBoard.list.boardId,
        });

        emitBoardEvent(taskWithBoard.list.boardId, 'task:updated', { task, boardId: taskWithBoard.list.boardId });
        res.json({ status: 'success', data: { task, boardId: taskWithBoard.list.boardId } });
    } catch (error) {
        next(error);
    }
};

export const unassignTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const taskId = req.params.id as string;
        const targetUserId = req.params.userId as string;
        const taskWithBoard = await getTaskWithBoard(taskId);
        await checkBoardAccess(taskWithBoard.list.boardId, req.userId!);

        await prisma.taskAssignee.deleteMany({
            where: { userId: targetUserId, taskId },
        });

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: fullTaskInclude,
        });

        const unassignedUser = await prisma.user.findUnique({ where: { id: targetUserId } });

        await logActivity({
            action: 'unassigned',
            details: `unassigned ${unassignedUser?.name || 'a user'} from task "${taskWithBoard.title}"`,
            taskId,
            userId: req.userId!,
            boardId: taskWithBoard.list.boardId,
        });

        emitBoardEvent(taskWithBoard.list.boardId, 'task:updated', { task, boardId: taskWithBoard.list.boardId });
        res.json({ status: 'success', data: { task, boardId: taskWithBoard.list.boardId } });
    } catch (error) {
        next(error);
    }
};

export const searchTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const boardId = req.params.boardId as string;
        await checkBoardAccess(boardId, req.userId!);

        const query = String(req.query.q || '');
        const page = parseInt(String(req.query.page || '1')) || 1;
        const limit = parseInt(String(req.query.limit || '20')) || 20;
        const skip = (page - 1) * limit;

        const where = {
            list: { boardId },
            OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { description: { contains: query, mode: 'insensitive' as const } },
            ],
        };

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    ...fullTaskInclude,
                    list: { select: { id: true, title: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.task.count({ where }),
        ]);

        res.json({
            status: 'success',
            data: {
                tasks,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};
