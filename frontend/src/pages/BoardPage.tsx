import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    closestCorners
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoardStore, type Task } from '../store/boardStore';
import { useSocketBoard } from '../hooks/useSocket';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ActivityPanel } from '../components/ActivityPanel';
import { BoardMemberModal } from '../components/BoardMemberModal';
import { BoardList } from '../components/BoardList';
import { ArrowLeft, Search, Users, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export const BoardPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentBoard, fetchBoard, createList, createTask, moveTask, updateList, deleteList } = useBoardStore();

    const [newListTitle, setNewListTitle] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState<{ [listId: string]: string }>({});
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showActivityPanel, setShowActivityPanel] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editingListTitle, setEditingListTitle] = useState('');
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    useSocketBoard(id);

    useEffect(() => {
        if (id) fetchBoard(id);
    }, [id]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, 
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id: string) => {
        if (currentBoard?.lists?.find(l => l.id === id)) {
            return id;
        }
        return currentBoard?.lists?.find(l => l.tasks.some(t => t.id === id))?.id;
    };

    const handleDragStart = (event: any) => {
        const task = currentBoard?.lists
            ?.flatMap(l => l.tasks)
            .find(t => t.id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the containers
        const activeContainer = findContainer(activeId as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        const activeList = currentBoard?.lists?.find(l => l.id === activeContainer);
        const overList = currentBoard?.lists?.find(l => l.id === overContainer);

        if (!activeList || !overList) return;

        const activeIndex = activeList.tasks.findIndex(t => t.id === activeId);
        const overIndex = overList.tasks.findIndex(t => t.id === overId);

        let newIndex: number;

        if (activeContainer === overContainer) {
            // Same list reordering
            newIndex = overIndex;
        } else {
            // Moving to different list
            const isBelowOverItem = over &&
                active.rect.current.translated &&
                active.rect.current.translated.top > over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;

            newIndex = overIndex >= 0 ? overIndex + modifier : overList.tasks.length + 1;
        }

        if (activeContainer === overContainer && activeIndex === newIndex) {
            return;
        }

        moveTask(activeId, overList.id, newIndex);
        toast.success('Task moved');
    };

    const handleCreateList = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newListTitle && id) {
            try {
                await createList(id, newListTitle);
                setNewListTitle('');
                toast.success('List created');
            } catch (error) {
                toast.error('Failed to create list');
            }
        }
    };

    const handleCreateTask = async (listId: string, e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTaskTitle[listId]) {
            try {
                await createTask(listId, { title: newTaskTitle[listId] });
                setNewTaskTitle({ ...newTaskTitle, [listId]: '' });
                toast.success('Task created');
            } catch (error) {
                toast.error('Failed to create task');
            }
        }
    };

    const handleEditList = (listId: string, title: string) => {
        setEditingListId(listId);
        setEditingListTitle(title);
    };

    const handleSaveListTitle = async (listId: string) => {
        if (editingListTitle.trim()) {
            try {
                await updateList(listId, editingListTitle);
                setEditingListId(null);
                toast.success('List updated');
            } catch (error) {
                toast.error('Failed to update list');
            }
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!window.confirm('Delete this list and all its tasks?')) return;
        try {
            await deleteList(listId);
            toast.success('List deleted');
        } catch (error) {
            toast.error('Failed to delete list');
        }
    };

    if (!currentBoard) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-[60px] text-[#6e7191] h-screen">
                <div className="animate-spin text-2xl">⏳</div>
                <p className="text-sm">Loading board...</p>
            </div>
        );
    }

    const filteredLists = currentBoard.lists?.map(list => ({
        ...list,
        tasks: list.tasks.filter(task =>
            searchQuery === '' ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }));

    return (
        <div className="flex flex-col h-screen">
            <header
                className="flex items-center justify-between py-3 px-3 sm:px-5 bg-[#1a1a24] border-b-2 flex-shrink-0 flex-wrap gap-2"
                style={{ borderBottomColor: currentBoard.color }}
            >
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#e8e9f3] hover:scale-105"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-semibold text-[#e8e9f3]">{currentBoard.title}</h1>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center gap-2.5 bg-[#13131a] border border-[#2a2a3a] rounded-lg px-3.5 py-0 max-w-[280px] transition-colors duration-300 focus-within:border-indigo-500">
                        <Search size={16} className="text-[#6e7191] flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-none bg-transparent py-[7px] px-0 text-[#e8e9f3] text-[13px] w-full outline-none shadow-none"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex">
                        {currentBoard.members?.slice(0, 3).map((member) => (
                            <div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[13px] font-semibold text-white border-2 border-[#0a0a0f] flex-shrink-0 -ml-1.5 first:ml-0"
                                title={member.user.name}
                            >
                                {member.user.name[0].toUpperCase()}
                            </div>
                        ))}
                        {(currentBoard.members?.length || 0) > 3 && (
                            <div className="w-8 h-8 rounded-full bg-[#2d2d3f] text-[#6e7191] text-[10px] flex items-center justify-center border-2 border-[#0a0a0f] flex-shrink-0 -ml-1.5">
                                +{(currentBoard.members?.length || 0) - 3}
                            </div>
                        )}
                    </div>
                    <button
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]"
                        onClick={() => setShowMemberModal(true)}
                    >
                        <Users size={16} />
                        Members
                    </button>
                    <button
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 ${showActivityPanel ? 'bg-indigo-500/9 text-indigo-300' : 'bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]'}`}
                        onClick={() => setShowActivityPanel(!showActivityPanel)}
                    >
                        <Activity size={16} />
                        Activity
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex-1 grid gap-4 p-5 overflow-y-auto items-start scrollbar-thin scrollbar-thumb-[#2a2a3a] scrollbar-track-transparent grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredLists?.map((list) => (
                            <BoardList
                                key={list.id}
                                list={list}
                                isEditing={editingListId === list.id}
                                editingTitle={editingListTitle}
                                newTaskTitle={newTaskTitle[list.id] || ''}
                                onEditTitle={setEditingListTitle}
                                onSaveTitle={() => handleSaveListTitle(list.id)}
                                onCancelEdit={() => setEditingListId(null)}
                                onDelete={() => handleDeleteList(list.id)}
                                onStartEdit={() => handleEditList(list.id, list.title)}
                                onTaskClick={(task) => setSelectedTask(task)}
                                onNewTaskChange={(title) => setNewTaskTitle({ ...newTaskTitle, [list.id]: title })}
                                onNewTaskSubmit={(e) => handleCreateTask(list.id, e)}
                            />
                        ))}

                        <div className="bg-[#13131a] border border-dashed border-[#2a2a3a] rounded-xl p-2 opacity-70 transition-opacity duration-300 hover:opacity-100">
                            <div className="p-2">
                                <input
                                    type="text"
                                    placeholder="+ Add list"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    onKeyDown={handleCreateList}
                                    className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-3 px-4 rounded-lg font-inherit text-sm w-full mb-2 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                                />
                            </div>
                        </div>
                    </div>

                    <DragOverlay>
                        {activeTask ? (
                            <div className="bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl p-3 cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)] opacity-90">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#e8e9f3] leading-snug">{activeTask.title}</div>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {showActivityPanel && id && <ActivityPanel boardId={id} onClose={() => setShowActivityPanel(false)} />}
            </div>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    boardId={id!}
                    onClose={() => setSelectedTask(null)}
                />
            )}

            {showMemberModal && id && (
                <BoardMemberModal
                    boardId={id}
                    onClose={() => setShowMemberModal(false)}
                />
            )}
        </div>
    );
};