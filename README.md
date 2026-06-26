# Image Detective

A real-time multiplayer web game where players race to find an image on the internet that best matches a target chosen by the host. Submissions are scored automatically by a local [CLIP](https://github.com/openai/CLIP) vision model — no manual judging required.

Host a room, share a code or QR, and compete across phones, tablets, and desktops with synchronized timers, live leaderboards, and instant Socket.IO updates.

## Features

- **AI-powered scoring** — CLIP embeddings and cosine similarity score every submission locally (no external AI API)
- **Real-time multiplayer** — Socket.IO keeps rooms, timers, and leaderboards in sync across all devices
- **Flexible image submission** — Paste from clipboard, drag and drop, or upload from gallery (client-side compression before upload)
- **Host controls** — Create rooms, set target images, start/pause/skip rounds, and view live rankings
- **Session recovery** — Players reconnect and resume without rejoining
- **Optional persistence** — Firebase Firestore when configured; in-memory store for local development

## How It Works

1. **Host** creates a room and shares the join code or QR code.
2. **Players** join with a display name and wait in the lobby.
3. **Host** starts a round with a target image.
4. **Players** search the web and submit the closest matching image they can find.
5. **Server** queues submissions, runs CLIP inference, and updates the leaderboard in real time.
6. When the timer expires, **results** are shown and the host advances to the next round or ends the game.

**Scoring:** `Round Score = Cosine Similarity × 100` (similarity range 0.0–1.0).

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO |
| AI | Transformers.js (`@xenova/transformers`), ONNX Runtime, OpenAI CLIP |
| Image processing | Sharp |
| Persistence | Firebase Firestore (optional) |
| Security | Helmet, CORS, express-rate-limit |

## Project Structure

```text
image-detective/
├── frontend/          # React client (host dashboard + player UI)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── server/            # Express + Socket.IO game server
│   ├── ai/            # CLIP inference and scoring
│   ├── api/           # REST routes
│   ├── queue/         # Submission queue
│   ├── rooms/         # Room, player, and timer management
│   ├── sockets/       # Real-time event handlers
│   ├── workers/       # AI worker pool
│   └── package.json
├── project.md         # Software requirements
├── techstack.md       # Technology decisions
└── designs.md         # UI / design system
```

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm**
- Enough disk space and RAM for the CLIP model download on first run (~350 MB)

Firebase is optional. Without credentials, the server runs with in-memory persistence.

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd image-detective
```

### 2. Configure environment variables

**Server** — copy the example file and edit as needed:

```bash
cp server/.env.example server/.env
```

**Frontend** — point the client at your server:

```bash
cp frontend/.env.example frontend/.env
```

### 3. Install dependencies

```bash
cd server && npm install
cd ../frontend && npm install
```

### 4. Start the server

```bash
cd server
npm run dev
```

The API and Socket.IO server listen on `http://localhost:4000` by default.

On first startup, the CLIP model is downloaded and cached. Set `AI_MOCK=true` in `server/.env` to skip real inference during development or CI.

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### 6. Play

- Go to **Host a Game** (`/host`) to create a room.
- Share the room code or QR with players.
- Players join at **Join a Game** (`/join`).

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP / Socket.IO port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DEFAULT_ROUND_SECONDS` | `60` | Default round timer length |
| `MAX_PLAYERS_PER_ROOM` | `100` | Maximum players per room |
| `ROOM_IDLE_TIMEOUT_MS` | `1800000` | Room cleanup after idle (30 min) |
| `AI_MODEL` | `Xenova/clip-vit-base-patch32` | CLIP model identifier |
| `AI_WORKER_CONCURRENCY` | `2` | Parallel AI worker processes |
| `AI_MOCK` | `false` | Use deterministic mock scores (no model download) |
| `MAX_UPLOAD_BYTES` | `8388608` | Max upload size (8 MB) |
| `FIREBASE_PROJECT_ID` | — | Firestore project ID (optional) |
| `FIREBASE_CLIENT_EMAIL` | — | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | — | Firebase private key |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_SERVER_URL` | `http://localhost:4000` | Backend URL for REST and Socket.IO |

## Architecture

```text
                    React Client
              (Host & Player Interfaces)
                         │
                Socket.IO + REST API
                         │
              Express.js Application Server
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
 Room Manager      Timer Manager     Game Service
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
                 Submission Queue
                         │
                  AI Worker Pool
                         │
               Transformers.js (CLIP)
                         │
              Cosine Similarity → Score
                         │
              Firestore (optional)
```

## Production Notes

- Set `NODE_ENV=production` and configure `CLIENT_ORIGIN` to your deployed frontend URL.
- Serve the frontend `dist/` build behind HTTPS (e.g. Nginx) and run the Node server with a process manager such as PM2.
- Provide valid Firebase credentials if you need match history and persistence across restarts.
- Keep Firebase Admin SDK credentials and `.env` files out of version control.

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| `server/` | `npm start` | Run production server |
| `server/` | `npm run dev` | Run with file watch |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build |
| `frontend/` | `npm run preview` | Preview production build |

## Further Reading

- [`project.md`](project.md) — full software requirements and game flow
- [`techstack.md`](techstack.md) — technology choices
- [`designs.md`](designs.md) — cyberpunk UI design system
