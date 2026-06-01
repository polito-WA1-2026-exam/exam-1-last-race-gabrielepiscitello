import db from '../db.js';

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

export const getAllStations = () =>
  all('SELECT id, name FROM stations ORDER BY id');

export const getAllLines = () =>
  all('SELECT id, name, color FROM lines ORDER BY id');

export const getLineStations = () =>
  all('SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position');

// Returns adjacent station pairs (one direction only: lower position → higher position)
// The route validator treats each pair as bidirectional
export const getSegments = () =>
  all(`
    SELECT
      ls1.line_id,
      ls1.station_id AS from_id,
      s1.name        AS from_name,
      ls2.station_id AS to_id,
      s2.name        AS to_name
    FROM line_stations ls1
    JOIN line_stations ls2 ON  ls1.line_id  = ls2.line_id
                           AND ls2.position = ls1.position + 1
    JOIN stations s1 ON s1.id = ls1.station_id
    JOIN stations s2 ON s2.id = ls2.station_id
    ORDER BY ls1.line_id, ls1.position
  `);
