export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${response.status}).`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function toExerciseNames(exercises = []) {
  return exercises.map((exercise) => typeof exercise === 'string' ? exercise : exercise.name);
}
