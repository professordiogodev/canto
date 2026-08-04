# Canto

A WaniKani-style spaced repetition system (SRS) for learning Cantonese characters
and vocabulary — Jyutping readings, English meanings, and mnemonics, organized
into levels you unlock as you go.

Single Node/Express server + SQLite file. No external services, no build
pipeline beyond a one-time `npm run build`. Built for one user (you), behind a
simple shared password.

## How it works

- **Characters** (81 in the starter set) and **vocabulary** (80 words) are
  organized into 8 levels.
- Level `N+1` unlocks once 90% of level `N`'s characters reach the "Guru" SRS
  stage.
- **Lessons** introduce new items in batches of 5: a flashcard intro (meaning +
  reading + mnemonics), then a quick quiz, then the item enters your review
  queue at SRS stage 1.
- **Reviews** ask you the meaning and reading for every item that's due, on
  the WaniKani interval schedule (4h → 8h → 23h → 2d → 1wk → 2wk → 1mo → 4mo →
  burned). Answer both correctly to advance a stage; get either wrong and you
  drop back (1 stage below Guru, 2 stages at or above Guru).
- **Browse** lets you look through every item by level with its current SRS
  stage and mnemonics.

The starter dataset covers numbers, family terms, time words, common verbs,
places/directions, question words, food, and connectors — real, commonly used
Cantonese, accurate Jyutping. It's meant to be a solid starting point; see
"Adding more content" below to extend it.

## Requirements

- Node.js **v22.5 or newer** (the backend uses Node's built-in `node:sqlite`
  module — no native compilation, no extra database server to install).

## Local setup

```bash
npm install
cp .env.example .env
# edit .env: set APP_PASSWORD to whatever you want your password to be,
# and SESSION_SECRET to a long random string (e.g. `openssl rand -hex 32`)

npm run seed     # populates data/canto.sqlite with the starter content
npm run build    # builds the React frontend into client/dist

npm start        # serves everything on http://localhost:4000
```

Then open `http://localhost:4000` and log in with your `APP_PASSWORD`.

### Development mode

```bash
npm run dev
```

Runs the API on port 4000 and a Vite dev server (with hot reload) on port
5173, proxying `/api` requests to the backend. Visit `http://localhost:5173`.

## Deploying to your own server

This is one Node process + one SQLite file, so hosting it yourself is simple:

1. Copy the project to your server (`git clone` or `rsync`).
2. `npm install && npm run build`
3. Create `.env` with `APP_PASSWORD`, `SESSION_SECRET`, and whatever `PORT`
   you want.
4. `npm run seed` (only once — it refuses to reseed if data already exists).
5. Run `npm start`, ideally under a process manager so it survives reboots,
   e.g.:

   ```bash
   pm2 start server/index.js --name canto -- --experimental-sqlite
   # or a systemd service / Docker container running `npm start`
   ```

6. Put it behind whatever reverse proxy/TLS you already use (nginx, Caddy,
   Cloudflare Tunnel, Tailscale, etc.) if you want HTTPS or to expose it
   outside your home network. The app itself just needs one port.

Your entire learning history lives in `data/canto.sqlite` — back that file up
(it's git-ignored on purpose, since it's your personal progress, not code).

## Adding more content

Characters and vocabulary live in plain JS arrays:

- `server/seed/characters.js`
- `server/seed/vocabulary.js`

Each entry is `{ hanzi, level, jyutping: [...], meanings: [...],
meaningMnemonic, readingMnemonic }`. Vocabulary entries also have
`characterIds`, referencing the 1-based position of characters in
`characters.js` (used for potential cross-linking; the array order determines
database IDs since the seed script inserts in array order).

To add more:

1. Append new entries (or a new level) to those files.
2. If you're adding to a level that's already seeded, either delete
   `data/canto.sqlite` and reseed everything (you'll lose progress), or
   insert the new rows directly with a small one-off script using
   `server/db.js` — the seed script's "refuse to reseed" guard is there
   specifically to protect existing progress from being clobbered.

## Project structure

```
server/           Express API, SQLite schema, SRS logic, seed data
  db.js           Database connection + schema
  srs.js          SRS stage/interval logic (pure functions)
  levels.js       Level-unlock calculation
  subjects.js     Character/vocabulary read helpers
  routes/         auth, dashboard, lessons, reviews, subjects endpoints
  seed/           Starter content + seed script
client/           React + TypeScript frontend (Vite)
  src/pages/      Login, Dashboard, Lessons, Reviews, Browse
  src/components/ QuizRunner (shared lesson/review quiz engine)
  src/matching.ts Answer-matching (fuzzy meaning match, exact reading match)
data/             SQLite database file (git-ignored)
```
