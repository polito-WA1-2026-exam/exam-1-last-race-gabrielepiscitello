import db from '../db.js';

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

let cachedEvents = null;

export const getAllEvents = async () => {
  if (cachedEvents) return cachedEvents;
  cachedEvents = await all('SELECT * FROM events');
  return cachedEvents;
};
