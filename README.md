# Form — Fitness & Workout Tracker

A React and Vite fitness tracker with a local Express API and SQLite database. Exercise favorites, planned exercises, completed sessions, workout feedback, history, and progress statistics persist in SQLite.

## Requirements

- Node.js 22.13 or newer
- npm

## Run locally

```sh
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The development command starts both the Vite frontend and the API on `http://127.0.0.1:3001`; Vite proxies `/api` requests to the API.

The SQLite file is created automatically at `data/fitness.sqlite` and is ignored by Git. To use another database file, set `DATABASE_PATH` before starting the API:

```sh
DATABASE_PATH=/path/to/fitness.sqlite npm run api
```

For a production-style local run:

```sh
npm run build
npm start
```

The Express server serves the built frontend when `dist/` exists. Set `PORT` to change the API/server port.

## API

All endpoints are under `/api`. Successful list requests return JSON arrays; validation errors return a JSON `error` message and an appropriate HTTP status.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check API and database availability |
| `GET` | `/api/exercises?search=squat&category=Lower%20body&level=Beginner` | Search/filter the exercise catalog |
| `GET` | `/api/exercises/:exerciseId` | Get one exercise |
| `POST` / `PUT` / `DELETE` | `/api/exercises` or `/api/exercises/:exerciseId` | Create, update, or remove an exercise |
| `PUT` / `DELETE` | `/api/favorites/:exerciseId` | Add or remove an exercise favorite |
| `GET` | `/api/plan/exercises` | List exercises saved to the plan |
| `PUT` / `DELETE` | `/api/plan/exercises/:exerciseId` | Add or remove a planned exercise |
| `GET` | `/api/workouts` | List completed workout sessions and logged sets |
| `POST` | `/api/workouts` | Save a completed session and feedback |
| `PUT` / `DELETE` | `/api/workouts/:id` | Edit or delete a saved session |
| `GET` | `/api/progress` | Weekly workout, minute, and completed-rep totals |
| `GET` | `/api/progress/balance` | Logged exercise volume grouped by category |

Example request to save a workout:

```json
{
  "name": "Full Body Foundation",
  "duration": 28,
  "difficulty": "just-right",
  "feltPain": false,
  "exercises": [
    {
      "name": "Bodyweight Squat",
      "sets": [
        { "completed": true, "reps": 10 },
        { "completed": true, "reps": 10 }
      ]
    }
  ]
}
```

Example request to add a catalog exercise:

```json
{
  "id": "step-up",
  "name": "Step-up",
  "category": "Lower body",
  "level": "Beginner",
  "sets": 3,
  "reps": "8 / side",
  "instruction": "Plant your whole foot on a stable step and drive through your front heel."
}
```

The current app is a local, single-user application: it has no login, cloud database, or multi-user access control. Back up `data/fitness.sqlite` to preserve local workout data.

## Checks

```sh
npm test
npm run lint
npm run build
```
