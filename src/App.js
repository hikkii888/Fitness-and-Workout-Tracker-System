import { useEffect, useState } from 'react';
import { apiRequest, toExerciseNames } from './api';
import { fetchWorkoutExerciseCandidates } from './exerciseApiService';
import ActiveWorkout from './pages/ActiveWorkout';
import Achievements from './pages/Achievements';
import AuthScreen from './pages/AuthScreen';
import FitnessGoalSelection from './pages/FitnessGoalSelection';
import ExerciseLibrary from './pages/ExerciseLibrary';
import HomeDashboard from './pages/HomeDashboard';
import Icon from './pages/Icon';
import ProfilePage from './pages/ProfilePage';
import WorkoutSchedule from './pages/WorkoutSchedule';
import WorkoutPlan from './pages/WorkoutPlan';
import WorkoutFeedback from './pages/WorkoutFeedback';
import { createWorkoutPlan } from './workoutPlan';

const progressMetricOptions = ['Workouts', 'Active minutes', 'Total reps'];

const navigation = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'goals', label: 'Fitness Goals', icon: 'target' },
  { id: 'plan', label: 'My Plan', icon: 'calendar' },
  { id: 'library', label: 'Exercise Library', icon: 'library' },
  { id: 'workout', label: 'Active Workout', icon: 'play' },
  { id: 'feedback', label: 'Workout Feedback', icon: 'message' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar' },
  { id: 'achievements', label: 'Achievements', icon: 'star' },
  { id: 'history', label: 'Workout History', icon: 'history' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

function formatWorkoutDate(date) {
  const parsedDate = date.length === 10 ? new Date(`${date}T12:00:00`) : new Date(date);
  return parsedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function ProgressAnalytics() {
  const [metric, setMetric] = useState('Workouts');
  const [period, setPeriod] = useState(8);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [trainingBalance, setTrainingBalance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiRequest('/progress'), apiRequest('/progress/balance')])
      .then(([stats, balance]) => {
        setWeeklyStats(stats);
        setTrainingBalance(balance);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const selectedMetric = {
    Workouts: { field: 'workouts', unit: 'workouts' },
    'Active minutes': { field: 'minutes', unit: 'minutes' },
    'Total reps': { field: 'reps', unit: 'reps' },
  }[metric];
  const visibleStats = weeklyStats.slice(-period);
  const visibleValues = visibleStats.length
    ? visibleStats.map((week) => week[selectedMetric.field])
    : [0];
  const chartMax = Math.max(...visibleValues, 1);
  const chartPath = visibleValues.map((value, index) => {
    const x = visibleValues.length === 1 ? 350 : 12 + (index * 676) / (visibleValues.length - 1);
    const y = 120 - (value / chartMax) * 100;
    return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }).join(' ');
  const periodTotal = visibleValues.reduce((total, value) => total + value, 0);
  const weeklyAverage = Math.round(periodTotal / period);
  const totalWorkouts = weeklyStats.reduce((total, week) => total + week.workouts, 0);
  const totalActiveMinutes = weeklyStats.reduce((total, week) => total + week.minutes, 0);
  const totalReps = weeklyStats.reduce((total, week) => total + week.reps, 0);
  const averageWorkoutsPerWeek = (totalWorkouts / 8).toFixed(1);

  return (
    <section className="progress-screen" aria-label="Progress and workout analytics">
      <div className="progress-metric-grid">
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="calendar" /></span>
          <strong>{totalWorkouts}</strong><b>Workouts</b><small>Last 8 weeks</small>
        </article>
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="clock" /></span>
          <strong>{totalActiveMinutes.toLocaleString()}</strong><b>Active min</b><small>Last 8 weeks</small>
        </article>
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="bolt" /></span>
          <strong>{totalReps.toLocaleString()}</strong><b>Total reps</b><small>Last 8 weeks</small>
        </article>
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="flame" /></span>
          <strong>{averageWorkoutsPerWeek}</strong><b>Workouts / week</b><small>8-week average</small>
        </article>
      </div>

      {error && <p className="api-error" role="alert">{error}</p>}

      <div className="progress-detail-grid">
        <article className="panel consistency-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">LAST {period} WEEKS</p><h3>Workout consistency</h3></div>
            <div className="progress-controls">
              <label className="metric-select-label">
                <span className="sr-only">Choose progress metric</span>
                <select aria-label="Choose progress metric" onChange={(event) => setMetric(event.target.value)} value={metric}>
                  {progressMetricOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="metric-select-label">
                <span className="sr-only">Choose chart period</span>
                <select aria-label="Choose chart period" onChange={(event) => setPeriod(Number(event.target.value))} value={period}>
                  <option value={4}>4 weeks</option>
                  <option value={8}>8 weeks</option>
                </select>
              </label>
            </div>
          </div>
          <div className="progress-period-summary" aria-live="polite">
            <strong>{periodTotal.toLocaleString()} {selectedMetric.unit}</strong>
            <span>{weeklyAverage.toLocaleString()} {selectedMetric.unit} per week on average</span>
          </div>
          <svg className="consistency-chart" viewBox="0 0 700 145" preserveAspectRatio="none" role="img" aria-label={`${metric} per week for the last ${period} weeks`}>
            <path d={`${chartPath} L688 130 L12 130 Z`} className="consistency-area" />
            <path d={chartPath} className="consistency-line" />
          </svg>
          <div className="consistency-axis">{visibleStats.map((week, index) => <span key={week.week}>W{index + 1}</span>)}</div>
          {totalWorkouts === 0 && <p className="progress-empty">Complete a workout to see your progress here.</p>}
        </article>

        <article className="panel muscle-panel">
          <p className="eyebrow">MUSCLE GROUPS</p>
          <h3>Training balance</h3>
          <p className="balance-caption">Share of your logged exercise volume</p>
          {trainingBalance.map((group) => {
            const totalVolume = trainingBalance.reduce((total, item) => total + item.volume, 0);
            const share = totalVolume ? Math.round((group.volume / totalVolume) * 100) : 0;
            return (
            <div className="muscle-progress" key={group.category}>
              <div><span>{group.category}</span><strong>{share}%</strong></div>
              <div className="progress-track"><span style={{ width: `${share}%` }} /></div>
            </div>
          );})}
          {trainingBalance.length === 0 && <p className="progress-empty">Exercise volume will appear after your first saved workout.</p>}
        </article>
      </div>
    </section>
  );
}

function WorkoutHistory() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [dialog, setDialog] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftDuration, setDraftDuration] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    apiRequest('/workouts')
      .then(setRecords)
      .catch((requestError) => setHistoryError(requestError.message))
      .finally(() => setHistoryLoading(false));
  }, []);

  const visibleRecords = records.filter((record) => {
    const matchesSearch = `${record.name} ${toExerciseNames(record.exercises).join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!monthFilter || record.date.startsWith(monthFilter));
  });
  const monthDate = monthFilter ? new Date(`${monthFilter}-01T12:00:00`) : null;
  const rangeLabel = monthDate
    ? `${monthDate.toLocaleDateString('en-US', { month: 'short' })} 1 – ${new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'All dates';

  const startEdit = (record) => {
    setDraftName(record.name);
    setDraftDuration(String(record.duration));
    setDialog({ type: 'edit', record });
  };

  const saveEdit = async () => {
    try {
      const updated = await apiRequest(`/workouts/${dialog.record.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: draftName.trim() || dialog.record.name,
          duration: Math.max(1, Number(draftDuration) || dialog.record.duration),
        }),
      });
      setRecords((current) => current.map((record) => record.id === updated.id ? { ...record, ...updated } : record));
      setDialog(null);
      setHistoryError('');
    } catch (requestError) {
      setHistoryError(requestError.message);
    }
  };

  const deleteWorkout = async (id) => {
    try {
      await apiRequest(`/workouts/${id}`, { method: 'DELETE' });
      setRecords((current) => current.filter((record) => record.id !== id));
      setDialog(null);
      setHistoryError('');
    } catch (requestError) {
      setHistoryError(requestError.message);
    }
  };

  return (
    <section className="screen-stack history-screen" aria-label="Workout history and record management">
      {historyError && <p className="api-error" role="alert">{historyError}</p>}
      <div className="history-filters">
        <label className="history-search">
          <Icon name="search" />
          <input aria-label="Search workout history" onChange={(event) => setSearch(event.target.value)} placeholder="Search workout history..." type="search" value={search} />
        </label>
        <label className="history-date-range">
          <Icon name="calendar" />
          <span>{rangeLabel}</span>
          <input aria-label="Filter workout history by month" onChange={(event) => setMonthFilter(event.target.value)} type="month" value={monthFilter} />
        </label>
      </div>

      {visibleRecords.length > 0 ? (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr><th scope="col">DATE</th><th scope="col">WORKOUT</th><th scope="col">DURATION</th><th scope="col">STATUS</th><th scope="col">ACTIONS</th></tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id}>
                  <td>{formatWorkoutDate(record.date)}</td>
                  <td>
                    <button className="record-name-button" onClick={() => setDialog({ type: 'details', record })} type="button">{record.name}</button>
                    <span className="record-program-label">Beginner program</span>
                  </td>
                  <td>{record.duration} min</td>
                  <td><span className={`history-status ${record.status === 'Modified' ? 'is-modified' : ''}`}>{record.status}</span></td>
                  <td>
                    <div className="history-table-actions">
                      <button aria-label={`Edit ${record.name}`} className="table-action edit-action" onClick={() => startEdit(record)} type="button"><Icon name="edit" /></button>
                      <button aria-label={`Delete ${record.name}`} className="table-action delete-action" onClick={() => setDialog({ type: 'delete', record })} type="button"><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : historyLoading ? (
        <p className="history-loading" role="status">Loading workout history…</p>
      ) : (
        <div className="history-empty">
          <span className="empty-mark"><Icon name={records.length ? 'search' : 'history'} /></span>
          <h3>{records.length ? 'No matching workouts' : 'Your history starts here'}</h3>
          <p>{records.length ? 'Try another search or month to find a session.' : 'Completed workouts will appear here, ready whenever you want to look back.'}</p>
          {(search || monthFilter) && <button className="text-link" onClick={() => { setSearch(''); setMonthFilter(''); }} type="button">Clear filters</button>}
        </div>
      )}

      {dialog && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <section aria-labelledby="history-dialog-title" aria-modal="true" className="history-dialog" role="dialog">
            <button aria-label="Close dialog" className="dialog-close" onClick={() => setDialog(null)} type="button">×</button>
            {dialog.type === 'delete' && <>
              <span className="dialog-symbol delete-symbol"><Icon name="history" /></span>
              <p className="eyebrow">REMOVE RECORD</p><h2 id="history-dialog-title">Delete this workout?</h2>
              <p className="dialog-description"><strong>{dialog.record.name}</strong> will be permanently removed from your workout history.</p>
              <div className="dialog-actions"><button className="secondary-button" onClick={() => setDialog(null)} type="button">Keep record</button><button className="danger-button" onClick={() => deleteWorkout(dialog.record.id)} type="button">Delete workout</button></div>
            </>}
            {dialog.type === 'details' && <>
              <p className="eyebrow">{formatWorkoutDate(dialog.record.date)} · {dialog.record.duration} MIN</p><h2 id="history-dialog-title">{dialog.record.name}</h2>
              <p className="dialog-description">Completed exercises</p>
              <ol className="exercise-detail-list">{toExerciseNames(dialog.record.exercises).map((exercise, index) => <li key={`${exercise}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{exercise}<Icon name="check" /></li>)}</ol>
              <button className="primary-button dialog-done" onClick={() => setDialog(null)} type="button">Done</button>
            </>}
            {dialog.type === 'edit' && <>
              <p className="eyebrow">UPDATE SAVED SESSION</p><h2 id="history-dialog-title">Edit workout record</h2>
              <label className="edit-field">Workout name<input onChange={(event) => setDraftName(event.target.value)} value={draftName} /></label>
              <label className="edit-field">Duration (minutes)<input min="1" onChange={(event) => setDraftDuration(event.target.value)} type="number" value={draftDuration} /></label>
              <div className="dialog-actions"><button className="secondary-button" onClick={() => setDialog(null)} type="button">Cancel</button><button className="primary-button" onClick={saveEdit} type="button">Save changes</button></div>
            </>}
          </section>
        </div>
      )}
    </section>
  );
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('checking');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authRetry, setAuthRetry] = useState(0);
  const [notice, setNotice] = useState('');
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [pendingWorkout, setPendingWorkout] = useState(null);
  const [planExercises, setPlanExercises] = useState([]);
  const [fitnessProfile, setFitnessProfile] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [activeWorkoutName, setActiveWorkoutName] = useState('Full Body Foundation');
  const [activeWorkoutExercises, setActiveWorkoutExercises] = useState([]);
  const [workoutStatus, setWorkoutStatus] = useState('none');

  useEffect(() => {
    let active = true;
    apiRequest('/auth/me')
      .then(({ user }) => {
        if (active) {
          setCurrentUser(user);
          setAuthError('');
          setAuthStatus('ready');
        }
      })
      .catch((requestError) => {
        if (active) {
          setAuthError(requestError.message);
          setAuthStatus('error');
        }
      });
    return () => { active = false; };
  }, [authRetry]);

  const refreshExerciseCatalog = async () => {
    const [exercises, plan] = await Promise.all([
      apiRequest('/exercises'),
      apiRequest('/plan/exercises'),
    ]);
    setExerciseCatalog(exercises);
    setPlanExercises(plan);
    setApiError('');
  };

  const userId = currentUser?.id;
  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    Promise.all([
      apiRequest('/exercises'),
      apiRequest('/plan/exercises'),
      apiRequest('/fitness-goal'),
      apiRequest('/workout-plan'),
    ])
      .then(([exercises, plan, profile, generatedPlan]) => {
        if (!active) return;
        setExerciseCatalog(exercises);
        setPlanExercises(plan);
        setFitnessProfile(profile);
        setWorkoutPlan(generatedPlan);
      })
      .catch((requestError) => {
        if (active) setApiError(requestError.message);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  const handleAuthenticated = (user) => {
      setCurrentUser(user);
      setCurrentScreen('home');
      setAuthError('');
      setApiError('');
  };

  const handleLogout = async () => {
      await apiRequest('/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setCurrentScreen('home');
      setCatalogLoading(true);
      setExerciseCatalog([]);
      setPlanExercises([]);
      setFitnessProfile(null);
      setWorkoutPlan(null);
      setPendingWorkout(null);
      setActiveWorkoutExercises([]);
      setWorkoutStatus('none');
      setApiError('');
      setAuthMode('login');
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const toggleFavorite = async (exercise) => {
    try {
      await apiRequest(`/favorites/${exercise.id}`, { method: exercise.isFavorite ? 'DELETE' : 'PUT' });
      await refreshExerciseCatalog();
      showNotice(`${exercise.name} ${exercise.isFavorite ? 'removed from' : 'added to'} favorites.`);
    } catch (requestError) {
      setApiError(requestError.message);
    }
  };

  const togglePlanExercise = async (exercise) => {
    try {
      await apiRequest(`/plan/exercises/${exercise.id}`, { method: exercise.isAdded ? 'DELETE' : 'PUT' });
      await refreshExerciseCatalog();
      showNotice(`${exercise.name} ${exercise.isAdded ? 'removed from' : 'added to'} your plan.`);
    } catch (requestError) {
      setApiError(requestError.message);
    }
  };

  const removePlanExercise = async (exercise) => {
    try {
      await apiRequest(`/plan/exercises/${encodeURIComponent(exercise.id)}`, { method: 'DELETE' });
      await refreshExerciseCatalog();
      showNotice(`${exercise.name} removed from your plan.`);
    } catch (requestError) {
      setApiError(requestError.message);
    }
  };

  const addExternalExerciseToPlan = async (exercise) => {
    try {
      const savedExercise = await apiRequest('/plan/external-exercises', {
        method: 'POST',
        body: JSON.stringify({
          externalId: exercise.id,
          name: exercise.name,
          category: exercise.category || 'Exercise',
          level: exercise.level || 'Beginner',
          equipment: exercise.equipment || 'No equipment',
          instruction: exercise.overview || exercise.instructions?.[0] || 'Follow the exercise instructions in the library.',
        }),
      });
      await refreshExerciseCatalog();
      showNotice(`${savedExercise.name} added to your plan.`);
      return savedExercise;
    } catch (requestError) {
      setApiError(requestError.message);
      return null;
    }
  };

  const finishWorkout = (workout) => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setPendingWorkout({ ...workout, date: localDate });
    setCurrentScreen('feedback');
  };

  const beginWorkout = (name, exercises) => {
    if (!Array.isArray(exercises) || exercises.length === 0) {
      showNotice('Choose a workout from My Plan before starting.');
      setCurrentScreen('plan');
      return;
    }
    setActiveWorkoutName(typeof name === 'string' && name.trim() ? name : 'Full Body Foundation');
    setActiveWorkoutExercises(exercises.map((exercise) => ({
      ...exercise,
      id: exercise.id?.startsWith('exerciseapi:')
        ? exercise.id
        : exercise.source === 'ExerciseAPI'
          ? `exerciseapi:${exercise.id}`
          : exercise.id,
      instruction: exercise.instructions?.join(' ')
        || exercise.instruction
        || exercise.overview
        || 'Follow the exercise instructions in the ExerciseAPI catalog.',
    })));
    setWorkoutStatus('active');
    setCurrentScreen('workout');
  };

  const generateWorkoutPlan = async (profile, forceRefresh = false) => {
    const candidates = await fetchWorkoutExerciseCandidates(profile, { forceRefresh });
    const generatedPlan = createWorkoutPlan(profile, candidates);
    const savedPlan = await apiRequest('/workout-plan', {
      method: 'PUT',
      body: JSON.stringify(generatedPlan),
    });
    setWorkoutPlan(savedPlan);
    return savedPlan;
  };

  const regenerateWorkoutPlan = async (forceRefresh = false) => {
    if (!fitnessProfile) return;
    setPlanLoading(true);
    setPlanError('');
    try {
      await generateWorkoutPlan(fitnessProfile, forceRefresh);
      showNotice('Your personalized weekly workout plan is ready.');
    } catch (requestError) {
      setPlanError(requestError.message || 'The personalized workout plan could not be generated.');
    } finally {
      setPlanLoading(false);
    }
  };

  const saveGeneratedWorkoutPlan = async (updatedPlan) => {
    const savedPlan = await apiRequest('/workout-plan', {
      method: 'PUT',
      body: JSON.stringify(updatedPlan),
    });
    setWorkoutPlan(savedPlan);
  };

  const saveWorkoutFeedback = async ({ difficulty, feltPain }) => {
    if (!pendingWorkout) {
      setApiError('No active workout was found to save. Start a workout before submitting feedback.');
      return;
    }
    try {
      await apiRequest('/workouts', {
        method: 'POST',
        body: JSON.stringify({ ...pendingWorkout, difficulty, feltPain }),
      });
      setPendingWorkout(null);
      setWorkoutStatus('none');
      setApiError('');
      showNotice('Workout and feedback saved to your history.');
      setCurrentScreen('home');
    } catch (requestError) {
      setApiError(requestError.message);
    }
  };

  const handleGoalComplete = async (profile) => {
    try {
      const savedProfile = await apiRequest('/fitness-goal', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      setFitnessProfile(savedProfile);
      setApiError('');
      setCurrentScreen('plan');
      setPlanLoading(true);
      setPlanError('');
      try {
        await generateWorkoutPlan(savedProfile);
        showNotice('Your personalized weekly workout plan is ready.');
      } catch (requestError) {
        setPlanError(requestError.message || 'The workout plan could not be generated.');
      } finally {
        setPlanLoading(false);
      }
    } catch (requestError) {
      setApiError(requestError.message);
    }
  };

  if (authStatus === 'checking') {
    return <main className="auth-status">Checking your account…</main>;
  }
  if (authStatus === 'error') {
    return (
      <main className="auth-status" role="alert">
        <p>Could not reach the account server: {authError}</p>
        <button className="primary-button" onClick={() => {
          setAuthStatus('checking');
          setAuthRetry((value) => value + 1);
        }} type="button">Try again</button>
      </main>
    );
  }
  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        onAuthenticated={handleAuthenticated}
        onModeChange={setAuthMode}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={() => setCurrentScreen('home')}>
          <span className="brand-mark"><Icon name="bolt" /></span>
          <span>form<span className="brand-period">.</span></span>
        </a>

        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const isAvailable = ['home', 'goals', 'plan', 'library', 'workout', 'feedback', 'progress', 'schedule', 'achievements', 'history', 'profile'].includes(item.id);
            return (
              <button
                className={`side-nav-item ${currentScreen === item.id ? 'is-active' : ''}`}
                data-nav-id={item.id}
                key={item.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && setCurrentScreen(item.id)}
                aria-current={currentScreen === item.id ? 'page' : undefined}
                title={!isAvailable ? `${item.label} — coming soon` : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="help-card">
          <div className="help-card-heading">
            <strong>Need a hand?</strong>
            <span className="help-mark">?</span>
          </div>
          <p>View beginner tips and guidance.</p>
          <button type="button" onClick={() => showNotice('Beginner tips are coming soon.')}>Get help</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{fitnessProfile?.experience?.toUpperCase() || 'PERSONALIZED PROGRAM'}</p>
            <h1>{({
              goals: 'Choose Your Fitness Goal',
              plan: 'Personalized Workout Plan',
              library: 'Exercise Library',
              workout: 'Active Workout',
              feedback: 'Workout Feedback',
              progress: 'Progress & Analytics',
              schedule: 'Workout Schedule',
              achievements: 'Achievements',
              history: 'Workout History',
              profile: 'My Profile',
            })[currentScreen] || 'Home Dashboard'}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Search">
              <Icon name="search" />
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <div className="profile">
              <span className="avatar">
                {currentUser.avatarDataUrl
                  ? <img src={currentUser.avatarDataUrl} alt="" />
                  : currentUser.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}
              </span>
              <span className="profile-copy"><strong>{currentUser.name}</strong><small>{currentUser.email}</small></span>
            </div>
          </div>
        </header>

        <main className="page-content">
          {apiError && <p className="api-error app-api-error" role="alert">{apiError}</p>}
          {currentScreen === 'goals' ? (
            <FitnessGoalSelection
              key={fitnessProfile ? `${fitnessProfile.goal}-${fitnessProfile.days}-${fitnessProfile.experience}` : 'new-goal'}
              initialProfile={fitnessProfile}
              onBack={() => setCurrentScreen('home')}
              onComplete={handleGoalComplete}
            />
          ) : currentScreen === 'progress' ? (
            <ProgressAnalytics />
          ) : currentScreen === 'schedule' ? (
            <WorkoutSchedule
              fitnessProfile={fitnessProfile}
              onSetFitnessGoal={() => setCurrentScreen('goals')}
              onViewWorkout={beginWorkout}
              workoutPlan={workoutPlan}
            />
          ) : currentScreen === 'history' ? (
            <WorkoutHistory />
          ) : currentScreen === 'profile' ? (
            <ProfilePage
              onLogout={handleLogout}
              onUserUpdated={setCurrentUser}
              user={currentUser}
            />
          ) : currentScreen === 'achievements' ? (
            <Achievements />
          ) : currentScreen === 'plan' ? (
            <WorkoutPlan
              fitnessProfile={fitnessProfile}
              workoutPlan={workoutPlan}
              planLoading={planLoading}
              planError={planError}
              onGenerateWorkoutPlan={regenerateWorkoutPlan}
              onSetFitnessGoal={() => setCurrentScreen('goals')}
              onUpdateWorkoutPlan={saveGeneratedWorkoutPlan}
              onRemovePlanExercise={removePlanExercise}
              planExercises={planExercises}
              onBrowseExercises={() => setCurrentScreen('library')}
              onStartWorkout={beginWorkout}
            />
          ) : currentScreen === 'library' ? (
            <ExerciseLibrary
              exercises={exerciseCatalog}
              fitnessProfile={fitnessProfile}
              loading={catalogLoading}
              onAddExternalExercise={addExternalExerciseToPlan}
              onRemovePlanExercise={removePlanExercise}
              onToggleFavorite={toggleFavorite}
              onTogglePlanExercise={togglePlanExercise}
              planExercises={planExercises}
            />
          ) : currentScreen === 'workout' ? (
            workoutStatus === 'none' ? (
              <section className="workout-complete-screen" aria-label="No active workout">
                <p className="eyebrow">NO ACTIVE SESSION</p>
                <h2>No active workout</h2>
                <p>Start a workout from My Plan when you’re ready for your next session.</p>
                <button className="primary-button" onClick={() => setCurrentScreen('plan')} type="button">
                  Open My Plan
                  <Icon name="arrow" />
                </button>
              </section>
            ) : (
              <ActiveWorkout
                exercises={activeWorkoutExercises}
                initiallyComplete={workoutStatus === 'complete'}
                onFinish={finishWorkout}
                onWorkoutComplete={() => setWorkoutStatus('complete')}
                workoutName={activeWorkoutName}
              />
            )
          ) : currentScreen === 'feedback' ? (
            <WorkoutFeedback onSaved={saveWorkoutFeedback} />
          ) : (
            <HomeDashboard
              fitnessProfile={fitnessProfile}
              workoutPlan={workoutPlan}
              onContinue={beginWorkout}
              onOpenPlan={() => setCurrentScreen('plan')}
              onOpenProgress={() => setCurrentScreen('progress')}
            />
          )}
        </main>
      </div>

      {notice && <div className="notice" role="status">{notice}</div>}
    </div>
  );
}

export default App;
