import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  database,
  getProgressBalance,
  getProgressStats,
  listExercises,
  listWorkouts,
} from './database.js';

const app = express();
const port = Number(process.env.PORT) || 3001;
const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
app.use(express.json({ limit: '100kb' }));

function isNonEmptyString(value, maxLength = 100) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function notFound(response, message) {
  return response.status(404).json({ error: message });
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: 'connected' });
});

app.get('/api/exercises', (request, response) => {
  const search = typeof request.query.search === 'string' ? request.query.search.trim().slice(0, 100) : '';
  const category = typeof request.query.category === 'string' ? request.query.category.trim() : '';
  const level = typeof request.query.level === 'string' ? request.query.level.trim() : '';
  response.json(listExercises({ search, category, level }));
});

app.get('/api/exercises/:exerciseId', (request, response) => {
  const exercise = listExercises().find((item) => item.id === request.params.exerciseId);
  if (!exercise) return notFound(response, 'Exercise not found.');
  return response.json(exercise);
});

app.post('/api/exercises', (request, response) => {
  const { id, name, category, level, sets, reps, instruction } = request.body ?? {};
  if (![id, name, category, level, reps, instruction].every((value) => isNonEmptyString(value))
    || !Number.isInteger(sets) || sets < 1 || sets > 20) {
    return response.status(400).json({ error: 'Provide a valid exercise id, name, category, level, sets, reps, and instruction.' });
  }
  try {
    database.prepare(`
      INSERT INTO exercises (id, name, category, level, sets, reps, instruction)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id.trim(), name.trim(), category.trim(), level.trim(), sets, reps.trim(), instruction.trim());
    const exercise = listExercises().find((item) => item.id === id.trim());
    return response.status(201).json(exercise);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An exercise with that id or name already exists.' });
    }
    throw error;
  }
});

app.put('/api/exercises/:exerciseId', (request, response) => {
  const { name, category, level, sets, reps, instruction, equipment = 'No equipment' } = request.body ?? {};
  if (![name, category, level, reps, instruction, equipment].every((value) => isNonEmptyString(value))
    || !Number.isInteger(sets) || sets < 1 || sets > 20) {
    return response.status(400).json({ error: 'Provide a valid exercise name, category, level, sets, reps, instruction, and equipment.' });
  }
  try {
    const result = database.prepare(`
      UPDATE exercises
      SET name = ?, category = ?, level = ?, sets = ?, reps = ?, instruction = ?, equipment = ?
      WHERE id = ?
    `).run(name.trim(), category.trim(), level.trim(), sets, reps.trim(), instruction.trim(), equipment.trim(), request.params.exerciseId);
    if (!result.changes) return notFound(response, 'Exercise not found.');
    return response.json(listExercises().find((item) => item.id === request.params.exerciseId));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An exercise with that name already exists.' });
    }
    throw error;
  }
});

app.delete('/api/exercises/:exerciseId', (request, response) => {
  const result = database.prepare('DELETE FROM exercises WHERE id = ?').run(request.params.exerciseId);
  if (!result.changes) return notFound(response, 'Exercise not found.');
  return response.status(204).end();
});

app.put('/api/favorites/:exerciseId', (request, response) => {
  const exercise = database.prepare('SELECT id FROM exercises WHERE id = ?').get(request.params.exerciseId);
  if (!exercise) return notFound(response, 'Exercise not found.');
  database.prepare('INSERT OR IGNORE INTO favorite_exercises (exercise_id) VALUES (?)').run(exercise.id);
  return response.status(204).end();
});

app.delete('/api/favorites/:exerciseId', (request, response) => {
  database.prepare('DELETE FROM favorite_exercises WHERE exercise_id = ?').run(request.params.exerciseId);
  return response.status(204).end();
});

app.get('/api/plan/exercises', (_request, response) => {
  response.json(listExercises().filter((exercise) => exercise.isAdded));
});

app.put('/api/plan/exercises/:exerciseId', (request, response) => {
  const exercise = database.prepare('SELECT id FROM exercises WHERE id = ?').get(request.params.exerciseId);
  if (!exercise) return notFound(response, 'Exercise not found.');
  database.prepare('INSERT OR IGNORE INTO plan_exercises (exercise_id) VALUES (?)').run(exercise.id);
  return response.status(204).end();
});

app.delete('/api/plan/exercises/:exerciseId', (request, response) => {
  database.prepare('DELETE FROM plan_exercises WHERE exercise_id = ?').run(request.params.exerciseId);
  return response.status(204).end();
});

app.get('/api/workouts', (_request, response) => {
  response.json(listWorkouts());
});

app.post('/api/workouts', (request, response) => {
  const { name, date, duration, status = 'Completed', difficulty = null, feltPain = false, exercises = [] } = request.body ?? {};
  if (!isNonEmptyString(name) || !Number.isInteger(duration) || duration < 1 || duration > 1440
    || !Array.isArray(exercises) || exercises.length > 100
    || !['Completed', 'Modified'].includes(status)
    || (difficulty !== null && !['too-easy', 'just-right', 'too-hard', 'unfinished'].includes(difficulty))
    || typeof feltPain !== 'boolean'
    || (date !== undefined && (typeof date !== 'string' || Number.isNaN(Date.parse(date))))) {
    return response.status(400).json({ error: 'Provide a valid workout name, date, duration, status, feedback, and exercises list.' });
  }
  const normalizedExercises = [];
  for (const exercise of exercises) {
    if (!isNonEmptyString(exercise?.name) || !Array.isArray(exercise.sets)) {
      return response.status(400).json({ error: 'Each workout exercise needs a name and a sets list.' });
    }
    const sets = exercise.sets.map((set) => ({
      completed: Boolean(set?.completed),
      reps: Number.isInteger(set?.reps) && set.reps >= 0 ? set.reps : 0,
    }));
    normalizedExercises.push({ name: exercise.name.trim(), sets });
  }

  const saveWorkout = database.transaction(() => {
    const result = database.prepare(`
      INSERT INTO workout_sessions (name, date, duration, status, difficulty, felt_pain)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), date ? new Date(date).toISOString() : new Date().toISOString(), duration, status, difficulty, Number(feltPain));
    const insertExercise = database.prepare(`
      INSERT INTO session_exercises (session_id, exercise_name, sets_json)
      VALUES (?, ?, ?)
    `);
    for (const exercise of normalizedExercises) {
      insertExercise.run(result.lastInsertRowid, exercise.name, JSON.stringify(exercise.sets));
    }
    return Number(result.lastInsertRowid);
  });
  const sessionId = saveWorkout();
  const workout = listWorkouts().find((item) => item.id === sessionId);
  return response.status(201).json(workout);
});

