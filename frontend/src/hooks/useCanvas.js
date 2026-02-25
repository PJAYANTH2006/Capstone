import { useState, useRef, useEffect } from 'react';

export const useCanvas = (socket, roomId) => {
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState('pencil');
    const [history, setHistory] = useState([]); // Array of actions: { type: 'pencil'|'rect'|'circle'|'line', points: [], color, size }
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
        } else if (action.type === 'line') {
            const [start, end] = action.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        } else if (action.type === 'text') {
            const start = action.points[0];
            ctx.font = `${action.size * 3}px Outfit, Inter, sans-serif`;
            ctx.fillStyle = action.color;
            ctx.fillText(action.text, start.x, start.y);
        }
    };

    const startDrawing = (e) => {
        isDrawing.current = true;
        const { offsetX, offsetY } = e.nativeEvent;

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
        }
    };

    const draw = (e) => {
        if (!isDrawing.current || tool === 'text') return;
        const { offsetX, offsetY } = e.nativeEvent;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

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
            const tempAction = { ...currentAction.current, points: [start, { x: offsetX, y: offsetY }] };
            drawAction(ctx, tempAction);
        }
    };

    const endDrawing = (e) => {
        if (!isDrawing.current || tool === 'text') return;
        isDrawing.current = false;
        const { offsetX, offsetY } = e.nativeEvent;

        if (currentAction.current.type !== 'pencil') {
            currentAction.current.points.push({ x: offsetX, y: offsetY });
        }

        const action = currentAction.current;
        setHistory(prev => [...prev, action]);
        setRedoStack([]); // Clear redo on new action

        if (socket) {
            socket.emit('draw-data', { roomId, data: action });
        }
        currentAction.current = null;
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

    return { canvasRef, startDrawing, draw, endDrawing, color, setColor, brushSize, setBrushSize, tool, setTool, clearCanvas, undo, redo, downloadCanvas };
};
