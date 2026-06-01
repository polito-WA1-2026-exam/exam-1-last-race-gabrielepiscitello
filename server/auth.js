import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import { getUserByUsername, getUserById } from './dao/usersDao.js';

// --- Local strategy ---
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await getUserByUsername(username);
    if (!user) return done(null, false, { message: 'Invalid credentials' });

    const hashedInput = crypto.scryptSync(password, user.salt, 64);
    const storedHash  = Buffer.from(user.password_hash, 'hex');

    if (!crypto.timingSafeEqual(hashedInput, storedHash))
      return done(null, false, { message: 'Invalid credentials' });

    // Return only safe fields — no hash/salt exposed beyond this point
    return done(null, { id: user.id, username: user.username });
  } catch (err) {
    return done(err);
  }
}));

// --- Session serialization ---
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
