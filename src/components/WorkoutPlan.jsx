import { useState } from 'react';
import { fetchWorkoutExerciseCandidates } from '../exerciseApiService';
import {
  createPlannedExercise,
  exerciseMatchesFocus,
  getSessionExercises,
  getTrainingDays,
  normalizeFitnessProfile,
} from '../workoutPlan';
import Icon from './Icon';

const goalTitles = {
  'Build Strength': 'Strength-building plan',
  'Build Muscle': 'Muscle-building plan',
  'Lose Weight': 'Weight-loss plan',
  'Improve Endurance': 'Endurance-building plan',
  'Get Abs': 'Core-focused plan',
  'Stay Active': 'Movement and mobility plan',
};

function WorkoutExerciseCard({ exercise, onToggle, onRemove, replaceControl }) {
  const isComplete = exercise.completed;
  return (
    <article className={`generated-exercise-card ${isComplete ? 'is-completed' : ''}`}>
      <div className="generated-exercise-heading">
        <button
          aria-label={`${isComplete ? 'Mark' : 'Complete'} ${exercise.name}`}
          aria-pressed={isComplete}
          className={`set-complete ${isComplete ? 'is-completed' : ''}`}
          onClick={onToggle}
          type="button"
        >
          {isComplete ? <Icon name="check" /> : <span aria-hidden="true">○</span>}
        </button>
        <div>
          <span className="exercise-tags">
            <span>{exercise.role.replace('-', ' ')}</span>
            <span>{exercise.level}</span>
            <span>{exercise.category.replaceAll('_', ' ')}</span>
          </span>
          <h4>{exercise.name}</h4>
        </div>
      </div>
      <dl className="generated-exercise-metadata">
        <div><dt>Target muscles</dt><dd>{exercise.primaryMuscles.join(', ')}</dd></div>
        <div><dt>Equipment</dt><dd>{exercise.equipment}</dd></div>
        <div><dt>Sets and reps</dt><dd>{exercise.sets} × {exercise.reps}</dd></div>
        <div><dt>Rest</dt><dd>{exercise.restSeconds} sec between sets</dd></div>
      </dl>
      <p className="generated-exercise-prescription-note">{exercise.prescriptionSource}</p>
      <ol className="generated-exercise-instructions">
        {exercise.instructions.map((instruction, index) => <li key={`${exercise.id}-${index}`}>{instruction}</li>)}
      </ol>
      {replaceControl}
      {onRemove && (
        <button className="text-link generated-exercise-remove" onClick={onRemove} type="button">
          Remove from this session
        </button>
      )}
    </article>
  );
}

