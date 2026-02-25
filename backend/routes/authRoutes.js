const express = require('express');
const { register, login } = require('../controllers/authController');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const user = { id: req.user._id, username: req.user.username, email: req.user.email };
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/google-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
);

module.exports = router;
