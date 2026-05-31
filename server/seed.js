import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./db/lastrace.db', (err) => {
  if (err) throw err;
});

// Promisify db.run for use with async/await
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const stations = [
  'La Défense',
  'Châtelet',
  'Charles de Gaulle–Étoile',
  'Nation',
  'Bastille',
  'Vincennes',
  'Gare de l\'Est',
  'Montparnasse–Bienvenüe',
  'Gare du Nord',
  'Trocadéro',
  'Denfert-Rochereau',
  'Gare de Lyon',
];

const lines = [
  { name: 'Line 1', color: '#FFCD00' },
  { name: 'Line 4', color: '#B8369D' },
  { name: 'Line 6', color: '#76B82A' },
  { name: 'Line 14', color: '#62259D' },
];

// Each entry: [line name, station name, position]
const lineStations = [
  // Line 1 – Yellow
  ['Line 1', 'La Défense',                  1],
  ['Line 1', 'Châtelet',                    2],
  ['Line 1', 'Charles de Gaulle–Étoile',    3],
  ['Line 1', 'Nation',                      4],
  ['Line 1', 'Bastille',                    5],
  ['Line 1', 'Vincennes',                   6],
  // Line 4 – Magenta
  ['Line 4', 'Châtelet',                    1],
  ['Line 4', 'Gare de l\'Est',              2],
  ['Line 4', 'Montparnasse–Bienvenüe',      3],
  ['Line 4', 'Gare du Nord',                4],
  // Line 6 – Green
  ['Line 6', 'Charles de Gaulle–Étoile',    1],
  ['Line 6', 'Gare de l\'Est',              2],
  ['Line 6', 'Trocadéro',                   3],
  ['Line 6', 'Denfert-Rochereau',           4],
  // Line 14 – Purple
  ['Line 14', 'Bastille',                   1],
  ['Line 14', 'Gare du Nord',               2],
  ['Line 14', 'Gare de Lyon',               3],
  ['Line 14', 'Denfert-Rochereau',          4],
];

(async () => {
  try {
    // --- Stations ---
    console.log('Seeding stations...');
    for (const name of stations) {
      await run('INSERT OR IGNORE INTO stations (name) VALUES (?)', [name]);
    }
    console.log(`  ${stations.length} stations inserted.`);

    // --- Lines ---
    console.log('Seeding lines...');
    for (const line of lines) {
      await run('INSERT OR IGNORE INTO lines (name, color) VALUES (?, ?)', [line.name, line.color]);
    }
    console.log(`  ${lines.length} lines inserted.`);

    // --- Line stations ---
    console.log('Seeding line_stations...');
    for (const [lineName, stationName, position] of lineStations) {
      await run(`
        INSERT OR IGNORE INTO line_stations (line_id, station_id, position)
        VALUES (
          (SELECT id FROM lines    WHERE name = ?),
          (SELECT id FROM stations WHERE name = ?),
          ?
        )
      `, [lineName, stationName, position]);
    }
    console.log(`  ${lineStations.length} line_station entries inserted.`);

    console.log('Network seed complete.');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    db.close();
  }
})();
