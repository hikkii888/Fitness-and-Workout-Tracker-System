import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createWorkoutPlan,
  getExercisePrescription,
  getNextPlannedSession,
  getTrainingDays,
  normalizeFitnessProfile,
} from './workoutPlan.js';

function catalogExercise(id, category, primaryMuscles) {
  return {
    id,
    name: `Catalog ${id}`,
    category,
    level: 'beginner',
    equipment: 'body only',
    primaryMuscles,
    secondaryMuscles: [],
    instructions: ['Use controlled movement.'],
    overview: 'Catalog description.',
  };
}

function exercisePool() {
  return [
    ...Array.from({ length: 8 }, (_, index) => catalogExercise(`push-${index}`, 'strength', ['pectoralis major'])),
    ...Array.from({ length: 8 }, (_, index) => catalogExercise(`pull-${index}`, 'strength', ['latissimus dorsi'])),
    ...Array.from({ length: 8 }, (_, index) => catalogExercise(`legs-${index}`, 'strength', ['rectus femoris'])),
    ...Array.from({ length: 8 }, (_, index) => catalogExercise(`core-${index}`, 'strength', ['rectus abdominis'])),
  ];
}

function recoveryPool(category, count = 8) {
  return Array.from({ length: count }, (_, index) => catalogExercise(`${category}-${index}`, category, ['hamstrings']));
}

test('normalizes saved profile values and supports all requested training frequencies', () => {
  assert.deepEqual(normalizeFitnessProfile({
    goal: 'Improve fitness',
    days: '4 days per week',
    experience: 'I have some experience',
  }), {
    goal: 'Improve Endurance',
    days: '4 days per week',
    experience: 'Intermediate',
  });
  assert.deepEqual(getTrainingDays('6 days per week'), [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ]);
});

test('Home skips sessions already completed this week and does not wrap back to old sessions', () => {
  const sessions = [
    { day: 'Monday', name: 'Earlier session' },
    { day: 'Thursday', name: 'Today session' },
    { day: 'Friday', name: 'Next session' },
  ];
  const thursday = new Date(2026, 10, 5, 9);

  assert.deepEqual(getNextPlannedSession(sessions, [], thursday), {
    session: sessions[1],
    date: '2026-11-05',
    dayIndex: 3,
  });
  assert.deepEqual(getNextPlannedSession(
    sessions,
    [{ date: '2026-11-05T10:00:00.000Z' }],
    thursday,
  ), {
    session: sessions[2],
    date: '2026-11-06',
    dayIndex: 4,
  });
  assert.equal(getNextPlannedSession(
    sessions,
    [{ date: '2026-11-05T10:00:00.000Z' }, { date: '2026-11-06T10:00:00.000Z' }],
    thursday,
  ), null);
});

test('creates a six-session split with unique API exercises and recovery days', () => {
  const plan = createWorkoutPlan({
    goal: 'Build Strength',
    days: '6 days per week',
    experience: 'Beginner',
  }, {
    exercises: exercisePool(),
    warmups: recoveryPool('mobility'),
    cooldowns: recoveryPool('stretching'),
    generatedAt: '2026-01-01T00:00:00.000Z',
  });
  const allMainExercises = plan.sessions.flatMap((session) => session.exercises);
  const allScheduledExercises = plan.sessions.flatMap((session) => [
    ...session.warmup,
    ...session.exercises,
    ...session.cooldown,
  ]);
  assert.equal(plan.sessions.length, 6);
  assert.deepEqual(plan.recoveryDays, ['Sunday']);
  assert.equal(new Set(allMainExercises.map((exercise) => exercise.id)).size, allMainExercises.length);
  assert.equal(new Set(allScheduledExercises.map((exercise) => exercise.id)).size, allScheduledExercises.length);
  assert.ok(plan.sessions.every((session) => session.exercises.length >= 3));
  assert.deepEqual(plan.sessions.map((session) => session.focus), [
    'Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B',
  ]);
  assert.ok(plan.sessions.every((session) => session.warmup[0].role === 'warm-up'
    && session.cooldown[0].role === 'cool-down'));
  assert.equal(plan.sessions[0].exercises[0].prescriptionSource, 'Application recommendation');
});

test('creates the selected number of sessions from two through six training days', () => {
  for (const days of [2, 3, 4, 5, 6]) {
    const plan = createWorkoutPlan({
      goal: 'Build Muscle',
      days: `${days} days per week`,
      experience: 'Intermediate',
    }, {
      exercises: exercisePool(),
      warmups: recoveryPool('mobility', 10),
      cooldowns: recoveryPool('stretching', 10),
    });
    assert.equal(plan.sessions.length, days);
    assert.equal(plan.recoveryDays.length, 7 - days);
    assert.ok(plan.sessions.every((session) => session.exercises.length >= 3));
  }
});

test('keeps Get Abs sessions focused on API core-muscle targets', () => {
  const coreExercises = Array.from({ length: 16 }, (_, index) => catalogExercise(
    `abs-${index}`,
    'strength',
    index % 2 ? ['obliques external', 'obliques internal'] : ['rectus abdominis'],
  ));
  const plan = createWorkoutPlan({
    goal: 'Get Abs',
    days: '3 days per week',
    experience: 'Beginner',
  }, {
    exercises: coreExercises,
    warmups: recoveryPool('mobility', 8),
    cooldowns: recoveryPool('stretching', 8),
  });
  assert.equal(plan.sessions.length, 3);
  assert.equal(new Set(plan.sessions.map((session) => session.name)).size, 3);
  assert.ok(plan.sessions.flatMap((session) => session.exercises).every((exercise) => (
    exercise.primaryMuscles.some((muscle) => /abdominis|obliques/i.test(muscle))
  )));
});

test('prescribes different rest and work targets by experience', () => {
  const exercise = catalogExercise('bench', 'strength', ['pectoralis major']);
  assert.deepEqual(
    [getExercisePrescription(exercise, 'Beginner').reps, getExercisePrescription(exercise, 'Intermediate').restSeconds, getExercisePrescription(exercise, 'Advanced').sets],
    ['10 reps', 90, 4],
  );
});
