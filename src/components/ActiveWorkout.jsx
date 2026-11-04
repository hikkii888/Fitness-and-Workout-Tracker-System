import { useEffect, useMemo, useState } from 'react';
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

function ActiveWorkout({ exercises: exerciseCatalog, onFinish, workoutName }) {
  const exercises = useMemo(() => exerciseCatalog.map((exercise) => ({
    ...exercise,
    reps: Number(exercise.reps.match(/\d+/)?.[0]) || 10,
    unit: /\bsec\b/i.test(exercise.reps) ? 'sec' : 'reps',
  })), [exerciseCatalog]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [sets, setSets] = useState(() => exercises.map((exercise) => (
    Array.from({ length: exercise.sets }, () => ({ completed: false, reps: exercise.reps }))
  )));

  useEffect(() => {
    const timerId = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const exercise = exercises[exerciseIndex];
  const updateSet = (setIndex, update) => {
    setSets((current) => current.map((exerciseSets, index) => (
      index === exerciseIndex
        ? exerciseSets.map((set, currentSetIndex) => currentSetIndex === setIndex ? update(set) : set)
        : exerciseSets
    )));
  };

  const finishExercise = () => {
    if (exerciseIndex === exercises.length - 1) {
      onFinish({
        name: workoutName,
        duration: Math.max(1, Math.ceil(elapsedSeconds / 60)),
        exercises: exercises.map((workoutExercise, index) => ({
          name: workoutExercise.name,
          sets: sets[index],
        })),
      });
      return;
    }
    setExerciseIndex((index) => index + 1);
    setShowGuide(false);
  };

  if (exercises.length === 0) {
    return <p className="api-error" role="alert">Exercise catalog is unavailable. Please return to the exercise library and try again.</p>;
  }

  return (
    <section className="active-workout-screen" aria-label="Active workout and exercise logging">
      <div className="active-exercise-heading">
        <div>
          <span className="exercise-step">EXERCISE {exerciseIndex + 1} OF {exercises.length}</span>
          <h2>{exercise.name}</h2>
          <p>{exercise.instruction}</p>
        </div>
        <div className="workout-timer" aria-label={`Workout time ${formatTime(elapsedSeconds)}`}>
          <Icon name="clock" /> <span>{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="active-workout-grid">
        <section className="exercise-demo" aria-label={`${exercise.name} form guide`}>
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
        </section>

        <section className="set-logger" aria-labelledby="set-logger-title">
          <h3 id="set-logger-title">Log your sets</h3>
          <p className="set-target">Target: 3 sets × {exercise.reps} {exercise.unit || 'reps'}</p>
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
            {exerciseIndex === exercises.length - 1 ? 'Finish workout' : 'Complete exercise'}
            <Icon name="check" />
          </button>
          <p className="workout-finish-hint">
            {exerciseIndex === exercises.length - 1 ? 'Ready to wrap up?' : `${exercises.length - exerciseIndex - 1} exercises remaining`}
          </p>
        </section>
      </div>
    </section>
  );
}

export default ActiveWorkout;
