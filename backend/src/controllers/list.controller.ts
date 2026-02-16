import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logActivity } from '../services/activity.service';
import { AuthRequest } from '../middleware/auth';
import { emitBoardEvent } from '../sockets';

export const createListSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
});

export const updateListSchema = z.object({
    title: z.string().min(1).max(100).optional(),
});

export const reorderListsSchema = z.object({
    lists: z.array(z.object({ id: z.string(), position: z.number() })),
});


const checkBoardAccess = async (boardId: string, userId: string) => {
    const member = await prisma.boardMember.findUnique({
        where: { userId_boardId: { userId, boardId } },
    });
    if (!member) throw new ForbiddenError('You are not a member of this board');
    return member;
};

export const createList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const boardId = req.params.boardId as string;
        const board = await prisma.board.findUnique({ where: { id: boardId } });
        if (!board) throw new NotFoundError('Board');

        await checkBoardAccess(boardId, req.userId!);

        const maxPosition = await prisma.list.aggregate({
            where: { boardId },
            _max: { position: true },
        });

        const list = await prisma.list.create({
            data: {
                title: req.body.title,
                position: (maxPosition._max.position ?? -1) + 1,
                boardId,
            },
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
        });

        await logActivity({
            action: 'created',
            details: `created list "${req.body.title}"`,
            entityType: 'list',
            userId: req.userId!,
            boardId,
        });

        emitBoardEvent(boardId, 'list:created', { list, boardId });
        res.status(201).json({ status: 'success', data: { list } });
    } catch (error) {
        next(error);
    }
};

export const updateList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const list = await prisma.list.findUnique({ where: { id } });
        if (!list) throw new NotFoundError('List');

        await checkBoardAccess(list.boardId, req.userId!);

        const updatedList = await prisma.list.update({
            where: { id },
            data: { title: req.body.title },
        });

        res.json({ 
            status: 'success', 
            data: { list: updatedList } 
        });
    } catch (error) {
        next(error);
    }
};

export const deleteList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const list = await prisma.list.findUnique({ where: { id } });
        if (!list) throw new NotFoundError('List');

        await checkBoardAccess(list.boardId, req.userId!);

        await prisma.task.deleteMany({ where: { listId: id } });
        await prisma.list.delete({ where: { id } });

        await logActivity({
            action: 'deleted',
            details: `deleted list "${list.title}"`,
            entityType: 'list',
            userId: req.userId!,
            boardId: list.boardId,
        });

        emitBoardEvent(list.boardId, 'list:deleted', { listId: id, boardId: list.boardId });
        res.json({ status: 'success', message: 'List deleted' });
    } catch (error) {
        next(error);
    }
};

export const reorderLists = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const boardId = req.params.boardId as string;
        await checkBoardAccess(boardId, req.userId!);

        const { lists } = req.body;

        await prisma.$transaction(
            lists.map((item: { id: string; position: number }) =>
                prisma.list.update({
                    where: { id: item.id },
                    data: { position: item.position },
                })
            )
        );

        res.json({ 
            status: 'success', 
            message: 'Lists reordered' });
    } catch (error) {
        next(error);
    }
};
