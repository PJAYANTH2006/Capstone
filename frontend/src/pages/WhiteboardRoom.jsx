import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../hooks/useCanvas';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Trash2, Users, Layout as LayoutIcon, Undo, Redo, Square, Circle, Minus, Type, Download, Crown, Ruler, Grid3X3, Shapes } from 'lucide-react';
import Chat from '../components/Chat';
import GridOverlay from '../components/GridOverlay';
import AssetLibrary from '../components/AssetLibrary';

const WhiteboardRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();
    const { canvasRef, startDrawing, draw, endDrawing, color, setColor, brushSize, setBrushSize, tool, setTool, scale, setScale, gridType, setGridType, clearCanvas, undo, redo, downloadCanvas } = useCanvas(socket, roomId);
    const [participants, setParticipants] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({}); // { socketId: { x, y, username } }
    const [roomHost, setRoomHost] = useState(null);
    const [showAssets, setShowAssets] = useState(false);

    const handleSelectAsset = (asset) => {
        setTool('asset');
        window.__currentSelectedAsset = asset;
    };

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
        <div className="h-screen flex flex-col overflow-hidden relative bg-[#f9f7f2]">
            {/* Structured Header - Higher Contrast */}
            <header className="h-24 border-b border-ink-primary/20 px-10 flex justify-between items-center z-20 relative bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="w-12 h-12 bg-ink-primary flex items-center justify-center text-white rotate-3 shadow-xl">
                        <LayoutIcon size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-terra-600 uppercase tracking-[0.4em] mb-1 block">Live Workshop</span>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black text-ink-primary tracking-tight uppercase leading-none">{roomId}</h1>
                            <div className="h-4 w-[2px] bg-ink-primary/20"></div>
                            <div className="flex items-center gap-2 text-ink-primary text-[10px] font-black uppercase tracking-widest">
                                {user.id === roomHost ? (
                                    <>
                                        <Crown size={14} className="text-terra-600" />
                                        Proprietor
                                    </>
                                ) : (
                                    <>
                                        <Users size={14} className="text-ink-primary" />
                                        Contributor
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    {/* User Presence List - High Contrast Avatars */}
                    <div className="flex items-center -space-x-3 py-2">
                        {participants.slice(0, 5).map((p, i) => (
                            <div
                                key={i}
                                className="w-12 h-12 rounded-full border-2 border-white bg-ink-primary flex items-center justify-center text-[11px] font-black text-white shadow-xl hover:-translate-y-2 transition-all cursor-pointer relative group ring-1 ring-ink-primary"
                                title={p.username}
                            >
                                {p.username[0].toUpperCase()}
                                {p.id === roomHost && (
                                    <div className="absolute -top-1 -right-1 bg-terra-600 text-white p-1 border-2 border-white shadow-md rounded-sm">
                                        <Crown size={10} />
                                    </div>
                                )}
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-ink-primary text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] pointer-events-none shadow-2xl border-2 border-white">
                                    {p.username}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-10 w-[2px] bg-ink-primary/10"></div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-[11px] font-black uppercase tracking-[0.2em] text-white bg-ink-primary hover:bg-terra-600 transition-all py-3.5 px-8 border-2 border-ink-primary shadow-md hover:shadow-xl active:scale-95"
                    >
                        Depart Studio
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Vertical Toolbar - Max Contrast */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 p-2 bg-white border-2 border-ink-primary rounded-sm flex flex-col items-center gap-2 z-[999] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]"
                >
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setTool('pencil')}
                            className={`p-4 transition-all duration-200 ${tool === 'pencil' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Graphite"
                        >
                            <Pencil size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-4 transition-all duration-200 ${tool === 'eraser' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Solvent"
                        >
                            <Eraser size={24} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setTool('rect')}
                            className={`p-4 transition-all duration-200 ${tool === 'rect' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Frame"
                        >
                            <Square size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setTool('circle')}
                            className={`p-4 transition-all duration-200 ${tool === 'circle' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Compass"
                        >
                            <Circle size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setTool('line')}
                            className={`p-4 transition-all duration-200 ${tool === 'line' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Straight Edge"
                        >
                            <Minus size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setTool('text')}
                            className={`p-4 transition-all duration-200 ${tool === 'text' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Typeface"
                        >
                            <Type size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setTool('dimension')}
                            className={`p-4 transition-all duration-200 ${tool === 'dimension' ? 'bg-ink-primary text-white ring-2 ring-terra-600' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                            title="Dimension Line (Hold Shift to Snap)"
                        >
                            <Ruler size={24} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <div className="flex flex-col items-center gap-1 w-full px-2">
                        <span className="text-[9px] font-black uppercase text-ink-primary/50 tracking-widest text-center w-full block mb-1">Scale</span>
                        <select
                            value={scale}
                            onChange={(e) => setScale(parseInt(e.target.value))}
                            className="bg-white text-ink-primary text-[10px] font-black rounded px-2 py-1.5 outline-none border-2 border-ink-primary/20 w-full text-center hover:border-terra-600 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="100">1:100</option>
                            <option value="50">1:50</option>
                            <option value="20">1:20</option>
                            <option value="10">1:10</option>
                        </select>
                    </div>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <div className="flex flex-col items-center gap-1 w-full px-2">
                        <span className="text-[9px] font-black uppercase text-ink-primary/50 tracking-widest text-center w-full block mb-1">Grid</span>
                        <select
                            value={gridType}
                            onChange={(e) => setGridType(e.target.value)}
                            className="bg-white text-ink-primary text-[10px] font-black rounded px-2 py-1.5 outline-none border-2 border-ink-primary/20 w-full text-center hover:border-terra-600 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="none">None</option>
                            <option value="standard">Standard</option>
                            <option value="isometric">Isometric</option>
                            <option value="perspective">Perspective</option>
                        </select>
                    </div>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <button
                        onClick={() => setShowAssets(!showAssets)}
                        className={`p-4 transition-all duration-200 ${showAssets ? 'bg-terra-600 text-white shadow-inner' : 'text-ink-primary hover:bg-ink-primary/10'}`}
                        title="Stencils & Assets"
                    >
                        <Shapes size={24} strokeWidth={2.5} />
                    </button>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <div className="flex flex-col items-center gap-1">
                        <button onClick={undo} className="p-4 text-ink-primary hover:scale-110 active:scale-95 transition-all" title="Revert">
                            <Undo size={22} strokeWidth={2.5} />
                        </button>
                        <button onClick={redo} className="p-4 text-ink-primary hover:scale-110 active:scale-95 transition-all" title="Forward">
                            <Redo size={22} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <button
                        onClick={downloadCanvas}
                        className="p-4 text-terra-600 hover:bg-terra-600 hover:text-white transition-all rounded-sm"
                        title="Archive"
                    >
                        <Download size={22} strokeWidth={2.5} />
                    </button>

                    <div className="w-10 h-[2px] bg-ink-primary/20 mx-auto my-1"></div>

                    <div className="p-1.5 border-2 border-ink-primary rounded-full my-2 bg-white shadow-md">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                        />
                    </div>

                    <select
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="bg-ink-primary text-white text-[10px] font-black rounded px-3 py-2 outline-none border-2 border-ink-primary cursor-pointer appearance-none text-center hover:bg-terra-600 transition-colors"
                    >
                        <option value="2">02</option>
                        <option value="5">05</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                    </select>

                    {user.id === roomHost && (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-[2px] bg-ink-primary/20 my-1"></div>
                            <button
                                onClick={clearCanvas}
                                className="p-4 text-ink-primary hover:bg-terra-600 hover:text-white transition-all relative group shadow-sm bg-ink-primary/5"
                                title="Liquis (Host Only)"
                            >
                                <Trash2 size={22} strokeWidth={2.5} />
                                <div className="absolute top-2 right-2 w-3 h-3 bg-terra-600 rounded-full ring-2 ring-white shadow-sm"></div>
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Main Canvas Space */}
                <div className="flex-1 bg-[#f1f1e9] flex items-center justify-center p-12 relative overflow-hidden">
                    {/* Dynamic Grid Overlay */}
                    <GridOverlay type={gridType} />

                    {/* Optional Slide-out Asset Library */}
                    {showAssets && (
                        <div className="absolute left-0 top-0 bottom-0 z-30">
                            <AssetLibrary onSelectAsset={handleSelectAsset} />
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-white rounded-sm shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden border-2 border-ink-primary"
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={handleMouseMove}
                            onMouseUp={endDrawing}
                            onMouseOut={endDrawing}
                            className="cursor-crosshair block"
                        />

                        {/* Remote Cursors - High Visibility */}
                        {Object.entries(remoteCursors).map(([socketId, pos]) => (
                            <div
                                key={socketId}
                                className="absolute pointer-events-none transition-all duration-75 z-50 flex items-center gap-4"
                                style={{ left: pos.x, top: pos.y }}
                            >
                                <div className="w-5 h-5 bg-black scale-110 shadow-xl border-2 border-white transform rotate-45" />
                                <div className="bg-black text-white text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.4)] border-2 border-white whitespace-nowrap">
                                    {pos.username}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Chat Panel - Higher Contrast Borders */}
                <div className="w-96 h-full bg-white border-l-2 border-ink-primary flex flex-col z-10 shadow-2xl">
                    <Chat roomId={roomId} />
                </div>
            </div>
        </div>
    );
};

export default WhiteboardRoom;
