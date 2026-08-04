# Canto

A WaniKani-style spaced repetition system (SRS) for learning Cantonese characters
and vocabulary — Jyutping readings, English meanings, and mnemonics, organized
into levels you unlock as you go.

Single Node/Express server + SQLite file. No external services, no build
pipeline beyond a one-time `npm run build`. Built for one user (you), behind a
simple shared password.

## How it works

- **Characters** (186), **vocabulary** (177 words), and **expressions** (29
  short natural phrases/sentences) are organized into 20 levels.
- Level `N+1` unlocks once 90% of level `N`'s characters reach the "Guru" SRS
  stage. Vocabulary and expressions unlock along with their level, using
  characters from that level or earlier.
- **Lessons** introduce new items in batches of 5: a flashcard intro (meaning +
  reading + mnemonics), then a quick quiz, then the item enters your review
  queue at SRS stage 1.
- **Reviews** ask you the meaning and reading for every item that's due, on
  the WaniKani interval schedule (4h → 8h → 23h → 2d → 1wk → 2wk → 1mo → 4mo →
  burned). Answer both correctly to advance a stage; get either wrong and you
  drop back (1 stage below Guru, 2 stages at or above Guru). After a wrong
  answer, the correct answer is shown — press Enter or click Continue to move
  on.
- **Browse** lets you look through every item by level with its current SRS
  stage and mnemonics.

The dataset covers numbers, family terms, time words, common verbs,
places/directions, question words, food, weather, body parts, transport,
emotions, money, school/work, house objects, health, politeness, and grammar
connectors — plus expressions that combine them into real short phrases and
questions (e.g. 你去邊 "where are you going?", 唔該 "please/thank you"). All
real, commonly used Cantonese with accurate Jyutping. See "Adding more
content" below to keep extending it — the dataset is designed to grow safely
without disturbing your progress.

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
4. `npm run seed` (safe to run again any time — it only inserts content
   beyond what's already there, so it never touches or duplicates existing
   progress).
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

Content lives in three plain JS arrays:

- `server/seed/characters.js`
- `server/seed/vocabulary.js`
- `server/seed/expressions.js`

Each entry is `{ hanzi, level, jyutping: [...], meanings: [...],
meaningMnemonic, readingMnemonic }`. You don't need to track character ids —
a word's or expression's component characters are derived automatically at
seed time by splitting its `hanzi` string (Chinese text has no spaces, so
"你好".split → 你, 好) and looking each one up, so just write real words made
of characters that exist somewhere in `characters.js`.

To add more:

1. **Append** new entries (or a whole new level) to the end of the relevant
   file(s) — never reorder or remove an existing entry. Database ids are
   assigned in array order, so appending keeps every existing id (and
   therefore every existing SRS progress row) stable.
2. Run `npm run seed` again. It inserts only the rows beyond what's already
   in each table, so your existing progress is completely untouched — this
   is the intended, safe way to grow the app over time.

If you ever do need to reorder or edit existing entries, that requires a
fresh `data/canto.sqlite` (delete the file and reseed), which resets all
progress — so it's worth avoiding unless you're just getting started.

## Project structure

```
server/           Express API, SQLite schema, SRS logic, seed data
  db.js           Database connection + schema (+ in-place migrations)
  srs.js          SRS stage/interval logic (pure functions)
  levels.js       Level-unlock calculation
  subjects.js     Character/vocabulary/expression read helpers
  routes/         auth, dashboard, lessons, reviews, subjects endpoints
  seed/           Content (characters/vocabulary/expressions) + seed script
client/           React + TypeScript frontend (Vite)
  src/pages/      Login, Dashboard, Lessons, Reviews, Browse
  src/components/ QuizRunner (shared lesson/review quiz engine)
  src/matching.ts Answer-matching (fuzzy meaning match, exact reading match)
  src/format.ts   Display helpers (e.g. scaling hanzi font size for long expressions)
data/             SQLite database file (git-ignored)
```
