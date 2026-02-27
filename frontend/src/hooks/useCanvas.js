import { useState, useRef, useEffect } from 'react';

export const useCanvas = (socket, roomId) => {
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState('pencil');
    const [scale, setScale] = useState(100); // e.g., 100 means 1:100 scale. 1px = 100 actual units (e.g. mm)
    const [gridType, setGridType] = useState('none');
    const [history, setHistory] = useState([]); // Array of actions: { type: 'pencil'|'rect'|'circle'|'line'|'dimension', points: [], color, size, text?: string }
    const [redoStack, setRedoStack] = useState([]);
    const isDrawing = useRef(false);
    const currentAction = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Redraw history
        redrawAll();

        if (socket) {
            socket.on('draw-data-receive', (action) => {
                setHistory((prev) => [...prev, action]);
            });

            socket.on('clear-canvas-receive', () => {
                setHistory([]);
                setRedoStack([]);
            });

            socket.on('undo-receive', () => {
                setHistory((prev) => {
                    const newHistory = [...prev];
                    const undone = newHistory.pop();
                    if (undone) setRedoStack((prevRedo) => [undone, ...prevRedo]);
                    return newHistory;
                });
            });

            socket.on('redo-receive', () => {
                setRedoStack((prevRedo) => {
                    if (prevRedo.length === 0) return prevRedo;
                    const [action, ...rest] = prevRedo;
                    setHistory((prevHist) => [...prevHist, action]);
                    return rest;
                });
            });

            socket.on('room-data', (data) => {
                setHistory(data.history || []);
            });
        }

        return () => {
            if (socket) {
                socket.off('draw-data-receive');
                socket.off('clear-canvas-receive');
                socket.off('undo-receive');
                socket.off('redo-receive');
                socket.off('room-data');
            }
        };
    }, [socket]);

    // Redraw all actions whenever history changes
    useEffect(() => {
        redrawAll();
    }, [history]);

    const redrawAll = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        history.forEach(action => {
            drawAction(ctx, action);
        });
    };

    const drawAction = (ctx, action) => {
        ctx.strokeStyle = action.tool === 'eraser' ? '#ffffff' : action.color;
        ctx.lineWidth = action.size;

        if (action.type === 'pencil' || action.type === 'eraser') {
            ctx.beginPath();
            action.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        } else if (action.type === 'rect') {
            const [start, end] = action.points;
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (action.type === 'circle') {
            const [start, end] = action.points;
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (action.type === 'line' || action.type === 'dimension') {
            const [start, end] = action.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Draw dimension text if it's the dimension tool
            if (action.type === 'dimension' && action.text) {
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const angle = Math.atan2(end.y - start.y, end.x - start.x);

                ctx.save();
                ctx.translate(midX, midY);
                // Keep text upright
                if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                    ctx.rotate(angle + Math.PI);
                } else {
                    ctx.rotate(angle);
                }

                ctx.font = `600 12px Outfit, Inter, sans-serif`;
                ctx.fillStyle = action.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';

                // Background for text
                const textMetrics = ctx.measureText(action.text);
                ctx.fillStyle = '#ffffff'; // Match canvas background or make configurable
                ctx.fillRect(-textMetrics.width / 2 - 4, -16, textMetrics.width + 8, 16);

                // Draw Text
                ctx.fillStyle = action.color;
                ctx.fillText(action.text, 0, -4);

                ctx.restore();

                // Draw tick marks
                const tickSize = 6;
                ctx.beginPath();
                ctx.moveTo(start.x - tickSize * Math.sin(angle), start.y + tickSize * Math.cos(angle));
                ctx.lineTo(start.x + tickSize * Math.sin(angle), start.y - tickSize * Math.cos(angle));
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(end.x - tickSize * Math.sin(angle), end.y + tickSize * Math.cos(angle));
                ctx.lineTo(end.x + tickSize * Math.sin(angle), end.y - tickSize * Math.cos(angle));
                ctx.stroke();
            }
        } else if (action.type === 'text') {
            const start = action.points[0];
            ctx.font = `${action.size * 3}px Outfit, Inter, sans-serif`;
            ctx.fillStyle = action.color;
            ctx.fillText(action.text, start.x, start.y);
        } else if (action.type === 'asset' && action.assetData) {
            const start = action.points[0];
            const p = new Path2D(action.assetData.path);

            // Assets need to be scaled and positioned
            ctx.save();
            ctx.translate(start.x - (action.size * 5), start.y - (action.size * 5)); // Center it roughly based on size
            const svgScale = (action.size * 10) / 100; // Assuming 100x100 viewBox
            ctx.scale(svgScale, svgScale);

            ctx.strokeStyle = action.color;
            ctx.lineWidth = 3 / svgScale; // Keep stroke width consistent regardless of scale
            ctx.stroke(p);
            ctx.restore();
        }
    };

    // Helper to find nearest snap point from history
    const findNearestSnapPoint = (x, y, threshold = 15) => {
        let nearest = null;
        let minDist = threshold;

        // Iterate through history to find line/rect/dimension endpoints
        history.forEach(action => {
            if (!action.points) return;

            // For lines/dimensions, check start and end points
            if (action.type === 'line' || action.type === 'dimension' || action.type === 'rect') {
                action.points.forEach(pt => {
                    const dist = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = { x: pt.x, y: pt.y };
                    }
                });

                // For rects, also check the other two corners
                if (action.type === 'rect' && action.points.length === 2) {
                    const [p1, p2] = action.points;
                    const corners = [
                        { x: p1.x, y: p2.y },
                        { x: p2.x, y: p1.y }
                    ];
                    corners.forEach(pt => {
                        const dist = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = { x: pt.x, y: pt.y };
                        }
                    });
                }
            }
        });

        return nearest;
    };

    const startDrawing = (e) => {
        isDrawing.current = true;
        let { offsetX, offsetY } = e.nativeEvent;

        // Smart snapping on start (for precise connections)
        if (tool === 'line' || tool === 'dimension' || tool === 'rect' || tool === 'circle') {
            const snap = findNearestSnapPoint(offsetX, offsetY);
            if (snap) {
                offsetX = snap.x;
                offsetY = snap.y;
            }
        }

        currentAction.current = {
            type: (tool === 'pencil' || tool === 'eraser') ? 'pencil' : tool,
            tool, // keep for color logic
            points: [{ x: offsetX, y: offsetY }],
            color,
            size: brushSize
        };

        if (tool === 'text') {
            const text = prompt('Enter text:');
            if (text) {
                const action = { ...currentAction.current, text };
                setHistory(prev => [...prev, action]);
                if (socket) socket.emit('draw-data', { roomId, data: action });
            }
            isDrawing.current = false;
            currentAction.current = null;
        } else if (tool === 'asset') {
            // If tool is asset, we just place it immediately on mousedown and end drawing
            const selectedAsset = window.__currentSelectedAsset; // Hacky but effective way to pass complex data without adding tons of state to hook signature
            if (selectedAsset) {
                const action = { ...currentAction.current, assetData: selectedAsset };
                setHistory(prev => [...prev, action]);
                if (socket) socket.emit('draw-data', { roomId, data: action });
                // We draw it immediately
                redrawAll();
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                drawAction(ctx, action);
            }
            isDrawing.current = false;
            currentAction.current = null;
            // setTool('pencil') happens in endDrawing, but we bypassed it, so we do it in the component
        }
    };

    const draw = (e) => {
        if (!isDrawing.current || tool === 'text') return;
        let { offsetX, offsetY } = e.nativeEvent;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Smart snapping while drawing
        if (tool === 'line' || tool === 'dimension' || tool === 'rect' || tool === 'circle') {
            const snap = findNearestSnapPoint(offsetX, offsetY);
            if (snap) {
                // Only snap if not forcing an angle constraint, or if we want to prioritize snap
                // For simplicity, we prioritize snap over angle if near a point
                offsetX = snap.x;
                offsetY = snap.y;
            } else if (e.shiftKey && currentAction.current.points.length > 0 && currentAction.current.type !== 'pencil') {
                // Angle Snapping (Hold Shift) - Fallback if not snapping to endpoint
                const start = currentAction.current.points[0];
                const dx = offsetX - start.x;
                const dy = offsetY - start.y;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Snap to 45 degree increments (PI/4)
                const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

                offsetX = start.x + distance * Math.cos(snapAngle);
                offsetY = start.y + distance * Math.sin(snapAngle);
            }
        }

        if (currentAction.current.type === 'pencil') {
            currentAction.current.points.push({ x: offsetX, y: offsetY });
            // For pencil, we can draw the latest segment for immediate feedback
            const points = currentAction.current.points;
            const prev = points[points.length - 2];
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = brushSize;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
        } else {
            // For shapes, we need to clear and redraw history + current shape preview
            redrawAll();
            const start = currentAction.current.points[0];

            // Calculate dimension text if applicable
            let text = undefined;
            if (currentAction.current.type === 'dimension') {
                const pxDistance = Math.sqrt(Math.pow(offsetX - start.x, 2) + Math.pow(offsetY - start.y, 2));
                // Simplified text calculation: px * scale
                const actualDistance = (pxDistance * scale / 1000).toFixed(2); // Assuming scale unit conversions, making it look clean
                text = `${actualDistance}m`;
            }

            const tempAction = { ...currentAction.current, points: [start, { x: offsetX, y: offsetY }], text };

            // Update the live action text so it gets saved on endDrawing
            if (text) {
                currentAction.current.text = text;
            }

            drawAction(ctx, tempAction);
        }
    };

    const endDrawing = (e) => {
        if (!isDrawing.current || tool === 'text') return;
        isDrawing.current = false;
        const { offsetX, offsetY } = e.nativeEvent;

        // For assets, we don't need a second point, they are placed on start
        if (currentAction.current.type !== 'pencil' && currentAction.current.type !== 'asset') {
            currentAction.current.points.push({ x: offsetX, y: offsetY });
        }

        const action = currentAction.current;
        setHistory(prev => [...prev, action]);
        setRedoStack([]); // Clear redo on new action

        if (socket) {
            socket.emit('draw-data', { roomId, data: action });
        }
        currentAction.current = null;

        // Auto-revert to pencil after placing an asset so they don't spam them accidentally
        if (action.type === 'asset') {
            setTool('pencil');
        }
    };

    const undo = () => {
        setHistory((prev) => {
            const newHistory = [...prev];
            const undone = newHistory.pop();
            if (undone) {
                setRedoStack((prevRedo) => [undone, ...prevRedo]);
                if (socket) socket.emit('undo', { roomId });
            }
            return newHistory;
        });
    };

    const redo = () => {
        setRedoStack((prevRedo) => {
            if (prevRedo.length === 0) return prevRedo;
            const [action, ...rest] = prevRedo;
            setHistory((prevHist) => [...prevHist, action]);
            if (socket) socket.emit('redo', { roomId, data: action });
            return rest;
        });
    };

    const clearCanvas = () => {
        setHistory([]);
        setRedoStack([]);
        if (socket) socket.emit('clear-canvas', { roomId });
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a temporary canvas to draw a white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw original canvas over it
        tempCtx.drawImage(canvas, 0, 0);

        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
    };

    return { canvasRef, startDrawing, draw, endDrawing, color, setColor, brushSize, setBrushSize, tool, setTool, scale, setScale, gridType, setGridType, clearCanvas, undo, redo, downloadCanvas };
};
