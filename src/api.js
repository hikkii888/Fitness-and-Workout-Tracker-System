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
    const apiError = body?.error;
    const error = new Error(
      typeof apiError === 'string'
        ? apiError
        : apiError?.message || `Request failed (${response.status}).`,
    );
    error.status = response.status;
    error.code = apiError?.code;
    error.hint = apiError?.hint;
    error.docsUrl = apiError?.docs_url;
    error.details = apiError?.details;
    error.retryAfter = response.headers.get('retry-after');
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function exerciseApiRequest(path, options) {
  return apiRequest(`/exercise-api${path}`, options);
}

export function toExerciseNames(exercises = []) {
  return exercises.map((exercise) => typeof exercise === 'string' ? exercise : exercise.name);
}