app.put('/api/workouts/:id', (request, response) => {
  const id = Number(request.params.id);
  const { name, duration } = request.body ?? {};
  if (!Number.isInteger(id) || id < 1 || !isNonEmptyString(name) || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
    return response.status(400).json({ error: 'Provide a valid workout id, name, and duration.' });
  }
  const result = database.prepare('UPDATE workout_sessions SET name = ?, duration = ? WHERE id = ?').run(name.trim(), duration, id);
  if (!result.changes) return notFound(response, 'Workout not found.');
  return response.json(listWorkouts().find((workout) => workout.id === id));
});

app.delete('/api/workouts/:id', (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) return response.status(400).json({ error: 'Workout id must be a positive integer.' });
  const result = database.prepare('DELETE FROM workout_sessions WHERE id = ?').run(id);
  if (!result.changes) return notFound(response, 'Workout not found.');
  return response.status(204).end();
});

app.get('/api/progress', (_request, response) => {
  response.json(getProgressStats());
});

app.get('/api/progress/balance', (_request, response) => {
  response.json(getProgressBalance());
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API endpoint not found.' });
});

if (existsSync(resolve(rootDirectory, 'dist'))) {
  app.use(express.static(resolve(rootDirectory, 'dist')));
  app.get('/{*path}', (request, response, next) => {
    if (request.path.startsWith('/api/')) return next();
    return response.sendFile(resolve(rootDirectory, 'dist/index.html'));
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  return response.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Workout API listening on http://127.0.0.1:${port}`);
});
