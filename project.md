# Internet Detective – Software Requirements Specification (SRS)

---

# 1. Project Overview

## 1.1 Introduction

Internet Detective is a real-time multiplayer web game where players compete to find an image on the internet that most closely matches a target image chosen by the Host.

Unlike traditional trivia games, players are judged using an AI-powered computer vision model rather than manual scoring. The application evaluates each submitted image based on visual similarity and automatically awards points.

The platform is designed to provide synchronized gameplay across multiple devices with minimal latency while maintaining a secure client-server architecture.

---

# 2. Project Objectives

The system aims to:

* Deliver a fun, fast-paced multiplayer experience.
* Eliminate manual image judging.
* Synchronize gameplay across all connected devices.
* Automatically evaluate submissions using local AI inference.
* Protect all backend credentials and business logic.
* Support multiple simultaneous game rooms.
* Scale efficiently with increasing player counts.
* Maintain a clean, modular, and maintainable architecture.

---

# 3. User Roles

## 3.1 Host

The Host controls the entire game session.

### Responsibilities

* Create a room
* Share room code or QR code
* Configure rounds
* Upload/select target images
* Start and end rounds
* Control timers
* View leaderboard
* Advance rounds
* End the game

---

## 3.2 Player

Players participate using a mobile phone, tablet, or desktop browser.

### Responsibilities

* Join a room
* Enter a display name
* Search the internet for matching images
* Submit an image
* View rankings
* Continue through all rounds

---

# 4. Functional Requirements

## FR-1 Room Management

The system shall allow a Host to create and manage a multiplayer game room.

Each room shall include:

* Unique Room ID
* Join URL
* QR Code
* Host session token

Players can join using either the room code or QR code.

---

## FR-2 Player Management

The system shall allow players to:

* Join an existing room
* Choose a display name
* Automatically receive a temporary player identifier
* Reconnect after temporary connection loss

The Host shall see players joining in real time.

---

## FR-3 Image Submission

The system shall support multiple image submission methods to provide a consistent experience across desktop and mobile devices.

### Supported submission methods

#### Desktop

* Clipboard Paste (Ctrl + V)
* File Upload
* Drag & Drop (Optional)

#### Mobile

* File Upload
* Gallery Selection
* Device File Picker

Regardless of the submission method, the client shall automatically:

* Validate image format
* Resize image
* Compress image
* Normalize image
* Upload the optimized image to the server

No image URLs are required.

---

## FR-4 Round Management

The Host shall be able to:

* Start game
* Start round
* Pause round
* Resume round
* Skip round
* End round
* Start next round
* Finish game

---

## FR-5 Global Timer

The server shall maintain the authoritative countdown timer.

Clients shall receive synchronized timer updates through Socket.IO.

When the timer expires:

* New submissions are rejected
* Submission UI becomes disabled
* Results phase begins

---

## FR-6 AI Image Evaluation

The server shall automatically:

* Receive player submission
* Normalize image
* Generate CLIP embeddings
* Compare against target image
* Calculate cosine similarity
* Convert similarity into score
* Update leaderboard

No manual scoring shall be required.

---

## FR-7 Leaderboard

The leaderboard shall automatically:

* Sort players
* Update scores
* Display rankings
* Animate ranking changes
* Synchronize across every connected device

---

## FR-8 Real-Time Synchronization

The following events shall synchronize instantly:

* Player joins
* Player disconnects
* Round starts
* Round ends
* Timer updates
* Submission received
* Leaderboard updates
* Results screen
* Next round
* Game over

Synchronization shall be performed using Socket.IO.

---

## FR-9 Session Recovery

If a player disconnects:

* Socket reconnects automatically
* Previous player session restored
* Current game state synchronized
* Player continues without rejoining

---

# 5. Non-Functional Requirements

## Performance

The application shall:

* Compress uploads before transmission.
* Minimize latency.
* Keep gameplay responsive.
* Support smooth UI animations.

---

## Scalability

The backend shall support:

* Multiple game rooms
* Concurrent AI workers
* High submission bursts
* Dozens of simultaneous players per room

---

## Reliability

The system shall recover gracefully from:

* Temporary network failures
* Browser refreshes
* Player reconnections
* Worker processing delays

---

## Availability

Core AI functionality shall execute locally without dependency on external AI APIs.

---

## Maintainability

The project shall follow:

* Modular architecture
* Separation of concerns
* Component-based frontend
* Layered backend
* Reusable services

---

# 6. Overall Application Flow

## Phase 1 — Room Creation

1. Host creates a room.
2. Server generates:

   * Room ID
   * Join URL
   * QR Code
3. Host shares the room.

---

## Phase 2 — Lobby

Players join.

Server:

* registers player
* assigns UUID
* opens Socket.IO connection

Host lobby updates live.

---

## Phase 3 — Round Starts

Host presses **Start Round**.

Server:

* changes room state
* starts timer
* broadcasts round information

All players enter the searching phase simultaneously.

---

## Phase 4 — Searching

Players search the internet.

They may submit an image using:

* Clipboard Paste
* File Upload
* Drag & Drop (desktop)

---

## Phase 5 — Client Processing

Before upload:

