const mongoose = require('mongoose');
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const createRoom = async (req, res) => {
    try {
        const { name, isPrivate, password } = req.body;
        const roomId = uuidv4().substring(0, 8);
        const room = new Room({
            roomId,
            name,
            host: req.userId,
            participants: [req.userId],
            isPrivate: !!isPrivate,
            password: isPrivate ? password : null
        });
        await room.save();
        res.status(201).json({ roomId: room.roomId, name: room.name, isPrivate: room.isPrivate });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId }).select('-password');
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { roomId, password } = req.body;
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        if (room.isPrivate) {
            if (!password) return res.status(400).json({ error: 'Password required' });
            const isMatch = await bcrypt.compare(password, room.password);
            if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ message: 'Access granted', roomId: room.roomId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId.trim());
        const rooms = await Room.find({
            $or: [
                { host: userId },
                { participants: userId }
            ]
        })
            .select('roomId name host isPrivate createdAt')
            .sort({ createdAt: -1 });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createRoom, getRoom, joinRoom, getHistory };
