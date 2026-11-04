import { useState } from 'react';
import Icon from './Icon';

const workouts = [
  {
    day: 'MONDAY · COMPLETED',
    name: 'Full Body Foundation',
    exercises: '7 exercises · 28 min',
    details: ['Bodyweight squat', 'Incline push-up', 'Glute bridge', 'Bird dog'],
    completed: true,
  },
  {
    day: 'WEDNESDAY · COMPLETED',
    name: 'Core & Stability',
    exercises: '7 exercises · 30 min',
    details: ['Dead bug', 'Bird dog', 'Glute bridge', 'Knee plank'],
    completed: true,
  },
  {
    day: 'FRIDAY · UP NEXT',
    name: 'Lower Body Basics',
    exercises: '7 exercises · 32 min',
    details: ['Bodyweight squat', 'Reverse lunge', 'Glute bridge', 'Calf raise'],
    completed: false,
  },
];

function WorkoutPlan({ onBrowseExercises, onStartWorkout, planExercises = [] }) {
  const [expandedWorkout, setExpandedWorkout] = useState(null);

  return (
    <section className="screen-stack plan-screen" aria-label="Personalized workout plan">
      <section className="plan-hero">
        <div className="plan-hero-copy">
          <span className="plan-week">WEEK 2 OF 8</span>
          <h2>Your strength foundation plan</h2>
          <p>3 workouts per week <span>·</span> 25–35 minutes</p>
        </div>
        <div className="plan-overall-progress">
          <strong>18%</strong>
          <span>Overall progress</span>
        </div>
      </section>

      <div className="plan-section-heading">
        <h2>This week’s workouts</h2>
        <span>2 of 3 completed</span>
      </div>

      <div className="plan-workout-list">
        {workouts.map((workout, index) => {
          const isExpanded = expandedWorkout === index;
          return (
            <article className={`plan-workout ${isExpanded ? 'is-expanded' : ''}`} key={workout.name}>
              <div className="plan-workout-main">
                <span className={`workout-status ${workout.completed ? 'is-completed' : ''}`}>
                  {workout.completed ? <Icon name="check" /> : index + 1}
                </span>
                <div className="plan-workout-copy">
                  <p className="eyebrow">{workout.day}</p>
                  <h3>{workout.name}</h3>
                  <span>{workout.exercises}</span>
                </div>
                {!workout.completed && (
                  <button className="primary-button plan-start-button" onClick={() => onStartWorkout(workout.name)} type="button">
                    Start workout
                  </button>
                )}
                <button
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Hide' : 'View'} ${workout.name} exercises`}
                  className={`plan-detail-button ${isExpanded ? 'is-open' : ''}`}
                  onClick={() => setExpandedWorkout(isExpanded ? null : index)}
                  type="button"
                >
                  <Icon name="arrow" />
                </button>
              </div>
              {isExpanded && (
                <ul className="plan-exercise-details">
                  {workout.details.map((exercise) => <li key={exercise}>{exercise}</li>)}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      {planExercises.length > 0 && (
        <section className="saved-plan-exercises" aria-labelledby="saved-plan-title">
          <div className="plan-section-heading">
            <h2 id="saved-plan-title">Exercises you added</h2>
            <span>{planExercises.length} saved</span>
          </div>
          <ul>
            {planExercises.map((exercise) => (
              <li key={exercise.id}>
                <span><strong>{exercise.name}</strong><small>{exercise.category} · {exercise.level}</small></span>
                <span>{exercise.sets} sets · {exercise.reps}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="text-link plan-browse-link" onClick={onBrowseExercises} type="button">
        Explore the exercise library <Icon name="arrow" />
      </button>
    </section>
  );
}

export default WorkoutPlan;
