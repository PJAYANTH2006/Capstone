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
        <div className="h-screen bg-[#f8fafc] text-slate-900 flex flex-col overflow-hidden">
            {/* Glossy Header */}
            <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex justify-between items-center z-20 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-6">
                    <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                        <LayoutIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Live Space</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-xl font-black text-slate-800 leading-none">{roomId}</p>
                            <div className="h-4 w-[1px] bg-slate-200"></div>
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                {user.id === roomHost ? (
                                    <>
                                        <Crown size={14} className="text-amber-500" />
                                        Host View
                                    </>
                                ) : (
                                    <>
                                        <Users size={14} className="text-blue-500" />
                                        Collaborator
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* User Presence Avatars */}
                    <div className="flex items-center -space-x-4 hover:-space-x-1 transition-all duration-500 ease-out py-2">
                        {participants.slice(0, 5).map((p, i) => (
                            <div
                                key={i}
                                className="w-11 h-11 rounded-full border-[3px] border-white bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-xl ring-1 ring-slate-100/50 hover:scale-110 hover:-translate-y-1 transition-all cursor-pointer relative group"
                                title={p.username}
                            >
                                {p.username[0].toUpperCase()}
                                {p.id === roomHost && (
                                    <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm ring-1 ring-amber-200">
                                        <Crown size={8} />
                                    </div>
                                )}
                                {/* Tooltip on hover */}
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] pointer-events-none">
                                    {p.username} {p.id === roomHost ? '(Host)' : ''}
                                </div>
                            </div>
                        ))}
                        {participants.length > 5 && (
                            <div className="w-11 h-11 rounded-full border-[3px] border-white bg-slate-50 flex items-center justify-center text-[11px] font-black text-slate-500 shadow-lg ring-1 ring-slate-100 active:scale-95 transition-transform cursor-pointer">
                                +{participants.length - 5}
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-[1px] bg-slate-100"></div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm font-black text-slate-400 hover:text-red-500 transition-all px-5 py-2.5 rounded-2xl hover:bg-red-50 active:scale-95"
                    >
                        Exit Workspace
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Floating Toolbar */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="fixed left-6 top-32 glass-morphism p-3 rounded-[2rem] flex flex-col items-center gap-4 z-[999] border border-white/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-y-auto max-h-[80vh] scrollbar-hide"
                >
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => setTool('pencil')}
                            className={`p-3 rounded-2xl transition-all duration-300 ${tool === 'pencil' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Pencil"
                        >
                            <Pencil size={20} />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-3 rounded-2xl transition-all duration-300 ${tool === 'eraser' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Eraser"
                        >
                            <Eraser size={20} />
                        </button>
                    </div>

                    <div className="w-8 h-[1px] bg-slate-100"></div>

                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => setTool('rect')}
                            className={`p-3 rounded-2xl transition-all duration-300 ${tool === 'rect' ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Rectangle"
                        >
                            <Square size={20} />
                        </button>
                        <button
                            onClick={() => setTool('circle')}
                            className={`p-3 rounded-2xl transition-all duration-300 ${tool === 'circle' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Circle"
                        >
                            <Circle size={20} />
                        </button>
                        <button
                            onClick={() => setTool('line')}
                            className={`p-3 rounded-2xl transition-all duration-300 ${tool === 'line' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Line"
                        >
                            <Minus size={20} />
                        </button>
                        <button
                            onClick={() => setTool('text')}
                            className={`p-3 rounded-2xl transition-all duration-300 ${tool === 'text' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Text Tool"
                        >
                            <Type size={20} />
                        </button>
                    </div>

                    <div className="w-8 h-[1px] bg-slate-100"></div>

                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={undo}
                            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                            title="Undo"
                        >
                            <Undo size={20} />
                        </button>
                        <button
                            onClick={redo}
                            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                            title="Redo"
                        >
                            <Redo size={20} />
                        </button>
                    </div>

                    <div className="w-10 h-[1px] bg-slate-100"></div>

                    <button
                        onClick={downloadCanvas}
                        className="p-3.5 rounded-2xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm group"
                        title="Download Snapshot"
                    >
                        <Download size={20} />
                    </button>

                    <div className="w-10 h-[1px] bg-slate-100"></div>

                    <div className="relative group p-2 rounded-full border border-slate-200 shadow-inner bg-slate-50">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-none appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none shadow-sm"
                        />
                    </div>

                    <select
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="bg-slate-50 text-[10px] font-black rounded-xl p-2 border border-slate-100 outline-none hover:bg-white transition-all shadow-inner text-slate-600 cursor-pointer"
                    >
                        <option value="2">2px</option>
                        <option value="5">5px</option>
                        <option value="10">10px</option>
                        <option value="20">20px</option>
                    </select>

                    {user.id === roomHost && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-[1px] bg-slate-100"></div>
                            <button
                                onClick={clearCanvas}
                                className="p-3.5 rounded-2xl text-slate-400 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm relative group"
                                title="Clear Canvas (Host Only)"
                            >
                                <Trash2 size={20} />
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border border-white shadow-sm">
                                    <Crown size={8} />
                                </div>
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Main Canvas Space */}
                <div className="flex-1 bg-[#f1f5f9] flex items-center justify-center p-8 relative overflow-hidden">
                    {/* Grid Pattern Backdrop */}
                    <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-[2rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden border border-white"
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={handleMouseMove}
                            onMouseUp={endDrawing}
                            onMouseOut={endDrawing}
                            className="cursor-crosshair block"
                        />

                        {/* Remote Cursors Overlay */}
                        {Object.entries(remoteCursors).map(([socketId, pos]) => (
                            <div
                                key={socketId}
                                className="absolute pointer-events-none transition-all duration-75 z-50"
                                style={{ left: pos.x, top: pos.y }}
                            >
                                <div className="relative">
                                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg animate-pulse" />
                                    <div className="absolute left-5 top-0 bg-blue-700 text-white text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap shadow-xl">
                                        {pos.username}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Chat Panel */}
                <div className="w-80 h-full bg-white border-l border-slate-100 flex flex-col z-10 shadow-xl">
                    <Chat roomId={roomId} />
                </div>
            </div>
        </div>
    );
};

export default WhiteboardRoom;
