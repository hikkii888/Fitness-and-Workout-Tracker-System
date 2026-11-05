export function exerciseImageUrl(exercise) {
  const image = typeof exercise === 'string' ? exercise : exercise.images?.[0];
  if (!image) return '';
  if (/^https:\/\//i.test(image)) return image;
  if (/^[a-z][a-z\d+.-]*:/i.test(image) || image.startsWith('//')) return '';
  return `https://cdn.exerciseapi.dev/v1/${image.split('/').map(encodeURIComponent).join('/')}`;
}
