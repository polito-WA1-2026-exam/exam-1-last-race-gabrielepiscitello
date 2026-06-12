import db from '../db.js';

// Helper: wrap db.run in a Promise
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

// Helper: wrap db.all in a Promise
const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

/**
 * Insert a new game row for a user. Score and completed_at are NULL until the game ends.
 * Returns the new game id.
 */
export const createGame = async (userId) => {
  const result = await run(
    'INSERT INTO games (user_id, score, completed_at) VALUES (?, NULL, NULL)',
    [userId]
  );
  return result.lastID;
};

/**
 * Update the game's score and completed_at timestamp when the game is finished.
 */
export const saveGameResult = async (gameId, score) => {
  await run(
    'UPDATE games SET score = ?, completed_at = datetime(\'now\') WHERE id = ?',
    [score, gameId]
  );
};

/**
 * Insert one step of the execution phase into game_segments.
 */
export const saveGameSegment = async (gameId, order, fromId, toId, eventId, coinsAfter) => {
  await run(
    `INSERT INTO game_segments (game_id, segment_order, from_station_id, to_station_id, event_id, coins_after)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [gameId, order, fromId, toId, eventId, coinsAfter]
  );
};

/**
 * Return the best (highest) score per user, ordered descending.
 * Only includes games that have a score (completed games).
 */
export const getBestScores = async () => {
  const rows = await all(
    `SELECT users.username, MAX(games.score) AS best_score
     FROM games
     JOIN users ON games.user_id = users.id
     WHERE games.score IS NOT NULL
     GROUP BY users.id
     ORDER BY best_score DESC`
  );
  return rows;
};