function WorkoutPlan({
  fitnessProfile,
  workoutPlan,
  planLoading = false,
  planError = '',
  onGenerateWorkoutPlan,
  onSetFitnessGoal,
  onBrowseExercises,
  onStartWorkout,
  onUpdateWorkoutPlan,
  onRemovePlanExercise,
  planExercises = [],
}) {
  const [expandedSession, setExpandedSession] = useState('');
  const [candidatePool, setCandidatePool] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState('');
  const [openPickerSession, setOpenPickerSession] = useState('');
  const [replacementSelections, setReplacementSelections] = useState({});
  const [additionSelections, setAdditionSelections] = useState({});
  const [savingPlan, setSavingPlan] = useState(false);
  const [editError, setEditError] = useState('');
  const profile = normalizeFitnessProfile(fitnessProfile);
  const planMatchesProfile = Boolean(
    workoutPlan
    && profile
    && workoutPlan.profile.goal === profile.goal
    && workoutPlan.profile.days === profile.days
    && workoutPlan.profile.experience === profile.experience,
  );
  const sessions = planMatchesProfile ? workoutPlan.sessions : [];
  const planReady = sessions.length > 0;
  const days = getTrainingDays(profile?.days);
  const recoveryDays = planMatchesProfile
    ? workoutPlan.recoveryDays
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter((day) => !days.includes(day));

  const savePlan = async (nextPlan) => {
    setSavingPlan(true);
    setEditError('');
    try {
      await onUpdateWorkoutPlan(nextPlan);
    } catch (error) {
      setEditError(error.message || 'The workout plan could not be saved.');
    } finally {
      setSavingPlan(false);
    }
  };

  const loadCandidates = async () => {
    if (candidatePool.length) return;
    setCandidateLoading(true);
    setCandidateError('');
    try {
      const candidates = await fetchWorkoutExerciseCandidates(profile);
      setCandidatePool(candidates.exercises);
    } catch (error) {
      setCandidateError(error.message || 'ExerciseAPI.dev alternatives could not be loaded.');
    } finally {
      setCandidateLoading(false);
    }
  };

  const customizeSession = async (session) => {
    if (expandedSession === session.id) {
      setExpandedSession('');
      setOpenPickerSession('');
      return;
    }
    setExpandedSession(session.id);
    setOpenPickerSession(session.id);
    await loadCandidates();
  };

  const updateSession = (sessionId, update) => {
    const updatedPlan = {
      ...workoutPlan,
      sessions: workoutPlan.sessions.map((session) => session.id === sessionId ? update(session) : session),
    };
    return savePlan(updatedPlan);
  };

  const currentExerciseIds = () => new Set(
    sessions.flatMap((session) => session.exercises.map((exercise) => exercise.id)),
  );

  const availableCandidates = (session) => {
    const usedIds = currentExerciseIds();
    return candidatePool.filter((candidate) => (
      !usedIds.has(candidate.id)
      && exerciseMatchesFocus(candidate, session.focus)
    ));
  };

  const addCandidate = (session) => {
    const candidate = candidatePool.find((exercise) => exercise.id === additionSelections[session.id]);
    if (!candidate || session.exercises.length >= 8) return;
    void updateSession(session.id, (current) => ({
      ...current,
      exercises: [...current.exercises, createPlannedExercise(candidate, profile.experience)],
    }));
    setAdditionSelections((current) => ({ ...current, [session.id]: '' }));
  };

  const replaceCandidate = (session, exercise) => {
    const candidate = candidatePool.find((item) => item.id === replacementSelections[`${session.id}:${exercise.id}`]);
    if (!candidate) return;
    void updateSession(session.id, (current) => ({
      ...current,
      exercises: current.exercises.map((item) => (
        item.id === exercise.id ? createPlannedExercise(candidate, profile.experience) : item
      )),
    }));
    setReplacementSelections((current) => ({ ...current, [`${session.id}:${exercise.id}`]: '' }));
  };

  const toggleCompleted = (session, exercise) => {
    const updateList = (items) => items.map((item) => (
      item.id === exercise.id ? { ...item, completed: !item.completed } : item
    ));
    void updateSession(session.id, (current) => ({
      ...current,
      warmup: updateList(current.warmup),
      exercises: updateList(current.exercises),
      cooldown: updateList(current.cooldown),
    }));
  };

  const removeExercise = (session, exercise) => {
    if (session.exercises.length <= 3) return;
    void updateSession(session.id, (current) => ({
      ...current,
      exercises: current.exercises.filter((item) => item.id !== exercise.id),
    }));
  };

  const renderExercise = (session, exercise, editable = true) => {
    const replacementKey = `${session.id}:${exercise.id}`;
    const replacementOptions = availableCandidates(session);
    const replaceControl = editable && openPickerSession === session.id && candidatePool.length > 0 ? (
      <div className="generated-exercise-actions">
        <label>
          <span className="sr-only">Replace {exercise.name} with an ExerciseAPI exercise</span>
          <select
            aria-label={`Replacement for ${exercise.name}`}
            onChange={(event) => setReplacementSelections((current) => ({
              ...current,
              [replacementKey]: event.target.value,
            }))}
            value={replacementSelections[replacementKey] || ''}
          >
            <option value="">Choose a replacement exercise</option>
            {replacementOptions.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.level}</option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button"
          disabled={!replacementSelections[replacementKey] || savingPlan}
          onClick={() => replaceCandidate(session, exercise)}
          type="button"
        >
          Replace
        </button>
      </div>
    ) : null;

    return (
      <WorkoutExerciseCard
        exercise={exercise}
        key={`${session.id}-${exercise.id}`}
        onToggle={() => toggleCompleted(session, exercise)}
        onRemove={editable && session.exercises.length > 3 ? () => removeExercise(session, exercise) : null}
        replaceControl={replaceControl}
      />
    );
  };

  return (
    <section className="screen-stack plan-screen" aria-label="Personalized workout plan">
      <section className="plan-hero">
        <div className="plan-hero-copy">
          <span className="plan-week">YOUR PERSONALIZED PLAN</span>
          <h2>{goalTitles[profile?.goal] || 'Personalized workout plan'}</h2>
          <p>
            {profile?.days || '3 days per week'}
            {profile?.experience && <> <span>·</span> {profile.experience}</>}
          </p>
        </div>
        <div className="plan-overall-progress">
          <strong>{planReady ? sessions.reduce((total, session) => total + session.exercises.length, 0) : 0}</strong>
          <span>API exercises scheduled</span>
        </div>
      </section>

      <div className="plan-section-heading generated-plan-heading">
        <div>
          <h2>Your generated weekly workouts</h2>
          <p>Exercise details come from ExerciseAPI.dev. Sets, reps, and rest are application recommendations.</p>
        </div>
        {planReady && (
          <button
            className="secondary-button"
            disabled={planLoading || savingPlan}
            onClick={() => onGenerateWorkoutPlan(true)}
            type="button"
          >
            {planLoading ? 'Regenerating…' : 'Regenerate plan'}
          </button>
        )}
      </div>

      {planError && <p className="api-error" role="alert">{planError}</p>}
      {editError && <p className="api-error" role="alert">{editError}</p>}
      {planLoading ? (
        <p className="history-loading" role="status">Fetching ExerciseAPI.dev exercises and building your weekly schedule…</p>
      ) : planReady ? (
        <div className="generated-workout-list">
          {sessions.map((session) => {
            const expanded = expandedSession === session.id;
            const sessionOptions = availableCandidates(session);
            return (
              <article className={`plan-workout generated-workout ${expanded ? 'is-expanded' : ''}`} key={session.id}>
                <div className="plan-workout-main">
                  <span className="workout-status"><Icon name="bolt" /></span>
                  <div className="plan-workout-copy">
                    <p className="eyebrow">{session.day.toUpperCase()} · {session.focus.toUpperCase()}</p>
                    <h3>{session.name}</h3>
                    <span>{session.exercises.length} exercises · includes warm-up and cool-down</span>
                  </div>
                  <button
                    className="primary-button plan-start-button"
                    disabled={savingPlan}
                    onClick={() => onStartWorkout(session.name, getSessionExercises(session))}
                    type="button"
                  >
                    Start workout
                  </button>
                  <button
                    aria-expanded={expanded}
                    className="secondary-button plan-customize-button"
                    onClick={() => void customizeSession(session)}
                    type="button"
                  >
                    {expanded ? 'Close editor' : 'Customize'}
                    <Icon name="arrow" />
                  </button>
                </div>

                {expanded && (
                  <div className="generated-session-details">
                    <h4>Warm-up</h4>
                    {session.warmup.map((exercise) => renderExercise(session, exercise, false))}
                    <h4>Main workout</h4>
                    {session.exercises.map((exercise) => renderExercise(session, exercise))}
                    {session.exercises.length < 8 && (
                      <div className="generated-exercise-actions generated-add-exercise">
                        {openPickerSession === session.id && candidatePool.length > 0 ? (
                          <>
                            <label>
                              <span className="sr-only">Add an ExerciseAPI exercise to {session.name}</span>
                              <select
                                aria-label={`Exercise to add to ${session.name}`}
                                onChange={(event) => setAdditionSelections((current) => ({
                                  ...current,
                                  [session.id]: event.target.value,
                                }))}
                                value={additionSelections[session.id] || ''}
                              >
                                <option value="">Choose an exercise to add</option>
                                {sessionOptions.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.level}</option>
                                ))}
                              </select>
                            </label>
                            <button
                              className="secondary-button"
                              disabled={!additionSelections[session.id] || savingPlan}
                              onClick={() => addCandidate(session)}
                              type="button"
                            >
                              Add exercise
                            </button>
                          </>
                        ) : (
                          <button
                            className="secondary-button"
                            disabled={candidateLoading || candidatePool.length > 0}
                            onClick={async () => {
                              setOpenPickerSession(session.id);
                              await loadCandidates();
                            }}
                            type="button"
                          >
                            {candidateLoading ? 'Loading API exercises…' : 'Load replacement or add options'}
                          </button>
                        )}
                        {openPickerSession === session.id && candidatePool.length > 0 && (
                          <button className="text-link" onClick={() => setOpenPickerSession('')} type="button">Close options</button>
                        )}
                      </div>
                    )}
                    {candidateError && openPickerSession === session.id && <p className="api-error" role="alert">{candidateError}</p>}
                    <h4>Cool-down</h4>
                    {session.cooldown.map((exercise) => renderExercise(session, exercise, false))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="library-empty plan-empty">
          <span className="empty-mark"><Icon name="library" /></span>
          <h3>{workoutPlan && !planMatchesProfile ? 'Your selections changed' : 'Generate your weekly workout plan'}</h3>
          <p>
            {workoutPlan && !planMatchesProfile
              ? 'Your saved schedule uses different goal settings. Generate a fresh schedule to match your current goal, frequency, and experience.'
              : 'Your selections will be matched against ExerciseAPI.dev. The app will organize API exercises into sessions and assign clearly labeled set, rep, and rest recommendations.'}
          </p>
          <button
            className="primary-button"
            disabled={planLoading || !profile}
            onClick={() => onGenerateWorkoutPlan(false)}
            type="button"
          >
            {planLoading ? 'Generating…' : 'Generate workout plan'} <Icon name="arrow" />
          </button>
          {!profile && (
            <button className="secondary-button" onClick={onSetFitnessGoal} type="button">
              Choose a fitness goal
            </button>
          )}
          <button className="text-link" onClick={onBrowseExercises} type="button">Open ExerciseAPI catalog</button>
        </div>
      )}

      {planReady && (
        <section className="recovery-days-section" aria-label="Weekly recovery days">
          <h3>Recovery days</h3>
          {recoveryDays.length
            ? <p>{recoveryDays.join(', ')} — use these days for rest and recovery.</p>
            : <p>No full rest days are scheduled at this frequency. Consider changing your training frequency to include recovery time.</p>}
          <small>Plan generated {new Date(workoutPlan.generatedAt).toLocaleString()} · API exercise data is distinct from application-generated prescriptions.</small>
        </section>
      )}

      {candidateLoading && <p className="history-loading" role="status">Loading replacement exercises from ExerciseAPI.dev…</p>}
      {savingPlan && <p className="history-loading" role="status">Saving your workout changes…</p>}

      {planExercises.length > 0 && (
        <section className="saved-plan-exercises" aria-labelledby="saved-plan-title">
          <div className="plan-section-heading">
            <h2 id="saved-plan-title">Exercises saved from the library</h2>
            <span>{planExercises.length} saved</span>
          </div>
          <ul>
            {planExercises.map((exercise) => (
              <li key={exercise.id}>
                <span><strong>{exercise.name}</strong><small>{exercise.category} · {exercise.level}</small></span>
                <span>{exercise.sets} sets · {exercise.reps}</span>
                <button
                  className="text-link saved-exercise-remove"
                  onClick={() => onRemovePlanExercise(exercise)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="text-link plan-browse-link" onClick={onBrowseExercises} type="button">
        Explore ExerciseAPI.dev catalog <Icon name="arrow" />
      </button>
    </section>
  );
}

export default WorkoutPlan;
