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
            // First check if room is private
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
        <div className="min-h-screen relative p-6 lg:p-12 overflow-hidden bg-[#f8fafc]">
            {/* Background Decorative Elements */}
            <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-blue-300/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-teal-300/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-20 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-5xl font-black flex items-center gap-4 text-slate-900">
                            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                                <LayoutIcon size={32} />
                            </div>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600">Workbench</span>
                        </h1>
                        <p className="text-slate-500 mt-3 font-medium text-lg">Manage your collaborative spaces</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="flex items-center gap-4 px-5 py-3 rounded-full bg-white border border-slate-100 shadow-sm glass-morphism">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-md">
                                {user.username[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700">Welcome, {user.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-4 rounded-2xl bg-red-50/50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                            title="Logout"
                        >
                            <LogOut size={22} />
                        </button>
                    </motion.div>
                </header>

                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Create Room */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] group hover:border-blue-200 transition-all duration-500 hover:shadow-blue-500/5"
                    >
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 text-blue-600 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Plus size={32} />
                        </div>
                        <h2 className="text-3xl font-black mb-3 text-slate-900">Create Space</h2>
                        <p className="text-slate-500 mb-10 font-medium leading-relaxed">Launch a new session and invite your team to brainstorm together.</p>

                        <div className="space-y-5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all font-medium text-slate-700 shadow-inner"
                                    placeholder="Room name (e.g. Brainstorming)"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-4 px-2">
                                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-slate-200 bg-slate-50 accent-blue-600"
                                    />
                                    Secure Protected Room
                                </label>
                                {isPrivate && <Lock size={16} className="text-blue-500 animate-bounce" />}
                            </div>

                            {isPrivate && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="relative"
                                >
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="password"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all font-medium text-slate-700 shadow-inner"
                                        placeholder="Room Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </motion.div>
                            )}

                            <button
                                onClick={handleCreateRoom}
                                className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                            >
                                Start Collaboration
                            </button>
                        </div>
                    </motion.div>

                    {/* Join Room */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] group hover:border-purple-200 transition-all duration-500 hover:shadow-purple-500/5"
                    >
                        <div className="w-16 h-16 rounded-[1.5rem] bg-purple-50 text-purple-600 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Hash size={32} />
                        </div>
                        <h2 className="text-3xl font-black mb-3 text-slate-900">Join Space</h2>
                        <p className="text-slate-500 mb-10 font-medium leading-relaxed">Enter an existing session ID to collaborate with your team.</p>

                        <div className="space-y-5">
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-purple-500/50 focus:bg-white transition-all font-medium text-slate-700 shadow-inner"
                                    placeholder="Room ID"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value)}
                                />
                            </div>

                            {showJoinPassword && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="relative"
                                >
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="password"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-purple-500/50 focus:bg-white transition-all font-medium text-slate-700 shadow-inner"
                                        placeholder="Enter Room Password"
                                        value={joinPassword}
                                        onChange={(e) => setJoinPassword(e.target.value)}
                                    />
                                </motion.div>
                            )}

                            <button
                                onClick={handleJoinRoom}
                                className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg transition-all active:scale-95 shadow-xl shadow-purple-500/20"
                            >
                                Connect to Session
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Session History Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-20"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900">Recent Sessions</h2>
                                <p className="text-slate-500 font-medium">Your previous collaborative spaces</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-20">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map((room) => (
                                <motion.div
                                    key={room.roomId}
                                    whileHover={{ y: -5 }}
                                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-2xl ${room.host === user.id ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {room.host === user.id ? <Crown size={20} /> : <Users size={20} />}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/room/${room.roomId}`)}
                                            className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                                        >
                                            <ArrowUpRight size={20} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-1 truncate">{room.name || 'Untitled Space'}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{room.roomId}</span>
                                        {room.isPrivate && <Lock size={12} className="text-slate-400" />}
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                        <span className="text-xs font-bold text-slate-400">{new Date(room.createdAt).toLocaleDateString()}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${room.host === user.id ? 'bg-amber-100/50 text-amber-600' : 'bg-blue-100/50 text-blue-600'}`}>
                                            {room.host === user.id ? 'Host' : 'Member'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">No history yet</h3>
                            <p className="text-slate-500 font-medium">Create or join a room to see them here.</p>
                        </div>
                    )}
                </motion.section>

                {/* Status Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 pt-24"
                >
                    <div className="p-10 rounded-3xl bg-blue-50/50 border border-blue-100 text-center shadow-sm">
                        <div className="text-blue-600 font-black text-4xl mb-2">99.9%</div>
                        <div className="text-blue-900/60 font-bold uppercase tracking-widest text-xs">Real-time Uptime</div>
                    </div>
                    <div className="p-10 rounded-3xl bg-purple-50/50 border border-purple-100 text-center shadow-sm">
                        <div className="text-purple-600 font-black text-4xl mb-2">P2P Secure</div>
                        <div className="text-purple-900/60 font-bold uppercase tracking-widest text-xs">Encrypted Channels</div>
                    </div>
                    <div className="p-10 rounded-3xl bg-teal-50/50 border border-teal-100 text-center shadow-sm">
                        <div className="text-teal-600 font-black text-4xl mb-2">∞ Layer</div>
                        <div className="text-teal-900/60 font-bold uppercase tracking-widest text-xs">Infinite Canvas</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
