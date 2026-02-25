const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    canvasData: { type: Array, default: [] },
    isPrivate: { type: Boolean, default: false },
    password: { type: String }, // Hashed password for private rooms
    createdAt: { type: Date, default: Date.now }
});

roomSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Room', roomSchema);
