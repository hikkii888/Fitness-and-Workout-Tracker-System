import { useEffect, useMemo, useState } from 'react';
import { exerciseApiRequest } from '../api';
import Icon from './Icon';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function ExerciseFigure() {
  return (
    <div className="active-exercise-figure" aria-hidden="true">
      <span className="active-figure-head" />
      <span className="active-figure-body" />
      <span className="active-figure-arm active-figure-arm-left" />
      <span className="active-figure-arm active-figure-arm-right" />
    </div>
  );
}

function ActiveWorkout({ exercises: exerciseCatalog, initiallyComplete = false, onFinish, onWorkoutComplete, workoutName }) {
  const exercises = useMemo(() => exerciseCatalog.map((exercise) => ({
    ...exercise,
    reps: Number(exercise.reps.match(/\d+/)?.[0]) || 10,
    unit: /\bsec\b/i.test(exercise.reps) ? 'sec' : 'reps',
  })), [exerciseCatalog]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(() => exercises.map(() => false));
  const [workoutComplete, setWorkoutComplete] = useState(initiallyComplete);
  const [exerciseMedia, setExerciseMedia] = useState({ exerciseId: '', loading: false, videoUrl: '', error: '' });
  const [sets, setSets] = useState(() => exercises.map((exercise) => (
    Array.from({ length: exercise.sets }, () => ({ completed: false, reps: exercise.reps }))
  )));

  useEffect(() => {
    if (workoutComplete) return undefined;
    const timerId = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timerId);
  }, [workoutComplete]);

  const exercise = exercises[exerciseIndex];
  const externalExerciseId = exercise?.id?.startsWith('exerciseapi:')
    ? exercise.id.slice('exerciseapi:'.length)
    : '';

  useEffect(() => {
    if (!externalExerciseId) return undefined;

    let active = true;
    exerciseApiRequest(`/exercises/${encodeURIComponent(externalExerciseId)}`)
      .then((response) => {
        if (!response?.data || !Array.isArray(response.data.videos)) {
          throw new Error('The exercise video information was not returned by ExerciseAPI.dev.');
        }
        const videoUrl = response.data.videos
          .map((video) => video?.url)
          .find((url) => typeof url === 'string' && /^https:\/\//i.test(url)) || '';
        if (active) setExerciseMedia({ exerciseId: externalExerciseId, loading: false, videoUrl, error: '' });
      })
      .catch((error) => {
        if (active) {
          setExerciseMedia({
            exerciseId: externalExerciseId,
            loading: false,
            videoUrl: '',
            error: error.message || 'The exercise video could not be loaded.',
          });
        }
      });

    return () => { active = false; };
  }, [externalExerciseId]);

  const currentExerciseMedia = exerciseMedia.exerciseId === externalExerciseId
    ? exerciseMedia
    : { loading: Boolean(externalExerciseId), videoUrl: '', error: '' };
  const workoutSummary = () => ({
    name: workoutName,
    duration: Math.max(1, Math.ceil(elapsedSeconds / 60)),
    exercises: exercises.map((workoutExercise, index) => ({
      name: workoutExercise.name,
      sets: sets[index],
    })),
  });

  const updateSet = (setIndex, update) => {
    setSets((current) => current.map((exerciseSets, index) => (
      index === exerciseIndex
        ? exerciseSets.map((set, currentSetIndex) => currentSetIndex === setIndex ? update(set) : set)
        : exerciseSets
    )));
  };

  const finishExercise = () => {
    const updatedCompleted = completedExercises.map((completed, index) => index === exerciseIndex || completed);
    setCompletedExercises(updatedCompleted);
    const nextExerciseIndex = Array.from({ length: exercises.length }, (_, index) => (
      (exerciseIndex + index + 1) % exercises.length
    )).find((index) => !updatedCompleted[index]);

    if (nextExerciseIndex === undefined) {
      setWorkoutComplete(true);
      onWorkoutComplete();
      return;
    }
    setExerciseIndex(nextExerciseIndex);
    setShowGuide(false);
  };

  if (exercises.length === 0) {
    return <p className="api-error" role="alert">Exercise catalog is unavailable. Please return to the exercise library and try again.</p>;
  }

  if (workoutComplete) {
    return (
      <section className="workout-complete-screen" aria-label="Workout complete">
        <span className="workout-complete-icon"><Icon name="check" /></span>
        <p className="eyebrow">WORKOUT COMPLETE</p>
        <h2>No more active workout</h2>
        <p>You completed all {exercises.length} exercises in {workoutName}. Continue to feedback to save this workout to your progress.</p>
        <button className="primary-button" onClick={() => onFinish(workoutSummary())} type="button">
          Continue to workout feedback
          <Icon name="arrow" />
        </button>
      </section>
    );
  }

  return (
    <section className="active-workout-screen" aria-label="Active workout and exercise logging">
      <div className="active-exercise-heading">
        <div>
          <label className="active-exercise-picker">
            <span className="exercise-step">CHOOSE EXERCISE · {completedExercises.filter(Boolean).length} OF {exercises.length} COMPLETE</span>
            <select
              aria-label="Choose active exercise"
              onChange={(event) => {
                setExerciseIndex(Number(event.target.value));
                setShowGuide(false);
              }}
              value={exerciseIndex}
            >
              {exercises.map((item, index) => (
                <option key={item.id || `${item.name}-${index}`} value={index}>
                  {completedExercises[index] ? '✓ ' : ''}{item.name}{completedExercises[index] ? ' · Completed' : ''}
                </option>
              ))}
            </select>
          </label>
          <h2>{exercise.name}</h2>
          <p>{exercise.instruction}</p>
          {exercise.source === 'ExerciseAPI' && (
            <dl className="active-exercise-metadata">
              <div><dt>Target muscles</dt><dd>{exercise.primaryMuscles.join(', ')}</dd></div>
              <div><dt>Equipment</dt><dd>{exercise.equipment}</dd></div>
              <div><dt>Difficulty</dt><dd>{exercise.level}</dd></div>
              <div><dt>Rest</dt><dd>{exercise.restSeconds} sec between sets</dd></div>
            </dl>
          )}
        </div>
        <div className="workout-timer" aria-label={`Workout time ${formatTime(elapsedSeconds)}`}>
          <Icon name="clock" /> <span>{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="active-workout-grid">
        <section className="exercise-demo" aria-label={`${exercise.name} form guide`}>
          {currentExerciseMedia.videoUrl ? (
            <video
              aria-label={`${exercise.name} exercise demonstration`}
              className="active-exercise-video"
              controls
              playsInline
              preload="metadata"
              src={currentExerciseMedia.videoUrl}
            >
              Your browser does not support embedded videos.
            </video>
          ) : (
            <>
              <ExerciseFigure />
              {showGuide && (
                <div className="form-guide">
                  <p className="eyebrow">FORM TIP</p>
                  <strong>Move with control</strong>
                  <span>{exercise.instruction}</span>
                </div>
              )}
              <button className="form-guide-button" onClick={() => setShowGuide((visible) => !visible)} type="button">
                <Icon name={showGuide ? 'check' : 'play'} />
                {showGuide ? 'Hide form guide' : 'Watch form guide'}
              </button>
              {currentExerciseMedia.loading && <p className="exercise-video-status" role="status">Loading exercise video…</p>}
              {!currentExerciseMedia.loading && currentExerciseMedia.error && (
                <p className="exercise-video-status" role="status">Video unavailable. Showing the form guide instead.</p>
              )}
              {!currentExerciseMedia.loading && !currentExerciseMedia.error && externalExerciseId && (
                <p className="exercise-video-status" role="status">No video demo is available for this exercise. Showing the form guide instead.</p>
              )}
            </>
          )}
        </section>

        <section className="set-logger" aria-labelledby="set-logger-title">
          <h3 id="set-logger-title">Log your sets</h3>
          <p className="set-target">Target: {exercise.sets} sets × {exercise.reps} {exercise.unit || 'reps'}</p>
          <div className="set-list">
            {sets[exerciseIndex].map((set, index) => (
              <div className="set-row" key={`${exerciseIndex}-${index}`}>
                <button
                  aria-label={`${set.completed ? 'Mark' : 'Complete'} set ${index + 1}`}
                  aria-pressed={set.completed}
                  className={`set-complete ${set.completed ? 'is-completed' : ''}`}
                  onClick={() => updateSet(index, (current) => ({ ...current, completed: !current.completed }))}
                  type="button"
                >
                  {set.completed ? <Icon name="check" /> : index + 1}
                </button>
                <strong>Set {index + 1}</strong>
                <div className="rep-control" aria-label={`Repetitions for set ${index + 1}`}>
                  <button
                    aria-label={`Decrease set ${index + 1} ${exercise.unit || 'reps'}`}
                    disabled={set.reps <= 0}
                    onClick={() => updateSet(index, (current) => ({ ...current, reps: Math.max(0, current.reps - 1) }))}
                    type="button"
                  >−</button>
                  <span>{set.reps}</span>
                  <button
                    aria-label={`Increase set ${index + 1} ${exercise.unit || 'reps'}`}
                    onClick={() => updateSet(index, (current) => ({ ...current, reps: current.reps + 1 }))}
                    type="button"
                  >+</button>
                </div>
                <span className="rep-unit">{exercise.unit || 'reps'}</span>
              </div>
            ))}
          </div>
          <button className="primary-button complete-exercise-button" onClick={finishExercise} type="button">
            {completedExercises.filter(Boolean).length === exercises.length - 1 && !completedExercises[exerciseIndex]
              ? 'Complete final exercise'
              : completedExercises[exerciseIndex] ? 'Complete exercise again' : 'Complete exercise'}
            <Icon name="check" />
          </button>
          <p className="workout-finish-hint">
            {exercises.length - completedExercises.filter(Boolean).length} exercises remaining
          </p>
        </section>
      </div>
    </section>
  );
}

export default ActiveWorkout;
