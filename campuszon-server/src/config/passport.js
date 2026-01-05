import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';

// Configure passport strategy
export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // User exists, return the user
            return done(null, user);
          }

          // Create new user from Google profile
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            password: 'google-oauth-' + profile.id, // Placeholder password for OAuth users
            phoneNumber: '', // Will be added later if needed
            hostelName: '', // Will be added later if needed
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default passport;
