import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, LogOut, Search, Hash, Layout as LayoutIcon, User as UserIcon, Lock, Unlock, Eye, EyeOff, Clock, ArrowUpRight, Crown, Users } from 'lucide-react';

const Dashboard = () => {
    const [roomName, setRoomName] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [showJoinPassword, setShowJoinPassword] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/rooms/history');
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        try {
            const res = await axios.post('/api/rooms', {
                name: roomName,
                isPrivate,
                password: isPrivate ? password : null
            });
            navigate(`/room/${res.data.roomId}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating room');
        }
    };

    const handleJoinRoom = async () => {
        try {
            if (!roomIdInput) return;
            const checkRes = await axios.get(`/api/rooms/${roomIdInput}`);
            if (checkRes.data.isPrivate && !showJoinPassword) {
                setShowJoinPassword(true);
                return;
            }
            const res = await axios.post('/api/rooms/join', {
                roomId: roomIdInput,
                password: joinPassword
            });
            navigate(`/room/${res.data.roomId}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Error joining room');
        }
    };

    return (
        <div className="min-h-screen relative p-8 lg:p-16 overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-ink-primary flex items-center justify-center text-white rotate-3">
                                <LayoutIcon size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-ink-muted">Directorate</span>
                        </div>
                        <h1 className="text-6xl font-medium tracking-tight text-ink-primary">
                            Your <span className="serif-display text-terra-600">Workshop.</span>
                        </h1>
                        <p className="text-ink-secondary mt-4 font-light text-xl">Curating collaborative spaces for high-fidelity thought.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-8"
                    >
                        <div className="text-right">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">Authenticated</span>
                            <span className="block font-bold text-ink-primary text-sm">{user.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="w-12 h-12 flex items-center justify-center border border-ink-primary/10 hover:border-terra-600 hover:text-terra-600 transition-all duration-300 group"
                        >
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </header>

                <div className="grid lg:grid-cols-12 gap-8 mb-24">
                    {/* Create Room - Bento 7/12 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-7 architect-card p-12 rounded-sm relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] grayscale group-hover:rotate-12 transition-transform duration-700">
                            <Plus size={120} />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-medium mb-4 text-ink-primary tracking-tight">Open Studio</h2>
                            <p className="text-ink-secondary mb-12 font-light max-w-sm leading-relaxed">Initiate a new collaborative session with zero friction.</p>

                            <div className="space-y-6 max-w-md">
                                <div className="relative">
                                    <input
                                        className="w-full px-0 py-4 bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/40"
                                        placeholder="Identification (e.g. Phase 01)"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-6 py-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 border border-ink-primary/20 flex items-center justify-center transition-all ${isPrivate ? 'bg-ink-primary border-ink-primary' : 'bg-transparent'}`}>
                                            {isPrivate && <Lock size={12} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isPrivate}
                                            onChange={(e) => setIsPrivate(e.target.checked)}
                                        />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-ink-muted group-hover:text-ink-primary transition-colors">Credential Access</span>
                                    </label>
                                </div>

                                {isPrivate && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                        <input
                                            type="password"
                                            className="w-full px-0 py-4 bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/40"
                                            placeholder="Secure Access Token"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </motion.div>
                                )}

                                <div className="pt-6">
                                    <button
                                        onClick={handleCreateRoom}
                                        className="btn-refined btn-ink w-full px-8 py-5 text-[11px] uppercase tracking-[0.3em] font-black"
                                    >
                                        Establish Connection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Join Room - Bento 5/12 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-5 architect-card p-12 rounded-sm flex flex-col justify-between border-terra-600/5 hover:border-terra-600/20"
                    >
                        <div>
                            <h2 className="text-3xl font-medium mb-4 text-ink-primary tracking-tight">Entry Port</h2>
                            <p className="text-ink-secondary mb-12 font-light leading-relaxed">Join an existing workspace via unique identifier.</p>

                            <div className="space-y-6">
                                <div className="relative">
                                    <input
                                        className="w-full px-0 py-4 bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/40"
                                        placeholder="Space Reference ID"
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                    />
                                </div>

                                {showJoinPassword && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                        <input
                                            type="password"
                                            className="w-full px-0 py-4 bg-transparent border-b border-ink-primary/10 focus:outline-none focus:border-terra-600 transition-all font-medium text-ink-primary placeholder:text-ink-muted/40"
                                            placeholder="Verification Token"
                                            value={joinPassword}
                                            onChange={(e) => setJoinPassword(e.target.value)}
                                        />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div className="pt-12">
                            <button
                                onClick={handleJoinRoom}
                                className="btn-refined btn-outline w-full px-8 py-5 text-[11px] uppercase tracking-[0.3em] font-black hover:border-ink-primary"
                            >
                                Initiate Entry
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Session History */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-12 border-b border-ink-primary/5 pb-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-terra-600 mb-2 block">Archives</span>
                            <h2 className="text-3xl font-medium text-ink-primary tracking-tight">Recent Sessions</h2>
                        </div>
                        <div className="text-right">
                            <Clock size={24} className="text-ink-muted ml-auto" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24 grayscale opacity-20">
                            <div className="w-10 h-10 border-2 border-ink-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {history.map((room) => (
                                <motion.div
                                    key={room.roomId}
                                    whileHover={{ y: -4 }}
                                    className="architect-card p-10 rounded-sm group cursor-pointer"
                                    onClick={() => navigate(`/room/${room.roomId}`)}
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-ink-primary/5 text-ink-muted group-hover:bg-terra-600 group-hover:text-white transition-colors duration-500">
                                            {room.host === user.id ? 'Proprietor' : 'Contributor'}
                                        </div>
                                        <ArrowUpRight size={18} className="text-ink-muted group-hover:text-terra-600 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-medium text-ink-primary mb-2 tracking-tight truncate uppercase">{room.name || 'Untitled Project'}</h3>
                                    <p className="text-[9px] font-black text-ink-muted uppercase tracking-[0.3em] mb-6">{room.roomId}</p>

                                    <div className="flex items-center justify-between pt-6 border-t border-ink-primary/5">
                                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-tighter">{new Date(room.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        {room.isPrivate && <Lock size={12} className="text-ink-muted opactiy-50" />}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="architect-card py-32 rounded-sm border-dashed text-center opacity-60">
                            <p className="text-ink-muted text-[11px] font-black uppercase tracking-[0.5em]">Inventory Empty</p>
                        </div>
                    )}
                </motion.section>

                {/* Performance Visuals */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink-primary/10"
                >
                    <div className="p-12 border-b md:border-b-0 md:border-r border-ink-primary/10 text-center">
                        <div className="text-ink-primary serif-display text-4xl mb-4 italic">99.99</div>
                        <div className="text-ink-muted font-black uppercase tracking-widest text-[9px]">Engine Status</div>
                    </div>
                    <div className="p-12 border-b md:border-b-0 md:border-r border-ink-primary/10 text-center">
                        <div className="text-terra-600 serif-display text-4xl mb-4 italic">Infinite</div>
                        <div className="text-ink-muted font-black uppercase tracking-widest text-[9px]">Dimensionality</div>
                    </div>
                    <div className="p-12 text-center">
                        <div className="text-ink-primary serif-display text-4xl mb-4 italic">AES-256</div>
                        <div className="text-ink-muted font-black uppercase tracking-widest text-[9px]">Cipher Layer</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
