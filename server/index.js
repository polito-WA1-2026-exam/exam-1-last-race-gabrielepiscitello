import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import fs from 'fs';
import db from './db.js';
import passport from './auth.js';
import { getAllStations, getAllLines, getLineStations, getSegments } from './dao/networkDao.js';

// --- Init Express ---
const app = express();
const port = 3001;

// --- Run DB schema ---
const schema = fs.readFileSync('./schema.sql', 'utf-8');
db.exec(schema, (err) => {
  if (err) throw err;
});

// --- Middleware ---
app.use(morgan('dev'));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: 'lastrace-secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// --- Auth helper ---
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

// --- Auth routes ---
app.post('/api/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ id: user.id, username: user.username });
    });
  })(req, res, next);
});

app.delete('/api/sessions/current', isLoggedIn, (req, res) => {
  req.logout(() => res.status(200).json({ message: 'Logged out' }));
});

app.get('/api/sessions/current', isLoggedIn, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// --- Network routes ---
app.get('/api/network', async (req, res) => {
  try {
    const [stations, lines, lineStations, segments] = await Promise.all([
      getAllStations(),
      getAllLines(),
      getLineStations(),
      getSegments(),
    ]);
    res.json({ stations, lines, lineStations, segments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load network data' });
  }
});

// --- Server check ---
app.get('/api/ping', (req, res) => {
  res.json({ message: 'ok' });
});

// --- Start server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
