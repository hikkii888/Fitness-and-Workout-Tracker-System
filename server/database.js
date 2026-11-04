import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const databasePath = resolve(process.env.DATABASE_PATH || 'data/fitness.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

export const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');

database.exec(`
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    sets INTEGER NOT NULL CHECK (sets > 0),
    reps TEXT NOT NULL,
    instruction TEXT NOT NULL,
    equipment TEXT NOT NULL DEFAULT 'No equipment'
  );

  CREATE TABLE IF NOT EXISTS favorite_exercises (
    exercise_id TEXT PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plan_exercises (
    exercise_id TEXT PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0),
    status TEXT NOT NULL DEFAULT 'Completed',
    difficulty TEXT,
    felt_pain INTEGER NOT NULL DEFAULT 0 CHECK (felt_pain IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets_json TEXT NOT NULL DEFAULT '[]'
  );

  CREATE INDEX IF NOT EXISTS workout_sessions_date_idx ON workout_sessions(date);
  CREATE INDEX IF NOT EXISTS session_exercises_session_idx ON session_exercises(session_id);
`);

const seedExercises = [
  ['squat', 'Bodyweight Squat', 'Lower body', 'Beginner', 3, '10 reps', 'Keep your chest lifted and knees tracking over your toes.'],
  ['push-up', 'Incline Push-up', 'Upper body', 'Beginner', 3, '8 reps', 'Keep your body in a straight line as you lower your chest toward the bench.'],
  ['bridge', 'Glute Bridge', 'Lower body', 'Beginner', 3, '12 reps', 'Press through your heels and squeeze your glutes at the top.'],
  ['bird-dog', 'Bird Dog', 'Core', 'Beginner', 2, '10 / side', 'Reach opposite arm and leg long while keeping your hips level.'],
  ['lunge', 'Reverse Lunge', 'Lower body', 'Intermediate', 3, '8 / side', 'Step back softly and keep your front knee stacked over your ankle.'],
  ['row', 'Dumbbell Row', 'Upper body', 'Beginner', 3, '10 / side', 'Pull your elbow toward your hip without rounding your back.'],
  ['plank', 'Plank Hold', 'Core', 'Intermediate', 3, '30 sec', 'Brace your core and keep a long, steady line from head to heels.'],
  ['dead-bug', 'Dead Bug', 'Core', 'Beginner', 3, '8 / side', 'Keep your lower back gently pressed down as you extend opposite limbs.'],
  ['calf-raise', 'Calf Raise', 'Lower body', 'Beginner', 3, '12 reps', 'Rise onto the balls of your feet, pause, and lower with control.'],
  ['wall-push-up', 'Wall Push-up', 'Upper body', 'Beginner', 3, '10 reps', 'Keep your body straight and bring your chest toward the wall.'],
  ['shoulder-press', 'Dumbbell Shoulder Press', 'Upper body', 'Intermediate', 3, '8 reps', 'Press overhead without arching your lower back.'],
  ['step-up', 'Step-up', 'Lower body', 'Beginner', 3, '8 / side', 'Plant your whole foot on a stable step and drive through your front heel.'],
  ['side-plank', 'Side Plank', 'Core', 'Intermediate', 2, '20 sec / side', 'Keep your hips lifted and your body in a straight line.'],
  ['march', 'March in Place', 'Cardio', 'Beginner', 3, '30 sec', 'Stand tall and alternate lifting your knees at a comfortable pace.'],
  ['hinge', 'Hip Hinge', 'Lower body', 'Beginner', 3, '10 reps', 'Push your hips back while keeping your spine long and knees soft.'],
];

const insertExercise = database.prepare(`
  INSERT OR IGNORE INTO exercises (id, name, category, level, sets, reps, instruction)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const seed = database.transaction(() => {
  for (const exercise of seedExercises) insertExercise.run(...exercise);
});
seed();

export function listExercises({ search = '', category = '', level = '' } = {}) {
  return database.prepare(`
    SELECT e.*,
      EXISTS (SELECT 1 FROM favorite_exercises f WHERE f.exercise_id = e.id) AS isFavorite,
      EXISTS (SELECT 1 FROM plan_exercises p WHERE p.exercise_id = e.id) AS isAdded
    FROM exercises e
    WHERE (? = '' OR e.name LIKE ? OR e.category LIKE ? OR e.level LIKE ?)
      AND (? = '' OR e.category = ?)
      AND (? = '' OR e.level = ?)
    ORDER BY e.category, e.name
  `).all(search, `%${search}%`, `%${search}%`, `%${search}%`, category, category, level, level)
    .map((exercise) => ({
      ...exercise,
      sets: Number(exercise.sets),
      isFavorite: Boolean(exercise.isFavorite),
      isAdded: Boolean(exercise.isAdded),
    }));
}

export function listWorkouts() {
  return database.prepare(`
    SELECT s.*,
      COALESCE(json_group_array(
        CASE WHEN se.id IS NULL THEN NULL
          ELSE json_object('name', se.exercise_name, 'sets', json(se.sets_json))
        END
      ) FILTER (WHERE se.id IS NOT NULL), '[]') AS exercises_json
    FROM workout_sessions s
    LEFT JOIN session_exercises se ON se.session_id = s.id
    GROUP BY s.id
    ORDER BY s.date DESC, s.id DESC
  `).all().map((row) => ({
    id: row.id,
    name: row.name,
    date: row.date,
    duration: row.duration,
    status: row.status,
    difficulty: row.difficulty,
    feltPain: Boolean(row.felt_pain),
    exercises: JSON.parse(row.exercises_json),
  }));
}

export function getProgressStats() {
  const rows = database.prepare(`
    SELECT date(s.date, '-' || ((CAST(strftime('%w', s.date) AS INTEGER) + 6) % 7) || ' days') AS week,
      COUNT(*) AS workouts,
      COALESCE(SUM(s.duration), 0) AS minutes,
      COALESCE(SUM((
        SELECT SUM(CAST(json_extract(item.value, '$.reps') AS INTEGER))
        FROM session_exercises se, json_each(se.sets_json) item
        WHERE se.session_id = s.id AND json_extract(item.value, '$.completed') = 1
      )), 0) AS reps
    FROM workout_sessions s
    WHERE s.date >= date('now', '-56 days')
    GROUP BY week ORDER BY week
  `).all();
  const statsByWeek = new Map(rows.map((row) => [row.week, row]));
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));

  return Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(monday);
    weekStart.setUTCDate(monday.getUTCDate() - (7 - index) * 7);
    const week = weekStart.toISOString().slice(0, 10);
    const totals = statsByWeek.get(week);
    return {
      week,
      workouts: totals?.workouts ?? 0,
      minutes: totals?.minutes ?? 0,
      reps: totals?.reps ?? 0,
    };
  });
}

export function getProgressBalance() {
  return database.prepare(`
    SELECT COALESCE(e.category, 'Other') AS category,
      COUNT(DISTINCT se.session_id) AS workouts,
      COALESCE(SUM((
        SELECT SUM(CAST(json_extract(item.value, '$.reps') AS INTEGER))
        FROM json_each(se.sets_json) item
        WHERE json_extract(item.value, '$.completed') = 1
      )), 0) AS volume
    FROM session_exercises se
    LEFT JOIN exercises e ON e.name = se.exercise_name
    GROUP BY category
    ORDER BY volume DESC, category
  `).all();
}
