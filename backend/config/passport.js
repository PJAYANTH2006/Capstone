const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (user) {
                    return done(null, user);
                }

                // Check if user exists with the same email
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    user.googleId = profile.id;
                    // Password remains as is (if set) or stays optional
                    await user.save();
                    return done(null, user);
                }

                // Create new user if not found
                user = new User({
                    googleId: profile.id,
                    username: profile.displayName || profile.emails[0].value.split('@')[0],
                    email: profile.emails[0].value,
                    // password is not set
                });
                await user.save();
                done(null, user);
            } catch (err) {
                console.error('Passport Google Strategy Error:', err);
                done(err, null);
            }
        }));
} else {
    console.warn('WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in .env. Google OAuth will not be initialized.');
}

module.exports = passport;
