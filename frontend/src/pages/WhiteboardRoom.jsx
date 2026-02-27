import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../hooks/useCanvas';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Trash2, Users, Layout as LayoutIcon, Undo, Redo, Square, Circle, Minus, Type, Download, Crown, Ruler, Grid3X3, Shapes, MessageSquare } from 'lucide-react';
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
    const [isChatOpen, setIsChatOpen] = useState(false);

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
        <div className="h-screen w-screen flex flex-col overflow-hidden relative bg-[#f9f7f2]">
            {/* Top Right Island - Users & Exit */}
            <div className="absolute top-4 right-4 z-[999] flex gap-2">
                <div className="flex items-center -space-x-2 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                    {participants.slice(0, 5).map((p, i) => (
                        <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-white bg-[#1a1c1e] flex items-center justify-center text-[10px] font-bold text-white relative group cursor-default"
                            title={p.username}
                        >
                            {p.username[0].toUpperCase()}
                            {p.id === roomHost && (
                                <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 border border-white rounded-full">
                                    <Crown size={8} />
                                </div>
                            )}
                        </div>
                    ))}
                    {participants.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            +{participants.length - 5}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`p-2 rounded-lg transition-colors border shadow-sm ${isChatOpen ? 'bg-[#1a1c1e] text-white border-[#1a1c1e]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    title="Toggle Chat"
                >
                    <MessageSquare size={16} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-[#1a1c1e] hover:bg-gray-800 text-white text-xs font-semibold px-4 rounded-lg shadow-sm transition-colors"
                >
                    Leave
                </button>
            </div>

            {/* Top Center Island - Primary Tools */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center p-1 gap-1 z-[999]"
            >
                <div className="flex bg-gray-50/50 rounded-lg p-0.5">
                    <button onClick={() => setTool('pencil')} className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Draw">
                        <Pencil size={18} strokeWidth={2} />
                    </button>
                    <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Eraser">
                        <Eraser size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <div className="flex bg-gray-50/50 rounded-lg p-0.5">
                    <button onClick={() => setTool('rect')} className={`p-2 rounded-lg transition-colors ${tool === 'rect' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Rectangle">
                        <Square size={18} strokeWidth={2} />
                    </button>
                    <button onClick={() => setTool('circle')} className={`p-2 rounded-lg transition-colors ${tool === 'circle' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Circle">
                        <Circle size={18} strokeWidth={2} />
                    </button>
                    <button onClick={() => setTool('line')} className={`p-2 rounded-lg transition-colors ${tool === 'line' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Line">
                        <Minus size={18} strokeWidth={2} />
                    </button>
                    <button onClick={() => setTool('text')} className={`p-2 rounded-lg transition-colors ${tool === 'text' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Text">
                        <Type size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <button onClick={() => setTool('dimension')} className={`p-2.5 rounded-lg transition-colors ${tool === 'dimension' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Dimension">
                    <Ruler size={18} strokeWidth={2} />
                </button>
                <button onClick={() => setShowAssets(!showAssets)} className={`p-2.5 rounded-lg transition-colors ${showAssets ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Library">
                    <Shapes size={18} strokeWidth={2} />
                </button>

                {user.id === roomHost && (
                    <>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button onClick={clearCanvas} className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Clear Canvas">
                            <Trash2 size={18} strokeWidth={2} />
                        </button>
                    </>
                )}
            </motion.div>

            {/* Left Properties Panel */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-20 left-4 w-56 bg-white rounded-xl shadow-sm border border-gray-200 p-4 z-[998] flex flex-col gap-5 max-h-[calc(100vh-120px)] overflow-y-auto"
            >
                <div>
                    <span className="text-xs font-semibold text-gray-500 mb-2 block">Stroke</span>
                    <div className="grid grid-cols-5 gap-2">
                        {['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-md border ${color === c ? 'ring-2 ring-[#e03131] ring-offset-1 border-transparent' : 'border-gray-200'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <span className="text-xs font-semibold text-gray-500 mb-2 block">Stroke width</span>
                    <div className="flex bg-gray-50 rounded-lg p-1 gap-1">
                        {[2, 5, 10].map(s => (
                            <button
                                key={s}
                                onClick={() => setBrushSize(s)}
                                className={`flex-1 py-1 rounded-md flex justify-center items-center ${brushSize === s ? 'bg-[#e03131]/10 shadow-sm' : 'hover:bg-gray-200'}`}
                            >
                                <div className="bg-gray-800 rounded-full" style={{ width: s * 1.5, height: s * 1.5 }}></div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                <div>
                    <span className="text-xs font-semibold text-gray-500 mb-2 block">Scale (Meters)</span>
                    <select
                        value={scale}
                        onChange={(e) => setScale(parseInt(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e03131]/50"
                    >
                        <option value="100">1:100</option>
                        <option value="50">1:50</option>
                        <option value="20">1:20</option>
                        <option value="10">1:10</option>
                    </select>
                </div>

                <div>
                    <span className="text-xs font-semibold text-gray-500 mb-2 block">Grid Overlay</span>
                    <select
                        value={gridType}
                        onChange={(e) => setGridType(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e03131]/50"
                    >
                        <option value="none">None</option>
                        <option value="standard">Standard</option>
                        <option value="isometric">Isometric</option>
                        <option value="perspective">Perspective</option>
                    </select>
                </div>
            </motion.div>

            {/* Bottom Left Island - Zoom & History */}
            <div className="absolute bottom-4 left-4 flex gap-2 z-[999]">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex p-1">
                    <button onClick={undo} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md" title="Undo">
                        <Undo size={18} />
                    </button>
                    <button onClick={redo} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md" title="Redo">
                        <Redo size={18} />
                    </button>
                </div>
                <button onClick={downloadCanvas} className="bg-white p-1.5 text-gray-600 hover:text-[#e03131] hover:bg-[#e03131]/10 rounded-lg shadow-sm border border-gray-200" title="Export Image">
                    <Download size={18} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Vertical Toolbar - Max Contrast */}


                <div className="absolute inset-0 z-0">
                    {/* Dynamic Grid Overlay */}
                    <GridOverlay type={gridType} />

                    {/* Optional Slide-out Asset Library */}
                    {showAssets && (
                        <div className="absolute left-0 top-0 bottom-0 z-30">
                            <AssetLibrary onSelectAsset={handleSelectAsset} />
                        </div>
                    )}

                    <div className="w-full h-full">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={handleMouseMove}
                            onMouseUp={endDrawing}
                            onMouseOut={endDrawing}
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
                    </div>
                </div>

                {/* Chat Panel - Collapsible/Floating */}
                {isChatOpen && (
                    <div className="absolute right-4 top-20 bottom-4 w-80 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col z-[998] overflow-hidden">
                        <Chat roomId={roomId} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhiteboardRoom;
