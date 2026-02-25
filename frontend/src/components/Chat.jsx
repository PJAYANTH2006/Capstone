import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

const Chat = ({ roomId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const socket = useSocket();
    const { user } = useAuth();
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (socket) {
            socket.on('receive-message', (msg) => {
                setMessages((prev) => [...prev, msg]);
            });
        }
        return () => {
            if (socket) socket.off('receive-message');
        };
    }, [socket]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const msgData = {
            user: user.username,
            text: message,
            timestamp: new Date().toLocaleTimeString()
        };

        socket.emit('send-message', { roomId, message: msgData });
        setMessage('');
    };

    return (
        <div className="flex-1 flex flex-col bg-white">
            <div className="p-5 border-b border-slate-100">
                <h2 className="font-black text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Discussion
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.user === user.username ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-1">{msg.user} • {msg.timestamp}</span>
                        <div className={`p-3.5 rounded-2xl max-w-[90%] text-sm font-medium shadow-sm transition-all hover:shadow-md ${msg.user === user.username ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200/50'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all shadow-inner text-slate-700 font-medium"
                    placeholder="Type a message..."
                />
                <button type="submit" className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
