import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import fs from 'fs';
import db from './db.js';
import passport from './auth.js';
import { getAllStations, getAllLines, getLineStations, getSegments } from './dao/networkDao.js';
import { createGame, saveGameResult, saveGameSegment, getBestScores } from './dao/gameDao.js';
import { getAllEvents } from './dao/eventsDao.js';
import { buildAdjacencyList, findValidPair, validateRoute } from './utils/networkUtils.js';
import { check, validationResult } from 'express-validator';

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
app.post(
  '/api/sessions',
  [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  }
);

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

// --- Game routes ---
app.post('/api/games', isLoggedIn, async (req, res) => {
  try {
    const [stations, lineStations] = await Promise.all([
      getAllStations(),
      getLineStations(),
    ]);

    const graph = buildAdjacencyList(lineStations);
    const { startStation, destStation } = findValidPair(stations, graph);
    const gameId = await createGame(req.user.id);

    // Store game context in the session for later validation
    req.session.currentGame = { gameId, startStationId: startStation.id, destStationId: destStation.id };

    res.status(201).json({ gameId, startStation, destStation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// POST /api/games/:gameId/route — submit the planned route for validation and execution
app.post(
  '/api/games/:gameId/route',
  isLoggedIn,
  [
    check('gameId').isInt({ min: 1 }).withMessage('gameId must be a positive integer').toInt(),
    check('segments').isArray({ min: 1 }).withMessage('segments must be a non-empty array'),
    check('segments.*.from_id').isInt().withMessage('each segment must have an integer from_id').toInt(),
    check('segments.*.to_id').isInt().withMessage('each segment must have an integer to_id').toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const gameId = parseInt(req.params.gameId, 10);
    const { segments } = req.body;

    // Verify the gameId matches the session's current game and belongs to this user
    const currentGame = req.session.currentGame;
    if (!currentGame || currentGame.gameId !== gameId) {
      return res.status(403).json({ error: 'Game not found in session or does not belong to you' });
    }

    try {
      const lineStations = await getLineStations();
      const result = validateRoute(
        segments,
        currentGame.startStationId,
        currentGame.destStationId,
        lineStations
      );

      req.session.currentGame = null;

      if (!result.valid) {
        await saveGameResult(gameId, 0);
        return res.json({ valid: false, reason: result.reason, finalScore: 0 });
      }

      // Execute the valid route: apply a random event per segment
      const [events, stations] = await Promise.all([getAllEvents(), getAllStations()]);
      const stationName = new Map(stations.map(s => [s.id, s.name]));
      let coins = 20;
      const steps = [];

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const event = events[Math.floor(Math.random() * events.length)];
        coins = Math.max(0, coins + event.effect);
        await saveGameSegment(gameId, i, seg.from_id, seg.to_id, event.id, coins);
        steps.push({
          from: { id: seg.from_id, name: stationName.get(seg.from_id) },
          to:   { id: seg.to_id,   name: stationName.get(seg.to_id)   },
          event: { description: event.description, effect: event.effect },
          coinsAfter: coins,
        });
      }

      await saveGameResult(gameId, coins);
      res.json({ valid: true, steps, finalScore: coins });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Route validation failed' });
    }
  }
);

// --- Ranking route ---
app.get('/api/ranking', isLoggedIn, async (req, res) => {
  try {
    const scores = await getBestScores();
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load ranking' });
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
