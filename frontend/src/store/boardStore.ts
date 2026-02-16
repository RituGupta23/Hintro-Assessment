import { create } from 'zustand';
import api from '../services/api';

export interface TaskAssignee {
    id: string;
    user: { id: string; name: string; email: string; avatar?: string };
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    position: number;
    priority: string;
    dueDate?: string;
    listId: string;
    createdAt: string;
    updatedAt: string;
    assignees: TaskAssignee[];
}

export interface List {
    id: string;
    title: string;
    position: number;
    boardId: string;
    tasks: Task[];
}

export interface BoardMember {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; avatar?: string };
}

export interface Board {
    id: string;
    title: string;
    description?: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    members: BoardMember[];
    lists?: List[];
    _count?: { lists: number };
}

export interface Activity {
    id: string;
    action: string;
    details: string;
    entityType: string;
    createdAt: string;
    user: { id: string; name: string; email: string; avatar?: string };
    task?: { id: string; title: string } | null;
}

interface BoardState {
    boards: Board[];
    currentBoard: Board | null;
    activities: Activity[];
    isLoading: boolean;
    pagination: { page: number; total: number; totalPages: number };
    activityPagination: { page: number; total: number; totalPages: number };

    fetchBoards: (page?: number, search?: string) => Promise<void>;
    fetchBoard: (id: string) => Promise<void>;
    createBoard: (title: string, description?: string, color?: string) => Promise<Board>;
    updateBoard: (id: string, data: Partial<Board>) => Promise<void>;
    deleteBoard: (id: string) => Promise<void>;
    addMember: (boardId: string, email: string) => Promise<void>;

    createList: (boardId: string, title: string) => Promise<void>;
    updateList: (id: string, title: string) => Promise<void>;
    deleteList: (id: string) => Promise<void>;

