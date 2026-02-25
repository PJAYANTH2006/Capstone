const Room = require('../models/Room');

const roomUsers = {}; // { roomId: { socketId: { username, id } } }

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-room', async ({ roomId, user }) => {
            socket.join(roomId);

            if (!roomUsers[roomId]) roomUsers[roomId] = {};
            roomUsers[roomId][socket.id] = { username: user.username, id: user.id };

            console.log(`User ${user.username} joined room: ${roomId}`);

            // Update room participants in DB and fetch existing data
            try {
                const room = await Room.findOneAndUpdate(
                    { roomId },
                    { $addToSet: { participants: user.id } },
                    { new: true }
                );

                // Sync existing canvas history and host info
                if (room) {
                    socket.emit('room-data', {
                        history: room.canvasData || [],
                        hostId: room.host
                    });
                }

                io.to(roomId).emit('room-users', Object.values(roomUsers[roomId]));
            } catch (err) {
                console.error('Error joining room:', err);
            }
        });

        socket.on('cursor-move', ({ roomId, data }) => {
            socket.to(roomId).emit('cursor-move-receive', { ...data, socketId: socket.id });
        });

        socket.on('draw-data', async ({ roomId, data }) => {
            socket.to(roomId).emit('draw-data-receive', data);

            // Persist to DB
            try {
                await Room.findOneAndUpdate(
                    { roomId },
                    { $push: { canvasData: data } }
                );
            } catch (err) {
                console.error('Error persisting draw data:', err);
            }
        });

        socket.on('undo', async ({ roomId }) => {
            socket.to(roomId).emit('undo-receive');
            try {
                await Room.findOneAndUpdate(
                    { roomId },
                    { $pop: { canvasData: 1 } }
                );
            } catch (err) {
                console.error('Error persisting undo:', err);
            }
        });

        socket.on('redo', async ({ roomId, data }) => {
            socket.to(roomId).emit('redo-receive', data);
            try {
                await Room.findOneAndUpdate(
                    { roomId },
                    { $push: { canvasData: data } }
                );
            } catch (err) {
                console.error('Error persisting redo:', err);
            }
        });

        socket.on('clear-canvas', async ({ roomId }) => {
            socket.to(roomId).emit('clear-canvas-receive');
            try {
                await Room.findOneAndUpdate(
                    { roomId },
                    { $set: { canvasData: [] } }
                );
            } catch (err) {
                console.error('Error persist clear-canvas:', err);
            }
        });

        socket.on('send-message', ({ roomId, message }) => {
            io.to(roomId).emit('receive-message', message);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Find which room the user was in and remove them
            for (const roomId in roomUsers) {
                if (roomUsers[roomId][socket.id]) {
                    const user = roomUsers[roomId][socket.id];
                    delete roomUsers[roomId][socket.id];
                    io.to(roomId).emit('room-users', Object.values(roomUsers[roomId]));
                    console.log(`User ${user.username} left room: ${roomId}`);
                    break;
                }
            }
        });
    });
};

module.exports = socketHandler;
