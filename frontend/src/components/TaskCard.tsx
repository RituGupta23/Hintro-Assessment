import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar } from 'lucide-react';

interface TaskCardProps {
    task: {
        id: string;
        title: string;
        description?: string;
        priority: string;
        dueDate?: string;
        assignees: { user: { name: string; avatar?: string } }[];
    };
    onClick?: () => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return '#ef4444';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#10b981';
            default:
                return '#6e7191';
        }
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl p-3 cursor-pointer transition-all duration-300 hover:border-[#3a3a4a] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex gap-2.5"
            onClick={onClick}
        >
            <div className="text-[#6e7191] cursor-grab pt-1 active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-[#e8e9f3] leading-snug mb-2">{task.title}</h4>
                    <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 mr-2"
                        style={{ background: getPriorityColor(task.priority) }}
                        title={`${task.priority} priority`}
                    />
                </div>

                {/* {task.description && (
                    <p className="text-[13px] text-[#6e7191] leading-relaxed mb-2.5">
                        {task.description.length > 80
                            ? task.description.substring(0, 80) + '...'
                            : task.description}
                    </p>
                )} */}
                <div className="flex items-center justify-between gap-2">
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${isOverdue ? 'text-[#ef4444] bg-red-500/10 font-semibold' : 'text-[#6e7191] bg-[#13131a]'}`}>
                            <Calendar size={12} />
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </div>
                    )}
                    {task.assignees.length > 0 && (
                        <div className="flex -space-x-1.5">
                            {task.assignees.slice(0, 3).map((a, idx) => (
                                <div
                                    key={idx}
                                    className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white border border-[#0a0a0f] flex-shrink-0"
                                    title={a.user.name}
                                >
                                    {a.user.name[0].toUpperCase()}
                                </div>
                            ))}
                            {task.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-[#2d2d3f] text-[#6e7191] text-[10px] flex items-center justify-center border border-[#0a0a0f] flex-shrink-0">
                                    +{task.assignees.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};