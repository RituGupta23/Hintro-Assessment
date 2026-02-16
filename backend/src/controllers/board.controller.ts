import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/activity.service';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export const createBoardSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
});

export const updateBoardSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
});

export const addMemberSchema = z.object({
    email: z.string().email('Invalid email'),
});

const checkBoardAccess = async (boardId: string, userId: string) => {
    const member = await prisma.boardMember.findUnique({
        where: { userId_boardId: { userId, boardId } },
    });
    if (!member) throw new ForbiddenError('You are not a member of this board');
    return member;
};

export const getBoards = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(String(req.query.page || '1')) || 1;
        const limit = parseInt(String(req.query.limit || '12')) || 12;
        const search = String(req.query.search || '');
        const skip = (page - 1) * limit;

        const where = {
            members: { some: { userId: req.userId! } },
            ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
        };

        const [boards, total] = await Promise.all([
            prisma.board.findMany({
                where,
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, email: true, avatar: true } },
                        },
                    },
                    _count: { select: { lists: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.board.count({ where }),
        ]);

        res.json({
            status: 'success',
            data: {
                boards,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        await checkBoardAccess(id, req.userId!);

        const board = await prisma.board.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
                lists: {
                    orderBy: { position: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { position: 'asc' },
                            include: {
                                assignees: {
                                    include: {
                                        user: { select: { id: true, name: true, email: true, avatar: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!board) throw new NotFoundError('Board');

        res.json({ status: 'success', data: { board } });
    } catch (error) {
        next(error);
    }
};

export const createBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, description, color } = req.body;

        const board = await prisma.board.create({
            data: {
                title,
                description,
                color: color || '#6366f1',
                members: {
                    create: { userId: req.userId!, role: 'owner' },
                },
                lists: {
                    createMany: {
                        data: [
                            { title: 'To Do', position: 0 },
                            { title: 'In Progress', position: 1 },
                            { title: 'Done', position: 2 },
                        ],
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
                lists: { orderBy: { position: 'asc' } },
            },
        });

        await logActivity({
            action: 'created',
            details: `created board "${title}"`,
            entityType: 'board',
            userId: req.userId!,
            boardId: board.id,
        });

        res.status(201).json({ status: 'success', data: { board } });
    } catch (error) {
        next(error);
    }
};

export const updateBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const member = await checkBoardAccess(id, req.userId!);
        if (member.role !== 'owner') throw new ForbiddenError('Only the owner can update this board');

        const board = await prisma.board.update({
            where: { id },
            data: req.body,
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
            },
        });

        await logActivity({
            action: 'updated',
            details: `updated board "${board.title}"`,
            entityType: 'board',
            userId: req.userId!,
            boardId: board.id,
        });

        res.json({ status: 'success', data: { board } });
    } catch (error) {
        next(error);
    }
};

export const deleteBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const member = await checkBoardAccess(id, req.userId!);
        if (member.role !== 'owner') throw new ForbiddenError('Only the owner can delete this board');

        await prisma.board.delete({ where: { id } });
        res.json({ status: 'success', message: 'Board deleted' });
    } catch (error) {
        next(error);
    }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const boardId = req.params.id as string;
        await checkBoardAccess(boardId, req.userId!);

        const user = await prisma.user.findUnique({ where: { email: req.body.email } });
        if (!user) throw new NotFoundError('User');

        const existing = await prisma.boardMember.findUnique({
            where: { userId_boardId: { userId: user.id, boardId } },
        });
        if (existing) {
            res.json({ status: 'success', message: 'User is already a member' });
            return;
        }

        await prisma.boardMember.create({
            data: { userId: user.id, boardId },
        });

        await logActivity({
            action: 'added',
            details: `added ${user.name} to the board`,
            entityType: 'board',
            userId: req.userId!,
            boardId,
        });

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
            },
        });

        res.json({ status: 'success', data: { board } });
    } catch (error) {
        next(error);
    }
};
