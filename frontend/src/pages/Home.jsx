import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ArrowRight, Zap } from 'lucide-react';

const Home = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        console.log('Form submitted:', isLogin ? 'Login' : 'Register', formData);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                navigate('/dashboard');
            } else {
                await register(formData.username, formData.email, formData.password);
                alert('Registration successful! Please login.');
                setIsLogin(true);
            }
        } catch (err) {
            console.error('Auth error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Authentication failed';
            alert(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#f8fafc]">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute middle-0 left-[20%] w-[30%] h-[30%] bg-teal-400/10 rounded-full blur-[100px]"></div>

            <main className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex flex-col space-y-8"
                >
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/10 text-blue-600 text-sm font-bold w-max shadow-sm">
                        <Zap size={14} className="fill-current" />
                        <span>Next-Gen Collaboration</span>
                    </div>
                    <h1 className="text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                        Visualize <br />
                        <span className="text-gradient">Ideas Together.</span>
                    </h1>
                    <p className="text-slate-600 text-xl max-w-md leading-relaxed">
                        The ultimate real-time collaborative whiteboard for teams. Draw, chat, and build—all in one place.
                    </p>
                    <div className="flex items-center space-x-4 text-slate-500 text-sm font-medium">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-md">
                                    <UserIcon size={18} className="text-slate-400" />
                                </div>
                            ))}
                        </div>
                        <p>Joined by <span className="text-blue-600 font-bold">100+ creators</span> this week</p>
                    </div>
                </motion.div>

                {/* Auth Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="glass-morphism p-10 rounded-[2.5rem] w-full max-w-md mx-auto relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-white/40"
                >
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black mb-3 text-slate-900">
                            {isLogin ? 'Welcome Back' : 'Get Started'}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {isLogin ? 'Enter your credentials to continue' : 'Create an account to join the community'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative group"
                                >
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <UserIcon size={20} />
                                    </div>
                                    <input
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all shadow-inner font-medium text-slate-700"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required={!isLogin}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Mail size={20} />
                            </div>
                            <input
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all shadow-inner font-medium text-slate-700"
                                placeholder="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all shadow-inner font-medium text-slate-700"
                                placeholder="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:shadow-blue-500/40 hover:scale-[1.02] text-white font-black text-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3 group overflow-hidden"
                        >
                            <span>{isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Join Now')}</span>
                            {!isLoading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="relative my-8 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <span className="relative px-6 text-[10px] text-slate-400 bg-white font-black uppercase tracking-[0.2em]">
                            Social Connect
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                            window.location.href = `${apiUrl}/api/auth/google`;
                        }}
                        className="w-full py-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 text-slate-700 font-bold transition-all flex items-center justify-center space-x-4 group shadow-sm"
                    >
                        <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                        <button
                            type="button"
                            className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold flex items-center justify-center w-full space-x-2"
                            onClick={() => {
                                setIsLogin(!isLogin);
                            }}
                        >
                            <span>{isLogin ? "New to the platform?" : "Joined us before?"}</span>
                            <span className="text-blue-600 font-black hover:underline underline-offset-4">
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Home;
