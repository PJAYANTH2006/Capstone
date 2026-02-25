const express = require('express');
const { createRoom, getRoom, joinRoom, getHistory } = require('../controllers/roomController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', auth, createRoom);
router.post('/join', auth, joinRoom);
router.get('/history', auth, getHistory);
router.get('/:roomId', auth, getRoom);

module.exports = router;
