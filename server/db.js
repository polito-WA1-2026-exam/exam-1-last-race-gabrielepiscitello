import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./db/lastrace.db', (err) => {
  if (err) throw err;
});

export default db;
