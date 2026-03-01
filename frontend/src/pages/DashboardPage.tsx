import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, LogOut, User, Trash2, Users, List } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

export const DashboardPage = () => {
    const { boards, fetchBoards, createBoard, deleteBoard, pagination } = useBoardStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadBoards(1, '');
    }, []);

    const loadBoards = async (page: number, search: string) => {
        setIsLoading(true);
        try {
            await fetchBoards(page, search);
            setCurrentPage(page);
        } catch (error) {
            toast.error('Failed to load boards');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        loadBoards(1, query);
    };

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const board = await createBoard(title, description, color);
            setShowModal(false);
            setTitle('');
            setDescription('');
            setColor(COLORS[0]);
            toast.success('Board created successfully!');
            navigate(`/board/${board.id}`);
        } catch (error) {
            toast.error('Failed to create board');
        }
    };

    const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this board?')) return;

        try {
            await deleteBoard(boardId);
            toast.success('Board deleted successfully');
        } catch (error) {
            toast.error('Failed to delete board');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredBoards = boards;

    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between py-4 px-6 border-b border-[#2a2a3a] bg-[#1a1a24]">
                <div className="flex items-center gap-3">
                    
                    <h1 className="text-xl font-bold text-indigo-300">
                        SyncDeck
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-[#b4b6c8] flex items-center gap-2">
                        <User size={16} />
                        {user?.name}
                    </span>
                    <button 
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]" 
                        onClick={handleLogout}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-2.5 bg-[#13131a] border border-[#2a2a3a] rounded-lg px-3.5 py-0 flex-1 max-w-[400px] transition-colors duration-300 focus-within:border-indigo-500">
                        <Search size={18} className="text-[#6e7191] flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search boards..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="border-none bg-transparent py-2.5 px-0 text-[#e8e9f3] text-sm w-full outline-none shadow-none"
                        />
                    </div>
                    <button 
                        className="inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-indigo-800 text-white" 
                        onClick={() => setShowModal(true)}
                    >
                        <Plus size={18} />
                        Create Board
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-[60px] text-[#6e7191]">
                        <div className="animate-spin text-2xl">⏳</div>
                        <p className="text-sm">Loading boards...</p>
                    </div>
                ) : filteredBoards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-[60px] text-[#6e7191]">
                        <h3 className="text-lg text-[#b4b6c8]">No boards found</h3>
                        <p className="text-sm mb-2">Create your first board to get started</p>

                        <button 
                            className="inline-flex items-center gap-2 px-5 py-4 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-indigo-800 text-white" 
                            onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Create Board
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                            {filteredBoards.map((board) => (
                                <div
                                    key={board.id}
                                    className="bg-[#1f1f2e] border border-[#2a2a3a] border-t-[3px] rounded-xl cursor-pointer transition-all duration-300 overflow-hidden hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:border-[#3a3a4a]"
                                    style={{ borderTopColor: board.color }}
                                    onClick={() => navigate(`/board/${board.id}`)}
                                >
                                    <div className="py-5 px-5 pb-3 flex justify-between items-start">
                                        <h3 className="text-base font-semibold text-[#e8e9f3]">{board.title}</h3>
                                        <button
                                            className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-[#6e7191] inline-flex items-center transition-all duration-300 hover:bg-[#252535] hover:text-[#ef4444] hover:bg-red-500/10"
                                            onClick={(e) => handleDeleteBoard(board.id, e)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    {board.description && (
                                        <p className="px-5 py-0 text-[13px] text-[#6e7191] leading-relaxed">{board.description}</p>
                                    )}
                                    <div className="flex items-center justify-between py-3.5 px-5 mt-3 border-t border-[#2a2a3a]">
                                        <div className="flex items-center gap-1.5 text-xs text-[#6e7191]">
                                            <Users size={14} />
                                            {board.members?.length || 0} members
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-[#6e7191]">
                                            <List size={14} />
                                            {board._count?.lists || 0} lists
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 p-6">
                                <button
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3] disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => loadBoards(currentPage - 1, searchQuery)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span className="text-[13px] text-[#6e7191]">
                                    Page {currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3] disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => loadBoards(currentPage + 1, searchQuery)}
                                    disabled={currentPage === pagination.totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {showModal && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease]" onClick={() => setShowModal(false)}>
                    <div className="bg-[#1a1a24]/95 backdrop-blur-xl border border-[#3a3a4a] rounded-2xl p-7 max-w-[420px] w-[90%] max-h-[90vh] overflow-y-auto shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6 text-[#e8e9f3]">Create New Board</h2>
                        <form className="mb-7" onSubmit={handleCreateBoard}>
                            <div className="mb-[18px] flex flex-col">
                                <label htmlFor="title" className="text-[13px] font-semibold text-[#b4b6c8] mb-1.5 flex items-center gap-1.5 tracking-wide">
                                    Board Title
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    placeholder="My Awesome Board"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    autoFocus
                                    className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-3 px-4 rounded-lg font-inherit text-sm w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                                />
                            </div>
                            <div className="mb-[18px] flex flex-col">
                                <label htmlFor="description" className="text-[13px] font-semibold text-[#b4b6c8] mb-1.5 flex items-center gap-1.5 tracking-wide">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    placeholder="What's this board about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="bg-[#13131a]/60 backdrop-blur-xl border border-[#2a2a3a] text-[#e8e9f3] py-3 px-4 rounded-lg font-inherit text-sm w-full transition-all duration-300 resize-vertical focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.09),0_4px_12px_rgba(99,102,241,0.2)] focus:bg-[#13131a]/80"
                                />
                            </div>
                            <div className="mb-[18px] flex flex-col">
                                <label className="text-[13px] font-semibold text-[#b4b6c8] mb-1.5 flex items-center gap-1.5 tracking-wide">
                                    Board Color
                                </label>
                                <div className="flex gap-2.5 flex-wrap">
                                    {COLORS.map((c) => (
                                        <div
                                            key={c}
                                            className={`w-10 h-10 rounded-lg cursor-pointer border-[3px] border-transparent transition-all duration-300 hover:scale-110 ${color === c ? 'border-[#e8e9f3] shadow-[0_0_0_2px_#1a1a24]' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-5 py-[11px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-transparent text-[#b4b6c8] hover:bg-[#252535] hover:text-[#e8e9f3]"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="inline-flex items-center gap-2 px-5 py-4 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-indigo-800 text-white"
                                >
                                    <Plus size={18}/>
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};