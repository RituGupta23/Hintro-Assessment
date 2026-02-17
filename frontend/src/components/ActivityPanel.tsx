import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { X, Clock } from 'lucide-react';

interface ActivityPanelProps {
    boardId: string;
    onClose: () => void;
}

const getActivityIcon = (action: string) => {
    switch (action) {
        case 'created':
            return '➕';
        case 'updated':
            return '✏️';
        case 'deleted':
            return '🗑️';
        case 'moved':
            return '↔️';
        case 'assigned':
            return '👤';
        default:
            return '📝';
    }
};

const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return past.toLocaleDateString();
};

export const ActivityPanel = ({ boardId, onClose }: ActivityPanelProps) => {
    const { activities, fetchActivities, activityPagination } = useBoardStore();

    useEffect(() => {
        fetchActivities(boardId, 1);
    }, [boardId]);

    const handleLoadMore = () => {
        if (activityPagination && activityPagination.page < activityPagination.totalPages) {
            fetchActivities(boardId, activityPagination.page + 1);
        }
    };

    return (
        <div className="w-80 bg-[#13131a]/95 backdrop-blur-xl border-l border-[#2a2a3a] flex flex-col h-full">
            <div className="flex items-center justify-between py-4 px-[18px] border-b border-[#2a2a3a]">
                <h3 className="text-[15px] font-bold flex items-center gap-2 text-[#e8e9f3]">
                    <Clock size={16} />
                    Activity
                </h3>
                <button
                    className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#e8e9f3] hover:scale-105"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-[60px] text-[#6e7191]">
                        <p className="text-sm">No activity yet</p>
                    </div>
                ) : (
                    <>
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex gap-3 p-3 rounded-lg mb-2 bg-[#13131a] transition-colors duration-300 hover:bg-[#252535]"
                            >
                                <div className="text-lg flex-shrink-0">
                                    {getActivityIcon(activity.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] leading-relaxed text-[#b4b6c8]">
                                        <strong className="text-[#e8e9f3] font-semibold">{activity.user.name}</strong> {activity.details}
                                        {activity.task && ` "${activity.task.title}"`}
                                    </p>
                                    <div className="text-[11px] text-[#6e7191] mt-1">
                                        {formatTimeAgo(activity.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {activityPagination && activityPagination.page < activityPagination.totalPages && (
                            <button
                                className="w-full justify-center inline-flex items-center gap-2 px-3.5 py-1.5 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]"
                                onClick={handleLoadMore}
                            >
                                Load More
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};