* Validate format
* Resize image
* Compress image
* Convert to JPEG/WebP if required
* Upload to backend

---

## Phase 6 — Submission Queue

Express server receives upload.

Submission enters the processing queue.

Worker receives next available job.

---

## Phase 7 — AI Evaluation

Worker:

* preprocesses image
* creates embedding
* compares target embedding
* computes cosine similarity
* calculates score

---

## Phase 8 — Live Leaderboard

Server updates score.

Socket.IO broadcasts:

* updated leaderboard
* updated ranking
* player movement

Clients animate ranking changes in real time.

---

## Phase 9 — Results

When timer expires:

* submissions close
* results displayed
* leaderboard finalized

---

## Phase 10 — Next Round

Host presses **Next Round**.

Server:

* resets temporary data
* loads next target image
* broadcasts new round

---

## Phase 11 — Game Complete

Final leaderboard displayed.

Winner announced.

Game archived.

Room destroyed after timeout.

---

# 7. Game State Flow

```text
WAITING_ROOM
      │
      ▼
ROUND_STARTING
      │
      ▼
SEARCHING
      │
      ▼
SUBMISSIONS_CLOSED
      │
      ▼
AI_PROCESSING
      │
      ▼
RESULTS
      │
      ▼
NEXT_ROUND
      │
      ▼
GAME_FINISHED
```

---

# 8. System Architecture

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
 Room Manager      Timer Manager     Session Manager
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
                 Submission Queue
                         │
                  AI Worker Pool
                         │
               Transformers.js (CLIP)
                         │
              Cosine Similarity Engine
                         │
                 Score Calculation
                         │
                Firebase Firestore
```

---

# 9. Security Requirements

## Authentication

Host:

* Secure session token

Players:

* UUID
* Socket session

---

## Authorization

Only the Host may:

* start rounds
* end rounds
* skip rounds
* configure rooms

Players cannot invoke administrative APIs.

---

## Input Validation

Validate:

* usernames
* room codes
* uploaded files
* API payloads

Reject malformed requests.

---

## File Validation

Accept:

* JPEG
* PNG
* WebP

Reject:

* SVG
* GIF
* Executables
* Unsupported MIME types

---

## Upload Protection

Restrict:

* Maximum file size
* Upload frequency
* Duplicate submissions
* Concurrent uploads

---

## Rate Limiting

Protect against:

* Spam
* API abuse
* Flood attacks
* Brute-force room joins

---

## Secure Configuration

Sensitive information remains server-side.

Never expose:

* Firebase Admin SDK credentials
* Environment variables
* Secret keys
* Internal API endpoints

---

## HTTPS

All production traffic must use HTTPS.

---

## Security Headers

Helmet middleware shall enable:

* Content Security Policy
* HSTS
* XSS Protection
* Frame Protection
* MIME Sniffing Protection

---

# 10. AI Processing Pipeline

```text
Player Image
      │
      ▼
Image Validation
      │
      ▼
Sharp Preprocessing
      │
      ▼
Resize & Normalize
      │
      ▼
CLIP Embedding
      │
      ▼
Target Embedding
      │
      ▼
Cosine Similarity
      │
      ▼
Score Calculation
      │
      ▼
Leaderboard Update
      │
      ▼
Socket.IO Broadcast
```

---

# 11. Scoring Formula

Each submission receives a similarity value between **0.0** and **1.0**.

```
Round Score = Cosine Similarity × 100
```

Example:

| Similarity | Score |
| ---------- | ----: |
| 0.95       |    95 |
| 0.82       |    82 |
| 0.67       |    67 |
| 0.43       |    43 |

---

# 12. Database Responsibilities

Persistent data includes:

* Rooms
* Players
* Total Scores
* Round History
* Game History
* Match Statistics

Transient data (kept in server memory):

* Socket connections
* Active timers
* Submission queue
* AI worker state
* Temporary round state

---

# 13. Recommended Project Structure

```text
internet-detective/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── Host/
│   │   │   ├── Player/
│   │   │   └── Shared/
│   │   ├── services/
│   │   │   ├── api/
│   │   │   └── socket/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── ai/
│   ├── api/
│   ├── config/
│   ├── middleware/
│   ├── queue/
│   ├── rooms/
│   ├── sockets/
│   ├── workers/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── docs/
├── .env
├── package.json
├── README.md
└── .gitignore
```

---

# 14. Future Enhancements

Potential future features include:

* Team Mode
* Spectator Mode
* Ranked Matchmaking
* User Accounts
* Global Leaderboards
* Match Replay
* AI Hint System
* Achievement System
* Tournament Mode
* Seasonal Events
* Mobile App
* GPU-Accelerated AI Workers
* Docker Deployment
* Kubernetes Scaling
* CI/CD Pipeline
* Monitoring & Logging
* Analytics Dashboard

---

# 15. Expected Outcome

Internet Detective will provide a modern, secure, and scalable multiplayer gaming platform that enables players to compete in image-search challenges using real-time synchronization and local AI-powered image recognition. By combining React, Express.js, Socket.IO, Transformers.js, and Firebase, the system will deliver responsive gameplay, automated scoring, robust security, and a maintainable architecture capable of supporting future expansion.
