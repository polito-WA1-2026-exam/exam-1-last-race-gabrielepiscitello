import sqlite3 from 'sqlite3';
import crypto from 'crypto';

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

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const hashPassword = (password, salt) => {
  return crypto.scryptSync(password, salt, 64).toString('hex');
};

// --- Network data ---

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
  { name: 'Line 1',  color: '#FFCD00' },
  { name: 'Line 4',  color: '#B8369D' },
  { name: 'Line 6',  color: '#76B82A' },
  { name: 'Line 14', color: '#62259D' },
];

// Each entry: [line name, station name, position]
const lineStations = [
  // Line 1 – Yellow
  ['Line 1', 'La Défense',               1],
  ['Line 1', 'Châtelet',                 2],
  ['Line 1', 'Charles de Gaulle–Étoile', 3],
  ['Line 1', 'Nation',                   4],
  ['Line 1', 'Bastille',                 5],
  ['Line 1', 'Vincennes',                6],
  // Line 4 – Magenta
  ['Line 4', 'Châtelet',                 1],
  ['Line 4', 'Gare de l\'Est',           2],
  ['Line 4', 'Montparnasse–Bienvenüe',   3],
  ['Line 4', 'Gare du Nord',             4],
  // Line 6 – Green
  ['Line 6', 'Charles de Gaulle–Étoile', 1],
  ['Line 6', 'Gare de l\'Est',           2],
  ['Line 6', 'Trocadéro',                3],
  ['Line 6', 'Denfert-Rochereau',        4],
  // Line 14 – Purple
  ['Line 14', 'Bastille',                1],
  ['Line 14', 'Gare du Nord',            2],
  ['Line 14', 'Gare de Lyon',            3],
  ['Line 14', 'Denfert-Rochereau',       4],
];

// --- Events data ---

const events = [
  { description: 'Wrong platform, had to backtrack',     effect: -2 },
  { description: 'Kind passenger helped with directions', effect:  1 },
  { description: 'Overcrowded carriage, missed the stop', effect: -3 },
  { description: 'Express service, arrived early',        effect:  2 },
  { description: 'Pickpocket attempt, minor loss',        effect: -1 },
  { description: 'Found a transit voucher on the seat',   effect:  3 },
  { description: 'Sudden door malfunction, missed a stop',effect: -4 },
  { description: 'Inspector waived the fare, lucky day',  effect:  4 },
  { description: 'Ticket inspector fine, wrong zone',     effect: -2 },
  { description: 'Friendly locals shared a shortcut tip', effect:  1 },
];

// --- Users data (hardcoded salts for reproducibility) ---

const users = [
  { username: 'alice', password: 'password123', salt: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' },
  { username: 'bob',   password: 'qwerty456',   salt: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7' },
  { username: 'carol', password: 'password789',  salt: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8' },
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

    // --- Events ---
    console.log('Seeding events...');
    for (const event of events) {
      await run(
        'INSERT OR IGNORE INTO events (description, effect) VALUES (?, ?)',
        [event.description, event.effect]
      );
    }
    console.log(`  ${events.length} events inserted.`);

    // --- Users ---
    console.log('Seeding users...');
    for (const user of users) {
      const hash = hashPassword(user.password, user.salt);
      await run(
        'INSERT OR IGNORE INTO users (username, password_hash, salt) VALUES (?, ?, ?)',
        [user.username, hash, user.salt]
      );
    }
    console.log(`  ${users.length} users inserted.`);

    // --- Past games ---
    // Fetch station IDs by name for game_segments
    const stationId = async (name) => (await get('SELECT id FROM stations WHERE name = ?', [name])).id;
    const eventId   = async (desc) => (await get('SELECT id FROM events WHERE description = ?', [desc])).id;
    const userId    = async (name) => (await get('SELECT id FROM users WHERE username = ?', [name])).id;

    console.log('Seeding past games...');

    const aliceId = await userId('alice');
    const aliceGame = await run(
      'INSERT INTO games (user_id, score, completed_at) VALUES (?, ?, ?)',
      [aliceId, 21, '2026-05-28T10:30:00']
    );
    const aliceGameId = aliceGame.lastID;
    const aliceSegments = [
      { from: 'La Défense',               to: 'Châtelet',                 eventDesc: 'Wrong platform, had to backtrack',      coinsAfter: 18 },
      { from: 'Châtelet',                 to: 'Charles de Gaulle–Étoile', eventDesc: 'Kind passenger helped with directions',  coinsAfter: 19 },
      { from: 'Charles de Gaulle–Étoile', to: 'Nation',                   eventDesc: 'Express service, arrived early',         coinsAfter: 21 },
    ];
    for (let i = 0; i < aliceSegments.length; i++) {
      const seg = aliceSegments[i];
      await run(
        `INSERT INTO game_segments (game_id, segment_order, from_station_id, to_station_id, event_id, coins_after)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          aliceGameId, i + 1,
          await stationId(seg.from), await stationId(seg.to),
          await eventId(seg.eventDesc), seg.coinsAfter,
        ]
      );
    }
    console.log('  Alice game 1 inserted (score: 21).');

    const bobId = await userId('bob');
    const bobGame = await run(
      'INSERT INTO games (user_id, score, completed_at) VALUES (?, ?, ?)',
      [bobId, 19, '2026-05-29T14:15:00']
    );
    const bobGameId = bobGame.lastID;
    const bobSegments = [
      { from: 'Châtelet',               to: 'Gare de l\'Est',          eventDesc: 'Pickpocket attempt, minor loss',        coinsAfter: 19 },
      { from: 'Gare de l\'Est',         to: 'Montparnasse–Bienvenüe',  eventDesc: 'Found a transit voucher on the seat',   coinsAfter: 22 },
      { from: 'Montparnasse–Bienvenüe', to: 'Gare du Nord',            eventDesc: 'Overcrowded carriage, missed the stop', coinsAfter: 19 },
    ];
    for (let i = 0; i < bobSegments.length; i++) {
      const seg = bobSegments[i];
      await run(
        `INSERT INTO game_segments (game_id, segment_order, from_station_id, to_station_id, event_id, coins_after)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          bobGameId, i + 1,
          await stationId(seg.from), await stationId(seg.to),
          await eventId(seg.eventDesc), seg.coinsAfter,
        ]
      );
    }
    console.log('  Bob game 1 inserted (score: 19).');

    console.log('\nAll seed data inserted successfully.');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    db.close();
  }
})();