    createTask: (listId: string, data: Partial<Task>) => Promise<void>;
    updateTask: (id: string, data: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    moveTask: (taskId: string, listId: string, position: number) => Promise<void>;
    assignTask: (taskId: string, userId: string) => Promise<void>;
    unassignTask: (taskId: string, userId: string) => Promise<void>;

    fetchActivities: (boardId: string, page?: number) => Promise<void>;
    searchTasks: (boardId: string, query: string) => Promise<Task[]>;

    // For real-time updates
    handleTaskCreated: (task: Task, listId: string) => void;
    handleTaskUpdated: (task: Task) => void;
    handleTaskDeleted: (taskId: string, listId: string) => void;
    handleTaskMoved: (task: Task, oldListId: string) => void;
    handleListCreated: (list: List) => void;
    handleListDeleted: (listId: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    boards: [],
    currentBoard: null,
    activities: [],
    isLoading: false,
    pagination: { page: 1, total: 0, totalPages: 0 },
    activityPagination: { page: 1, total: 0, totalPages: 0 },

    fetchBoards: async (page = 1, search = '') => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/boards', { params: { page, limit: 12, search } });
            set({ boards: data.data.boards, pagination: data.data.pagination, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },

    fetchBoard: async (id) => {
        set({ isLoading: true });
        try {
            const { data } = await api.get(`/boards/${id}`);
            set({ currentBoard: data.data.board, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },

    createBoard: async (title, description, color) => {
        const { data } = await api.post('/boards', { title, description, color });
        const board = data.data.board;
        set((s) => ({ boards: [board, ...s.boards] }));
        return board;
    },

    updateBoard: async (id, updateData) => {
        const { data } = await api.put(`/boards/${id}`, updateData);
        set((s) => ({
            boards: s.boards.map((b) => (b.id === id ? { ...b, ...data.data.board } : b)),
            currentBoard: s.currentBoard?.id === id ? { ...s.currentBoard, ...data.data.board } : s.currentBoard,
        }));
    },

    deleteBoard: async (id) => {
        await api.delete(`/boards/${id}`);
        set((s) => ({
            boards: s.boards.filter((b) => b.id !== id),
            currentBoard: s.currentBoard?.id === id ? null : s.currentBoard,
        }));
    },

    addMember: async (boardId, email) => {
        const { data } = await api.post(`/boards/${boardId}/members`, { email });
        set((s) => ({
            currentBoard: s.currentBoard?.id === boardId ? { ...s.currentBoard, members: data.data.board.members } : s.currentBoard,
        }));
    },

    createList: async (boardId, title) => {
        const { data } = await api.post(`/boards/${boardId}/lists`, { title });
        const newList = data.data.list;
        set((s) => {
            if (!s.currentBoard || s.currentBoard.id !== boardId) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: [...(s.currentBoard.lists || []), newList],
                },
            };
        });
    },

    updateList: async (id, title) => {
        await api.put(`/lists/${id}`, { title });
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) => (l.id === id ? { ...l, title } : l)),
                },
            };
        });
    },

    deleteList: async (id) => {
        await api.delete(`/lists/${id}`);
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.filter((l) => l.id !== id),
                },
            };
        });
    },

    createTask: async (listId, taskData) => {
        const { data } = await api.post(`/lists/${listId}/tasks`, taskData);
        const newTask = data.data.task;
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) =>
                        l.id === listId ? { ...l, tasks: [...l.tasks, newTask] } : l
                    ),
                },
            };
        });
    },

    updateTask: async (id, taskData) => {
        const { data } = await api.put(`/tasks/${id}`, taskData);
        const updatedTask = data.data.task;
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) => ({
                        ...l,
                        tasks: l.tasks.map((t) => (t.id === id ? { ...updatedTask, listId: t.listId } : t)),
                    })),
                },
            };
        });
    },

    deleteTask: async (id) => {
        await api.delete(`/tasks/${id}`);
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) => ({
                        ...l,
                        tasks: l.tasks.filter((t) => t.id !== id),
                    })),
                },
            };
        });
    },

    moveTask: async (taskId, listId, position) => {

        set((s) => {
            if (!s.currentBoard?.lists) return s;
            let movedTask: Task | null = null;
            const listsWithRemoved = s.currentBoard.lists.map((l) => {
                const found = l.tasks.find((t) => t.id === taskId);
                if (found) movedTask = { ...found, listId, position };
                return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
            });
            if (!movedTask) return s;
            const listsWithAdded = listsWithRemoved.map((l) => {
                if (l.id === listId) {
                    const tasks = [...l.tasks];
                    tasks.splice(position, 0, movedTask!);
                    return { ...l, tasks: tasks.map((t, i) => ({ ...t, position: i })) };
                }
                return l;
            });
            return { currentBoard: { ...s.currentBoard, lists: listsWithAdded } };
        });

        try {
            await api.put(`/tasks/${taskId}/move`, { listId, position });
        } catch {

            const board = get().currentBoard;
            if (board) get().fetchBoard(board.id);
        }
    },

    assignTask: async (taskId, userId) => {
        const { data } = await api.post(`/tasks/${taskId}/assign`, { userId });
        const updatedTask = data.data.task;
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) => ({
                        ...l,
                        tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, assignees: updatedTask.assignees } : t)),
                    })),
                },
            };
        });
    },

    unassignTask: async (taskId, userId) => {
        const { data } = await api.delete(`/tasks/${taskId}/assign/${userId}`);
        const updatedTask = data.data.task;
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) => ({
                        ...l,
                        tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, assignees: updatedTask.assignees } : t)),
                    })),
                },
            };
        });
    },

    fetchActivities: async (boardId, page = 1) => {
        const { data } = await api.get(`/boards/${boardId}/activities`, { params: { page, limit: 20 } });
        set({
            activities: page === 1 ? data.data.activities : [...get().activities, ...data.data.activities],
            activityPagination: data.data.pagination,
        });
    },

    searchTasks: async (boardId, query) => {
        const { data } = await api.get(`/boards/${boardId}/tasks/search`, { params: { q: query } });
        return data.data.tasks;
    },

    // real-time event handlers
    handleTaskCreated: (task, listId) => {
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) =>
                        l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l
                    ),
                },
            };
        });
    },

    handleTaskUpdated: (task) => {
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) => ({
                        ...l,
                        tasks: l.tasks.map((t) => (t.id === task.id ? { ...task, listId: t.listId } : t)),
                    })),
                },
            };
        });
    },

    handleTaskDeleted: (taskId, listId) => {
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.map((l) =>
                        l.id === listId ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) } : l
                    ),
                },
            };
        });
    },

    handleTaskMoved: (task, oldListId) => {
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            const lists = s.currentBoard.lists.map((l) => ({
                ...l,
                tasks: l.tasks.filter((t) => t.id !== task.id),
            }));
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: lists.map((l) => {
                        if (l.id === task.listId) {
                            const tasks = [...l.tasks, task].sort((a, b) => a.position - b.position);
                            return { ...l, tasks };
                        }
                        return l;
                    }),
                },
            };
        });
    },

    handleListCreated: (list) => {
        set((s) => {
            if (!s.currentBoard) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: [...(s.currentBoard.lists || []), { ...list, tasks: list.tasks || [] }],
                },
            };
        });
    },

    handleListDeleted: (listId) => {
        set((s) => {
            if (!s.currentBoard?.lists) return s;
            return {
                currentBoard: {
                    ...s.currentBoard,
                    lists: s.currentBoard.lists.filter((l) => l.id !== listId),
                },
            };
        });
    },
}));
