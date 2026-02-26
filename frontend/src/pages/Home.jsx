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
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background Texture Element */}
            <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}></div>

            <main className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden lg:flex flex-col space-y-10"
                >
                    <div className="space-y-4">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-terra-600 block mb-6 px-1">
                            A shared space for ideas
                        </span>
                        <h1 className="text-8xl font-medium tracking-tight leading-[0.95] text-ink-primary">
                            Design <br />
                            <span className="serif-display text-terra-600">Expression.</span>
                        </h1>
                    </div>

                    <p className="text-ink-secondary text-xl max-w-md leading-relaxed font-light">
                        A minimalist canvas for high-fidelity collaboration. Built for architects, designers, and thinkers who value intentionality.
                    </p>

                    <div className="pt-8 border-t border-ink-primary/5 w-fit">
                        <div className="flex items-center space-x-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-[#f9f7f2] bg-ink-primary/5 flex items-center justify-center overflow-hidden grayscale opacity-70">
                                        <UserIcon size={20} className="text-ink-primary" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm">
                                <span className="block font-bold text-ink-primary tracking-tight">Vanguard Creators</span>
                                <span className="block text-ink-muted">Shaping the future together</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Auth Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="architect-card p-12 rounded-lg w-full max-w-md mx-auto"
                >
                    <div className="mb-12">
                        <h2 className="text-3xl font-medium mb-3 text-ink-primary tracking-tight">
                            {isLogin ? 'Login' : 'Create Account'}
                        </h2>
                        <div className="h-1 w-12 bg-terra-600"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="relative"
                                >
                                    <input
                                        className="w-full px-4 py-4 rounded-sm bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/50"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required={!isLogin}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <input
                                className="w-full px-4 py-4 rounded-sm bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/50"
                                placeholder="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="relative">
                            <input
                                className="w-full px-4 py-4 rounded-sm bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/50"
                                placeholder="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-between group px-8 py-5 bg-ink-primary text-white hover:bg-terra-600 transition-all duration-300"
                            >
                                <span className="font-bold tracking-widest uppercase text-xs">
                                    {isLoading ? 'Wait...' : (isLogin ? 'Continue' : 'Join Workshop')}
                                </span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>

                    <div className="relative my-10 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-ink-primary/5"></div>
                        </div>
                        <span className="relative px-4 text-[10px] text-ink-muted bg-white font-bold uppercase tracking-[0.2em]">
                            Authentication
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                            window.location.href = `${apiUrl}/api/auth/google`;
                        }}
                        className="w-full py-4 border border-ink-primary/10 hover:border-ink-primary hover:bg-ink-primary/5 text-ink-primary font-bold transition-all flex items-center justify-center space-x-3 group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" opacity="0.7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" opacity="0.5" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                            <path fill="currentColor" opacity="0.7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                        </svg>
                        <span className="text-[11px] uppercase tracking-widest font-black">Join with Google</span>
                    </button>

                    <div className="mt-10 text-center">
                        <button
                            type="button"
                            className="text-ink-muted hover:text-ink-primary transition-colors text-[11px] font-bold uppercase tracking-widest flex items-center justify-center w-full space-x-2"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            <span>{isLogin ? "No membership?" : "Existing member?"}</span>
                            <span className="text-terra-600 hover:underline underline-offset-4">
                                {isLogin ? 'Apply' : 'Log Entry'}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Home;
