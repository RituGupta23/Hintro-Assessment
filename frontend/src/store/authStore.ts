import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            const { user, token } = data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            connectSocket(token);
            set({ user, token, isLoading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
            throw err;
        }
    },

    signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post('/auth/signup', { name, email, password });
            const { user, token } = data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            connectSocket(token);
            set({ user, token, isLoading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Signup failed', isLoading: false });
            throw err;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
        set({ user: null, token: null });
    },

    loadUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
            connectSocket(token);
            const { data } = await api.get('/auth/me');
            set({ user: data.data.user });
        } catch {
            get().logout();
        }
    },

    checkAuth: async () => {
        const token = get().token;
        if (token) {
            await get().loadUser();
        }
    },

    clearError: () => set({ error: null }),
}));
