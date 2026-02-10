# Piano Learning Web App

## Overview
This repo contains a FastAPI backend and a React (Vite) frontend for a piano learning web app.

### Features
- PDF lessons with per-page progress tracking
- Audio per PDF page (voice box)
- Hands-on piano with WebAudio playback
- Admin upload for PDFs and page audio

## Backend
Location: `backend/`

### Setup
1. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. Start PostgreSQL (Docker recommended):

```bash
docker compose up -d
```

3. Copy env:

```bash
copy backend\.env.example backend\.env
```

4. Run migrations:

```bash
cd backend
alembic revision --autogenerate -m "init"
alembic upgrade head
```

5. Start API:

```bash
uvicorn app.main:app --reload
```

## Frontend
Location: `frontend/`

### Setup
```bash
cd frontend
npm install
npm run dev
```

### Notes
- Update `frontend/.env` (see `.env.example`) if API runs on a different host.
- The piano uses `frontend/public/samples/a4.wav` as a base sample. Replace with higher quality samples for realism.

## Admin Flow
- Register a user.
- Update the user role to `admin` in the database.
- Use admin endpoints to create lessons and upload PDFs/audio.

## API Quick Test
- `POST /auth/register`
- `POST /auth/login`
- `POST /admin/lessons`
- `POST /admin/lessons/{id}/pdf`
- `POST /admin/lessons/{id}/pages/{page}/audio`
- `GET /lessons/{id}/pages/{page}`
- `PUT /lessons/{id}/pages/{page}/progress`
