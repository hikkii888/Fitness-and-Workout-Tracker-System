import express from 'express';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  database,
  claimLegacyData,
  getProgressBalance,
  getProgressStats,
  listExercises,
  listWorkouts,
} from './database.js';

const app = express();
const port = Number(process.env.PORT) || 3001;
const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exerciseApiBaseUrl = 'https://api.exerciseapi.dev/v1';
const sessionCookieName = 'fitness_session';
const sessionDurationSeconds = 30 * 24 * 60 * 60;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genderOptions = new Set(['Woman', 'Man', 'Non-binary', 'Self-describe', 'Prefer not to say']);
app.use(express.json({ limit: '800kb' }));

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

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    age: user.age,
    gender: user.gender,
    avatarDataUrl: user.avatar_data_url,
    phone: user.phone,
    addressLine1: user.address_line1,
    addressLine2: user.address_line2,
    city: user.city,
    region: user.region,
    postalCode: user.postal_code,
    country: user.country,
  };
}

function readSessionToken(request) {
  const cookie = request.headers.cookie?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice(sessionCookieName.length + 1));
  } catch {
    return null;
  }
}

function sessionCookie(token, secure) {
  return [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${sessionDurationSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

function clearSessionCookie(secure) {
  return [
    `${sessionCookieName}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

function findSessionUser(request) {
  const token = readSessionToken(request);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = database.prepare(`
    SELECT user_id, expires_at FROM auth_sessions WHERE token_hash = ?
  `).get(tokenHash);
  if (!session) return null;
  if (session.expires_at <= Date.now()) {
    database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  return database.prepare(`
    SELECT id, name, email, created_at, age, gender, avatar_data_url,
      phone, address_line1, address_line2, city, region, postal_code, country
    FROM users WHERE id = ?
  `).get(session.user_id) || null;
}

function requireAuth(request, response, next) {
  const user = findSessionUser(request);
  if (!user) return response.status(401).json({ error: 'Please sign in to continue.' });
  request.user = user;
  return next();
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

function startSession(response, userId) {
  const token = randomBytes(32).toString('base64url');
  database.prepare(`
    INSERT INTO auth_sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(hashToken(token), userId, Date.now() + sessionDurationSeconds * 1000);
  response.setHeader('Set-Cookie', sessionCookie(token, process.env.NODE_ENV === 'production'));
}

app.post('/api/auth/register', (request, response) => {
  const { name, email, password } = request.body ?? {};
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return response.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  }
  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    return response.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return response.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
  }

  const salt = randomBytes(16).toString('hex');
  try {
    const result = database.prepare(`
      INSERT INTO users (name, email, password_salt, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(normalizedName, normalizedEmail, salt, hashPassword(password, salt));
    const userId = Number(result.lastInsertRowid);
    claimLegacyData(userId);
    const user = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    startSession(response, userId);
    return response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An account with that email already exists.' });
    }
    throw error;
  }
});

app.post('/api/auth/login', (request, response) => {
  const { email, password } = request.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof password !== 'string' || password.length > 128) {
    return response.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const user = database.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  const candidateHash = user ? hashPassword(password, user.password_salt) : '';
  const passwordMatches = user
    && Buffer.byteLength(candidateHash) === Buffer.byteLength(user.password_hash)
    && timingSafeEqual(Buffer.from(candidateHash), Buffer.from(user.password_hash));
  if (!passwordMatches) {
    return response.status(401).json({ error: 'Email or password is incorrect.' });
  }
  startSession(response, user.id);
  return response.json({ user: publicUser(user) });
});

app.get('/api/auth/me', (request, response) => {
  const user = findSessionUser(request);
  if (!user && readSessionToken(request)) {
    response.setHeader('Set-Cookie', clearSessionCookie(process.env.NODE_ENV === 'production'));
  }
  return response.json({ user: user ? publicUser(user) : null });
});

app.post('/api/auth/logout', (request, response) => {
  const token = readSessionToken(request);
  if (token) database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
  response.setHeader('Set-Cookie', clearSessionCookie(process.env.NODE_ENV === 'production'));
  return response.status(204).end();
});

app.patch('/api/auth/profile', requireAuth, (request, response) => {
  const body = request.body ?? {};
  const columns = {
    name: ['name', (value) => value.trim()],
    email: ['email', (value) => value.trim().toLowerCase()],
    age: ['age', (value) => value],
    gender: ['gender', (value) => value],
    avatarDataUrl: ['avatar_data_url', (value) => value],
    phone: ['phone', (value) => value?.trim() || null],
    addressLine1: ['address_line1', (value) => value?.trim() || null],
    addressLine2: ['address_line2', (value) => value?.trim() || null],
    city: ['city', (value) => value?.trim() || null],
    region: ['region', (value) => value?.trim() || null],
    postalCode: ['postal_code', (value) => value?.trim() || null],
    country: ['country', (value) => value?.trim() || null],
  };
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !columns[key])) {
    return response.status(400).json({ error: 'Provide valid profile fields to update.' });
  }
  if ('name' in body && (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100)) {
    return response.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  }
  if ('email' in body && (typeof body.email !== 'string' || body.email.trim().length > 254 || !emailPattern.test(body.email.trim()))) {
    return response.status(400).json({ error: 'Enter a valid email address.' });
  }
  if ('age' in body && body.age !== null && (!Number.isInteger(body.age) || body.age < 13 || body.age > 120)) {
    return response.status(400).json({ error: 'Age must be between 13 and 120, or left blank.' });
  }
  if ('gender' in body && body.gender !== null && !genderOptions.has(body.gender)) {
    return response.status(400).json({ error: 'Choose a valid gender option.' });
  }
  const textFields = [
    ['phone', 'Phone number', 30],
    ['addressLine1', 'Street address', 160],
    ['addressLine2', 'Address line 2', 160],
    ['city', 'City', 100],
    ['region', 'State or province', 100],
    ['postalCode', 'Postal code', 24],
    ['country', 'Country', 100],
  ];
  for (const [field, label, maxLength] of textFields) {
    if (field in body && body[field] !== null && (
      typeof body[field] !== 'string' || body[field].trim().length > maxLength
    )) {
      return response.status(400).json({ error: `${label} must be no more than ${maxLength} characters.` });
    }
  }
  if ('phone' in body && body.phone !== null && body.phone.trim()
    && !/^[+()\d.\-\s]{7,30}$/.test(body.phone.trim())) {
    return response.status(400).json({ error: 'Enter a valid phone number.' });
  }
  if ('avatarDataUrl' in body && body.avatarDataUrl !== null) {
    const avatar = typeof body.avatarDataUrl === 'string'
      ? /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.avatarDataUrl)
      : null;
    if (!avatar || Buffer.from(avatar[1], 'base64').length > 512 * 1024) {
      return response.status(400).json({ error: 'Avatar must be a PNG, JPEG, or WebP image under 512 KB.' });
    }
  }

  try {
    database.prepare(`
      UPDATE users
      SET ${keys.map((key) => `${columns[key][0]} = ?`).join(', ')}
      WHERE id = ?
    `).run(...keys.map((key) => columns[key][1](body[key])), request.user.id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An account with that email already exists.' });
    }
    throw error;
  }
  const user = database.prepare('SELECT * FROM users WHERE id = ?').get(request.user.id);
  return response.json({ user: publicUser(user) });
});

app.patch('/api/auth/password', requireAuth, (request, response) => {
  const { currentPassword, newPassword } = request.body ?? {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string'
    || currentPassword.length > 128 || newPassword.length < 8 || newPassword.length > 128) {
    return response.status(400).json({ error: 'Enter your current password and a new password of 8 to 128 characters.' });
  }
  const user = database.prepare('SELECT password_salt, password_hash FROM users WHERE id = ?')
    .get(request.user.id);
  const currentHash = hashPassword(currentPassword, user.password_salt);
  if (!timingSafeEqual(Buffer.from(currentHash), Buffer.from(user.password_hash))) {
    return response.status(401).json({ error: 'Current password is incorrect.' });
  }
  const salt = randomBytes(16).toString('hex');
  database.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?')
    .run(salt, hashPassword(newPassword, salt), request.user.id);
  database.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(request.user.id);
  startSession(response, request.user.id);
  return response.json({ message: 'Your password has been changed.' });
});

app.use('/api', requireAuth);

app.get('/api/fitness-goal', (request, response) => {
  const profile = database.prepare(`
    SELECT goal, days, experience
    FROM user_fitness_profiles
    WHERE user_id = ?
  `).get(request.user.id);
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
    INSERT INTO user_fitness_profiles (user_id, goal, days, experience, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      goal = excluded.goal,
      days = excluded.days,
      experience = excluded.experience,
      updated_at = CURRENT_TIMESTAMP
  `).run(request.user.id, goal, days, experience);
  return response.json({ goal, days, experience });
});

app.get('/api/workout-plan', (request, response) => {
  const savedPlan = database.prepare('SELECT plan_json FROM user_generated_workout_plans WHERE user_id = ?')
    .get(request.user.id);
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
    INSERT INTO user_generated_workout_plans (user_id, plan_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      plan_json = excluded.plan_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(request.user.id, JSON.stringify(plan));
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
  response.json(listExercises(request.user.id, { search, category, level }));
});

app.get('/api/exercises/:exerciseId', (request, response) => {
  const exercise = listExercises(request.user.id).find((item) => item.id === request.params.exerciseId);
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
      INSERT INTO exercises (id, name, category, level, sets, reps, instruction, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id.trim(), name.trim(), category.trim(), level.trim(), sets, reps.trim(), instruction.trim(), request.user.id);
    const exercise = listExercises(request.user.id).find((item) => item.id === id.trim());
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
      WHERE id = ? AND owner_id = ?
    `).run(name.trim(), category.trim(), level.trim(), sets, reps.trim(), instruction.trim(), equipment.trim(), request.params.exerciseId, request.user.id);
    if (!result.changes) return notFound(response, 'Exercise not found.');
    return response.json(listExercises(request.user.id).find((item) => item.id === request.params.exerciseId));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An exercise with that name already exists.' });
    }
    throw error;
  }
});

app.delete('/api/exercises/:exerciseId', (request, response) => {
  const result = database.prepare('DELETE FROM exercises WHERE id = ? AND owner_id = ?')
    .run(request.params.exerciseId, request.user.id);
  if (!result.changes) return notFound(response, 'Exercise not found.');
  return response.status(204).end();
});

app.put('/api/favorites/:exerciseId', (request, response) => {
  const exercise = database.prepare('SELECT id FROM exercises WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)')
    .get(request.params.exerciseId, request.user.id);
  if (!exercise) return notFound(response, 'Exercise not found.');
  database.prepare('INSERT OR IGNORE INTO user_favorite_exercises (user_id, exercise_id) VALUES (?, ?)')
    .run(request.user.id, exercise.id);
  return response.status(204).end();
});

app.delete('/api/favorites/:exerciseId', (request, response) => {
  database.prepare('DELETE FROM user_favorite_exercises WHERE user_id = ? AND exercise_id = ?')
    .run(request.user.id, request.params.exerciseId);
  return response.status(204).end();
});

app.get('/api/plan/exercises', (request, response) => {
  response.json(listExercises(request.user.id).filter((exercise) => exercise.isAdded));
});

app.put('/api/plan/exercises/:exerciseId', (request, response) => {
  const exercise = database.prepare('SELECT id FROM exercises WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)')
    .get(request.params.exerciseId, request.user.id);
  if (!exercise) return notFound(response, 'Exercise not found.');
  database.prepare('INSERT OR IGNORE INTO user_plan_exercises (user_id, exercise_id) VALUES (?, ?)')
    .run(request.user.id, exercise.id);
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
    let exercise = database.prepare(`
      SELECT id FROM exercises
      WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)
    `).get(externalExerciseId, request.user.id);
    if (!exercise) {
      exercise = database.prepare(`
        SELECT id FROM exercises
        WHERE name = ? AND (owner_id IS NULL OR owner_id = ?)
      `).get(name.trim(), request.user.id);
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
      'INSERT OR IGNORE INTO user_plan_exercises (user_id, exercise_id) VALUES (?, ?)',
    ).run(request.user.id, exercise.id);
    const storedExercise = listExercises(request.user.id).find((item) => item.id === exercise.id);
    return { exercise: storedExercise, added: planResult.changes > 0 };
  })();

  return response.status(saved.added ? 201 : 200).json(saved.exercise);
});

app.delete('/api/plan/exercises/:exerciseId', (request, response) => {
  database.prepare('DELETE FROM user_plan_exercises WHERE user_id = ? AND exercise_id = ?')
    .run(request.user.id, request.params.exerciseId);
  return response.status(204).end();
});

app.get('/api/workouts', (request, response) => {
  response.json(listWorkouts(request.user.id));
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
      INSERT INTO workout_sessions (user_id, name, date, duration, status, difficulty, felt_pain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(request.user.id, name.trim(), date ? new Date(date).toISOString() : new Date().toISOString(), duration, status, difficulty, Number(feltPain));
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
  const workout = listWorkouts(request.user.id).find((item) => item.id === sessionId);
  return response.status(201).json(workout);
});

app.put('/api/workouts/:id', (request, response) => {
  const id = Number(request.params.id);
  const { name, duration } = request.body ?? {};
  if (!Number.isInteger(id) || id < 1 || !isNonEmptyString(name) || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
    return response.status(400).json({ error: 'Provide a valid workout id, name, and duration.' });
  }
  const result = database.prepare('UPDATE workout_sessions SET name = ?, duration = ? WHERE id = ? AND user_id = ?')
    .run(name.trim(), duration, id, request.user.id);
  if (!result.changes) return notFound(response, 'Workout not found.');
  return response.json(listWorkouts(request.user.id).find((workout) => workout.id === id));
});

app.delete('/api/workouts/:id', (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) return response.status(400).json({ error: 'Workout id must be a positive integer.' });
  const result = database.prepare('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?')
    .run(id, request.user.id);
  if (!result.changes) return notFound(response, 'Workout not found.');
  return response.status(204).end();
});

app.get('/api/progress', (request, response) => {
  response.json(getProgressStats(request.user.id));
});

app.get('/api/progress/balance', (request, response) => {
  response.json(getProgressBalance(request.user.id));
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
