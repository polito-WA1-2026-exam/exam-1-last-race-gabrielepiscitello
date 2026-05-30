// imports
import express from "express";
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';

// init express
const app = new express();
const port = 3001;

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

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});