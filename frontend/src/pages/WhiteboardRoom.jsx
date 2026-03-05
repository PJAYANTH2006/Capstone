import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../hooks/useCanvas';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Trash2, Users, Layout as LayoutIcon, Undo, Redo, Square, Circle, Minus, Type, Download, Crown, Ruler, Grid3X3, Shapes, MessageSquare, Layers, Eye, EyeOff, Lock, Cloud, Copy, Check, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import Chat from '../components/Chat';
import GridOverlay from '../components/GridOverlay';
import AssetLibrary from '../components/AssetLibrary';

const WhiteboardRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();
    const { canvasRef, startDrawing, draw, endDrawing, color, setColor, brushSize, setBrushSize, tool, setTool, scale, setScale, gridType, setGridType, clearCanvas, undo, redo, downloadCanvas, activeLayer, setActiveLayer, visibleLayers, setVisibleLayers } = useCanvas(socket, roomId);
    const [participants, setParticipants] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({}); // { socketId: { x, y, username } }
    const [roomHost, setRoomHost] = useState(null);
    const [showAssets, setShowAssets] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showLayers, setShowLayers] = useState(false);
    const [copied, setCopied] = useState(false);
    const { localStream, remoteStreams, isMuted, isVideoOff, isScreenSharing, startMedia, stopMedia, toggleMute, toggleVideo, startScreenShare, stopScreenShare } = useWebRTC(socket, roomId);

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isArchitect = user && roomHost && user.id === roomHost;
    const layers = ['Base Floor Plan', 'Electrical', 'Plumbing', 'Furniture', 'Annotations', 'Redline'];

    useEffect(() => {
        if (user && roomHost && user.id !== roomHost) {
            setActiveLayer('Redline');
        }
    }, [user, roomHost, setActiveLayer]);

    const toggleLayerVisibility = (layerName) => {
        setVisibleLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(layerName)) {
                newSet.delete(layerName);
            } else {
                newSet.add(layerName);
            }
            return newSet;
        });
    };

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
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-gray-400 leading-none">Meeting ID</span>
                        <span className="text-xs font-mono font-bold text-gray-700">{roomId}</span>
                    </div>
                    <button
                        onClick={handleCopyRoomId}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
                        title="Copy Room ID"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>

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
                    onClick={() => setShowLayers(!showLayers)}
                    className={`p-2 rounded-lg transition-colors border shadow-sm ${showLayers ? 'bg-[#1a1c1e] text-white border-[#1a1c1e]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    title="Layers"
                >
                    <Layers size={16} strokeWidth={2.5} />
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
                    <button onClick={() => setTool('cloud')} className={`p-2 rounded-lg transition-colors ${tool === 'cloud' ? 'bg-[#e03131]/10 text-[#e03131]' : 'text-gray-600 hover:bg-gray-100'}`} title="Revision Cloud">
                        <Cloud size={18} strokeWidth={2} />
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
                    <div className={`grid grid-cols-5 gap-2 ${activeLayer === 'Redline' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00'].map(c => {
                            const actualColor = activeLayer === 'Redline' ? '#e03131' : color;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-md border ${(actualColor === c || (activeLayer === 'Redline' && c === '#e03131')) ? 'ring-2 ring-[#e03131] ring-offset-1 border-transparent' : 'border-gray-200'}`}
                                    style={{ backgroundColor: c }}
                                />
                            );
                        })}
                    </div>
                    {activeLayer === 'Redline' && (
                        <p className="text-[10px] text-[#e03131] mt-2 font-medium italic">Redline mode: Color locked to Architectural Red</p>
                    )}
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                <div>
                    <span className="text-xs font-semibold text-gray-500 mb-3 block">Media Controls</span>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={localStream ? stopMedia : startMedia}
                            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider ${localStream ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {localStream ? 'End Connection' : 'Join Studio Live'}
                            {localStream ? <VideoOff size={14} /> : <Video size={14} />}
                        </button>

                        {localStream && (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                    onClick={toggleMute}
                                    className={`p-2 rounded-lg border flex items-center justify-center transition-all ${isMuted ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                                >
                                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`p-2 rounded-lg border flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                                >
                                    {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                                </button>
                                <button
                                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                                    className={`col-span-2 p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${isScreenSharing ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                                >
                                    {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
                                    <span className="text-[9px] font-black uppercase tracking-widest">{isScreenSharing ? 'Stop Sharing' : 'Present Screen'}</span>
                                </button>
                            </div>
                        )}
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

                {/* Layers Panel - Floating */}
                {showLayers && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-4 top-20 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[998]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-800">Layers</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                                {isArchitect ? 'Architect' : 'Client Mode'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {layers.map(layer => {
                                const isLocked = !isArchitect && layer !== 'Redline';
                                const isActive = activeLayer === layer;
                                const isVisible = visibleLayers.has(layer);

                                return (
                                    <div
                                        key={layer}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isActive ? 'bg-[#e03131]/5 border-[#e03131]/20' : 'border-transparent hover:bg-gray-50'}`}
                                    >
                                        <button
                                            onClick={() => toggleLayerVisibility(layer)}
                                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${isVisible ? 'text-[#e03131]' : 'text-gray-300'}`}
                                            title={isVisible ? 'Hide Layer' : 'Show Layer'}
                                        >
                                            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>

                                        <button
                                            disabled={isLocked}
                                            onClick={() => setActiveLayer(layer)}
                                            className={`flex-1 text-left text-xs font-medium flex items-center justify-between ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}
                                        >
                                            {layer}
                                            {isLocked && <Lock size={10} />}
                                            {isActive && !isLocked && <div className="w-1.5 h-1.5 rounded-full bg-[#e03131]" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {!isArchitect && (
                            <div className="mt-4 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                <p className="text-[10px] text-amber-700 leading-tight">
                                    <strong>Redline Mode Active:</strong> As a client, you can only draw feedback on the Redline layer.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Floating Video Grid - Fixed Bottom Center */}
                {localStream && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[997] flex gap-3 pointer-events-none"
                    >
                        <VideoContainer stream={localStream} username={user.username} isLocal={true} />
                        {Object.entries(remoteStreams).map(([socketId, stream]) => {
                            if (!stream) return null;
                            const participant = participants.find(p => p.socketId === socketId);
                            return (
                                <VideoContainer
                                    key={socketId}
                                    stream={stream}
                                    username={participant?.username || 'Collaborator'}
                                    isLocal={false}
                                />
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const VideoContainer = ({ stream, username, isLocal }) => {
    const videoRef = useRef();
    const [videoEnabled, setVideoEnabled] = useState(true);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;

            // Safer track monitoring
            const tracks = stream.getVideoTracks();
            if (tracks.length > 0) {
                setVideoEnabled(tracks[0].enabled);
                const handleTrackChange = () => setVideoEnabled(tracks[0].enabled);
                tracks[0].addEventListener('enabled', handleTrackChange);
                tracks[0].addEventListener('disabled', handleTrackChange);
                return () => {
                    tracks[0].removeEventListener('enabled', handleTrackChange);
                    tracks[0].removeEventListener('disabled', handleTrackChange);
                };
            }
        }
    }, [stream]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-40 h-28 bg-[#1a1c1e] rounded-xl overflow-hidden border-2 border-white/80 shadow-2xl pointer-events-auto backdrop-blur-md"
        >
            {stream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${videoEnabled ? 'opacity-100' : 'opacity-0'}`}
                />
            )}

            {(!stream || !videoEnabled) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#2c2e33] to-[#1a1c1e]">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1">
                        <Users size={16} className="text-white/40" />
                    </div>
                    <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">{username}</span>
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white font-black uppercase tracking-widest truncate max-w-[80%]">
                        {isLocal ? 'ME (PRO)' : username}
                    </span>
                    {!isLocal && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default WhiteboardRoom;
