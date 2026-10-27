import { useEffect, useState } from 'react';
import Icon from './Icon';

const exercises = [
  { name: 'Bodyweight Squat', instruction: 'Keep your chest lifted and knees tracking over your toes.', reps: 10 },
  { name: 'Incline Push-up', instruction: 'Keep your body in a straight line as you lower your chest toward the bench.', reps: 8 },
  { name: 'Glute Bridge', instruction: 'Press through your heels and squeeze your glutes at the top.', reps: 12 },
  { name: 'Bird Dog', instruction: 'Reach opposite arm and leg long while keeping your hips level.', reps: 10 },
  { name: 'Reverse Lunge', instruction: 'Step back softly and keep your front knee stacked over your ankle.', reps: 8 },
  { name: 'Dumbbell Row', instruction: 'Pull your elbow toward your hip without rounding your back.', reps: 10 },
  { name: 'Plank Hold', instruction: 'Brace your core and keep a long, steady line from head to heels.', reps: 30, unit: 'sec' },
];

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

function ActiveWorkout({ onFinish }) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(402);
  const [showGuide, setShowGuide] = useState(false);
  const [sets, setSets] = useState(() => exercises.map((exercise, index) => (
    Array.from({ length: 3 }, (_, setIndex) => ({
      completed: index === 0 && setIndex < 2,
      reps: index === 0 && setIndex < 2 ? exercise.reps : 0,
    }))
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
      onFinish();
      return;
    }
    setExerciseIndex((index) => index + 1);
    setShowGuide(false);
  };

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
