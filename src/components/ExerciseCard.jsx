import { useState } from 'react';
import { exerciseImageUrl } from '../exerciseMedia';

function ExerciseCard({
  exercise,
  onOpen,
  onAddToPlan,
  onRemoveFromPlan,
  isAdded = false,
  isAdding = false,
  compact = false,
}) {
  const thumbnail = exerciseImageUrl(exercise);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const muscles = exercise.primaryMuscles?.slice(0, 2).join(', ');
  const hasVideo = exercise.videos?.some((video) => /^https:\/\//i.test(video?.url));

  return (
    <article className={`api-exercise-card ${compact ? 'is-compact' : ''}`}>
      <button
        aria-label={`View details for ${exercise.name}`}
        className="api-exercise-card-open"
        onClick={() => onOpen(exercise.id)}
        type="button"
      >
        <span className="api-exercise-card-art">
          {thumbnail && !imageUnavailable
            ? <img alt="" loading="lazy" onError={() => setImageUnavailable(true)} src={thumbnail} />
            : <span className="api-exercise-card-placeholder" aria-hidden="true">FORM</span>}
          {hasVideo && <span className="api-exercise-media-badge">Video demo</span>}
        </span>
        <span className="api-exercise-card-content">
          <span className="exercise-tags">
            <span>{exercise.category?.replaceAll('_', ' ') || 'Exercise'}</span>
            <span>{exercise.level || 'Level not specified'}</span>
          </span>
          <strong>{exercise.name}</strong>
          {muscles && <small>Targets {muscles}</small>}
          {exercise.equipment && <small>Equipment: {exercise.equipment}</small>}
          {hasVideo && <small className="api-exercise-video-note">Video demonstration available</small>}
        </span>
      </button>
      {onAddToPlan && (
        <button
          aria-pressed={isAdded}
          className={`add-exercise-button api-exercise-add-button ${isAdded ? 'is-added' : ''}`}
          disabled={isAdding || (isAdded && !onRemoveFromPlan)}
          onClick={() => isAdded ? onRemoveFromPlan?.(exercise) : onAddToPlan(exercise)}
          type="button"
        >
          <span aria-hidden="true">{isAdded ? '−' : '+'}</span>
          {isAdding ? (isAdded ? 'Removing…' : 'Adding…') : isAdded ? 'Remove from plan' : 'Add to plan'}
        </button>
      )}
    </article>
  );
}

export default ExerciseCard;
