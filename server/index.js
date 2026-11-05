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
const exerciseApiBaseUrl = 'https://api.exerciseapi.dev/v1';
app.use(express.json({ limit: '100kb' }));

function isNonEmptyString(value, maxLength = 100) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function notFound(response, message) {
  return response.status(404).json({ error: message });
}

function exerciseApiError(response, status, code, message, hint, details = {}) {
  return response.status(status).json({
    error: {
      code,
      message,
      hint,
      docs_url: `https://exerciseapi.dev/docs/errors#${code}`,
      details,
    },
  });
}

function isValidPlanExercise(exercise, roles) {
  return Boolean(
    exercise
    && isNonEmptyString(exercise.id, 160)
    && exercise.source === 'ExerciseAPI'
    && isNonEmptyString(exercise.name)
    && isNonEmptyString(exercise.category, 60)
    && isNonEmptyString(exercise.level, 40)
    && isNonEmptyString(exercise.equipment, 100)
    && Array.isArray(exercise.primaryMuscles)
    && exercise.primaryMuscles.length > 0
    && exercise.primaryMuscles.every((muscle) => isNonEmptyString(muscle, 100))
    && Array.isArray(exercise.instructions)
    && exercise.instructions.length > 0
    && exercise.instructions.length <= 20
    && exercise.instructions.every((instruction) => isNonEmptyString(instruction, 1000))
    && Number.isInteger(exercise.sets)
    && exercise.sets >= 1
    && exercise.sets <= 10
    && isNonEmptyString(exercise.reps, 40)
    && Number.isInteger(exercise.restSeconds)
    && exercise.restSeconds >= 0
    && exercise.restSeconds <= 600
    && roles.includes(exercise.role)
    && exercise.prescriptionSource === 'Application recommendation'
    && typeof exercise.completed === 'boolean',
  );
}

function isValidGeneratedPlan(plan) {
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const goals = ['Build Strength', 'Build Muscle', 'Lose Weight', 'Improve Endurance', 'Get Abs', 'Stay Active'];
  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const trainingDays = Number(plan?.profile?.days?.match(/\d/)?.[0]);
  return Boolean(
    plan
    && typeof plan.generatedAt === 'string'
    && !Number.isNaN(Date.parse(plan.generatedAt))
    && goals.includes(plan.profile?.goal)
    && [2, 3, 4, 5, 6].includes(trainingDays)
    && plan.profile.days === `${trainingDays} days per week`
    && experienceLevels.includes(plan.profile?.experience)
    && Array.isArray(plan.sessions)
    && plan.sessions.length === trainingDays
    && plan.sessions.every((session) => (
      isNonEmptyString(session.id, 80)
      && validDays.includes(session.day)
      && isNonEmptyString(session.name, 120)
      && isNonEmptyString(session.focus, 80)
      && Array.isArray(session.warmup)
      && session.warmup.length > 0
      && session.warmup.every((exercise) => isValidPlanExercise(exercise, ['warm-up']))
      && Array.isArray(session.exercises)
      && session.exercises.length >= 3
      && session.exercises.length <= 8
      && session.exercises.every((exercise) => isValidPlanExercise(exercise, ['workout']))
      && Array.isArray(session.cooldown)
      && session.cooldown.length > 0
      && session.cooldown.every((exercise) => isValidPlanExercise(exercise, ['cool-down']))
    ))
    && Array.isArray(plan.recoveryDays)
    && plan.recoveryDays.every((day) => validDays.includes(day)),
  );
}

async function proxyExerciseApi(request, response, resourcePath) {
  const apiKey = process.env.EXERCISEAPI_KEY;
  if (!apiKey) {
    return exerciseApiError(
      response,
      503,
      'API_NOT_CONFIGURED',
      'ExerciseAPI.dev is not configured yet.',
      'Create an API key in the ExerciseAPI.dev dashboard, add EXERCISEAPI_KEY to .env, then restart the app.',
      { setup_url: 'https://exerciseapi.dev/dashboard' },
    );
  }

  const upstreamUrl = new URL(`${exerciseApiBaseUrl}${resourcePath}`);
  for (const [key, value] of Object.entries(request.query)) {
    if (typeof value === 'string') upstreamUrl.searchParams.set(key, value);
  }
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    const body = await upstreamResponse.text();
    response.status(upstreamResponse.status);
    for (const header of [
      'content-type',
      'retry-after',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
    ]) {
      const value = upstreamResponse.headers.get(header);
      if (value) response.setHeader(header, value);
    }
    return response.send(body);
  } catch (error) {
    console.error('ExerciseAPI.dev request failed:', error);
    return exerciseApiError(
      response,
      502,
      'EXTERNAL_API_UNAVAILABLE',
      'ExerciseAPI.dev could not be reached.',
      'Check your internet connection and try again in a moment.',
    );
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: 'connected' });
});

