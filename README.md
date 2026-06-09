# Exam #1: "Last Race"
## Student: s352024 Piscitello Gabriele

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- `GET /api/ping`
  - No parameters
  - Returns `{ message: 'ok' }` — server check

- `POST /api/sessions`
  - Body: `{ username, password }`
  - Returns `{ id, username }` on success, `{ error }` with status 401 on failure

- `GET /api/sessions/current`
  - Requires authentication (session cookie)
  - Returns `{ id, username }` of the logged-in user, or 401

- `DELETE /api/sessions/current`
  - Requires authentication (session cookie)
  - Returns `{ message: 'Logged out' }`, or 401

- `GET /api/network`
  - No parameters, public
  - Returns `{ stations, lines, lineStations, segments }`

## Database Tables

- Table `stations` — all underground stations (id, name)
- Table `lines` — metro lines with display color (id, name, color)
- Table `line_stations` — ordered mapping of stations per line (line_id, station_id, position)
- Table `events` — random events applied during execution phase (id, description, effect from -4 to +4)
- Table `users` — registered users with hashed and salted passwords (id, username, password_hash, salt)
- Table `games` — one record per game played (id, user_id, score, completed_at)
- Table `game_segments` — one record per step in the execution phase (id, game_id, segment_order, from_station_id, to_station_id, event_id, coins_after)

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- alice / password123
- bob / qwerty456
- carol / password789

## Use of AI Tools
AI assistance (Github Copilot and Gemini) was used in the following specific areas during development:

- **Comments:** AI was used to write comments for every utility function (e.g., in `networkUtils.js` and `gameDao.js`) to improve code readability and document parameters and return types. All comments were reviewed and verified to accurately reflect the actual function behaviour.

- **Algorithm design:** AI was used to design and implement the BFS-based functions in `server/utils/networkUtils.js`, specifically `buildAdjacencyList`, `bfsDistance`, and `findValidPair`. The logic was carefully reviewed to ensure correctness.

All AI-generated output was manually reviewed, tested, and adapted where necessary. The overall architecture and design decisions were carried out independently.
