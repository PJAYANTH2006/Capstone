import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../hooks/useCanvas';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Trash2, Users, Layout as LayoutIcon, Undo, Redo, Square, Circle, Minus, Type, Download, Crown } from 'lucide-react';
import Chat from '../components/Chat';

const WhiteboardRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();
    const { canvasRef, startDrawing, draw, endDrawing, color, setColor, brushSize, setBrushSize, tool, setTool, clearCanvas, undo, redo, downloadCanvas } = useCanvas(socket, roomId);
    const [participants, setParticipants] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({}); // { socketId: { x, y, username } }
    const [roomHost, setRoomHost] = useState(null);

    useEffect(() => {
        if (socket && user) {
            socket.emit('join-room', { roomId, user });

            socket.on('room-users', (users) => {
                setParticipants(users);
            });

            socket.on('room-data', (data) => {
                setRoomHost(data.hostId);
            });

            socket.on('cursor-move-receive', (data) => {
                setRemoteCursors((prev) => ({
                    ...prev,
                    [data.socketId]: data
                }));
            });
        }

        return () => {
            if (socket) {
                socket.off('room-users');
                socket.off('cursor-move-receive');
            }
        };
    }, [socket, user, roomId]);

    const handleMouseMove = (e) => {
        if (socket && user) {
            const { offsetX, offsetY } = e.nativeEvent;
            socket.emit('cursor-move', {
                roomId,
                data: { x: offsetX, y: offsetY, username: user.username }
            });
        }
        draw(e);
    };

    if (!user) return null; // Defensive check

    return (
        <div className="h-screen flex flex-col overflow-hidden relative">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}></div>

            {/* Structured Header */}
            <header className="h-24 border-b border-ink-primary/5 px-10 flex justify-between items-center z-20 relative bg-white/40 backdrop-blur-sm">
                <div className="flex items-center gap-8">
                    <div className="w-12 h-12 bg-ink-primary flex items-center justify-center text-white rotate-3 shadow-md">
                        <LayoutIcon size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-terra-600 uppercase tracking-[0.4em] mb-1 block">Live Workshop</span>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-medium text-ink-primary tracking-tight uppercase leading-none">{roomId}</h1>
                            <div className="h-4 w-[1px] bg-ink-primary/10"></div>
                            <div className="flex items-center gap-2 text-ink-muted text-[10px] font-black uppercase tracking-widest">
                                {user.id === roomHost ? (
                                    <>
                                        <Crown size={12} className="text-terra-600" />
                                        Proprietor
                                    </>
                                ) : (
                                    <>
                                        <Users size={12} className="text-ink-primary" />
                                        Contributor
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    {/* User Presence List */}
                    <div className="flex items-center -space-x-3 py-2">
                        {participants.slice(0, 5).map((p, i) => (
                            <div
                                key={i}
                                className="w-12 h-12 rounded-full border-4 border-[#f9f7f2] bg-ink-primary flex items-center justify-center text-xs font-bold text-white shadow-sm hover:-translate-y-1 transition-all cursor-pointer relative group grayscale hover:grayscale-0"
                                title={p.username}
                            >
                                {p.username[0].toUpperCase()}
                                {p.id === roomHost && (
                                    <div className="absolute -top-1 -right-1 bg-terra-600 text-white p-0.5 border-2 border-white shadow-sm">
                                        <Crown size={8} />
                                    </div>
                                )}
                                <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-ink-primary text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] pointer-events-none">
                                    {p.username}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-10 w-[1px] bg-ink-primary/5"></div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted hover:text-terra-600 transition-all py-3 px-6 border border-transparent hover:border-terra-600/20"
                    >
                        Depart Studio
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Vertical Toolbar - Refined */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="fixed left-8 top-1/2 -translate-y-1/2 p-2 architect-card rounded-sm flex flex-col items-center gap-2 z-[999] border-ink-primary/10"
                >
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setTool('pencil')}
                            className={`p-4 transition-all duration-300 ${tool === 'pencil' ? 'bg-ink-primary text-white' : 'text-ink-muted hover:bg-ink-primary/5 hover:text-ink-primary'}`}
                            title="Graphite"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-4 transition-all duration-300 ${tool === 'eraser' ? 'bg-ink-primary text-white' : 'text-ink-muted hover:bg-ink-primary/5 hover:text-ink-primary'}`}
                            title="Solvent"
                        >
                            <Eraser size={18} />
                        </button>
                    </div>

                    <div className="w-8 h-[1px] bg-ink-primary/5 mx-auto my-1"></div>

                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setTool('rect')}
                            className={`p-4 transition-all duration-300 ${tool === 'rect' ? 'bg-ink-primary text-white' : 'text-ink-muted hover:bg-ink-primary/5 hover:text-ink-primary'}`}
                            title="Frame"
                        >
                            <Square size={18} />
                        </button>
                        <button
                            onClick={() => setTool('circle')}
                            className={`p-4 transition-all duration-300 ${tool === 'circle' ? 'bg-ink-primary text-white' : 'text-ink-muted hover:bg-ink-primary/5 hover:text-ink-primary'}`}
                            title="Compass"
                        >
                            <Circle size={18} />
                        </button>
                        <button
                            onClick={() => setTool('line')}
                            className={`p-4 transition-all duration-300 ${tool === 'line' ? 'bg-ink-primary text-white' : 'text-ink-muted hover:bg-ink-primary/5 hover:text-ink-primary'}`}
                            title="Straight Edge"
                        >
                            <Minus size={18} />
                        </button>
                        <button
                            onClick={() => setTool('text')}
                            className={`p-4 transition-all duration-300 ${tool === 'text' ? 'bg-ink-primary text-white' : 'text-ink-muted hover:bg-ink-primary/5 hover:text-ink-primary'}`}
                            title="Typeface"
                        >
                            <Type size={18} />
                        </button>
                    </div>

                    <div className="w-8 h-[1px] bg-ink-primary/5 mx-auto my-1"></div>

                    <div className="flex flex-col items-center gap-1">
                        <button onClick={undo} className="p-4 text-ink-muted hover:text-ink-primary transition-all" title="Revert">
                            <Undo size={18} />
                        </button>
                        <button onClick={redo} className="p-4 text-ink-muted hover:text-ink-primary transition-all" title="Forward">
                            <Redo size={18} />
                        </button>
                    </div>

                    <div className="w-8 h-[1px] bg-ink-primary/5 mx-auto my-1"></div>

                    <button
                        onClick={downloadCanvas}
                        className="p-4 text-terra-600 hover:bg-terra-600 hover:text-white transition-all"
                        title="Archive"
                    >
                        <Download size={18} />
                    </button>

                    <div className="w-8 h-[1px] bg-ink-primary/5 mx-auto my-1"></div>

                    <div className="p-1 border border-ink-primary/10 rounded-full my-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-none appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none grayscale-[0.2]"
                        />
                    </div>

                    <select
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="bg-transparent text-[8px] font-black rounded-lg p-2 outline-none border-none text-ink-muted cursor-pointer appearance-none text-center"
                    >
                        <option value="2">02</option>
                        <option value="5">05</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                    </select>

                    {user.id === roomHost && (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-[1px] bg-ink-primary/5 my-1"></div>
                            <button
                                onClick={clearCanvas}
                                className="p-4 text-ink-muted hover:text-terra-600 transition-all relative group"
                                title="Liquis (Host Only)"
                            >
                                <Trash2 size={18} />
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-terra-600 rounded-full animate-pulse"></div>
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Main Canvas Space */}
                <div className="flex-1 bg-[#f1f1e9] flex items-center justify-center p-12 relative overflow-hidden">
                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1a1c1e 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-white rounded-sm shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden border border-ink-primary/5"
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={handleMouseMove}
                            onMouseUp={endDrawing}
                            onMouseOut={endDrawing}
                            className="cursor-crosshair block"
                        />

                        {/* Remote Cursors - Thematic */}
                        {Object.entries(remoteCursors).map(([socketId, pos]) => (
                            <div
                                key={socketId}
                                className="absolute pointer-events-none transition-all duration-75 z-50 flex items-center gap-2"
                                style={{ left: pos.x, top: pos.y }}
                            >
                                <div className="w-3 h-3 bg-terra-600 rotate-45 shadow-sm" />
                                <div className="bg-ink-primary text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg border border-white/10">
                                    {pos.username}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Chat Panel - Integrated */}
                <div className="w-80 h-full bg-white border-l border-ink-primary/5 flex flex-col z-10">
                    <Chat roomId={roomId} />
                </div>
            </div>
        </div>
    );
};

export default WhiteboardRoom;
