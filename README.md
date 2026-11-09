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

## ExerciseAPI.dev integration

The Exercise Library includes an optional ExerciseAPI.dev catalog. The API key is read only by the Express server and is not included in browser code.

1. Generate a key from the [ExerciseAPI.dev dashboard](https://exerciseapi.dev/dashboard).
2. Copy `.env.example` to `.env`.
3. Set `EXERCISEAPI_KEY` in `.env`, then restart `npm run dev`.

Do not commit `.env` or paste the key into source files. `.env` is ignored by Git. Without a key, the ExerciseAPI.dev tab shows setup instructions and the local exercise catalog remains available.

The browser caches exercise searches, details, categories, and muscle references per browser installation for 24 hours. Stale cache entries are shown while a refresh runs. Cached catalog data is stored in that browser's local storage; the server does not persist or share the third-party catalog cache.

ExerciseAPI.dev results can also be saved from their catalog cards to the local SQLite library-plan list. Catalog images are shown when their media URLs are available; exercises with demos show a video player on the detail page.

Fitness goal, training frequency, and experience preferences are saved in the local database. Submitting the goal form automatically searches and paginates ExerciseAPI.dev for matching exercise categories, core-muscle targets, and difficulty levels. The generated plan contains distinct sessions across the selected two to six training days, with API-sourced warm-ups, main exercises, and cool-downs; the other days are recovery days.

Exercise names, instructions, target muscles, equipment, categories, and difficulty values are read from ExerciseAPI.dev. Sets, repetitions or duration, rest periods, workout focus labels, and warm-up/cool-down roles are application-generated recommendations, identified as such in the plan UI. Generated plans are stored in SQLite and can be regenerated, edited by replacing/adding/removing exercises, and tracked exercise by exercise. Workout sessions started from the schedule still save through the normal feedback flow and power Progress.

The ExerciseAPI.dev integration follows its documented `GET /v1/exercises` filters (`category`, `muscle`, `level`, `limit`, `offset`, and `random`) and response shape. See the [provider documentation](https://exerciseapi.dev/llms.txt). The API key is sent only by the server using `X-API-Key`.

Proxy routes:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/exercise-api/status` | Check whether a server-side ExerciseAPI.dev key is configured |
| `GET` | `/api/exercise-api/exercises?q=bench&limit=20&offset=0` | Search and paginate ExerciseAPI.dev exercises |
| `GET` | `/api/exercise-api/exercises/:id` | Retrieve full exercise details |
| `GET` | `/api/exercise-api/categories` | Retrieve categories |
| `GET` | `/api/exercise-api/muscles` | Retrieve muscle groups |

Third-party API errors preserve the provider's error code, hint, documentation URL, retry header, and upgrade URL so the UI can present actionable feedback.

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
| `POST` | `/api/auth/register` | Create an account and sign in |
| `POST` | `/api/auth/login` | Sign in to an existing account |
| `GET` | `/api/auth/me` | Read the signed-in account |
| `PATCH` | `/api/auth/profile` | Update name, email, avatar, age, gender, phone, and address |
| `PATCH` | `/api/auth/password` | Change the signed-in account password |
| `POST` | `/api/auth/logout` | Sign out and clear the session |
| `GET` / `PUT` | `/api/fitness-goal` | Read or save fitness goal, training frequency, and experience preferences |
| `GET` / `PUT` | `/api/workout-plan` | Read or persist the generated ExerciseAPI.dev workout schedule |
| `GET` | `/api/exercises?search=squat&category=Lower%20body&level=Beginner` | Search/filter the exercise catalog |
| `GET` | `/api/exercises/:exerciseId` | Get one exercise |
| `POST` / `PUT` / `DELETE` | `/api/exercises` or `/api/exercises/:exerciseId` | Create, update, or remove an exercise |
| `PUT` / `DELETE` | `/api/favorites/:exerciseId` | Add or remove an exercise favorite |
| `GET` | `/api/plan/exercises` | List exercises saved to the plan |
| `PUT` / `DELETE` | `/api/plan/exercises/:exerciseId` | Add or remove a planned exercise |
| `POST` | `/api/plan/external-exercises` | Save an ExerciseAPI.dev exercise to the local catalog and workout plan |
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

The tracker requires an account. Passwords are stored as salted scrypt hashes and
sessions use random tokens in HTTP-only, SameSite=Lax cookies. Goals, generated
plans, favorites, planned exercises, workout history, and profile details are
scoped to the signed-in account. Existing single-user workout data is assigned
to the first account created after upgrading the database. Back up
`data/fitness.sqlite` to preserve local accounts and workouts.

## Team contributions

| Contributor | Responsibilities |
|---|---|
| dvd | Backend and integration; home dashboard and fitness goal selection |
| Ker | Landing page, personalized workout plan, and exercise library |
| Vinz | Sign-up and login screens; workout logging, active workout, and feedback |
| Shann | Achievements and workout history |
| Jeff | Exercise API integration and backend services |

## Source structure

- `src/pages/` contains the dashboard screens and account screens.
- `src/App.js` coordinates navigation and app state.
- `server/` contains the Express API, authentication, and SQLite persistence.

## Checks

```sh
npm test
npm run lint
npm run build
```
