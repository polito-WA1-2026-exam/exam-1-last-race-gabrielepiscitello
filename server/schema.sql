CREATE TABLE IF NOT EXISTS stations (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS lines (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS line_stations (
  line_id    INTEGER NOT NULL REFERENCES lines(id),
  station_id INTEGER NOT NULL REFERENCES stations(id),
  position   INTEGER NOT NULL,
  PRIMARY KEY (line_id, station_id)
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT    NOT NULL,
  effect      INTEGER NOT NULL CHECK(effect BETWEEN -4 AND 4)
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  score        INTEGER,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS game_segments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         INTEGER NOT NULL REFERENCES games(id),
  segment_order   INTEGER NOT NULL,
  from_station_id INTEGER NOT NULL REFERENCES stations(id),
  to_station_id   INTEGER NOT NULL REFERENCES stations(id),
  event_id        INTEGER REFERENCES events(id),
  coins_after     INTEGER NOT NULL
);
