export const EXERCISE_API_CACHE_TTL = 24 * 60 * 60 * 1000;

const cachePrefix = 'form.exerciseApi.v1:';

export function readExerciseApiCache(key) {
  try {
    const serialized = window.localStorage.getItem(`${cachePrefix}${key}`);
    if (!serialized) return null;
    const cached = JSON.parse(serialized);
    if (!cached || typeof cached.updatedAt !== 'number' || !('data' in cached)) {
      removeExerciseApiCache(key);
      return null;
    }
    return cached;
  } catch (error) {
    console.warn('ExerciseAPI.dev cache could not be read; fetching fresh data.', error);
    return null;
  }
}

export function writeExerciseApiCache(key, data) {
  try {
    window.localStorage.setItem(`${cachePrefix}${key}`, JSON.stringify({
      data,
      updatedAt: Date.now(),
    }));
    return true;
  } catch (error) {
    console.warn('ExerciseAPI.dev cache could not be saved; continuing without cached data.', error);
    return false;
  }
}

export function removeExerciseApiCache(key) {
  try {
    window.localStorage.removeItem(`${cachePrefix}${key}`);
  } catch (error) {
    console.warn('ExerciseAPI.dev cache entry could not be removed.', error);
  }
}

export function isExerciseApiCacheFresh(cached) {
  return Boolean(cached && Date.now() - cached.updatedAt < EXERCISE_API_CACHE_TTL);
}