app.get('/api/fitness-goal', (_request, response) => {
  const profile = database.prepare(`
    SELECT goal, days, experience
    FROM fitness_profile
    WHERE id = 1
  `).get();
  response.json(profile ?? null);
});

app.put('/api/fitness-goal', (request, response) => {
  const { goal, days, experience } = request.body ?? {};
  const validGoals = ['Build Strength', 'Build Muscle', 'Lose Weight', 'Improve Endurance', 'Get Abs', 'Stay Active'];
  const validTrainingDays = [2, 3, 4, 5, 6].map((count) => `${count} days per week`);
  const validExperienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
  if (!validGoals.includes(goal) || !validTrainingDays.includes(days) || !validExperienceLevels.includes(experience)) {
    return response.status(400).json({ error: 'Provide a valid fitness goal, training frequency, and experience level.' });
  }
  database.prepare(`
    INSERT INTO fitness_profile (id, goal, days, experience, updated_at)
    VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      goal = excluded.goal,
      days = excluded.days,
      experience = excluded.experience,
      updated_at = CURRENT_TIMESTAMP
  `).run(goal, days, experience);
  return response.json({ goal, days, experience });
});

app.get('/api/workout-plan', (_request, response) => {
  const savedPlan = database.prepare('SELECT plan_json FROM generated_workout_plan WHERE id = 1').get();
  return response.json(savedPlan ? JSON.parse(savedPlan.plan_json) : null);
});

app.put('/api/workout-plan', (request, response) => {
  const plan = request.body;
  if (!isValidGeneratedPlan(plan)) {
    return response.status(400).json({
      error: 'Provide a complete generated plan with valid ExerciseAPI exercises, prescriptions, sessions, and recovery days.',
    });
  }
  database.prepare(`
    INSERT INTO generated_workout_plan (id, plan_json, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      plan_json = excluded.plan_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(JSON.stringify(plan));
  return response.json(plan);
});

app.get('/api/exercise-api/status', (_request, response) => {
  response.json({ configured: Boolean(process.env.EXERCISEAPI_KEY) });
});

app.get('/api/exercise-api/exercises', (request, response) => proxyExerciseApi(request, response, '/exercises'));

app.get('/api/exercise-api/exercises/:exerciseId', (request, response) => {
  return proxyExerciseApi(request, response, `/exercises/${encodeURIComponent(request.params.exerciseId)}`);
});

app.get('/api/exercise-api/categories', (request, response) => proxyExerciseApi(request, response, '/categories'));

app.get('/api/exercise-api/muscles', (request, response) => proxyExerciseApi(request, response, '/muscles'));

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

app.post('/api/plan/external-exercises', (request, response) => {
  const {
    externalId,
    name,
    category,
    level,
    equipment = 'No equipment',
    instruction,
  } = request.body ?? {};
  if (!isNonEmptyString(externalId, 160)
    || !isNonEmptyString(name)
    || !isNonEmptyString(category, 60)
    || !isNonEmptyString(level, 40)
    || !isNonEmptyString(equipment, 100)
    || !isNonEmptyString(instruction, 500)) {
    return response.status(400).json({
      error: 'Provide a valid external exercise id, name, category, level, equipment, and instruction.',
    });
  }

  const externalExerciseId = `exerciseapi:${externalId.trim()}`;
  const saved = database.transaction(() => {
    let exercise = database.prepare('SELECT id FROM exercises WHERE id = ?').get(externalExerciseId);
    if (!exercise) {
      exercise = database.prepare('SELECT id FROM exercises WHERE name = ?').get(name.trim());
    }
    if (!exercise) {
      database.prepare(`
        INSERT INTO exercises (id, name, category, level, sets, reps, instruction, equipment)
        VALUES (?, ?, ?, ?, 3, '10 reps', ?, ?)
      `).run(
        externalExerciseId,
        name.trim(),
        category.trim(),
        level.trim(),
        instruction.trim(),
        equipment.trim(),
      );
      exercise = { id: externalExerciseId };
    }

    const planResult = database.prepare(
      'INSERT OR IGNORE INTO plan_exercises (exercise_id) VALUES (?)',
    ).run(exercise.id);
    const storedExercise = listExercises().find((item) => item.id === exercise.id);
    return { exercise: storedExercise, added: planResult.changes > 0 };
  })();

  return response.status(saved.added ? 201 : 200).json(saved.exercise);
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
