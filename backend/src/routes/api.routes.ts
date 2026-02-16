import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getBoards, createBoard, getBoard, updateBoard, deleteBoard, addMember, createBoardSchema, updateBoardSchema, addMemberSchema } from '../controllers/board.controller';
import { createList, updateList, deleteList, reorderLists, createListSchema, updateListSchema, reorderListsSchema } from '../controllers/list.controller';
import { createTask, updateTask, deleteTask, moveTask, assignTask, unassignTask, searchTasks, createTaskSchema, updateTaskSchema, moveTaskSchema, assignTaskSchema } from '../controllers/task.controller';
import { getBoardActivities } from '../controllers/activity.controller';

const router = Router();
router.use(authMiddleware);

// board routes

router.get('/boards', getBoards);
router.post('/boards', validate(createBoardSchema), createBoard);
router.get('/boards/:id', getBoard);
router.put('/boards/:id', validate(updateBoardSchema), updateBoard);
router.delete('/boards/:id', deleteBoard);
router.post('/boards/:id/members', validate(addMemberSchema), addMember);

// list routes

router.post('/boards/:boardId/lists', validate(createListSchema), createList);
router.put('/lists/:id', validate(updateListSchema), updateList);
router.delete('/lists/:id', deleteList);
router.put('/boards/:boardId/lists/reorder', validate(reorderListsSchema), reorderLists);

// task routes

router.post('/lists/:listId/tasks', validate(createTaskSchema), createTask);
router.put('/tasks/:id', validate(updateTaskSchema), updateTask);
router.delete('/tasks/:id', deleteTask);
router.put('/tasks/:id/move', validate(moveTaskSchema), moveTask);
router.post('/tasks/:id/assign', validate(assignTaskSchema), assignTask);
router.delete('/tasks/:id/assign/:userId', unassignTask);

// search & activity routes

router.get('/boards/:boardId/tasks/search', searchTasks);
router.get('/boards/:boardId/activities', getBoardActivities);

export default router;