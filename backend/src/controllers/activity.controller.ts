import { AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import prisma from '../utils/prisma';
import { getActivities } from '../services/activity.service';

export const getBoardActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const boardId = req.params.boardId as string;
        const member = await prisma.boardMember.findUnique({
            where: { userId_boardId: { userId: req.userId!, boardId } },
        });
        if (!member) throw new ForbiddenError('You are not a member of this board');

        const page = parseInt(String(req.query.page || '1')) || 1;
        const limit = parseInt(String(req.query.limit || '20')) || 20;
        const result = await getActivities(boardId, page, limit);
        res.json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};
