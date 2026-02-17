import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signup, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signup(name, email, password);
            toast.success('Account created successfully!');
            navigate('/');
        } catch {
            toast.error('Failed to create account');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 md:p-8 relative overflow-x-hidden">

            <div className="w-full max-w-[440px] bg-black/50 backdrop-blur-xl border border-[#3a3a4a] rounded-3xl p-6 md:p-12">
                <div className="text-center mb-9">
                    <div className="flex items-center justify-center gap-3.5 mb-3">
                        <h1 className="text-3xl font-extrabold text-indigo-300"> Hintro </h1>
                    </div>
                    <p className="text-gray-400 text-md font-medium">Create your workspace account</p>
                </div>

                <form className="mb-7" onSubmit={handleSubmit}>
                    <div className="mb-6 flex flex-col">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5 tracking-wide">
                            Full Name
                        </label>
                        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xl border border-gray-500 rounded-lg px-4 transition-all duration-300">
                            <User size={18} className="text-gray-500 flex-shrink-0" />
                            <input
                                id="name"
                                type="text"
                                placeholder="your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="border-none bg-transparent py-3 px-0 text-gray font-inherit text-sm w-full outline-none focus:shadow-none"
                            />
                        </div>
                    </div>
                    <div className="mb-6 flex flex-col">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5 tracking-wide">
                            Email
                        </label>
                        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xl border border-gray-500 rounded-lg px-4 transition-all duration-300">
                            <Mail size={18} className="text-gray-500 flex-shrink-0" />
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="border-none bg-transparent py-3 px-0 text-gray font-inherit text-sm w-full outline-none focus:shadow-none"
                            />
                        </div>
                    </div>
                    <div className="mb-6 flex flex-col">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5 tracking-wide">
                            Password
                        </label>
                        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xl border border-gray-500 rounded-lg px-4 transition-all duration-300">
                            <Lock size={18} className="text-gray-500 flex-shrink-0" />
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="border-none bg-transparent py-3 px-0 text-gray font-inherit text-sm w-full outline-none focus:shadow-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full justify-center inline-flex items-center gap-2 px-5 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 font-inherit relative overflow-hidden bg-indigo-800 text-white"
                        disabled={isLoading}>
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        Sign Up
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400">
                    <p>Already have an account? <Link to="/login" className="text-indigo-300 no-underline transition-colors duration-300 hover:text-indigo-400">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
};