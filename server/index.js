import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import fs from 'fs';
import db from './db.js';

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

// --- Routes ---
app.get('/api/ping', (req, res) => {
  res.json({ message: 'ok' });
});

// --- Start server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
