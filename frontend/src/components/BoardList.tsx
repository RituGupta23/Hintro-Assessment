import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { MoreVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import type { Task, List } from '../store/boardStore';

interface BoardListProps {
    list: List;
    isActive?: boolean;
    isEditing: boolean;
    editingTitle: string;
    newTaskTitle: string;
    onEditTitle: (title: string) => void;
    onSaveTitle: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onStartEdit: () => void;
    onTaskClick: (task: Task) => void;
    onNewTaskChange: (title: string) => void;
    onNewTaskSubmit: (e: React.KeyboardEvent) => void;
}

export const BoardList = ({
    list,
    isActive,
    isEditing,
    editingTitle,
    newTaskTitle,
    onEditTitle,
    onSaveTitle,
    onCancelEdit,
    onDelete,
    onStartEdit,
    onTaskClick,
    onNewTaskChange,
    onNewTaskSubmit
}: BoardListProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: list.id,
    });

    const tasksIds = list.tasks.map(t => t.id);

    return (
        <div
            className={`bg-[#13131a] border border-[#2a2a3a] rounded-xl flex flex-col ${isOver ? 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)] bg-indigo-500/5' : ''}`}
        >
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-[#2a2a3a] flex-shrink-0 group">
                {isEditing ? (
                    <div className="flex items-center gap-1 w-full">
                        <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => onEditTitle(e.target.value)}
                            onBlur={onSaveTitle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveTitle();
                                if (e.key === 'Escape') onCancelEdit();
                            }}
                            autoFocus
                            className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-1 px-2 rounded-lg font-inherit text-sm font-semibold w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09)] focus:bg-[#13131a]/80"
                        />
                    </div>
                ) : (
                    <h3
                        onClick={onStartEdit}
                        className="text-sm font-semibold cursor-pointer flex items-center gap-2 flex-1 text-[#e8e9f3]"
                    >
                        {list.title}
                        <span className="bg-[#2d2d3f] text-[#6e7191] text-[11px] py-0.5 px-[7px] rounded-full font-medium">{list.tasks.length}</span>
                    </h3>
                )}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#e8e9f3] hover:scale-105"
                        onClick={onStartEdit}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#ef4444] hover:bg-red-500/10"
                        onClick={onDelete}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 min-h-0">
                <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[40px] max-h-[216px] scrollbar-thin scrollbar-thumb-[#2a2a3a] scrollbar-track-transparent">
                        {list.tasks.length === 0 ? (
                            <div className="p-5 text-center text-[#6e7191] text-[13px] border-2 border-dashed border-[#2a2a3a] rounded-lg m-1">
                                Drop tasks here
                            </div>
                        ) : (
                            list.tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => onTaskClick(task)}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>

            <div className="p-2 border-t border-[#2a2a3a] flex-shrink-0">
                <input
                    type="text"
                    placeholder="+ Add task"
                    value={newTaskTitle}
                    onChange={(e) => onNewTaskChange(e.target.value)}
                    onKeyDown={onNewTaskSubmit}
                    className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-2 px-3 rounded-lg font-inherit text-sm w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09)] focus:bg-[#13131a]/80"
                />
            </div>
        </div>
    );
};