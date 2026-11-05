import { exerciseApiRequest } from './api';
import {
  isExerciseApiCacheFresh,
  readExerciseApiCache,
  removeExerciseApiCache,
  writeExerciseApiCache,
} from './exerciseApiCache';

const pageSize = 100;
const maximumOffset = 500;

const goalFilters = {
  'Build Strength': { categories: ['strength'] },
  'Build Muscle': { categories: ['strength'] },
  'Lose Weight': { categories: ['conditioning', 'strength'] },
  'Improve Endurance': { categories: ['conditioning', 'strength'] },
  'Get Abs': { muscle: 'core' },
  'Stay Active': { categories: ['mobility', 'stretching', 'yoga'] },
};

function isExerciseRecord(exercise, level) {
  return Boolean(
    exercise
    && typeof exercise.id === 'string'
    && typeof exercise.name === 'string'
    && typeof exercise.category === 'string'
    && exercise.level === level
    && Array.isArray(exercise.primaryMuscles)
    && exercise.primaryMuscles.length > 0
    && Array.isArray(exercise.instructions)
    && exercise.instructions.length
    && exercise.instructions.every((instruction) => typeof instruction === 'string' && instruction.trim()),
  );
}

function uniqueExercises(exercises) {
  const seenIds = new Set();
  const seenNames = new Set();
  return exercises.filter((exercise) => {
    const normalizedName = exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenIds.has(exercise.id) || seenNames.has(normalizedName)) return false;
    seenIds.add(exercise.id);
    seenNames.add(normalizedName);
    return true;
  });
}

async function fetchFilteredPages(filters, level, minimumCount, forceRefresh) {
  const results = [];
  for (let offset = 0; offset < maximumOffset && results.length < minimumCount; ) {
    const parameters = new URLSearchParams({
      ...filters,
      level,
      limit: String(pageSize),
      offset: String(offset),
      ...(forceRefresh ? { random: 'true' } : {}),
    });
    const query = parameters.toString();
    const cacheKey = `exercises:${query}`;
    if (forceRefresh) removeExerciseApiCache(cacheKey);
    const cached = readExerciseApiCache(cacheKey);
    let response;
    if (cached && isExerciseApiCacheFresh(cached)) {
      response = cached.data;
    } else {
      response = await exerciseApiRequest(`/exercises?${query}`);
      if (!response || !Array.isArray(response.data)
        || !Number.isInteger(response.limit) || response.limit < 1
        || !Number.isInteger(response.offset) || response.offset !== offset) {
        throw new Error('ExerciseAPI.dev returned an unexpected paginated exercise response.');
      }
      writeExerciseApiCache(cacheKey, response);
    }

    results.push(...response.data.filter((exercise) => isExerciseRecord(exercise, level)));
    const pageLimit = response.limit;
    offset += pageLimit;
    if (response.data.length < pageLimit
      || (Number.isInteger(response.total) && offset >= response.total)) break;
  }
  return uniqueExercises(results);
}

export async function fetchWorkoutExerciseCandidates(profile, { forceRefresh = false } = {}) {
  const fitnessGoal = profile?.goal;
  const level = profile?.experience?.toLowerCase();
  const filters = goalFilters[fitnessGoal];
  if (!filters || !['beginner', 'intermediate', 'advanced'].includes(level)) {
    throw new Error('Choose a supported fitness goal and experience level before generating a plan.');
  }

  const status = await exerciseApiRequest('/status');
  if (!status || typeof status.configured !== 'boolean') {
    throw new Error('The local server returned an invalid ExerciseAPI.dev setup status.');
  }
  if (!status.configured) {
    throw new Error('ExerciseAPI.dev is not configured. Add the server-side API key to .env before generating a workout plan.');
  }

  const minimumCount = 4 * Number(String(profile.days).match(/\d/)?.[0] || 3);
  const goalQueries = filters.categories
    ? filters.categories.map((category) => fetchFilteredPages({ category }, level, minimumCount, forceRefresh))
    : [fetchFilteredPages({ muscle: filters.muscle }, level, minimumCount, forceRefresh)];
  const [goalResults, warmupResults, cooldownResults] = await Promise.all([
    Promise.all(goalQueries),
    fetchFilteredPages({ category: 'mobility' }, level, 4, forceRefresh),
    fetchFilteredPages({ category: 'stretching' }, level, 4, forceRefresh),
  ]);
  const goalExercises = uniqueExercises(goalResults.flat()).filter((exercise) => {
    if (filters.muscle) {
      return exercise.primaryMuscles.some((muscle) => /rectus abdominis|obliques|transverse abdominis/i.test(muscle));
    }
    return filters.categories.includes(exercise.category);
  });
  if (!goalExercises.length) {
    throw new Error(`ExerciseAPI.dev returned no ${fitnessGoal.toLowerCase()} exercises for the ${level} level.`);
  }
  if (!warmupResults.length || !cooldownResults.length) {
    throw new Error('ExerciseAPI.dev did not return mobility and stretching exercises for warm-ups and cool-downs.');
  }
  return {
    exercises: goalExercises,
    warmups: warmupResults.filter((exercise) => exercise.category === 'mobility'),
    cooldowns: cooldownResults.filter((exercise) => exercise.category === 'stretching'),
  };
}
