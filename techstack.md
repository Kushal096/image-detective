# Internet Detective – Final Technology Stack

## Frontend

### Core Framework

* React
* Vite

### Programming Language

* JavaScript (ES6+)

### Styling

* Tailwind CSS

### Real-Time Communication

* Socket.IO Client

### Browser APIs

* Clipboard API
* Canvas API
* Fetch API
* File API

### Purpose

* Host Dashboard
* Player HUD
* Image Pasting
* Image Compression
* Live Leaderboard
* Timer Synchronization
* Round State Management

---

# Backend

## Runtime

* Node.js

## Framework

* Express.js

## Responsibilities

* REST API
* Room Management
* Player Management
* Submission Handling
* Authentication
* AI Processing Orchestration
* Game State Management
* Timer Synchronization

---

# Real-Time Communication

## Socket.IO

### Responsibilities

* Player Join/Leave
* Host Controls
* Live Timer Synchronization
* Leaderboard Updates
* Round State Changes
* Results Reveal
* Connection Recovery

---

# Artificial Intelligence

## Library

* Transformers.js

## Runtime

* ONNX Runtime

## Model

* OpenAI CLIP

## Responsibilities

* Image Embedding
* Similarity Calculation
* Automatic Scoring

---

# Image Processing

## Library

* Sharp

## Responsibilities

* Resize Images
* Image Compression
* JPEG Conversion
* Image Normalization
* Preprocessing for AI

---

# Database

## Primary Database

* Firebase Firestore

### Stores

* Rooms
* Players
* Scores
* Round History
* Match History
* Player Statistics

---

# File Storage (Optional)

## Firebase Storage

### Stores

* Uploaded Images (if persistence is needed)

If image history is not required, images should be processed in memory and discarded after scoring.

---

# Queue System

## In-Memory Worker Queue

### Responsibilities

* Buffer Submission Spikes
* Distribute Jobs to AI Workers
* Prevent Server Overload

---

# Security

## Libraries

* Helmet
* CORS
* Express Rate Limit
* UUID

### Responsibilities

* HTTP Security Headers
* Cross-Origin Protection
* Request Rate Limiting
* Temporary Player Identification

---

# Deployment

## Operating System

* Ubuntu Server

## Reverse Proxy

* Nginx

## Runtime

* Node.js

## Process Manager

* PM2

---

# Development Tools

## Package Manager

* npm

## Version Control

* Git

## Code Editor

* Visual Studio Code

## API Testing

* Postman

---

# Project Structure

```text
internet-detective/

├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
│
├── server/
│   ├── api/
│   ├── sockets/
│   ├── rooms/
│   ├── queue/
│   ├── workers/
│   ├── ai/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── .env
├── package.json
└── README.md
```

---

# Overall Architecture

```text
                    Host Dashboard
                          │
                          │
                  Socket.IO Client
                          │
Players ──────────────────┤
                          │
                 Express + Socket.IO
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   REST API         Room Manager      Timer Manager
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                  Submission Queue
                          │
                    Worker Pool
                          │
                Transformers.js (CLIP)
                          │
                 Similarity Calculator
                          │
                   Score Calculator
                          │
                     Firebase Firestore
```

---

# Final Technology Stack Summary

| Category                | Technology                             |
| ----------------------- | -------------------------------------- |
| Frontend Framework      | React                                  |
| Build Tool              | Vite                                   |
| Programming Language    | JavaScript (ES6+)                      |
| Styling                 | Tailwind CSS                           |
| Real-Time Communication | Socket.IO                              |
| Backend Runtime         | Node.js                                |
| Backend Framework       | Express.js                             |
| AI Framework            | Transformers.js                        |
| AI Runtime              | ONNX Runtime                           |
| Vision Model            | OpenAI CLIP                            |
| Image Processing        | Sharp                                  |
| Database                | Firebase Firestore                     |
| File Storage            | Firebase Storage (Optional)            |
| Queue System            | In-Memory Worker Queue                 |
| Reverse Proxy           | Nginx                                  |
| Process Manager         | PM2                                    |
| Security                | Helmet, CORS, Express Rate Limit, UUID |
| Operating System        | Ubuntu Server                          |
| Version Control         | Git                                    |
| Package Manager         | npm                                    |
| Development Tools       | Visual Studio Code, Postman            |
