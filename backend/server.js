const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const passport = require('passport');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Global Request: ${req.method} ${req.url}`);
    }
    next();
});

app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

// Deployment Diagnostic Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        config: {
            FRONTEND_URL: process.env.FRONTEND_URL ? 'PRESENT' : 'MISSING',
            CALLBACK_URL: process.env.CALLBACK_URL ? 'PRESENT' : 'MISSING',
            GOOGLE_CONFIG: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'PRESENT' : 'MISSING',
            MONGO_URI: process.env.MONGO_URI ? 'PRESENT' : 'MISSING'
        }
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Socket.io Connection
const socketHandler = require('./utils/socketHandler');
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
