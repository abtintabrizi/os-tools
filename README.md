# OS Tools — Draft Simulator

A real-time draft tool for competitive play, supporting both map selection and striker (character) drafts. Teams join shared rooms and alternate banning/picking in sync via WebSockets.

Live at: [drafter2.bestieinslot.com](https://drafter2.bestieinslot.com)

Live at: [https://os-tools-theta.vercel.app/](https://https://os-tools-theta.vercel.app/)

---

## Features

**Map Draft**

- Best-of-1 and Best-of-3 formats
- Custom map pool selection
- Alternating ban/pick sequence with turn timer
- Spectator mode

**Striker Draft**

- 21-striker pool with ban/pick sequence
- Optional awakening selection
- Awakening conflict validation
- Spectator mode

**Both modes share:**

- Real-time WebSocket sync across all connected clients
- Persistent rooms stored in Supabase
- Shareable room links with side assignment (`?room=XXXXX&side=blue`)
- Turn countdown timer

---

## Tech Stack

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4 |
| Backend  | Python, FastAPI, Uvicorn, WebSockets       |
| Database | Supabase (PostgreSQL)                      |
| Deploy   | Vercel (frontend), Render (backend)        |

---

## Project Structure

```
os-tools/
├── frontend/          # React + TypeScript SPA
│   └── src/
│       ├── features/
│       │   ├── common/         # Shared components and types
│       │   ├── map-drafter/    # Map draft feature
│       │   └── striker-draft/  # Striker draft feature
│       └── routes/             # Top-level page routes
└── backend/           # FastAPI application
    └── app/
        ├── routes/    # REST + WebSocket endpoints
        ├── models/    # Pydantic request/response models
        ├── constants/ # Game rules, sequences, striker/map pools
        └── utils/     # Supabase client, WebSocket manager, timers
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project with `map_drafts` and `striker_drafts` tables

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/Scripts/activate   # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.default .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

# Run development server
python app/main.py
# Server starts at http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.default .env
# Set VITE_API_BASE_URL=http://127.0.0.1:8000 (or leave empty for default)

# Run development server
npm run dev
# App starts at http://localhost:5173

# Build for production
npm run build
```

---

## Environment Variables

**Backend (`backend/.env`)**
| Variable | Description |
|-----------------------------|----------------------------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret key |

**Frontend (`frontend/.env`)**
| Variable | Description |
|---------------------|------------------------------------------------|
| `VITE_API_BASE_URL` | Backend API base URL (defaults to localhost) |

---

## API Overview

Both draft types expose the same 6-endpoint pattern:

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| POST   | `/{type}/create`           | Create a new draft room      |
| GET    | `/{type}/{room_id}`        | Get current room state       |
| POST   | `/{type}/{room_id}/ready`  | Mark a team as ready         |
| POST   | `/{type}/{room_id}/action` | Submit a ban or pick         |
| DELETE | `/{type}/{room_id}`        | Delete a room                |
| WS     | `/{type}/{room_id}/ws`     | WebSocket for real-time sync |

Where `{type}` is `map-draft` or `striker-draft`.
