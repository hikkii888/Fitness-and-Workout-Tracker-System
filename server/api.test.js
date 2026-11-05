import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

let apiProcess;
let apiUrl;
let temporaryDirectory;
let processOutput = '';

async function getAvailablePort() {
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForApi() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) throw new Error(`API process exited early: ${processOutput}`);
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`API did not start in time: ${processOutput}`);
}

before(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'fitness-tracker-api-'));
  const port = await getAvailablePort();
  apiUrl = `http://127.0.0.1:${port}/api`;
  apiProcess = spawn(process.execPath, [fileURLToPath(new URL('./index.js', import.meta.url))], {
    env: {
      ...process.env,
      DATABASE_PATH: join(temporaryDirectory, 'test.sqlite'),
      EXERCISEAPI_KEY: '',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  apiProcess.stdout.on('data', (data) => { processOutput += data.toString(); });
  apiProcess.stderr.on('data', (data) => { processOutput += data.toString(); });
  await waitForApi();
});

after(async () => {
  if (apiProcess && apiProcess.exitCode === null) {
    apiProcess.kill('SIGTERM');
    await once(apiProcess, 'exit');
  }
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

test('exercise, plan, workout, and progress API workflows persist correctly', async (context) => {
  await context.test('reports missing ExerciseAPI.dev configuration without exposing credentials', async () => {
    const status = await (await fetch(`${apiUrl}/exercise-api/status`)).json();
    assert.equal(status.configured, false);

    const response = await fetch(`${apiUrl}/exercise-api/exercises?q=bench&limit=1`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error.code, 'API_NOT_CONFIGURED');
    assert.ok(body.error.hint.includes('EXERCISEAPI_KEY'));
    assert.equal(body.error.details.setup_url, 'https://exerciseapi.dev/dashboard');
  });

  await context.test('filters the seeded exercise catalog', async () => {
    const response = await fetch(`${apiUrl}/exercises?category=Core`);
    assert.equal(response.status, 200);
    const exercises = await response.json();
    assert.ok(exercises.length >= 3);
    assert.ok(exercises.every((exercise) => exercise.category === 'Core'));
  });

  await context.test('persists fitness goal preferences for recommendations', async () => {
    assert.equal(await (await fetch(`${apiUrl}/fitness-goal`)).json(), null);
    const profile = {
      goal: 'Improve Endurance',
      days: '6 days per week',
      experience: 'Intermediate',
    };
    const saveResponse = await fetch(`${apiUrl}/fitness-goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    assert.equal(saveResponse.status, 200);
    assert.deepEqual(await saveResponse.json(), profile);
    assert.deepEqual(await (await fetch(`${apiUrl}/fitness-goal`)).json(), profile);

    const invalidResponse = await fetch(`${apiUrl}/fitness-goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, goal: 'Run faster' }),
    });
    assert.equal(invalidResponse.status, 400);
  });

  await context.test('persists a validated generated workout plan', async () => {
    assert.equal(await (await fetch(`${apiUrl}/workout-plan`)).json(), null);
    const plannedExercise = {
      id: 'API_Test_Squat',
      source: 'ExerciseAPI',
      name: 'API Test Squat',
      category: 'strength',
      level: 'beginner',
      equipment: 'body only',
      primaryMuscles: ['quadriceps'],
      secondaryMuscles: [],
      instructions: ['Squat with control.'],
      overview: 'A catalog exercise.',
      sets: 3,
      reps: '10 reps',
      restSeconds: 60,
      role: 'workout',
      completed: false,
      prescriptionSource: 'Application recommendation',
    };
    const recoveryExercise = {
      ...plannedExercise,
      id: 'API_Test_Mobility',
      name: 'API Test Mobility',
      category: 'mobility',
      role: 'warm-up',
      reps: '30 sec',
      sets: 1,
      restSeconds: 15,
    };
    const cooldownExercise = {
      ...recoveryExercise,
      id: 'API_Test_Stretch',
      name: 'API Test Stretch',
      category: 'stretching',
      role: 'cool-down',
    };
    const plan = {
      profile: {
        goal: 'Build Strength',
        days: '2 days per week',
        experience: 'Beginner',
      },
      generatedAt: new Date().toISOString(),
      recoveryDays: ['Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
      sessions: ['Monday', 'Thursday'].map((day, index) => ({
        id: `session-${index + 1}`,
        day,
        name: `Strength · Full Body ${index + 1}`,
        focus: `Full Body ${index + 1}`,
        warmup: [recoveryExercise],
        exercises: [
          plannedExercise,
          { ...plannedExercise, id: `API_Test_Squat_${index}`, name: `API Test Squat ${index}` },
          { ...plannedExercise, id: `API_Test_Press_${index}`, name: `API Test Press ${index}` },
        ],
        cooldown: [cooldownExercise],
      })),
    };
    const saveResponse = await fetch(`${apiUrl}/workout-plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    assert.equal(saveResponse.status, 200);
    assert.deepEqual(await saveResponse.json(), plan);
    assert.deepEqual(await (await fetch(`${apiUrl}/workout-plan`)).json(), plan);

    const updatedPlan = structuredClone(plan);
    updatedPlan.sessions[0].exercises[0].completed = true;
    const updateResponse = await fetch(`${apiUrl}/workout-plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlan),
    });
    assert.equal(updateResponse.status, 200);
    const persistedPlan = await (await fetch(`${apiUrl}/workout-plan`)).json();
    assert.equal(persistedPlan.sessions[0].exercises[0].completed, true);

    const invalidResponse = await fetch(`${apiUrl}/workout-plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedPlan, sessions: [] }),
    });
    assert.equal(invalidResponse.status, 400);
  });

  await context.test('creates, reads, updates, and deletes catalog exercises', async () => {
    const newExercise = {
      id: 'api-test-step-up',
      name: 'API Test Step-up',
      category: 'Lower body',
      level: 'Beginner',
      sets: 3,
      reps: '8 / side',
      instruction: 'Step up with control.',
    };
    const createResponse = await fetch(`${apiUrl}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExercise),
    });
    assert.equal(createResponse.status, 201);

    const readResponse = await fetch(`${apiUrl}/exercises/${newExercise.id}`);
    assert.equal((await readResponse.json()).name, newExercise.name);

    const updateResponse = await fetch(`${apiUrl}/exercises/${newExercise.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newExercise, name: 'Updated API Test Step-up' }),
    });
    assert.equal((await updateResponse.json()).name, 'Updated API Test Step-up');

    const deleteResponse = await fetch(`${apiUrl}/exercises/${newExercise.id}`, { method: 'DELETE' });
    assert.equal(deleteResponse.status, 204);
    assert.equal((await fetch(`${apiUrl}/exercises/${newExercise.id}`)).status, 404);
  });

  await context.test('persists favorites and planned exercises', async () => {
    const favoriteResponse = await fetch(`${apiUrl}/favorites/squat`, { method: 'PUT' });
    const planResponse = await fetch(`${apiUrl}/plan/exercises/squat`, { method: 'PUT' });
    assert.equal(favoriteResponse.status, 204);
    assert.equal(planResponse.status, 204);

    const response = await fetch(`${apiUrl}/exercises?search=Bodyweight%20Squat`);
    const [squat] = await response.json();
    assert.equal(squat.isFavorite, true);
    assert.equal(squat.isAdded, true);

    await fetch(`${apiUrl}/favorites/squat`, { method: 'DELETE' });
    await fetch(`${apiUrl}/plan/exercises/squat`, { method: 'DELETE' });
  });

  await context.test('adds an ExerciseAPI.dev exercise to the persistent workout plan', async () => {
    const externalExercise = {
      externalId: 'API_Test_External_Squat',
      name: 'API Test External Squat',
      category: 'strength',
      level: 'beginner',
      equipment: 'body only',
      instruction: 'Keep your chest lifted and squat with control.',
    };
    const response = await fetch(`${apiUrl}/plan/external-exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(externalExercise),
    });
    assert.equal(response.status, 201);
    const savedExercise = await response.json();
    assert.equal(savedExercise.id, 'exerciseapi:API_Test_External_Squat');
    assert.equal(savedExercise.isAdded, true);

    const plannedExercises = await (await fetch(`${apiUrl}/plan/exercises`)).json();
    assert.ok(plannedExercises.some((exercise) => exercise.id === savedExercise.id));

    const duplicateResponse = await fetch(`${apiUrl}/plan/external-exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(externalExercise),
    });
    assert.equal(duplicateResponse.status, 200);

    await fetch(`${apiUrl}/plan/exercises/${encodeURIComponent(savedExercise.id)}`, { method: 'DELETE' });
    await fetch(`${apiUrl}/exercises/${encodeURIComponent(savedExercise.id)}`, { method: 'DELETE' });
  });

  await context.test('rejects invalid external exercises before saving them', async () => {
    const response = await fetch(`${apiUrl}/plan/external-exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalId: 'missing-fields' }),
    });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  });

  await context.test('creates, updates, summarizes, and deletes workout sessions', async () => {
    const createResponse = await fetch(`${apiUrl}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'API test workout',
        duration: 25,
        difficulty: 'just-right',
        feltPain: false,
        exercises: [{
          name: 'Bodyweight Squat',
          sets: [{ completed: true, reps: 10 }, { completed: false, reps: 8 }],
        }],
      }),
    });
    assert.equal(createResponse.status, 201);
    const workout = await createResponse.json();
    assert.equal(workout.exercises[0].name, 'Bodyweight Squat');
    assert.equal(workout.exercises[0].sets[0].reps, 10);

    const stats = await (await fetch(`${apiUrl}/progress`)).json();
    assert.equal(stats.reduce((total, week) => total + week.workouts, 0), 1, JSON.stringify(stats));
    assert.equal(stats.reduce((total, week) => total + week.minutes, 0), 25);
    assert.equal(stats.reduce((total, week) => total + week.reps, 0), 10);

    const balance = await (await fetch(`${apiUrl}/progress/balance`)).json();
    assert.equal(balance[0].category, 'Lower body');
    assert.equal(balance[0].volume, 10);

    const updateResponse = await fetch(`${apiUrl}/workouts/${workout.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated test workout', duration: 30 }),
    });
    assert.equal((await updateResponse.json()).name, 'Updated test workout');

    const deleteResponse = await fetch(`${apiUrl}/workouts/${workout.id}`, { method: 'DELETE' });
    assert.equal(deleteResponse.status, 204);
    assert.deepEqual(await (await fetch(`${apiUrl}/workouts`)).json(), []);
  });

  await context.test('rejects invalid workout input', async () => {
    const response = await fetch(`${apiUrl}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', duration: -1 }),
    });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  });
});
