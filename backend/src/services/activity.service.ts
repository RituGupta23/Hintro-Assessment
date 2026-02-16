import prisma from '../utils/prisma';

interface LogActivityParams {
    action: string;  // created, updated , deleted etc.
    details: string; // description
    entityType?: string; // task, list, board
    taskId?: string; // Optional
    userId: string; 
    boardId: string;
}

export const logActivity = async (params: LogActivityParams) => {
    return prisma.activity.create({
        data: {
            action: params.action,
            details: params.details,
            entityType: params.entityType || 'task',
            taskId: params.taskId,
            userId: params.userId,
            boardId: params.boardId,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, avatar: true },
            },
        },
    });
};

export const getActivities = async (boardId: string, page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
        prisma.activity.findMany({
            where: { boardId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                task: {
                    select: { id: true, title: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.activity.count({ where: { boardId } }),
    ]);

    return {
        activities,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
