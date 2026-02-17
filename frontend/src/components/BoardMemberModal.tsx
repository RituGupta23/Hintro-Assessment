import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { X, UserPlus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface BoardMemberModalProps {
    boardId: string;
    onClose: () => void;
}

export const BoardMemberModal = ({ boardId, onClose }: BoardMemberModalProps) => {
    const { currentBoard, addMember } = useBoardStore();
    const [email, setEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsAdding(true);
        try {
            await addMember(boardId, email);
            setEmail('');
            toast.success('Member added successfully');
        } catch (error) {
            toast.error('Failed to add member');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease]" onClick={onClose}>
            <div className="bg-[#1a1a24]/95 backdrop-blur-xl border border-[#3a3a4a] rounded-2xl p-7 max-w-[420px] w-[90%] max-h-[90vh] overflow-y-auto shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#e8e9f3]">Board Members</h2>
                    <button
                        className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#e8e9f3] hover:scale-105"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleAddMember} className="mb-7">
                    <div className="mb-[18px] flex flex-col">
                        <label htmlFor="member-email" className="text-[13px] font-semibold text-[#b4b6c8] mb-1.5 flex items-center gap-1.5 tracking-wide">
                            Add Member
                        </label>
                        <div className="flex items-center gap-3 bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] rounded-lg px-4 transition-all duration-300 focus-within:border-indigo-500 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus-within:bg-[#13131a]/80">
                            <Mail size={18} className="text-[#6e7191] flex-shrink-0" />
                            <input
                                id="member-email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isAdding}
                                className="border-none bg-transparent py-3 px-0 text-[#e8e9f3] font-inherit text-sm w-full outline-none focus:shadow-none"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full justify-center inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-indigo-800 text-white"
                        disabled={isAdding}
                    >
                        <UserPlus size={18} />
                        {isAdding ? 'Adding...' : 'Add Member'}
                    </button>
                </form>

                <div className="mt-6">
                    <h4 className="text-[13px] font-semibold mb-3 text-[#b4b6c8]">
                        Current Members ({currentBoard?.members?.length || 0})
                    </h4>
                    {currentBoard?.members?.map((member) => (
                        <div key={member.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#13131a] mb-1.5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white border-2 border-[#0a0a0f] flex-shrink-0">
                                {member.user.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#e8e9f3]">{member.user.name}</div>
                                <div className="text-xs text-[#6e7191]">{member.user.email}</div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/9 text-indigo-300 flex-shrink-0">
                                {member.role}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 mt-5">
                    <button
                        className="w-full justify-center inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};