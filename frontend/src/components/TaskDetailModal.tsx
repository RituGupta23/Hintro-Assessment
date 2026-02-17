import { useState } from 'react';
import { useBoardStore, type Task } from '../store/boardStore';
import { X, Calendar, Flag, User, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
    task: Task;
    boardId: string;
    onClose: () => void;
}

const PRIORITIES = ['low', 'medium', 'high'];

export const TaskDetailModal = ({ task, boardId, onClose }: TaskDetailModalProps) => {
    const { currentBoard, updateTask, deleteTask, assignTask, unassignTask } = useBoardStore();

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.dueDate?.split('T')[0] || '');
    const [showAssignMenu, setShowAssignMenu] = useState(false);

    const handleSave = async () => {
        try {
            await updateTask(task.id, {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            });
            toast.success('Task updated');
            onClose();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await deleteTask(task.id);
            toast.success('Task deleted');
            onClose();
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleAssign = async (userId: string) => {
        try {
            const isAssigned = task.assignees.some(a => a.user.id === userId);
            if (isAssigned) {
                await unassignTask(task.id, userId);
                toast.success('User unassigned');
            } else {
                await assignTask(task.id, userId);
                toast.success('User assigned');
            }
            setShowAssignMenu(false);
        } catch (error) {
            toast.error('Failed to update assignment');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease]" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="bg-[#1a1a24]/95 backdrop-blur-xl border border-[#3a3a4a] rounded-2xl p-7 max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#e8e9f3]">Task Details</h2>
                    <button 
                        className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#e8e9f3] hover:scale-105" 
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
                    <div className="min-w-0">
                        <div className="mb-[18px] flex flex-col">
                            <label htmlFor="task-title" className="text-[13px] font-semibold text-[#b4b6c8] mb-1.5 flex items-center gap-1.5 tracking-wide">
                                Title
                            </label>
                            <input
                                id="task-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-2.5 px-3.5 rounded-lg font-inherit text-lg font-semibold w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                            />
                        </div>

                        <div className="mb-[18px] flex flex-col">
                            <label htmlFor="task-description" className="text-[13px] font-semibold text-[#b4b6c8] mb-1.5 flex items-center gap-1.5 tracking-wide">
                                Description
                            </label>
                            <textarea
                                id="task-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows={6}
                                className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-3 px-4 rounded-lg font-inherit text-sm w-full transition-all duration-300 resize-vertical focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div>
                            <h4 className="text-[13px] font-semibold text-[#b4b6c8] mb-2.5 flex items-center gap-1.5">
                                <Flag size={14} />
                                Priority
                            </h4>
                            <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full py-2 px-3 bg-[#13131a] border border-[#2a2a3a] rounded-lg text-[#e8e9f3] text-[13px] cursor-pointer transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <h4 className="text-[13px] font-semibold text-[#b4b6c8] mb-2.5 flex items-center gap-1.5">
                                <Calendar size={14} />
                                Due Date
                            </h4>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full py-2 px-3 bg-[#13131a] border border-[#2a2a3a] rounded-lg text-[#e8e9f3] text-[13px] transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                            />
                        </div>

                        <div className="relative">
                            <h4 className="text-[13px] font-semibold text-[#b4b6c8] mb-2.5 flex items-center justify-between gap-1.5">
                                <span className="flex items-center gap-1.5">
                                    <User size={14} />
                                    Assignees
                                </span>
                                <button
                                    className="inline-flex items-center gap-2 px-2 py-1 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]"
                                    onClick={() => setShowAssignMenu(!showAssignMenu)}
                                >
                                    +
                                </button>
                            </h4>

                            {task.assignees.map((assignee) => (
                                <div key={assignee.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#13131a] mb-1.5">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white border border-[#0a0a0f] flex-shrink-0">
                                        {assignee.user.name[0].toUpperCase()}
                                    </div>
                                    <span className="flex-1 text-[13px] text-[#e8e9f3]">{assignee.user.name}</span>
                                    <button
                                        className="inline-flex items-center gap-2 px-2 py-1 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]"
                                        onClick={() => handleAssign(assignee.user.id)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {showAssignMenu && (
                                <div className="absolute top-full left-0 right-0 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] max-h-[200px] overflow-y-auto z-10 mt-1">
                                    {currentBoard?.members
                                        ?.filter(m => !task.assignees.some(a => a.user.id === m.user.id))
                                        .map((member) => (
                                            <button
                                                key={member.id}
                                                className="flex items-center gap-2.5 py-2.5 px-3 w-full bg-transparent border-none text-[#e8e9f3] text-[13px] cursor-pointer transition-colors duration-300 hover:bg-[#252535]"
                                                onClick={() => handleAssign(member.user.id)}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white border border-[#0a0a0f] flex-shrink-0">
                                                    {member.user.name[0].toUpperCase()}
                                                </div>
                                                {member.user.name}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#2a2a3a]">
                    <button 
                        className="inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#6e7191] hover:bg-[#252535] hover:text-[#ef4444] hover:bg-red-500/10" 
                        onClick={handleDelete}
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                    <div className="flex gap-3">
                        <button 
                            className="inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]" 
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            className="inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-indigo-800 text-white" 
                            onClick={handleSave}
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};