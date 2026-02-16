import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useBoardStore } from '../store/boardStore';
import { joinBoard, leaveBoard } from '../services/socket';

export const useSocketBoard = (boardId: string | undefined) => {
    const {
        handleTaskCreated,
        handleTaskUpdated,
        handleTaskDeleted,
        handleTaskMoved,
        handleListCreated,
        handleListDeleted,
        fetchBoard,
    } = useBoardStore();

    useEffect(() => {
        if (!boardId) return;
        const socket = getSocket();
        if (!socket) return;

        joinBoard(boardId);

        socket.on('task:created', (data: any) => {
            handleTaskCreated(data.task, data.task.listId);
        });
        socket.on('task:updated', (data: any) => {
            handleTaskUpdated(data.task);
        });
        socket.on('task:deleted', (data: any) => {
            handleTaskDeleted(data.taskId, data.listId);
        });
        socket.on('task:moved', (data: any) => {
            fetchBoard(boardId);
        });
        socket.on('list:created', (data: any) => {
            handleListCreated(data.list);
        });
        socket.on('list:deleted', (data: any) => {
            handleListDeleted(data.listId);
        });
        socket.on('board:updated', () => {
            fetchBoard(boardId);
        });

        return () => {
            leaveBoard(boardId);
            socket.off('task:created');
            socket.off('task:updated');
            socket.off('task:deleted');
            socket.off('task:moved');
            socket.off('list:created');
            socket.off('list:deleted');
            socket.off('board:updated');
        };
    }, [boardId]);
};
