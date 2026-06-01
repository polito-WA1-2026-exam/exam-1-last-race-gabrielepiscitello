import db from '../db.js';

// Promisify db.get
const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });

// Returns full user row (including hash + salt) — used at login
export const getUserByUsername = (username) =>
  get('SELECT id, username, password_hash, salt FROM users WHERE username = ?', [username]);

// Returns safe user row (no hash/salt) — used by deserializeUser
export const getUserById = (id) =>
  get('SELECT id, username FROM users WHERE id = ?', [id]);
